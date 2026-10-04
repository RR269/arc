// ARC-CLAUDE-PROXY : relaie les appels d'ARC vers l'API Anthropic.
// Accès réservé à Rayan : la requête doit porter son jeton de session Supabase (connexion par e-mail).
// Aucun secret dans ce fichier : tout est lu dans les secrets de la fonction.
//   ANTHROPIC_KEY      clé de l'API Anthropic
//   ARC_OWNER_ID       identifiant du compte de Rayan (Authentication › Users)
//   SUPABASE_URL, SUPABASE_ANON_KEY : fournis d'office par Supabase

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

// Origines autorisées à appeler le proxy depuis un navigateur
const ALLOWED_ORIGINS = ["https://rr269.github.io", "http://localhost:8080"];

// Doit contenir la valeur de CLAUDE_MODEL dans index.html
const ALLOWED_MODELS = ["claude-sonnet-5-5"];

// claudeCall demande 1500 ; au-delà, la demande est ramenée à ce plafond
const MAX_TOKENS = 1500;
const MAX_MESSAGES = 40;

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
    "Access-Control-Max-Age": "86400",
  };
}

// Toutes les réponses, erreurs comprises, portent les en-têtes CORS : sinon le navigateur
// masque le vrai statut (401, 500…) derrière une erreur réseau.
function reply(req: Request, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

// « source » permet à ARC de distinguer un refus de ce code d'un refus de la passerelle Supabase
function fail(req: Request, status: number, message: string): Response {
  return reply(req, status, { error: { message, source: "arc-proxy" } });
}

// Pour les journaux : jamais d'identifiant complet, seulement ses 4 derniers caractères
function tail(id: string): string {
  return id.length > 4 ? `…${id.slice(-4)}` : "…";
}

// Vérifie le jeton auprès de Supabase Auth : identifiant du compte, ou cause du refus (sans le jeton)
async function sessionUserId(
  jwt: string,
  supabaseUrl: string,
  anonKey: string,
): Promise<{ id: string } | { cause: string }> {
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { "Authorization": `Bearer ${jwt}`, "apikey": anonKey },
    });
    if (!res.ok) return { cause: `/auth/v1/user a répondu ${res.status}` };
    const user = await res.json();
    return typeof user?.id === "string" ? { id: user.id } : { cause: "/auth/v1/user sans identifiant" };
  } catch (e) {
    return { cause: `/auth/v1/user injoignable (${e instanceof Error ? e.name : "erreur"})` };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(req) });
  if (req.method !== "POST") return fail(req, 405, "Méthode non autorisée");

  const anthropicKey = Deno.env.get("ANTHROPIC_KEY");
  // trim : un espace ou un retour à la ligne collé avec le secret ne doit pas fermer la porte à Rayan
  const ownerId = (Deno.env.get("ARC_OWNER_ID") ?? "").trim();
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!anthropicKey || !ownerId || !supabaseUrl || !anonKey) return fail(req, 500, "Proxy mal configuré");

  // 1. Session de Rayan, et de lui seul
  const auth = req.headers.get("Authorization") ?? "";
  const jwt = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!jwt) {
    console.log("refus 401 : en-tête Authorization absent ou sans « Bearer »");
    return fail(req, 401, "Session invalide ou expirée");
  }
  const session = await sessionUserId(jwt, supabaseUrl, anonKey);
  if ("cause" in session) {
    console.log(`refus 401 : jeton non reconnu (${session.cause})`);
    return fail(req, 401, "Session invalide ou expirée");
  }
  if (session.id !== ownerId) {
    console.log(`refus 403 : compte ${tail(session.id)} ≠ ARC_OWNER_ID ${tail(ownerId)} (longueur ${ownerId.length}, attendu 36)`);
    return fail(req, 403, "Ce compte n'est pas autorisé");
  }

  // 2. Demande bornée : modèle autorisé, nombre de messages et de jetons plafonnés
  let body: { model?: unknown; max_tokens?: unknown; system?: unknown; messages?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail(req, 400, "Corps JSON invalide");
  }
  const model = typeof body.model === "string" ? body.model : ALLOWED_MODELS[0];
  if (!ALLOWED_MODELS.includes(model)) return fail(req, 400, `Modèle non autorisé : ${model}`);
  if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > MAX_MESSAGES) {
    return fail(req, 400, "Messages manquants ou trop nombreux");
  }
  const asked = Number(body.max_tokens);
  const maxTokens = Number.isFinite(asked) && asked > 0 ? Math.min(Math.floor(asked), MAX_TOKENS) : 1000;

  const payload: Record<string, unknown> = { model, max_tokens: maxTokens, messages: body.messages };
  if (typeof body.system === "string" && body.system) payload.system = body.system;

  // 3. Relais vers Anthropic
  try {
    const response = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return reply(req, response.status, data);
  } catch {
    return fail(req, 502, "API Anthropic injoignable");
  }
});

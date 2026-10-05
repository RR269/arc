-- Tables thoughts et arc_events — créées par Rayan dans Supabase le 5 octobre 2026, avec son accord.
-- POUR MÉMOIRE SEULEMENT : ce fichier n'est exécuté par personne.
--
-- ATTENTION : ce SQL est RECONSTRUIT à partir de la description donnée par Rayan (types, contraintes,
-- règles d'accès), pas copié de la base. Les noms des contraintes et des règles peuvent différer.
-- À remplacer par le SQL exact exécuté par Rayan dès qu'il le colle.

-- Pensées déposées : ajout seul. L'identifiant et la date de création sont fournis par l'appareil
-- (file d'attente hors ligne : renvoyer la même pensée ne crée pas de doublon).
create table public.thoughts (
  id          uuid primary key,
  user_id     uuid not null default auth.uid(),
  body        text not null check (char_length(body) between 1 and 8000),
  source      text not null check (source in ('text', 'voice', 'photo')),
  device      text check (char_length(device) <= 40),
  created_at  timestamptz not null,
  received_at timestamptz not null default now()
);

alter table public.thoughts enable row level security;

-- Lire et ajouter ses propres lignes. Aucune règle de modification ni de suppression.
create policy thoughts_select_own on public.thoughts
  for select to authenticated using (user_id = (select auth.uid()));
create policy thoughts_insert_own on public.thoughts
  for insert to authenticated with check (user_id = (select auth.uid()));

-- Mesures d'usage : une ligne par ouverture d'ARC (open) et par dépôt (deposit).
create table public.arc_events (
  id          uuid primary key,
  user_id     uuid not null default auth.uid(),
  kind        text not null check (kind in ('open', 'deposit')),
  at          timestamptz not null,
  received_at timestamptz not null default now()
);

alter table public.arc_events enable row level security;

create policy arc_events_select_own on public.arc_events
  for select to authenticated using (user_id = (select auth.uid()));
create policy arc_events_insert_own on public.arc_events
  for insert to authenticated with check (user_id = (select auth.uid()));

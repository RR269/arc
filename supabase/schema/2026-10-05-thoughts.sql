-- Tables thoughts et arc_events.
-- SQL EXACT exécuté par Rayan dans l'éditeur SQL de Supabase le 5 octobre 2026 (résultat : deux tables, rowsecurity = true).
-- POUR MÉMOIRE SEULEMENT : ce fichier n'est exécuté par personne depuis le dépôt.

begin;

-- Les pensées : on ne fait qu'ajouter, jamais modifier ni supprimer
create table public.thoughts (
  id          uuid primary key,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 8000),
  source      text not null default 'text' check (source in ('text','voice','photo')),
  device      text check (device is null or char_length(device) <= 40),
  created_at  timestamptz not null,
  received_at timestamptz not null default now()
);
create index thoughts_user_created on public.thoughts (user_id, created_at desc);

alter table public.thoughts enable row level security;
revoke all on table public.thoughts from anon, authenticated;
grant select, insert on table public.thoughts to authenticated;

create policy thoughts_select_own on public.thoughts
  for select to authenticated using (user_id = (select auth.uid()));
create policy thoughts_insert_own on public.thoughts
  for insert to authenticated with check (user_id = (select auth.uid()));

-- Les mesures d'usage : ouvertures et dépôts, pour savoir si ARC sert
create table public.arc_events (
  id          uuid primary key,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind        text not null check (kind in ('open','deposit')),
  at          timestamptz not null,
  received_at timestamptz not null default now()
);
create index arc_events_user_at on public.arc_events (user_id, at desc);

alter table public.arc_events enable row level security;
revoke all on table public.arc_events from anon, authenticated;
grant select, insert on table public.arc_events to authenticated;

create policy arc_events_select_own on public.arc_events
  for select to authenticated using (user_id = (select auth.uid()));
create policy arc_events_insert_own on public.arc_events
  for insert to authenticated with check (user_id = (select auth.uid()));

commit;

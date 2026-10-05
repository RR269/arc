-- Table thought_filings.
-- SQL EXACT exécuté par Rayan dans l'éditeur SQL de Supabase le 5 octobre 2026 (résultat : rowsecurity = true).
-- POUR MÉMOIRE SEULEMENT : ce fichier n'est exécuté par personne depuis le dépôt.

begin;

-- Les rangements : ce qu'ARC propose pour une pensée, et tes corrections.
-- On ne fait qu'ajouter : chaque correction est une nouvelle ligne, la plus récente fait foi.
create table public.thought_filings (
  id          uuid primary key,
  thought_id  uuid not null references public.thoughts(id) on delete cascade,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  origin      text not null check (origin in ('ai','user')),
  status      text not null check (status in ('filed','unsure','done','cancelled')),
  space       text check (space is null or char_length(space) <= 40),
  step        text check (step is null or char_length(step) <= 300),
  moment      jsonb,
  extras      jsonb,
  model       text check (model is null or char_length(model) <= 60),
  created_at  timestamptz not null,
  received_at timestamptz not null default now(),
  check (moment is null or pg_column_size(moment) <= 1000),
  check (extras is null or pg_column_size(extras) <= 4000)
);
create index thought_filings_user_created on public.thought_filings (user_id, created_at desc);
create index thought_filings_thought on public.thought_filings (thought_id, created_at desc);

alter table public.thought_filings enable row level security;
revoke all on table public.thought_filings from anon, authenticated;
grant select, insert on table public.thought_filings to authenticated;

create policy thought_filings_select_own on public.thought_filings
  for select to authenticated using (user_id = (select auth.uid()));
create policy thought_filings_insert_own on public.thought_filings
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.thoughts t
                where t.id = thought_id and t.user_id = (select auth.uid()))
  );

commit;

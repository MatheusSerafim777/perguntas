-- Execute uma vez no SQL Editor do projeto Supabase.
begin;

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  content jsonb not null check (
    jsonb_typeof(content) = 'object'
    and content @> '{"app":"mapa-de-dados","version":1}'::jsonb
    and octet_length(content::text) <= 8388608
  ),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index meetings_owner_updated_idx on public.meetings(owner_id, updated_at desc);

alter table public.meetings enable row level security;
revoke all on public.meetings from anon, authenticated;
grant select on public.meetings to authenticated;
grant insert (title, content) on public.meetings to authenticated;
grant update (title, content) on public.meetings to authenticated;

create policy "Owners read meetings" on public.meetings
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Owners create meetings" on public.meetings
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Owners update meetings" on public.meetings
  for update to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create function public.bump_meeting_revision() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.revision := old.revision + 1;
  new.updated_at := now();
  return new;
end;
$$;
create trigger meeting_revision before update on public.meetings
for each row execute function public.bump_meeting_revision();
revoke all on function public.bump_meeting_revision() from public, anon, authenticated;

commit;

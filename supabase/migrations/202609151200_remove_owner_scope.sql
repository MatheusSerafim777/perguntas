-- Execute uma vez no SQL Editor do projeto Supabase, depois de 202609150001_meetings.sql.
-- Remove o vínculo de cada reunião com uma conta autenticada: não há mais login,
-- e todas as reuniões ficam visíveis e editáveis por quem tiver a chave publicável/anon.
begin;

drop policy if exists "Owners read meetings" on public.meetings;
drop policy if exists "Owners create meetings" on public.meetings;
drop policy if exists "Owners update meetings" on public.meetings;

drop index if exists meetings_owner_updated_idx;
alter table public.meetings drop column owner_id;
create index meetings_updated_idx on public.meetings(updated_at desc);

revoke all on public.meetings from authenticated;
grant select on public.meetings to anon;
grant insert (title, content) on public.meetings to anon;
grant update (title, content) on public.meetings to anon;

create policy "Anyone reads meetings" on public.meetings
  for select to anon using (true);
create policy "Anyone creates meetings" on public.meetings
  for insert to anon with check (true);
create policy "Anyone updates meetings" on public.meetings
  for update to anon using (true) with check (true);

commit;

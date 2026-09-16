-- Execute uma vez no SQL Editor do projeto Supabase, depois de 202609151200_remove_owner_scope.sql.
-- O aplicativo deixou de guardar "reuniões": há uma única linha global, e o conteúdo
-- do caderno passou a incluir a própria lista de perguntas (para permitir excluir e
-- adicionar perguntas), descartando campos que nunca tiveram tela própria
-- (classificação, evidência, responsável, próximo passo, dados da reunião e a linha
-- do tempo de rastreamento). Isso muda o "version" dentro de content de 1 para 2.
begin;

alter table public.meetings drop constraint meetings_content_check;
alter table public.meetings add constraint meetings_content_check check (
  jsonb_typeof(content) = 'object'
  and content->>'app' = 'mapa-de-dados'
  and (content->>'version')::int in (1, 2)
  and octet_length(content::text) <= 8388608
);

commit;

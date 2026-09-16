# Perguntas e respostas

Roteiro com 20 perguntas, edição dos enunciados e salvamento automático de perguntas e respostas. Não há login: as reuniões ficam no Supabase e são visíveis e editáveis por qualquer pessoa que acesse o aplicativo, pensado para uso por uma única pessoa/equipe.

## Rodar

Requer Node.js 22 ou superior.

```sh
npm ci
npm start
```

Abra http://localhost:3000. O comando gera `dist` e inicia o servidor. Depois de alterar o código, execute novamente para gerar a versão atualizada.

## Supabase

A configuração local fica no `.env`, ignorado pelo Git:

```dotenv
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUA_CHAVE
```

O build aceita também `SUPABASE_ANON_KEY`. Somente a URL e a chave publicável/anon são incluídas no cliente; chaves secretas e `service_role` são rejeitadas.

### Banco

A estrutura está em duas migrações, aplicadas nesta ordem:

1. `202609150001_meetings.sql` cria `meetings` (conteúdo do caderno, título, datas e revisão) com RLS por proprietário e controle de revisão que impede sobrescritas silenciosas entre dispositivos.
2. `202609151200_remove_owner_scope.sql` remove a coluna de proprietário e as regras por conta, e libera leitura/escrita para o papel `anon` — sem login, qualquer dispositivo com a chave publicável/anon lê e grava as mesmas reuniões.

A primeira migração foi aplicada ao projeto `zixieschltbwfdgljggq` pelo Supabase CLI usando a sessão autenticada, por `db query` (sem histórico no `db push`). **Não execute novamente `202609150001_meetings.sql` nesse projeto**: a tabela já existe. Aplique apenas a migração mais recente que ainda não rodou.

Para configurar outro projeto vazio, execute as duas migrações em ordem no SQL Editor, ou:

```sh
npx supabase login
npx supabase db query --linked --project-ref SEU_PROJECT_REF --file supabase/migrations/202609150001_meetings.sql
npx supabase db query --linked --project-ref SEU_PROJECT_REF --file supabase/migrations/202609151200_remove_owner_scope.sql
```

> **Atenção:** a chave publicável/anon vai embutida no JavaScript enviado ao navegador — ela não é secreta. Como as políticas de RLS liberam leitura e escrita para qualquer requisição com essa chave, qualquer pessoa que descubra a URL do app consegue ler e alterar todas as reuniões. Isso é aceitável apenas porque o aplicativo é de uso pessoal/interno e não expõe dados sensíveis de terceiros; não reutilize este esquema para dados que precisem de controle de acesso por pessoa.

### Uso

- Não há tela de login: o app carrega a reunião mais recente automaticamente ao abrir.
- **Editar pergunta** permite salvar, cancelar ou restaurar o texto original.
- As alterações são salvas automaticamente. Aguarde **Salvo na nuvem** antes de fechar.
- **Nova reunião** cria outro caderno; as anteriores continuam no seletor, compartilhado por todos os dispositivos.
- Em caso de conflito, salve suas alterações como cópia ou carregue a versão da nuvem.
- Falhas de rede mantêm as alterações na tela e, quando possível, em um rascunho local por reunião. Use **Tentar novamente** ou exporte um backup.
- **Importar caderno deste navegador** copia o caderno antigo para uma nova reunião na nuvem.
- Backups antigos continuam compatíveis. Campos extras da versão anterior são preservados no JSON.

Sem as duas variáveis de configuração, o build usa o modo local, sem sincronização. Alterar `.env` exige um novo build.

## Hospedagem com repositório privado

### Vercel

Importe o repositório e configure `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` nas variáveis do projeto. O `vercel.json` já define `npm ci`, `npm run build` e saída `dist`. A configuração local `.env` não é enviada pelo Git.

Repositórios privados de organizações GitHub exigem Pro na Vercel. [Documentação](https://vercel.com/docs/git).

### Railway

Conecte o repositório privado, configure as mesmas variáveis e use `npm start`. O servidor usa `PORT`, escuta em `0.0.0.0` e serve somente `dist`. Gere o domínio na seção Networking.

O repositório pode permanecer privado em ambas as plataformas; como não há login, quem tiver o link do app publicado já acessa e altera os dados — restrinja o acesso ao próprio domínio/URL, não ao banco.

## Referências

- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Chaves de API](https://supabase.com/docs/guides/getting-started/api-keys)
- [Supabase CLI](https://supabase.com/docs/reference/cli)

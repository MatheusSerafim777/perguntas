# Perguntas e respostas

Um único questionário global de perguntas e respostas, salvo no Supabase. Não há login nem conceito de "reunião": todas as perguntas e respostas ficam numa única linha compartilhada, visível e editável por qualquer pessoa que acesse o aplicativo — pensado para uso por uma única pessoa/equipe. Dá para editar o texto de uma pergunta, excluir uma pergunta ou adicionar novas.

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

A estrutura está em três migrações, aplicadas nesta ordem:

1. `202609150001_meetings.sql` cria `meetings` (conteúdo do caderno, título, datas e revisão) com RLS por proprietário e controle de revisão que impede sobrescritas silenciosas entre dispositivos.
2. `202609151200_remove_owner_scope.sql` remove a coluna de proprietário e as regras por conta, e libera leitura/escrita para o papel `anon` — sem login, qualquer dispositivo com a chave publicável/anon lê e grava a mesma linha.
3. `202609151800_flatten_content.sql` atualiza a validação do conteúdo (campo `version` dentro do JSON) para aceitar o formato atual, que passou a guardar a própria lista de perguntas (permitindo excluir e adicionar perguntas) e descartou campos que nunca tiveram tela própria (classificação, evidência, responsável, próximo passo, dados da reunião e linha do tempo de rastreamento).

As duas primeiras migrações foram aplicadas ao projeto `zixieschltbwfdgljggq` pelo Supabase CLI usando a sessão autenticada, por `db query` (sem histórico no `db push`); a terceira foi aplicada da mesma forma nesta sessão. **Não execute novamente uma migração já aplicada nesse projeto.** O aplicativo sempre usa uma única linha da tabela (a mais antiga); se houver mais de uma, as demais ficam sem uso.

Para configurar outro projeto vazio, execute as três migrações em ordem no SQL Editor, ou:

```sh
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db query --linked --file supabase/migrations/202609150001_meetings.sql
npx supabase db query --linked --file supabase/migrations/202609151200_remove_owner_scope.sql
npx supabase db query --linked --file supabase/migrations/202609151800_flatten_content.sql
```

> **Atenção:** a chave publicável/anon vai embutida no JavaScript enviado ao navegador — ela não é secreta. Como as políticas de RLS liberam leitura e escrita para qualquer requisição com essa chave, qualquer pessoa que descubra a URL do app consegue ler e alterar o questionário. Isso é aceitável apenas porque o aplicativo é de uso pessoal/interno e não expõe dados sensíveis de terceiros; não reutilize este esquema para dados que precisem de controle de acesso por pessoa.

### Uso

- Não há tela de login nem seletor de reunião: o app carrega o questionário compartilhado automaticamente ao abrir.
- **Editar pergunta** permite salvar, cancelar ou (para as perguntas originais) restaurar o texto padrão.
- **Adicionar pergunta**, no topo de cada seção, cria uma nova pergunta nessa seção. **Excluir pergunta** remove a pergunta e a resposta registrada nela, com confirmação antes.
- As alterações são salvas automaticamente. Aguarde **Salvo na nuvem** antes de fechar.
- Em caso de conflito com outro dispositivo, exporte um backup e carregue a versão da nuvem.
- Falhas de rede mantêm as alterações na tela e, quando possível, em um rascunho local. Use **Tentar novamente** ou exporte um backup.
- **Recomeçar**, no rodapé, apaga todas as respostas e restaura as perguntas originais (pede confirmação).
- **Importar caderno deste navegador** substitui o questionário salvo pelo caderno local anterior (útil ao ativar o Supabase pela primeira vez).
- Backups antigos (do formato anterior, com "reuniões" por conta) continuam compatíveis: as perguntas e respostas são recuperadas; os campos removidos são descartados.

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

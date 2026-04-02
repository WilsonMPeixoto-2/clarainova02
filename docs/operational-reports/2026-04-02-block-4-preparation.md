# Relatório de Preparação — BLOCO 4 Consolidação operacional externa

## Metadados
- Data: 2026-04-02
- Bloco alvo: BLOCO 4 — Consolidação operacional externa
- Branch atual de trabalho: `session/2026-04-02/HOME/CODEX/BLOCO-3-SUPABASE-HARDENING`
- Máquina: `WILSON-MP`
- Ferramenta: `CODEX`
- Status: `preparado`

## Finalidade
Preparar a próxima frente sem abrir alterações prematuras em backend funcional, corpus ou UX fora do escopo imediato. O objetivo desta rodada foi deixar explícito:

- o que já está pronto no frontend para o Google OAuth administrativo
- o que ainda falta habilitar no Supabase e no Google
- quais dependências externas ainda bloqueiam embeddings reais
- qual sequência mínima de validação deve ser seguida assim que os provedores estiverem saneados

## Arquivos inspecionados
- `src/components/AdminAuth.tsx`
- `src/pages/AuthCallback.tsx`
- `src/lib/admin-auth.ts`
- `src/integrations/supabase/client.ts`
- `supabase/functions/chat/index.ts`
- `supabase/functions/embed-chunks/index.ts`
- `docs/MIGRATION_STATUS.md`
- `README.md`

## Diagnóstico consolidado

### Google OAuth do admin
O frontend já possui a esteira principal preparada:

- `AdminAuth.tsx` chama `supabase.auth.signInWithOAuth({ provider: "google" })`
- o retorno usa `getAdminAuthCallbackUrl("/admin")`
- `AuthCallback.tsx` já faz a confirmação da sessão e o redirecionamento para `/admin`
- `client.ts` já usa `flowType: "pkce"` e `detectSessionInUrl: true`
- a UX hoje desabilita conscientemente o botão porque `googleOAuthOperational = false`

Conclusão:

- o gargalo do Google OAuth é externo
- a interface já está pronta para ser reativada assim que o provider estiver habilitado e testado

### Gemini, geração e embeddings
O código hoje declara explicitamente:

- chat generativo:
  - `gemini-3.1-flash-lite-preview`
  - `gemini-3.1-pro-preview`
- embeddings de consulta e ingestão:
  - `gemini-embedding-2-preview`
- dimensionalidade esperada:
  - `768`
- secret requerido nas functions:
  - `GEMINI_API_KEY`

Conclusão:

- o bloqueio atual não é de modelagem de código
- o bloqueio é operacional: projeto certo, chave certa, billing/quota e disponibilidade do provedor

## Checklist operacional do BLOCO 4

### Frente A — Habilitar Google OAuth no admin
Validar no projeto Supabase oficial `jasqctuzeznwdtbcuixn`:

1. `Authentication -> Providers -> Google`
2. provider `Google` habilitado
3. `Client ID` preenchido
4. `Client Secret` preenchido
5. `Site URL` coerente com a produção
6. redirect URLs aceitas no Supabase:
   - `https://clarainova02.vercel.app/auth/callback`
   - `http://localhost:5173/auth/callback`
7. redirect URLs igualmente cadastradas no console do Google

Validação de produto após habilitar:

1. clicar em `Continuar com Google`
2. autenticar
3. voltar por `/auth/callback`
4. confirmar entrada em `/admin`
5. confirmar sessão estável após refresh

### Frente B — Sanear Gemini para embeddings reais
Validar no projeto Google associado:

1. a chave usada em `GEMINI_API_KEY` pertence ao projeto correto
2. billing/quota estão ativos
3. o projeto tem acesso aos modelos:
   - `gemini-3.1-flash-lite-preview`
   - `gemini-3.1-pro-preview`
   - `gemini-embedding-2-preview`
4. a mesma chave funciona tanto para geração quanto para embeddings

Validação operacional após saneamento:

1. selecionar um documento já carregado no admin
2. reprocessar embeddings
3. confirmar transição para `embeddings prontos`
4. confirmar elegibilidade para grounding
5. realizar uma pergunta real no chat com referência documental

## Sequência recomendada assim que os provedores forem saneados
1. habilitar Google OAuth e validar o callback completo
2. corrigir `GEMINI_API_KEY` / quota / projeto
3. reprocessar o PDF de prova ou um documento controlado
4. verificar `document_chunks` com embeddings válidos
5. testar uma resposta grounded com referência real
6. só depois abrir a carga curada de corpus inicial

## Decisões conscientes desta preparação
- nenhum ajuste foi feito em `supabase/functions/chat/index.ts`
- nenhum ajuste foi feito em `supabase/functions/embed-chunks/index.ts`
- nenhum ajuste foi feito em `ROADMAP_FUTURO.md`
- esta preparação registra o checklist sem interferir nas alterações em andamento fora do escopo

## Próxima ação recomendada
Executar o checklist acima no Supabase e no Google, registrar o estado resultante em `docs/REMOTE_STATE.md` e então abrir formalmente a trilha de execução do BLOCO 4.

# BLOCO 3 — Mensagens de exceção, estados do sistema e tom conversacional

Data de conclusão: 2026-03-30

## Objetivo

Revisar a linguagem de erro, fallback, ausência de resposta, ambiguidade, pedido de esclarecimento e loading para manter o tom da CLARA mais humano, institucional e orientativo.

## Alterações realizadas

- Revisão do chat em `src/components/ChatSheet.tsx`:
  - loading com etapas mais humanas e menos técnicas
  - textos do estado demonstrativo revistos
  - aviso de falta de conexão reescrito em tom mais acolhedor
  - placeholders e microtextos do rodapé alinhados ao novo vocabulário
- Ajuste do tom em `src/components/chat/ChatStructuredMessage.tsx`:
  - rótulos de esclarecimento, cautela e contexto reescritos
  - status visíveis ao usuário ajustados para linguagem menos técnica
- Consolidação dos estados do chat em `src/hooks/useChatStore.tsx`, `src/lib/chat-runtime.ts`, `src/lib/chat-api.ts` e `src/lib/chat-response-mode.ts`:
  - labels e descrições de runtime reescritos
  - erros de conexão, interrupção e formato inesperado reescritos
  - hints de carregamento ajustados ao novo tom
- Revisão das respostas demonstrativas e estados de ambiguidade em `src/lib/clara-response.ts`:
  - mensagens de preview menos técnicas
  - cautelas e pedidos de complemento mais claros
  - process states com linguagem mais institucional
- Revisão do backend em `supabase/functions/chat/index.ts`:
  - mensagens de validação e indisponibilidade reescritas
  - respostas públicas de erro desacopladas de jargão técnico
  - prompt reforçado para evitar rótulos visíveis como `backend`, `RAG` e `web fallback`
- Revisão do acesso administrativo em `src/components/AdminAuth.tsx`, `src/pages/AuthCallback.tsx`, `src/lib/admin-auth.ts` e `src/integrations/supabase/client.ts`:
  - estados de indisponibilidade e loading reescritos
  - mensagens de login e passkey suavizadas
  - helper de normalização de erros de autenticação adicionado

## Verificações realizadas

- `npm run validate`
- revisão por busca textual para remover termos de bastidor nas mensagens visíveis
- cobertura de teste ampliada em:
  - `src/test/chat-api.test.ts`
  - `src/test/chat-runtime.test.ts`
  - `src/test/clara-response.test.ts`
  - `src/test/admin-auth.test.ts`

## Resultado

- O chat agora explica espera, ambiguidade e falha de forma mais clara e menos técnica.
- Os estados demonstrativos da CLARA deixaram de soar como bastidor de implementação.
- O backend passou a devolver mensagens públicas mais humanas e orientativas.
- O fluxo administrativo ficou mais consistente com o mesmo tom institucional do chat.

## Observações

- Este bloco não alterou o contrato funcional `Direto / Didático` nem a estrutura visual principal do chat.
- Os warnings de chunk grande no build continuam fora do escopo deste bloco.

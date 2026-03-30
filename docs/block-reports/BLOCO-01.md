# BLOCO 1 — Contrato funcional do chat

Data de conclusão: 2026-03-30

## Objetivo

Transformar o modo `Direto / Didático` em comportamento real de produto, com coerência entre frontend, transporte, backend e textos públicos.

## Alterações realizadas

- Criação de um helper central para modos de resposta em `src/lib/chat-response-mode.ts`.
- Inclusão do estado `responseMode` no chat store com persistência em `localStorage` em `src/hooks/useChatStore.tsx`.
- Envio explícito do modo escolhido no payload do chat em `src/lib/chat-api.ts`.
- Adaptação de mock e preview para refletirem `Direto` e `Didático` em `src/lib/clara-response.ts`.
- Implementação do seletor de modo no painel de chat, com microtextos, loading e resumo do modo ativo em `src/components/ChatSheet.tsx`.
- Inclusão de estilos do seletor e dos badges de modo em `src/styles/clara-experience.css`.
- Ajuste do backend da edge function para:
  - ler `responseMode`
  - aplicar instruções específicas ao prompt
  - registrar o modo na telemetria
  em `supabase/functions/chat/index.ts`
- Alinhamento dos textos públicos e metadados em:
  - `src/components/FAQSection.tsx`
  - `src/components/FeaturesSection.tsx`
  - `index.html`
- Ampliação da cobertura de testes em:
  - `src/test/chat-api.test.ts`
  - `src/test/chat-persistence.test.ts`
  - `src/test/clara-response-mode.test.ts`

## Resultado

- Usuário escolhe entre `Direto` e `Didático` no próprio chat.
- Preferência fica salva no navegador.
- Backend recebe e respeita a escolha.
- Promessa pública do produto passa a corresponder ao comportamento real.

## Validação executada

- `npm run validate`

## Observações

- Este bloco não incluiu calibração do RAG, revisão jurídica, branding externo ou landing page.

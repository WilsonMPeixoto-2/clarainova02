# 2026-04-04 — Correção de scroll e polimento do modo didático no chat

## Objetivo

Corrigir dois problemas urgentes percebidos no uso real da aba do chat:

- a rolagem do mouse escapava para a página de fundo, deixando o painel sem fluidez própria
- a diferença entre `Direto` e `Didático` ainda estava sutil demais, especialmente no modo didático

## Referências usadas nesta rodada

- prints atuais do chat extraídos de `Fotos do chat em 4 de abril de 2026.docx`
- PDF `SDP_PRESTACAO_DE_CONTAS_GAD_4_CRE.pdf` como benchmark de cadência didática
- prints antigos na pasta `CLARAINOVA02/IMAGENS`, especialmente os que mostram:
  - `Resumo`
  - `Aviso importante`
  - lista operacional
  - checklist bem segmentado
- imagem premium `clara_avatar_vfinal_ultra_modern_1775267563339.png` como base para um avatar pequeno de loading/resposta

## Mudanças aplicadas

### 1. Scroll containment do painel

- `ScrollArea` agora aceita `viewportRef`
- `ChatSheet` passou a capturar `wheel` no painel inteiro
- quando o cursor está sobre header ou composer, o delta de rolagem é redirecionado para o viewport do chat
- o pano de fundo deixa de receber a rolagem enquanto o cursor está dentro da aba

Arquivos:
- `src/components/ui/scroll-area.tsx`
- `src/components/ChatSheet.tsx`
- `src/index.css`

### 2. Preservação do modo por mensagem

- o `responseMode` passou a ser persistido em cada mensagem de resposta
- a renderização estruturada agora sabe com precisão se a resposta foi gerada em `Direto` ou `Didático`

Arquivos:
- `src/hooks/useChatStore.tsx`
- `src/components/ChatSheet.tsx`
- `src/components/chat/ChatStructuredMessage.tsx`

### 3. Didático com camadas mais conscientes

- o `Didático` passou a assumir explicitamente quatro camadas:
  - veredito inicial
  - explicação principal
  - detalhamento complementar
  - observações finais
- o texto de orientação do modo e o prompt backend foram reforçados para produzir essa leitura guiada

Arquivos:
- `src/components/chat/ChatStructuredMessage.tsx`
- `src/lib/chat-response-mode.ts`
- `src/lib/clara-response.ts`
- `supabase/functions/chat/index.ts`
- `supabase/functions/chat/response-schema.ts`

### 4. Redução de repetição

- foi adicionada deduplicação leve de strings repetidas em itens, destaques e observações
- o objetivo foi reforçar sem redundar, especialmente no `Didático`

Arquivos:
- `src/lib/clara-response.ts`
- `supabase/functions/chat/response-schema.ts`

### 5. Avatar de loading e assinatura visual

- o estado de loading deixou de usar um ícone indefinido
- agora usa um avatar pequeno derivado da imagem premium da CLARA
- a mesma linha visual passa a aparecer também no kicker da resposta estruturada

Novos assets:
- `public/brand/clara-avatar-chat-128.png`
- `public/brand/clara-avatar-chat-64.png`

Arquivos:
- `src/components/ChatSheet.tsx`
- `src/components/chat/ChatStructuredMessage.tsx`
- `src/index.css`

### 6. Toggle de modo com contraste real

- o estado ativo do seletor `Direto` / `Didático` ganhou:
  - borda mais forte
  - brilho próprio
  - contraste cromático claro
  - diferença real em relação ao card inativo

Arquivo:
- `src/styles/clara-experience.css`

## Validação

- `npm run typecheck`
- `npm test -- --run src/test/clara-response-mode.test.ts src/test/clara-response.test.ts`
- `npm run validate`

Resultado:
- tudo passou
- suíte total mantida em `72` testes

## Leitura final

Esta rodada não muda o plano macro do projeto. Ela abre apenas um parêntese de UX dentro do BLOCO 5 para atacar fricções reais do chat em uso:

- o painel agora se comporta como superfície de trabalho própria
- o loading passa a parecer parte do produto
- o modo `Direto` continua objetivo, mas menos telegráfico
- o modo `Didático` fica mais claramente guiado, com melhor cadência e menos repetição

## Próxima ação recomendada

- validar visualmente essa rodada em uso real
- se aprovada, promover para `main` e produção
- em seguida retomar a trilha funcional do BLOCO 5

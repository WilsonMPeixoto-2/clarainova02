# Relatório de Auditoria Independente — CLARAINOVA02

**Data:** 19/04/2026  
**Commit oficial auditado:** `origin/main @ 6426b33ceaa0d08336a23daad03c0fcba2f2514a`  
**Escopo:** aplicação pública, home, navegação, chat, store/persistência, backend RAG, caches, documentação, estado remoto do Supabase e experiência real do usuário  
**Natureza:** parecer técnico independente, baseado em código real, validação local e inspeção publicada

---

## 1. Síntese executiva

A CLARAINOVA02 está em um ponto forte de maturidade. O projeto já não é um protótipo frágil, não exige reconstrução estrutural e já sustenta uso real assistido com qualidade visual, robustez de backend e excelente experiência na aba do chat.

O parecer final desta auditoria é:

> **produto forte, operacionalmente utilizável e muito próximo de travar versão, mas ainda não encerrado**

O que impede um “pronto para travar v1.0” sem ressalvas não é falta de arquitetura. É fechamento:

1. **governança documental e coerência do repositório**;
2. **fechamento final do ambiente remoto do Supabase**;
3. **governança explícita do response cache e da telemetria associada**;
4. **alguns ajustes pontuais de produto e de baseline de qualidade (`npm run validate`)**.

Também houve uma revisão importante desta rodada: o estado remoto atual do corpus está **melhor** do que parte da continuidade antiga e de alguns relatórios ainda sugeriam. Hoje o ambiente remoto mostra `17` documentos ativos, `23` documentos processados no total e `289/289` chunks ativos com embedding, o que reduz a incerteza sobre prontidão documental. Ao mesmo tempo, a telemetria recente ainda mostra **forte participação de caminhos lexicais** (`keyword_only` e `keyword_only_targeted`), então ainda não é correto dizer que a camada semântica já domina o tráfego real.

---

## 2. Metodologia e evidência usada

Esta auditoria foi construída com quatro bases:

### 2.1. Leitura prioritária do repositório oficial

Foram lidos primeiro:

- `.continuity/current-state.json`
- `docs/HANDOFF.md`
- `docs/MIGRATION_STATUS.md`
- relatório mais recente em `docs/operational-reports/`

Depois, a auditoria foi ancorada em arquivos centrais do frontend, do chat e do backend, incluindo:

- `src/App.tsx`
- `src/pages/Index.tsx`
- `src/components/Header.tsx`
- `src/components/HeroSection.tsx`
- `src/components/FeaturesSection.tsx`
- `src/components/FAQSection.tsx`
- `src/components/Footer.tsx`
- `src/hooks/useChatStore.tsx`
- `src/components/ChatSheet.tsx`
- `src/components/chat/ChatStructuredMessage.tsx`
- `src/components/chat/ChatFeedbackControls.tsx`
- `src/lib/chat-api.ts`
- `src/lib/chat-feedback-api.ts`
- `src/lib/site-identity.ts`
- `supabase/functions/chat/index.ts`
- `supabase/functions/chat/knowledge.ts`
- `supabase/functions/chat/response-schema.ts`
- `supabase/functions/chat/emergency-playbooks.ts`
- `supabase/functions/chat/response-cache.ts`
- `supabase/functions/submit-chat-feedback/index.ts`
- `supabase/functions/get-usage-stats/index.ts`
- `README.md`

### 2.2. Validação local objetiva

Foram executados:

- `npm run validate`
- `npm test`
- `npm run build`
- uma bateria focada de testes do chat

### 2.3. Auditoria publicada em navegação real

Foi feita inspeção real da aplicação publicada em `https://clarainova02.vercel.app/` com Playwright em desktop e mobile, incluindo:

- home
- header
- hero
- FAQ
- footer
- abertura do chat
- leitura de resposta estruturada
- estado mobile do painel

Por parcimônia com cotas, foi executada apenas **uma** pergunta real no chat publicado.

### 2.4. Auditoria remota de banco e telemetria

Foram feitas consultas de leitura ao projeto Supabase vinculado para confirmar:

- estado atual do corpus
- embeddings ativos
- distribuição recente de `search_mode`
- saúde recente de `chat_metrics`
- existência de caches
- leftovers de template
- RLS e políticas
- divergência entre schema real e narrativa documental antiga

---

## 3. Resultado dos checks locais

### 3.1. O que passou

- `npm test`: **passou**
  - `30` suites
  - `121` testes
- bateria focada de chat: **passou**
  - `4` suites
  - `20` testes
- `npm run build`: **passou**

### 3.2. O que falhou

- `npm run validate`: **falhou**

Motivo:

- erro em `supabase/functions/chat/index.ts:2082`
  - `Unexpected any. Specify a different type`
- warning em `src/components/providers/SmoothScrollProvider.tsx:6`
  - `react-refresh/only-export-components`

### 3.3. Juízo técnico

Isto é importante: o repositório **não está hoje em baseline green de validação total**, apesar de o README sugerir um estado validado localmente. Isso não desqualifica o produto, mas é um bloqueio pequeno e objetivo antes de falar em “travamento” com rigor.

---

## 4. Arquitetura pública da aplicação

### 4.1. Confirmado no código

O núcleo da SPA é sólido.

Evidência:

- `src/App.tsx:52-84`
  - `ErrorBoundary`
  - `QueryClientProvider`
  - `SmoothScrollProvider`
  - `ChatProvider`
  - `BrowserRouter`
  - `ChatSheetHost`
- `src/pages/Index.tsx:31-50`
  - abertura do chat por query string (`?chat=1`)
  - scroll com offset consciente para hash

### 4.2. Avaliação

Há boa separação entre:

- home pública
- páginas legais
- área administrativa
- shell global do chat

O desenho não é improvisado. O produto tem estrutura coerente de aplicação real.

---

## 5. Home pública, branding e jornada do usuário

### 5.1. Forças confirmadas

#### Header

`src/components/Header.tsx:33-37` confirma a navegação desktop atual:

- `Perguntas frequentes`
- `Política de Privacidade`
- `Termos de Uso`
- `Contato`

O CTA de chat está forte e o drawer mobile está bem resolvido. O acesso administrativo aparece no drawer e no footer sem contaminar a home.

#### Hero

`src/components/HeroSection.tsx:226-256` confirma:

- headline clara
- CTA principal forte
- CTA secundário útil
- integração de perguntas rápidas

Visualmente, a home tem identidade própria. Não parece template genérico.

#### Funcionalidades

`src/components/FeaturesSection.tsx:67-118` mostra boa tradução do produto em linguagem de uso, sem jargão excessivo.

#### FAQ

`src/components/FAQSection.tsx:6-11, 24-29` confirma:

- ajuste de expectativa
- explicação do modo `Direto` e `Didático`
- reforço de validação humana
- explicitação do suporte a mobile/desktop

#### Footer e identidade pública

`src/components/Footer.tsx` e `src/lib/site-identity.ts` confirmam posicionamento público prudente:

- autoria técnica explícita
- natureza autoral em maturação
- não se apresenta como canal oficial
- ressalta prevalência dos fluxos institucionais

### 5.2. Ponto crítico de produto público

O relatório anterior do ChatGPT estava correto neste ponto: a navegação desktop **não destaca** `Funcionalidades` ou `Como funciona`.

Hoje, isso está confirmado no código e na produção:

- header desktop sem link para funcionalidades
- footer com link para funcionalidades
- CTA secundário no hero levando à seção correta

### 5.3. Juízo técnico

A home é forte, bonita e funcional. A tensão real é esta:

> branding premium/cinemático muito bem executado, com pequena fricção diante da sobriedade esperada por parte do público institucional

Não é defeito grave. É um trade-off de linguagem visual.

---

## 6. UX do chat e experiência real do usuário

### 6.1. Forças confirmadas no código

#### Store e persistência

`src/hooks/useChatStore.tsx` confirma:

- histórico persistido em `localStorage`
- modo de resposta persistido separadamente
- limite de `50` mensagens
- uso de `startTransition`
- hidratação retrocompatível

#### Painel do chat

`src/components/ChatSheet.tsx` confirma:

- quatro larguras de painel
- resize
- exportação PDF
- impressão
- limpeza
- banner offline
- contador de caracteres
- `rows={1}` com auto-grow
- indicador `Nova resposta`
- scroll para o início da resposta do assistente

#### Resposta estruturada

`src/components/chat/ChatStructuredMessage.tsx` confirma:

- resumo inicial
- badge de confiança
- destaques
- etapas
- accordions para respostas longas
- referências recolhíveis
- botão de cópia
- navegação entre citação e referência
- botão “Voltar ao resumo”

#### Feedback

`src/components/chat/ChatFeedbackControls.tsx` + `src/lib/chat-feedback-api.ts` + `supabase/functions/submit-chat-feedback/index.ts` confirmam feedback real ponta a ponta.

### 6.2. Validação publicada

Na interação real auditada:

- o chat abriu corretamente
- a pergunta “Como incluir um documento externo no SEI-Rio?” retornou resposta estruturada
- a UI exibiu:
  - resumo
  - `4` etapas
  - `6` fontes
  - botão de voltar ao resumo
  - ações de PDF/imprimir/limpar
- a resposta permaneceu legível em mobile
- não houve erros de console

### 6.3. Juízo técnico

O chat é o ponto mais forte do produto hoje.

Ele já se comporta como ferramenta institucional séria, especialmente por:

- organização da informação
- legibilidade
- ergonomia
- clareza de modo
- recursos auxiliares de uso real

### 6.4. Melhorias ainda cabíveis

#### Confirmadas e de baixo risco

1. **Cabeçalho do chat ainda pode ficar carregado em larguras intermediárias**
   - `src/components/ChatSheet.tsx:656-694` concentra várias ações simultâneas.
   - Resultado esperado: reduzir ruído visual e tornar o topo mais estável em resoluções médias.

2. **O botão de expandir/recolher etapa não tem `aria-label` explícito**
   - `src/components/chat/ChatStructuredMessage.tsx:207-210`
   - Resultado esperado: acessibilidade melhor para leitores de tela.

3. **O “Voltar ao resumo” rola para `center`, não para o topo real**
   - `src/components/chat/ChatStructuredMessage.tsx:267`
   - Resultado esperado: retorno mais previsível em respostas longas.

4. **A largura de leitura ainda é generosa no desktop**
   - `src/components/ChatSheet.tsx:502`
   - `assistantMessageMaxWidth = max-w-[94%]`
   - Resultado esperado: menos fadiga visual em respostas muito extensas.

5. **O histórico local não tem expiração ou aviso de privacidade**
   - `src/hooks/useChatStore.tsx:48-115`
   - Resultado esperado: melhor segurança de uso em máquina compartilhada.

---

## 7. Organização da informação nas respostas

### 7.1. Confirmado no código e no uso real

Esta é uma das maiores qualidades do projeto.

O desenho da resposta favorece trabalho real porque separa:

- veredito inicial
- passos
- observações
- referências
- confiança
- feedback

Não é só “texto bonito”. É design de informação aplicado à resposta.

### 7.2. Juízo técnico

Confirmado com convicção:

> a CLARA está acima da média justamente porque trata resposta como interface, não como bloco textual bruto

---

## 8. Backend do chat e pipeline RAG

### 8.1. Confirmado no código

#### Modelos e estratégia

`supabase/functions/chat/index.ts:129-130, 439-440`

- primário: `gemini-3.1-pro-preview`
- fallback: `gemini-3.1-flash-lite-preview`
- `thinkingLevel: 'high'`
- `maxOutputTokens`:
  - `4096` para `direto`
  - `8192` para `didatico`

#### Query expansion

`supabase/functions/chat/index.ts:223-228`

- a expansão de query está **desligada intencionalmente**

Isso contradiz a continuidade antiga que ainda falava como se ela estivesse ativa.

#### Retrieval e governança

O pipeline permanece forte:

- `hybrid_search_chunks`
- ranking e governança em `knowledge.ts`
- source-target routing
- keyword rescue
- editorial layer
- leakage repair
- emergency playbooks

#### Structured generation

`supabase/functions/chat/index.ts:1141-1143, 1919-1921`

- structured output com `responseMimeType: 'application/json'`

#### Schema

`supabase/functions/chat/response-schema.ts` segue sofisticado e alinhado ao frontend.

### 8.2. Juízo técnico

O backend continua um dos pontos mais robustos do projeto. Não há sinal de arquitetura amadora.

---

## 9. Response cache e embedding cache

### 9.1. Confirmado no código

#### Embedding cache

`supabase/functions/chat/response-cache.ts` não é o embedding cache; o embedding cache é criado por migration dedicada e usado no backend.

A migration `20260405235500_add_query_embedding_cache.sql` documenta melhor o modelo de acesso:

- RLS habilitado
- `REVOKE ALL` para `anon` e `authenticated`
- `GRANT ALL` para `service_role`
- comentário explícito dizendo que o consumo é via Edge Functions

#### Response cache

`supabase/functions/chat/response-cache.ts:3, 17-26`

- TTL de `24h`
- chave `SHA-256`
- inclui `responseMode`

`supabase/functions/chat/index.ts:2079-2096`

- lookup do cache ocorre cedo
- em hit válido, a resposta retorna imediatamente

`supabase/functions/chat/index.ts:2610-2629`

- resposta estruturada nova é gravada no cache após `recordTelemetry`

### 9.2. Confirmado no ambiente remoto

- `embedding_cache`: `9` linhas
- `chat_response_cache`: `3` linhas
- os `3` registros de `chat_response_cache` já têm `hits = 1`

### 9.3. Problema real ainda aberto

O caminho de `cache hit` retorna antes de `recordTelemetry`.

Consequência:

- não há observabilidade equivalente entre resposta nova e resposta servida por cache
- a governança do cache ainda está incompleta

Esse ponto é técnico, real e material. Não é cosmético.

### 9.4. Juízo técnico

O cache é bom e já está vivo. O problema não é implementação básica. O problema é governança:

- versionamento
- invalidação
- telemetria

---

## 10. Estado remoto do corpus e saúde operacional do RAG

### 10.1. Confirmado remotamente

No projeto Supabase atual:

- `23` documentos totais
- `17` documentos ativos
- `23` documentos processados
- `0` documentos não processados
- `289` chunks ativos
- `289/289` chunks ativos com embedding

Além disso, os documentos ativos mais recentes foram atualizados em `2026-04-19`, incluindo:

- `Manual do Usuário SEI 4.0+`
- `Termo de Uso e Aviso de Privacidade do SEI.Rio`
- `Nota oficial MGI sobre o SEI 5.0.3`
- `Nota oficial MGI sobre a versão 4.1.5 do SEI`
- `Novidades da versão 4.1 – Wiki SEI-RJ`
- `Decreto Rio nº 55.615 de 1º de janeiro de 2025`

### 10.2. Telemetria recente

Últimos `14` dias:

- `chat_metrics`
  - `12` chats
  - `12` respondidos
  - `0` não respondidos
  - latência média: `26435 ms`

- `search_metrics`
  - `12 keyword_only`
  - `7 hybrid_governed`
  - `5 hybrid`
  - `4 keyword_only_targeted`

### 10.3. Leitura correta desse resultado

O corpus remoto está **mais pronto** do que alguns relatórios deixavam em aberto.

Mas a telemetria recente também mostra:

> os caminhos lexicais ainda respondem por uma fatia ligeiramente maior do tráfego recente do que os caminhos híbridos/semânticos

Portanto:

- **não** é correto dizer que o sistema depende só de degradação segura
- **também não** é correto dizer que a camada semântica já é a dominante operacional inequívoca

### 10.4. Juízo técnico

O estado atual é:

> corpus remoto saudável, operação real funcional, mas com semântica ainda não dominante o bastante para encerrar a frente sem ressalva

---

## 11. Supabase remoto: limpeza, RLS e leftovers

### 11.1. Achado confirmado

O ambiente remoto ainda carrega leftovers de template:

- `public.users`
- `public.posts`
- `public.comments`

Evidência:

- `users`: `3` linhas
- `posts`: `3` linhas
- `comments`: `0` linhas

Os dados são claramente de template:

- `Mia Rivera`
- `Ava Chen`
- `Noah Patel`
- postagens como `Ten SQL Tricks for Faster Queries`

### 11.2. RLS/policies

No remoto:

- `users`: `rowsecurity = false`
- `comments`: `rowsecurity = false`
- `posts`: `rowsecurity = true`

E não há policies para:

- `users`
- `comments`
- `posts`
- `embedding_cache`
- `chat_response_cache`

### 11.3. Nuance importante

No caso dos caches, a ausência de policy não significa necessariamente erro de segurança porque o repositório faz:

- `REVOKE ALL` de `anon` e `authenticated`
- `GRANT ALL` para `service_role`

Isso é aceitável como modelo de acesso interno. O que falta é **clareza documental consistente**, especialmente para `chat_response_cache`, cuja migration é menos explícita do que a do `embedding_cache`.

### 11.4. Juízo técnico

O problema sério aqui não é o cache. É o ambiente residual do template:

> `users`, `posts` e `comments` deveriam ser removidas ou explicitamente justificadas

---

## 12. Documentação e coerência do repositório

### 12.1. Drift grave confirmado

Esta foi uma das constatações mais fortes da auditoria.

#### `current-state.json` e `HANDOFF`

Antes desta rodada, ambos ainda falavam em:

- `main @ 6770c85`
- branch antiga de `2026-04-04`
- query expansion ativa
- narrativas de bloco que já não batiam mais com o código

Isso estava factualmente defasado.

#### `README.md`

O README segue contradizendo o código real em ponto técnico relevante:

- `README.md:43-44`
  - diz que o chat usa `flash-lite` como primário e `pro` como fallback
- `supabase/functions/chat/index.ts:129-130, 439-440`
  - mostra o contrário: `pro` primário e `flash-lite` fallback

Também há outro descompasso:

- o README afirma baseline validado/localmente estável
- o `validate` hoje falha

### 12.2. Juízo técnico

Este não é um detalhe de copy. É risco operacional de continuidade.

Se a documentação principal diverge do código, novas auditorias e novas ferramentas começam do lugar errado.

---

## 13. Matriz consolidada de achados

### 13.1. Confirmado no código e/ou no ambiente

- arquitetura principal da aplicação sólida
- home pública forte e com posicionamento transparente
- chat muito maduro em UX
- resposta estruturada como principal diferencial
- feedback loop real implementado
- response cache implementado e ativo
- embedding cache implementado e ativo
- otimização de tokens por modo implementada
- corpus remoto ativo saudável (`17` docs ativos, `289/289` embeddings ativos)
- build passa
- suíte de testes passa

### 13.2. Parcialmente confirmado

- “pronto para produção”:
  - correto apenas como **operação controlada forte**
  - ainda não como produto formalmente encerrado
- “restam só ajustes mínimos”:
  - incorreto se isso apagar governança, limpeza remota, cache governance e baseline green

### 13.3. Superado em relação a relatórios antigos

- ausência de response cache
- scroll piorado para respostas longas
- falta de contador de caracteres
- ausência de accordions
- ausência de retorno ao resumo

### 13.4. Contestado pelo código atual

- continuidade antiga que tratava query expansion como parte ativa do runtime
- continuidade antiga que ainda fixava `main` em `6770c85`
- README que ainda apresenta `flash-lite` como primário

### 13.5. Plausível, mas não comprovado apenas pelo repositório

- risco de mudança futura por uso de modelos `preview`
- eventual impacto analítico do header desktop enxuto na descoberta funcional
- necessidade futura de rever equilíbrio entre branding premium e sobriedade institucional com base em uso real

### 13.6. Pendente relevante

- reconciliar `README.md`
- reconciliar `docs/MIGRATION_STATUS.md`
- voltar `npm run validate` ao verde
- decidir o destino de `users`, `posts` e `comments`
- formalizar política de response cache
- registrar cache hits na telemetria
- avaliar link de `Funcionalidades` no header desktop

---

## 14. Riscos atuais

### Risco alto

1. **drift documental**
   - impacta qualquer nova sessão de manutenção

2. **baseline de validação quebrado**
   - `npm run validate` não está green

3. **leftovers no Supabase remoto**
   - aumentam ambiguidade operacional

### Risco médio

1. **telemetria incompleta do response cache**
2. **README tecnicamente impreciso**
3. **participação ainda alta de caminhos lexicais**

### Risco baixo

1. **chunk warnings no build**
2. **warnings de preload de fontes**
3. **microajustes de acessibilidade/ergonomia no chat**

---

## 15. Recomendações priorizadas

### Prioridade 1 — fechamento obrigatório antes de travar versão

1. **Corrigir `README.md`**
   - Por quê: hoje contradiz modelo primário/fallback e baseline local.
   - Resultado esperado: documentação pública coerente com o backend real.

2. **Atualizar `docs/MIGRATION_STATUS.md`**
   - Por quê: a narrativa atual ainda descreve um projeto antigo.
   - Resultado esperado: continuidade operacional menos sujeita a diagnósticos errados.

3. **Corrigir o lint em `supabase/functions/chat/index.ts`**
   - Por quê: `npm run validate` precisa voltar a ser gate confiável.
   - Resultado esperado: baseline técnico limpo para fechamento.

4. **Decidir o destino de `users`, `posts` e `comments`**
   - Por quê: são restos de template e não pertencem ao produto.
   - Resultado esperado: Supabase remoto sem ambiguidade estrutural.

5. **Formalizar a governança do `chat_response_cache`**
   - Por quê: implementação existe, governança ainda não.
   - Resultado esperado: cache sustentável, auditável e observável.

### Prioridade 2 — fortalecimento de produto

1. **Adicionar `Funcionalidades` ou `Como funciona` ao header desktop**
   - Resultado esperado: melhor descoberta funcional sem mexer na arquitetura.

2. **Compactar ou hierarquizar melhor as ações do topo do chat em larguras intermediárias**
   - Resultado esperado: topo mais respirável.

3. **Ajustar largura máxima de leitura do assistente**
   - Resultado esperado: legibilidade editorial melhor em painéis largos.

### Prioridade 3 — refinamento futuro

1. **Expiração/opção de privacidade para histórico local**
2. **Melhorar acessibilidade do toggle de collapse**
3. **Ajustar o scroll do “Voltar ao resumo” para `start`**
4. **Revisar preloads de fonte e chunks grandes**

---

## 16. Veredito final

A CLARAINOVA02 já é um produto tecnicamente forte, funcional e com diferenciais reais de UX e design de informação. O chat, em especial, está num patamar muito acima do que normalmente se vê em assistentes RAG institucionais.

O projeto **não precisa ser reconstruído**.

Mas também **ainda não deveria ser declarado “encerrado”** sem fechar:

- governança documental
- baseline de validação
- limpeza final do Supabase remoto
- governança do response cache

Portanto, a formulação mais precisa neste momento é:

> **produto forte, operacionalmente utilizável e em fase final de consolidação, muito próximo de travar versão**

---

## 17. Próximo bloco recomendado

Abrir um bloco curto de fechamento pré-`v1.0` com cinco entregas:

1. atualizar `README.md`;
2. atualizar `docs/MIGRATION_STATUS.md`;
3. corrigir o lint e recuperar `npm run validate`;
4. limpar/documentar leftovers e caches no Supabase remoto;
5. aplicar um ajuste pequeno de descoberta funcional no header desktop.

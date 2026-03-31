# Relatorio de estado do repositorio e proximas tarefas

Data: 2026-03-31

Base analisada: `main` em `5bc6450`

## Resumo executivo

O repositorio entrou em uma fase de consolidacao.

O produto ja tem:

- frontend publico maduro, com identidade externa, metadados sociais, PWA e exportacao em PDF
- chat com contrato de resposta estruturada, modos de resposta, fallback de preview/mock e integracao real com a edge function `chat`
- painel administrativo funcional para login por conta provisionada, upload de PDF, governanca documental, reprocessamento e leitura de metricas agregadas
- backend Supabase com funcoes edge, busca hibrida, telemetria e classificacao do corpus
- camada institucional publica revista em termos, privacidade e autoria

O repositorio tambem ja tem um baseline tecnico confiavel:

- `npm run validate` passou nesta analise
- `12` arquivos de teste passaram
- `54` testes passaram
- o build de producao fecha sem erro

O principal problema agora nao e falta de funcionalidade central. O principal problema passou a ser coerencia operacional e documental:

- a documentacao oficial do estado do projeto ficou para tras
- ainda existem dependencias operacionais reais fora do codigo
- ha alguns pontos de hardening e performance que devem ser tratados antes de chamar o produto de "fechado"

## Estado atual por frente

### 1. Aplicacao publica

Estado: forte

O frontend publico esta bem resolvido para esta fase:

- roteamento principal funcional com home, termos, privacidade, admin e callback de auth
- chat em painel lateral com persistencia local, exportacao de conversa em PDF e renderizacao estruturada
- fallback honesto para ambientes sem Supabase
- camada de marca externa concluida em favicon, OG image, manifest e impressao

Conclusao:

O produto publico ja transmite acabamento e intencao. O risco agora nao esta no desenho geral da UX, mas no acoplamento entre essa UX e a operacao real do backend.

### 2. Painel administrativo

Estado: funcional, mas ainda parcialmente dependente de configuracao externa

O admin ja entrega:

- login por conta provisionada
- callback de autenticacao
- upload de PDF com extracao local
- classificacao e governanca antes da ingestao
- retries, cancelamento, exclusao e leitura de estado documental
- distincao correta entre `processed`, `embedding_pending`, `ready`, `inactive` e `excluded`

Limites atuais:

- Google OAuth ainda aparece como rota prevista, nao como fluxo principal ativo
- passkey continua apenas como preparacao de experiencia
- a operacao depende de Supabase real, usuario admin provisionado e chave Gemini funcional

Conclusao:

O admin saiu da fase de mock e entrou na fase operacional. O que falta agora e fechar as dependencias externas e endurecer as garantias de acesso.

### 3. Backend Supabase e RAG

Estado: arquitetura pronta e bastante madura

O backend hoje ja tem:

- edge function `chat` com guardrails, limite de taxa, busca hibrida, telemetria, fallback grounded e fallback de modelos
- edge function `embed-chunks` com autenticacao manual, retry e persistencia idempotente
- edge function `get-usage-stats` para leitura agregada do painel
- migrations para documentos, chunks, metricas, analytics, governanca e eventos de processamento
- busca hibrida via `hybrid_search_chunks`

Pontos relevantes desta leitura:

- o modelo de embedding usado no codigo atual e `gemini-embedding-001`
- o roadmap ainda fala em `text-embedding-004` como estado atual, o que nao bate com a implementacao real
- `embed-chunks` e `get-usage-stats` estao com `verify_jwt = false` no `config.toml`, mas compensam isso validando o usuario manualmente dentro da funcao

Conclusao:

O backend ja tem forma de produto serio. O que resta aqui nao e construir a base do RAG, e sim reduzir drift documental e reforcar os pontos de seguranca e operacao.

### 4. Corpus e governanca documental

Estado: muito bem desenhado, ainda nao concluido operacionalmente

O repositorio ja tem uma boa camada de governanca:

- classificador de documentos
- categorias de corpus
- pesos de busca
- prioridades de ingestao
- criterios de ativacao para grounding
- playbook de ingestao inicial

O ponto em aberto nao e conceitual. O ponto em aberto e operacional:

- o corpus inicial curado ainda nao aparece como frente fechada
- embeddings continuam sujeitos a disponibilidade do provedor
- a base real ainda precisa ser tratada como corpus curado e nao como prova isolada de esteira

Conclusao:

O projeto ja sabe como deve construir a base. O que falta e executar essa construcao com disciplina e registrar a conclusao desse marco.

### 5. Documentacao e memoria do projeto

Estado: inconsistente

Este e hoje o principal ponto fraco do repositorio.

Problemas encontrados:

- `docs/MIGRATION_STATUS.md` ainda se apresenta como "BLOCO 1 Certificado", embora o `main` ja tenha avancado bastante alem disso
- `docs/block-reports` vai apenas ate o BLOCO 4
- `ROADMAP_FUTURO.md` registra um estado atual de embeddings que nao corresponde ao codigo
- `docs/corpus-ingestion-playbook.md` ainda referencia preparacao para um bloco anterior ao momento atual do repositorio

Conclusao:

Quem ler o repositorio hoje sem contexto oral consegue entender a arquitetura, mas nao consegue reconstruir com confianca o estado real da fase atual. Isso precisa ser corrigido antes de novas frentes grandes.

### 6. Qualidade, testes e entrega

Estado: boa base de qualidade, cobertura ainda concentrada em logica local

Pontos positivos:

- workflow de qualidade no GitHub para typecheck, lint, teste e build
- suite local consistente para runtime do chat, classificacao, governanca, auth e respostas
- validacao padrao simples e confiavel: `npm run validate`

Lacunas:

- nao ha teste E2E/browser para home, admin, callback, chat online e exportacao de PDF
- nao ha smoke test de producao automatizado
- nao ha monitoracao de regressao de deploy alem da verificacao manual

Conclusao:

O projeto esta bem defendido contra regressao de logica local, mas ainda nao contra regressao de integracao real.

### 7. Performance e peso de build

Estado: funcional, com divida de otimizacao

O build fecha, mas o Vite acusou chunks grandes nesta analise. Os principais pontos foram:

- `admin-pdf-runtime` acima de `1.3 MB`
- `admin-ingestion` acima de `440 KB`
- `index` acima de `400 KB`
- CSS principal perto de `178 KB`

Conclusao:

Nao e um bloqueio de produto agora, mas ja virou divida tecnica clara. O foco principal deve ser a experiencia do admin e da exportacao em PDF, que concentram boa parte do peso.

## Diagnostico final

Se eu tiver que resumir o momento atual da CLARA em uma frase:

O repositorio ja passou da fase de "construir o produto" e entrou na fase de "consolidar operacao, memoria oficial e disciplina de release".

Isso muda o tipo de proxima tarefa que faz sentido.

Nao parece eficiente abrir agora mais um bloco grande de interface ou comportamento sem antes:

1. alinhar a memoria oficial do repositorio ao que o codigo realmente virou
2. fechar as dependencias operacionais que ainda deixam o produto "pronto, mas condicionado"
3. endurecer verificacao de producao e pontos sensiveis de seguranca/performance

## Plano de acao recomendado

### Prioridade 0 — Alinhar a verdade oficial do repositorio

Objetivo:

Fazer a documentacao voltar a ser confiavel como memoria institucional do projeto.

Tarefas:

- reescrever `docs/MIGRATION_STATUS.md` para refletir a fase real atual, e nao apenas o BLOCO 1
- criar um fechamento documental para os blocos posteriores ja incorporados no `main`, ou consolidar tudo em um relatorio unico de fase
- corrigir `ROADMAP_FUTURO.md` para registrar o embedding real atual como `gemini-embedding-001`
- revisar referencias a "proximo bloco" que ficaram atrasadas em documentos de operacao

Resultado esperado:

Quem abrir o repositorio entende com precisao onde a CLARA esta hoje e o que ainda falta.

### Prioridade 1 — Fechar as dependencias operacionais reais

Objetivo:

Sair do estado "funciona com prova operacional" para "opera com previsibilidade".

Tarefas:

- decidir se Google OAuth sera habilitado agora ou removido da promessa principal ate segunda fase
- verificar o projeto Supabase canonico e confirmar se ele segue sendo a referencia oficial de operacao
- publicar ou reconfirmar as edge functions remotas criticas e seu estado real no projeto atual
- montar a primeira carga curada do corpus oficial e registrar sua conclusao
- reprocessar qualquer documento em `embedding_pending` quando a disponibilidade do provedor estiver normalizada

Resultado esperado:

O produto deixa de depender de memoria oral para saber qual ambiente e canonico, como o admin entra e quais documentos realmente sustentam o grounding.

### Prioridade 2 — Hardening tecnico do backend administrativo

Objetivo:

Reduzir fragilidade operacional e fortalecer controle de acesso.

Tarefas:

- revisar se `embed-chunks` e `get-usage-stats` podem migrar de autenticacao manual para enforcement de JWT no proprio Supabase, sem quebrar o fluxo do painel
- revisar politicas RLS e superficie de acesso publico das tabelas mais sensiveis
- consolidar um checklist unico de secrets, env vars, deploy e verificacao pos-publicacao
- definir um procedimento curto de rollback e resposta a indisponibilidade do provedor Gemini

Resultado esperado:

Menos risco de configuracao "quase certa" em ambiente real e menos dependencia de conhecimento tacito.

### Prioridade 3 — QA de integracao e verificacao de producao

Objetivo:

Garantir que deploy valido no build continue significando comportamento valido em producao.

Tarefas:

- adicionar smoke tests E2E para home, admin, callback, chat e exportacao de PDF
- definir um checklist pos-deploy com verificacao de branding, chat, referencias, admin e metadados publicos
- registrar um procedimento curto para prova de grounding com documentos reais

Resultado esperado:

Cada novo deploy passa a ter uma prova objetiva de integridade funcional, e nao so de build.

### Prioridade 4 — Otimizacao de performance do admin e do PDF

Objetivo:

Melhorar peso de entrega sem mexer no contrato do produto.

Tarefas:

- separar melhor o runtime de PDF e ingestao em chunks menores
- revisar importacoes pesadas no admin
- avaliar se parte da exportacao PDF pode ser carregada ainda mais tarde ou isolada por fluxo
- reduzir warnings de build que hoje ja apontam crescimento relevante

Resultado esperado:

Menor custo de carregamento do admin e menor risco de regressao de performance no frontend.

## Ordem pratica sugerida

Se eu fosse executar as proximas tarefas agora, faria nesta ordem:

1. corrigir a memoria oficial do repositorio
2. confirmar ambiente operacional canonico e status real das edge functions
3. fechar a decisao de acesso admin: Google agora ou depois
4. concluir corpus inicial curado e sua prova operacional
5. endurecer auth e checklist operacional do backend
6. adicionar smoke tests de integracao
7. otimizar peso do admin/PDF

## Conclusao

A CLARA ja nao parece um prototipo.

O repositório mostra um produto com identidade, arquitetura, fluxo administrativo, busca grounded e linguagem institucional bastante amadurecidos.

O que falta agora e menos "inventar novas camadas" e mais consolidar:

- verdade documental
- ambiente operacional
- verificacao de producao
- hardening de acesso
- performance dos fluxos pesados

Esse e o tipo de trabalho que transforma um bom repositorio em uma base confiavel de continuidade.

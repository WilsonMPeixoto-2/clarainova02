# Política Operacional do Sistema de Cache — CLARAINOVA02

**Data de Vigência:** 19 de Abril de 2026
**Escopo:** Política de funcionamento, versionamento e expiração do Cache Duplo (`embedding_cache` e `chat_response_cache`)

---

## 1. Objetivo do Cache Duplo

A infraestrutura de RAG da CLARAINOVA02 utiliza um sistema de duplo cache no Supabase para atingir três objetivos críticos de negócio:
1. **Governança de Custos:** Minimizar o faturamento da API do Google Gemini, evitando gerar embeddings ou completions idênticas repetidas vezes.
2. **Latência de Resposta (Performance):** Respostas cacheadas pulam completamente a latência do LLM (que pode variar entre 15s a 30s) e da busca vetorial, entregando o conteúdo em ~1.5s.
3. **Estabilidade de Operação:** Garantir resiliência temporária contra instabilidades ou gargalos da API do provedor (Gemini).

---

## 2. Nível 1: Cache de Respostas (`chat_response_cache`)

É o escudo primário. Quando um usuário faz uma pergunta, o sistema calcula o hash SHA-256 do texto de entrada. Se houver um _hit_ para o mesmo prompt, o texto gerado do cache é devolvido instantaneamente.

### Regras de Operação e Invalidação
- **TTL (Time to Live):** 24 horas (padrão) a 7 dias (perguntas institucionais frias). O TTL é gerenciado pelo worker/cron de limpeza ou política da tabela.
- **Isolamento de Estado:** O cache é sensível ao modo (Direto vs. Didático). Perguntas iguais em modos diferentes geram e consomem chaves de cache distintas.
- **Invalidação Explicita (Cache Busting):** O cache deve ser limpo/ignorado quando:
  1. A base de documentos (corpus) for atualizada ou modificada. (Isso evita que o cache responda com base em um PDF antigo).
  2. O prompt de sistema (`system_prompt`) for versionado (novo release).
- **Segurança (RLS):** A tabela `public.chat_response_cache` tem acesso irrestrito pelo público negado. Ela é operada estritamente via `service_role` na Edge Function de chat.

---

## 3. Nível 2: Cache de Embeddings (`embedding_cache`)

É o escudo secundário. Quando uma pergunta não possui resposta cacheada (Cache Miss Primário), o sistema verifica se a mesma exata frase já teve sua intenção vetorial calculada anteriormente.

### Regras de Operação e Invalidação
- **TTL (Time to Live):** Padrão de 7 dias, podendo ser maior, pois o sentido das palavras e a dimensão vetorial mudam muito raramente para o mesmo modelo.
- **Isolamento de Modelo:** O hash do embedding inclui o ID do modelo (`gemini-embedding-2-preview`) e a dimensionalidade (`768`). Mudar o modelo invalida automaticamente a compatibilidade do cache.
- **Vantagem:** Evita a chamada de API de embedding, pulando direto para a busca no Vector DB e geração da resposta.

---

## 4. Diretrizes de Versionamento e Drift de Conteúdo

1. **Atualização do RAG (Novo Documento Ingerido):**
   - **Obrigatório:** Executar um script de `TRUNCATE public.chat_response_cache;` no Supabase após cada nova ingestão. Respostas antigas baseadas em corpus anterior são inválidas e configuram "alucinação presa no cache".
2. **Impacto na Telemetria (`chat_metrics` / `query_analytics`):**
   - Um Cache Hit Primário de Resposta não deve empobrecer a telemetria. O evento de log deve registrar a intenção de pergunta do usuário marcando a flag `cache_hit: true` na base de métricas para não distorcer a visão de "perguntas mais frequentes".

---
*Documento formalizado durante a consolidação da versão v1.0 (2026-04-19).*

# Roadmap de Evolução Tecnológica: CLARA

Este documento serve como um repositório de memória oficial sobre futuras evoluções de arquitetura que devem ser avaliadas assim que saírem de suas fases experimentais (Preview/Beta) para o status de *Produção*.

## 1. Migração de Embeddings (Modelo: Gemini Embedding 2)

**Status (Abril 2026):** Migração concluída. O projeto agora utiliza `gemini-embedding-2-preview` com compressão Matryoshka a 768 dimensões, substituindo o antigo `gemini-embedding-001`.

### O que mudou:
- **Modelo de embedding:** `gemini-embedding-001` → `gemini-embedding-2-preview`
- **Técnica:** Matryoshka Representation Learning (MRL) a 768d — mesma largura de coluna no pgvector, mas qualidade semântica significativamente superior
- **Espaço vetorial:** Incompatível com embeddings anteriores — requer re-ingestão de todo o corpus
- **Aplicado em:** `embed-chunks` (ingestão) e `chat` (busca por consulta)

### Pendências futuras quando sair de Preview para GA:
- [ ] Atualizar o nome do modelo de `gemini-embedding-2-preview` para o nome GA
- [ ] Avaliar aumento de dimensionalidade para 1536 ou 3072 se o custo de pgvector permitir
- [ ] Explorar ingestão multimodal (PDF puro, tabelas, imagens escaneadas no mesmo espaço vetorial)
- [ ] Modificar a rotina `admin-ingestion.ts` para envio binário multimodal em vez de texto extraído

## 2. Modelos Generativos (Gemini 3.1)

**Status (Abril 2026):** O projeto migrou para os modelos Gemini 3.1, substituindo a cadeia 2.5.

### Cadeia de fallback atual:
1. `gemini-3.1-flash-lite-preview` — principal, baixa latência e alto volume
2. `gemini-3.1-pro-preview` — fallback para raciocínio complexo

### Pendências futuras quando sair de Preview para GA:
- [ ] Atualizar os nomes dos modelos para as versões GA estáveis
- [ ] Avaliar inclusão do `gemini-3.1-flash-live-preview` para funcionalidades conversacionais em tempo real
- [ ] Reavaliar parâmetros de temperatura e topP com base na qualidade das respostas 3.1

# Roadmap de Evolução Tecnológica: CLARA

Este documento serve como um repositório de memória oficial sobre futuras evoluções de arquitetura que devem ser avaliadas assim que saírem de suas fases experimentais (Preview/Beta) para o status de *Produção*.

## 1. Migração de Embeddings (Modelo: Gemini Embedding 2)

**Status Atual (Março 2026):** O projeto utiliza ativamente o modelo `text-embedding-004` padrão, que é ideal e consolidado para RAG baseado em fragmentos textuais extraídos via interface de admin.
**Status da Nova Tecnologia:** Recém-lançada em fase "Preview".
**Gatilho para Ação:** Ocorrerá quando a API do Gemini Embedding 2 for oficialmente promovida para a versão "Stable/GA" (General Availability).

### O que é o Gemini Embedding 2?
É um modelo de IA de incorporações (embeddings) **nativamente multimodal**. Ele joga texto, vídeo, áudio e PDF cru no mesmo espaço contínuo matemático (de até 3072 dimensões).

### Vantagens Esperadas para a CLARA:
1. **Ingestão Multimodal:** Mudar a ingestão de PDFs de uma versão "baseada em texto corrido extraído" (via Unpdf) para "PDF puro multimodal", onde tabelas, gráficos, imagens escaneadas e fotos presentes no documento SEI serão indexados vetorialmente pela foto do documento.
2. **Compressão pelo método Matryoshka:** O modelo permite salvar os vetores com o fim quebrado (ex: de 3072 para 768 dimensões) sem perda letal de fidelidade, reduzindo severamente os custos do banco de dados vetorial de `pgvector` na Supabase.

### Passo a Passo para a Futura Migração:
- [ ] Validar a estabilidade do modelo na documentação do `@google/genai`.
- [ ] Atualizar o `systemPrompt` (se necessário para a nova camada de interpretação de imagens).
- [ ] Modificar a rotina `admin-ingestion.ts` no frontend para enviar os arquivos de forma binária multimodal em vez de texto extraído.
- [ ] Atualizar a edge function `embed-chunks` para chamar o modelo multimodal do Gemini 2 e lidar com vetores MRL (Matryoshka).
- [ ] Realizar rotina de "Re-ingestão em Lote" com os PDFs antigos usando a nova IA pelo painel Admin.

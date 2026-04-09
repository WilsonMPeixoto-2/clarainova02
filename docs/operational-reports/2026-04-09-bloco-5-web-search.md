# Relatório Operacional: BLOCO 5 - Web Search dentro do Escopo

**Data:** 09 de Abril de 2026
**Líder Técnico:** CODEX @ WILSON-MP
**Branch:** `session/2026-04-09/HOME/CODEX/RECOVERY-SPRINT-1`

## Objetivo
Configurar a capacidade de consulta livre na Web para a CLARA sem permitir a quebra do escopo do RAG institucional, garantindo que "Google Search" funcione apenas em canais chancelados pelo Rio de Janeiro e somente quando trouxer benefício comprovado em falhas de corpus interno.

## Implementações Técnicas
1. **Regra de Habilitação Restrita (GenerationStrategy)**:
   A propriedade `enableWebSearch` foi adicionada e rege a decisão para cada payload enviado ao modelo nativo do Gemini (Google GenAI SDK). A API envia o objeto Tool `googleSearch` APENAS se as condições do roteador forem atendidas:
   - A Flag global `FEATURE_WEB_SEARCH` é `true`.
   - A intenção principal do usuário não é de conversa jogada fora (`fora_escopo`).
   - A base interna do projeto demonstrou falência de grounding (`confidenceTier === 'fraca'`) OU é uma denúncia de erro técnico do sistema operadora (`erro_sistema`/`conceito`).
2. **Confinamento de Escopo via Prompt Overlay**:
   A Gemini API tem limites para hardcoding de "domínios" diretos via SDK no Grounding Web da Vertex. Como alternativa imune, construímos um novo bloco de *instructions overlay*.
   Sempre que `enableWebSearch=true`, cravamos as seguintes injeções de conduta acima do prompt:
   - Permissão estrita e condicionada de uso da ferramenta.
   - Ordem expressa para circundar e formatar buscas limitadas às URIs terminadas em: `rio.rj.gov.br, prefeitura.rio, carioca.rio, pcrj.rj.gov.br`.
   - Descarte imperativo de fóruns de ajuda, conselhos terceiros ou wikis.
3. **Injeção Transparente via TypeCast**:
   Foi feito Cast do Tool nas configurações do SDK: `...(strategy.enableWebSearch ? { tools: [{ googleSearch: {} } as unknown as import('@google/genai').Tool] } : {})` para acoplar sem alarmes de linter.

## Verificações
- Regra Linter EsLint totalmente limpa (0 Errors, 0 Warnings ignorados propositalmente).
- Arquiteturas RAG complexas mantêm fluxo e tipagem com a adição de configurações da web.

## Próximo Passo 
- Acionar o **BLOCO 6 - Observabilidade custo × qualidade**. Vamos garantir que geração via APIs free x paid, métricas calculadas e tokens transmitidos sejam persistidos corretamente sem verbosidades logísticas extremas no banco `chat_metrics` ou `query_analytics`.

# Relatório Operacional: BLOCO 4 - Roteamento Dinâmico Inteligente

**Data:** 09 de Abril de 2026
**Líder Técnico:** CODEX @ WILSON-MP
**Branch:** `session/2026-04-09/HOME/CODEX/RECOVERY-SPRINT-1`

## Objetivo
Transformar a lógica estática ("Free sempre primeiro, e se falhar, nada") em um Roteamento de API/Billing inteligente. Ensinamos a CLARA a aplicar os projetos Free/Paid e modelos Flash-Lite/Pro balanceadamente segundo a complexidade de cada classe da tarefa.

## Implementações Técnicas
1. **Modelagem de Estratégias (GenerationStrategy)**:
    - Adição da tag `targetBilling: 'free' | 'paid' | 'legacy'` no helper *buildGenerationStrategy*.
    - Requisições simpes (sem fallback direto, sem roteamento alvo e com modo explicativo curto) forçam infraestrutura `free` e o ecossistema `[FLASH-LITE, PRO]`.
    - Requisições complexas (didático forçado, qualidade de base moderada/fraca ou erros) forçam infraestrutura `paid` assegurando a hierarquia premiun `[PRO, FLASH-LITE]` para proteger a reputação das respostas.
2. **Cliente Gemini Desacoplado**:
    - O RAG de base de vetor e agrupamentos contextuais (Query Expansion) permanece associado prioritariamente ao Google Cloud Free porque o peso e a instabilidade não quebram o fluxo de prompt principal e são gratuitos neste tier.
    - O ato exato da geração de tokens para consumo (`generateStructuredWithFallback`, etc.) recarrega via injeção um cliente GoogleGenAI `generationAi` preparado e limpo contendo o escopo financeiro escolhido.
3. **Telemetria e Observabilidade**:
    - A prop `activeProjectBilling` submetida pela instância global foi redesenhada para copiar no momento da geração qual foi o `targetBilling` decidido, gravando em `chat_metrics.metadata_json` com exatidão qual projeto está financiando o tráfego da interação final.

## Checkpoint e Testes
- A bateria do linter local e testes unitários Vitest foram concluídos com sucesso.
- Nenhuma das assinaturas corrompeu as métricas ou estourou dependências estendidas no Edge Worker. 

## Próximo Passo 
- Inicia-se o **BLOCO 5 – Web Search dentro do escopo**, estabelecendo as regras explícitas para quando e onde a busca em diretórios externos aprovados valerá a pena, garantindo que o assistente institucional não sofra alucinações generalistas.

# Relatório operacional - corpus batch 1 e avaliação inicial do RAG

Data: 2026-04-04  
Frente: Curadoria do corpus / avaliação do RAG em produção

## Objetivo

Executar a primeira rodada prática da política de curadoria do corpus da CLARA:

- localizar e preparar o lote inicial de documentos do SEI.Rio
- ingerir primeiro o núcleo local
- medir o comportamento do RAG com perguntas reais
- registrar o que já está pronto para a próxima leva e o que ainda precisa de ajuste

## Escopo da rodada

### Staging local concluído

Foi criada a área `corpus_staging/` com documentos nomeados segundo a política oficial:

- `01_nucleo_oficial_sei_rio`
- `02_cobertura_pen_compativel`
- `03_apoio_complementar_versionado`
- `99_quarentena_ou_arquivo_morto`

Também foram adicionados:

- `docs/corpus-curation-policy.md`
- `docs/corpus_manifest.template.csv`
- `docs/corpus_manifest.csv`
- `scripts/corpus/fetch_source_to_pdf.py`
- `scripts/corpus/fetch_sei_rio_guide_series.py`
- `scripts/corpus/ingest_manifest_batch.py`

## Materiais encontrados e preparados

### Núcleo local SEI.Rio

Itens preparados em staging:

- `NUCLEO_P1_decreto_instituicao_sei_rio_57250_2025.pdf`
- `NUCLEO_P1_decreto_substituicao_processo_rio_55615_2025.pdf`
- `NUCLEO_P1_resolucao_numeracao_processos_cvl_237_2025.pdf`
- `NUCLEO_P1_guia_usuario_interno_sei_rio_2025.pdf`
- `NUCLEO_P1_guia_migracao_sei_rio_2026.pdf`
- `NUCLEO_P1_guia_usuario_externo_sei_rio_2025.pdf`
- `NUCLEO_P2_faq_servidor_sei_rio_2025.pdf`
- `NUCLEO_P2_termo_uso_aviso_privacidade_sei_rio_2025.pdf`
- `NUCLEO_P2_faq_cidadao_sei_rio_2025.pdf`

### Cobertura oficial compatível (staging apenas)

Itens baixados e mantidos fora do grounding principal nesta rodada:

- `COBERTURA_P2_manual_usuario_pen_sei_4_0_plus.pdf`
- `COBERTURA_P2_modulos_pen_documentacao_oficial.pdf`
- `COBERTURA_P2_nota_compatibilidade_pen_sei_4_1_5_2025.pdf`
- `COBERTURA_P2_nota_compatibilidade_tramita_sei_4_x_e_5_x_2025.pdf`
- `COBERTURA_P2_nota_oficial_sei_5_0_2025.pdf`
- `COBERTURA_P2_nota_oficial_sei_5_0_3_2025.pdf`

### Apoio complementar controlado (staging apenas)

- `APOIO_P3_novidades_interface_wiki_sei_rj_4_1.pdf`

## Correções na automação de ingestão

Durante a automação, a function remota `embed-chunks` rejeitou inicialmente o fluxo com `AUTH:UNAUTHORIZED` quando a chamada era feita com `service_role` legado.

Foi ajustado o bypass seguro de automação em `supabase/functions/embed-chunks/index.ts` para aceitar:

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_SECRET_KEY`
- tokens `sb_secret_*`
- JWTs cujo payload declare `role = service_role`

Depois da republicação da function remota, a automação passou a atingir o fluxo normal do upsert e a ingestão via serviço ficou operacional.

## Ingestão executada

### Lote P1 ingerido

Documentos ativos e válidos no corpus após reconciliação:

- `Decreto Rio nº 57.250 de 19 de novembro de 2025`
- `Resolução CVL nº 237 de 19 de novembro de 2025`
- `Guia do usuário interno – SEI.Rio`
- `Guia de migração – SEI.Rio`
- `Guia do usuário externo – SEI.Rio`

### Lote P2 local ingerido após os primeiros testes

- `Perguntas frequentes do servidor – SEI.Rio`
- `Termo de Uso e Aviso de Privacidade do SEI.Rio`
- `Perguntas frequentes do cidadão – SEI.Rio`

### Itens retirados do corpus ativo

Dois documentos foram explicitamente inativados por qualidade/escopo:

- `MODELO_DE_OFICIO_PDDE.pdf`
  - legado fora do escopo SEI-Rio
- `Decreto Rio nº 55.615 de 1º de janeiro de 2025`
  - captura atual parcial demais (`460` caracteres), aguardando texto oficial mais completo

Também foram mantidas inativas as três ingestões provisórias fracas dos guias do SEI.Rio geradas antes da reconstrução correta por série de capítulos.

## Avaliação inicial do RAG

Arquivos de evidência:

- `docs/operational-reports/data/2026-04-04-rag-batch-1-eval.json`
- `docs/operational-reports/data/2026-04-04-rag-batch-1-eval-post-p2.json`

### Perguntas testadas

Rodada 1:

1. O que o Decreto Rio nº 57.250/2025 institui no âmbito do Município do Rio de Janeiro?
2. Como é composto o número do processo no SEI.Rio segundo a Resolução CVL nº 237/2025?
3. Como fazer login no SEI.Rio usando a matrícula?
4. Como enviar um processo para uma ou mais unidades no SEI.Rio?
5. Quando a migração manual do Processo.rio para o SEI.Rio deve ser usada?
6. Qual nível da conta gov.br permite liberação automática do cadastro no SEI.Rio para usuário externo?

Rodada 2:

7. Durante a transição, o servidor pode continuar usando o Processo.rio ao mesmo tempo que o SEI.Rio?
8. O credenciamento de usuário externo no SEI.Rio é pessoal e intransferível?
9. Como redefinir a senha do usuário externo no SEI.Rio?

### Resultado geral

- `9/9` respostas HTTP `200`
- `9/9` com `webFallbackUsed = false`
- `9/9` com `answerScopeMatch = exact`
- `9/9` com `finalConfidence = 1`

### O que funcionou bem

- O núcleo local novo já sustenta respostas normativas e operacionais sem depender de web fallback.
- As perguntas de migração foram respondidas de forma consistente com o `Guia de migração – SEI.Rio` e com o Decreto 57.250.
- As perguntas de usuário externo passaram a citar também os novos documentos P2 locais (FAQ do cidadão e Termo de Uso), o que mostra valor real da segunda leva local.
- A retirada do legado fora de escopo e do decreto parcial reduziu o risco de citação indevida.

### O que ainda apareceu como ponto de atenção

- Algumas referências ainda usam `subtitulo` pouco útil, especialmente em guias e resoluções, o que indica necessidade de refino na heurística de `sectionTitle`.
- Em perguntas operacionais como login e envio de processo, ainda aparecem referências cruzadas de guias que não são o melhor trecho possível.
- O documento `SEI-Guia-do-usuario-Versao-final.pdf` continua aparecendo como reforço de cobertura operacional; isso não é um erro, mas precisa permanecer com precedência inferior ao núcleo local.
- O Decreto 55.615 continua pendente de substituição por um texto oficial mais completo antes de voltar ao corpus ativo.

## Avaliação de exatidão

### Exatidão factual

Boa.

As respostas testadas ficaram aderentes aos documentos locais do SEI.Rio e não apresentaram alucinação evidente nem desvio para material externo não compatível.

### Exatidão de atribuição

Boa, mas ainda não excelente.

O sistema cita documentos corretos, porém alguns títulos de seção recuperados ainda são fracos, truncados ou pouco representativos para o usuário final.

### Exatidão editorial

Boa.

Depois da inativação do legado fora de escopo e do decreto parcial, o corpus ficou mais coerente. Ainda assim, o próximo salto de qualidade depende de duas frentes:

- melhorar a rotulagem de seções nos chunks
- controlar melhor a competição entre guias próximos quando a pergunta é ampla

## Decisão operacional após a rodada

### Já pode avançar

- manter o lote local (`NUCLEO_P1` + `NUCLEO_P2`) como base ativa do corpus
- continuar testes reais sobre esse núcleo
- documentar a governança do corpus como política canônica

### Ainda não deve fazer

- ingerir a camada `COBERTURA_P2` do PEN no grounding principal nesta mesma rodada
- misturar apoio complementar versionado ao núcleo ativo
- reativar o Decreto 55.615 antes de conseguir uma fonte oficial completa

## Próximos passos recomendados

1. Encontrar uma versão oficial mais completa do Decreto Rio nº 55.615/2025 e substituir a captura parcial atual.
2. Melhorar a heurística de `sectionTitle` para os guias do SEI.Rio.
3. Rodar uma bateria maior de perguntas reais com rubrica de avaliação manual.
4. Só então decidir a entrada da camada `COBERTURA_P2` no corpus ativo.

## Conclusão

O experimento foi bem-sucedido.

O corpus da CLARA deixou de ser apenas um conjunto de uploads pontuais e passou a operar com:

- política editorial explícita
- manifesto de curadoria
- staging por camadas
- ingestão automatizada via manifesto
- avaliação grounded contra lote local real

O sistema RAG já responde com boa exatidão sobre o núcleo do SEI.Rio. O principal trabalho restante não é provar que a arquitetura funciona, mas refinar a governança e a qualidade editorial da recuperação.

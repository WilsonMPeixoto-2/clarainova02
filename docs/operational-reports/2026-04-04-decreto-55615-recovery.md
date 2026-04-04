# Relatório operacional - recuperação do Decreto Rio nº 55.615/2025

Data: 2026-04-04  
Frente: Corpus SEI.Rio / fechamento da lacuna normativa local

## Objetivo

Recuperar uma versão íntegra do Decreto Rio nº 55.615/2025 para substituir a captura parcial que havia sido retirada do corpus ativo.

## Fonte localizada

Foi localizada uma reprodução integral do decreto em fonte institucional secundária:

- URL: `https://aplicnt.camara.rj.gov.br/APL/Legislativos/scpro.nsf/8446f2be3d9bb8730325863200569352/2787d701335f49a503258cf4006edb3f?Collapse=1.1&Count=100&OpenDocument=&Start=1`
- Origem institucional: Câmara Municipal do Rio de Janeiro
- Observação editorial: a página reproduz o texto completo do decreto em seção de legislação citada e referencia explicitamente o `D.O.RIO DE 01.01.2025`

## Ação executada

- o texto integral foi extraído da fonte institucional secundária
- foi gerado um novo PDF de staging:
  - `corpus_staging/01_nucleo_oficial_sei_rio/NUCLEO_P1_decreto_substituicao_processo_rio_55615_2025.pdf`
- hash SHA-256 registrado no manifesto:
  - `6132d085b735c7ff485c7c3e5327a3126bc57f7838cf4821ef0bfb31215ca207`
- o manifesto `docs/corpus_manifest.csv` foi atualizado para refletir a nova origem e o novo estado do documento

## Ingestão remota

- documento criado/processado no remoto: `62606bcc-2ccb-45bd-b388-eb69a358acc0`
- resultado da ingestão: `processed`
- chunks persistidos: `3`
- embeddings persistidos: `3`
- `failed_embeddings`: `0`

## Verificação funcional rápida

Pergunta testada:

`O que o Decreto Rio nº 55.615, de 1º de janeiro de 2025, determina sobre a substituição do Processo.rio pelo SEI-Rio?`

Resultado observado:

- HTTP `200`
- `finalConfidence = 1`
- `answerScopeMatch = exact`
- `webFallbackUsed = false`
- referências principais:
  - Decreto Rio nº 55.615 de 1º de janeiro de 2025
  - Decreto Rio nº 57.250 de 19 de novembro de 2025

Leitura qualitativa:

- a resposta captou corretamente a substituição do `Processo.rio` pelo `SEI-Rio`
- descreveu de forma adequada as regras de transição e a criação do grupo de trabalho
- a nova peça já entrou de forma útil no grounding local

## Decisão editorial desta rodada

O decreto pode permanecer **ativo** no corpus local com a seguinte ressalva:

- a origem usada nesta etapa é institucional, porém secundária
- caso um PDF oficial íntegro do Executivo/D.O.RIO seja localizado depois, ele deve substituir esta versão sem hesitação

## Próximo passo relacionado

Manter a busca por uma cópia oficial primária do decreto, mas sem bloquear a evolução do lote local, já que a lacuna normativa principal deixou de existir para o uso corrente do RAG.

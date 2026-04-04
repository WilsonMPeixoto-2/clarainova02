# Relatorio operacional - curadoria e staging do corpus

Data: 2026-04-04
Frente: Curadoria do corpus / coleta controlada

## Objetivo

Materializar a politica de curadoria do corpus da CLARA e adiantar a coleta do lote inicial sem misturar documentos por intuicao.

## O que foi feito

- criada a politica detalhada de curadoria em `docs/corpus-curation-policy.md`
- criado o manifesto-template em `docs/corpus_manifest.template.csv`
- criado o utilitario `scripts/corpus/fetch_source_to_pdf.py`
- criada a area local `corpus_staging/` com camadas separadas
- adicionado `corpus_staging/` ao `.gitignore`

## Decisoes operacionais

- o staging local fica fora do Git
- a coleta pode usar tanto PDF oficial direto quanto PDF gerado localmente a partir de HTML oficial
- o manifesto e obrigatorio antes da ingestao do lote
- o lote 1 deve ser ingerido sozinho antes de abrir as camadas seguintes

## Pendencias desta frente

- baixar os itens do lote 1 que forem acessiveis
- confirmar links oficiais ainda nao resolvidos no portal do SEI.Rio
- tentar primeira subida automatizada usando a stack remota do projeto
- rodar perguntas reais e registrar analise do RAG

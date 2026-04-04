# Relatório operacional - integração em `main` e deploy de produção do corpus batch 1

Data: 2026-04-04  
Frente: Curadoria do corpus / avaliação inicial do RAG / continuidade oficial

## Escopo

Consolidar em `main` e em produção a primeira leva governada do corpus SEI.Rio, junto com:

- política canônica de curadoria
- manifesto de corpus
- automação de staging/ingestão
- avaliação inicial do RAG sobre o núcleo local

## Estado integrado

- Commit integrado em `main`: `5c59b2169afff642871747b166286a43fc1348ea`
- Mensagem: `feat(corpus): stage curated sei-rio batch and evaluate rag`
- Branch oficial: `origin/main`

## Produção

- Projeto Vercel: `clarainova02`
- Deploy canônico observado: `dpl_ycURU2FVB1ABYuFRzdSckTo9K984`
- Estado: `READY`
- Commit publicado: `5c59b2169afff642871747b166286a43fc1348ea`
- URLs ativas:
  - `https://clarainova02.vercel.app`
  - `https://clarainova02-wilson-m-peixotos-projects.vercel.app`
  - `https://clarainova02-git-main-wilson-m-peixotos-projects.vercel.app`

## Edge Functions remotas confirmadas

- `chat` v15
- `embed-chunks` v16
- `get-usage-stats` v11

## O que entrou nesta integração

### Governança e staging do corpus

- `docs/corpus-curation-policy.md`
- `docs/corpus_manifest.template.csv`
- `docs/corpus_manifest.csv`
- `scripts/corpus/fetch_source_to_pdf.py`
- `scripts/corpus/fetch_sei_rio_guide_series.py`
- `scripts/corpus/ingest_manifest_batch.py`

### Lote local efetivamente ingerido no corpus ativo

- Decreto Rio nº 57.250/2025
- Resolução CVL nº 237/2025
- Guia do usuário interno – SEI.Rio
- Guia de migração – SEI.Rio
- Guia do usuário externo – SEI.Rio
- FAQ do servidor – SEI.Rio
- Termo de Uso e Aviso de Privacidade do SEI.Rio
- FAQ do cidadão – SEI.Rio

### Materiais baixados, mas ainda fora do grounding principal

- Manual do Usuário SEI 4.0+ — PEN
- Documentação de apoio / módulos oficiais do PEN
- Notas oficiais de compatibilidade e releases 4.1.5 / 5.0 / 5.0.3
- Apoio complementar versionado de interface (`wiki SEI-RJ 4.1`)

## Ajustes operacionais relevantes

- `embed-chunks` passou a aceitar com segurança a automação autenticada por service role/secret no fluxo de ingestão em lote
- a política de curadoria e o manifesto passaram a distinguir explicitamente `nucleo`, `cobertura`, `apoio` e `quarentena`
- o Decreto Rio nº 55.615/2025 foi mantido fora do corpus ativo por captura ainda parcial
- o legado fora de escopo `MODELO_DE_OFICIO_PDDE.pdf` foi mantido inativo

## Avaliação inicial do RAG

Relatório-base: `docs/operational-reports/2026-04-04-rag-evaluation-and-corpus-batch-1.md`

Resultado resumido:

- `9/9` respostas com HTTP `200`
- `9/9` sem `webFallbackUsed`
- `9/9` com `answerScopeMatch = exact`
- `9/9` com `finalConfidence = 1`

Leitura operacional:

- o núcleo local já sustenta respostas normativas e operacionais do SEI.Rio com boa exatidão
- os documentos P2 locais melhoraram respostas de usuário externo
- a principal lacuna restante está no refinamento de `sectionTitle` e na substituição do Decreto 55.615 por captura íntegra oficial

## Pendências reais após a integração

1. Encontrar e substituir a captura parcial do Decreto Rio nº 55.615/2025 por um texto oficial completo.
2. Rodar uma bateria ampliada de 15 a 20 perguntas reais sobre o núcleo local.
3. Decidir quando abrir a ingestão da camada `COBERTURA_P2` do PEN sem reduzir a precedência do SEI.Rio.
4. Repetir o reupload controlado do mesmo PDF no admin para fechar a evidência residual de deduplicação da UI.

## Conclusão

O projeto saiu de “RAG com documentos pontuais” para “corpus governado com núcleo local ativo em produção”.

O ganho principal desta rodada não foi só adicionar PDFs, mas estabelecer:

- política editorial explícita
- metadados operacionais por documento
- staging por camadas
- automação de ingestão por manifesto
- avaliação grounded com evidência concreta

O próximo passo útil deixa de ser provar a arquitetura e passa a ser consolidar a governança do corpus e ampliar a bateria empírica de perguntas.

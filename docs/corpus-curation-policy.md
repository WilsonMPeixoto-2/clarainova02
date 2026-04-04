# Politica de curadoria do corpus da CLARA

Data: 2026-04-04

## Objetivo

Transformar a coleta documental da CLARA em uma trilha governada, auditavel e compativel com o contexto real do SEI.Rio.

## Principio central

Um documento oficial nao entra automaticamente no corpus ativo.

Para o SEI, confiabilidade institucional so e insuficiente. Cada material precisa ser avaliado tambem por:

- aderencia ao SEI.Rio
- faixa de versao do SEI
- modulos relacionados
- perfil de usuario
- risco de conflito com outra instancia ou parametrizacao

## Linha de autoridade

Quando houver divergencia entre fontes:

1. `NUCLEO` local do SEI.Rio vence.
2. `COBERTURA` do ecossistema PEN complementa.
3. `APOIO` apenas contextualiza e explica.
4. `QUARENTENA` nunca participa do grounding principal.

## Camadas documentais

### 1. NUCLEO

Funcao:

- verdade local do SEI.Rio
- fundamento normativo e operacional principal

Entram aqui:

- decretos e resolucoes locais do SEI.Rio
- guias oficiais do SEI.Rio
- FAQ e termos oficiais do SEI.Rio

### 2. COBERTURA

Funcao:

- ampliar repertorio de uso do SEI sem substituir a verdade local

Entram aqui:

- manual do usuario SEI 4.0+ do PEN
- documentacao oficial de apoio do PEN
- notas oficiais de compatibilidade e releases do MGI/PEN

### 3. APOIO

Funcao:

- enriquecer interface, exemplos e desambiguacao visual/versionada

Entram aqui:

- wikis institucionais versionadas
- correspondencia de icones
- guias complementares com versao explicita

### 4. QUARENTENA

Funcao:

- preservar materiais potencialmente uteis sem contaminar grounding

Entram aqui:

- materiais 3.x
- documentos sem versao clara
- materiais de outra instituicao com parametrizacao local forte
- conteudo tecnico/administrativo fora do escopo do usuario final

## Regra de nomenclatura

Padrao de arquivo:

`[CAMADA]_[PRIORIDADE]_[TEMA]_[ORIGEM]_[VERSAO-OU-ANO].pdf`

Exemplos:

- `NUCLEO_P1_decreto_instituicao_sei_rio_57250_2025.pdf`
- `NUCLEO_P1_guia_usuario_interno_sei_rio_2025.pdf`
- `COBERTURA_P2_manual_usuario_pen_sei_4_0_plus.pdf`
- `APOIO_P3_novidades_interface_wiki_sei_rj_4_1.pdf`

## Ordem de ingestao

### Lote 1

Objetivo: criar o cerebro minimo local do SEI.Rio.

Entram primeiro:

- decreto 57.250/2025
- decreto 55.615/2025
- resolucao CVL 237/2025
- guia do usuario interno
- guia de migracao
- guia do usuario externo

### Lote 2

Objetivo: ampliar a cobertura local sem abrir conflito.

Entram depois:

- FAQ do servidor
- termo de uso e aviso de privacidade
- FAQ do cidadao/usuario externo

### Lote 3

Objetivo: adicionar cobertura oficial compativel do ecossistema PEN.

Entram depois:

- manual do usuario SEI 4.0+
- documentacao oficial do PEN
- notas de compatibilidade e releases relevantes

### Lote 4

Objetivo: apoio complementar controlado.

Entram por ultimo:

- apoio visual/interface
- materiais versionados de outra instancia

## Precedencia editorial

- `NUCLEO_P1` tem o maior peso.
- `NUCLEO_P2` continua acima de qualquer `COBERTURA_P2`.
- `COBERTURA_P2` nunca substitui regra local.
- `APOIO_P3` nao pode reger resposta principal quando houver conflito.

## Metadados minimos por documento

Cada item precisa ser registrado no manifesto antes da ingestao com, no minimo:

- `arquivo`
- `titulo_oficial`
- `fonte_url`
- `origem_institucional`
- `camada`
- `prioridade`
- `tipo_documental`
- `escopo_usuario`
- `versao_sei_referida`
- `ano`
- `peso_autoridade`
- `status_download`
- `status_ingestao`
- `observacao_de_conflito`

Campos adicionais recomendados:

- `scope_instance`
- `module_tags`
- `hash_sha256`
- `data_download`

## Estrutura de staging local

Os arquivos coletados devem ser organizados em `corpus_staging/`:

- `01_nucleo_oficial_sei_rio`
- `02_cobertura_pen_compativel`
- `03_apoio_complementar_versionado`
- `04_apoio_visual_interface`
- `99_quarentena_ou_arquivo_morto`

`corpus_staging/` fica fora do Git e serve apenas como area de coleta e validacao antes da subida ao projeto.

## Regra de uso no grounding

- documentos do `NUCLEO` devem ter precedencia material
- `COBERTURA` deve entrar com peso menor
- `APOIO` deve ser tratado como apoio controlado
- `QUARENTENA` fica fora do grounding principal

## Criterio de avance

Nao abrir o lote seguinte antes de:

1. completar metadados do lote atual
2. validar ingestao tecnica
3. testar perguntas reais
4. confirmar ausencia de conflito material nas respostas

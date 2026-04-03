# BLOCO 4B — Verificação remota do corpus e smoke test grounded

Data: 2026-04-03  
Branch de sessão: `session/2026-04-03/HOME/CODEX/BLOCO-4B-REMOTE-SMOKE`

## Objetivo

Validar o estado real do corpus remoto depois da integração do BLOCO 4A, verificar possível mistura entre gerações de embeddings e executar um smoke test grounded na produção.

## Escopo executado

1. inspeção remota das tabelas `documents` e `document_chunks` via `supabase db query --linked`
2. verificação de presença de:
   - `embedding_model`
   - `embedding_dim`
   - `embedded_at`
   - `chunk_metadata_json`
3. teste do chat público na produção `https://clarainova02.vercel.app`

## Achados remotos do corpus

### Documentos

- `total_documents = 1`
- `processed_documents = 1`
- `embedding_pending_documents = 0`
- `error_documents = 0`

Documento encontrado:

- `14f38de0-c2a0-4723-8a44-20426925547a`
- `MODELO_DE_OFICIO_PDDE.pdf`
- status atual em `documents`: `processed`

### Chunks

- `total_chunks = 2`
- `embedded_chunks = 0`
- `chunks_without_model = 2`
- `chunks_without_embedded_at = 2`
- `chunks_without_metadata = 0`

Distribuição observada:

- `embedding_model = <null>`
- `embedding_dim = <null>`
- `chunk_count = 2`

Leitura qualitativa dos chunks remotos:

- os chunks ainda carregam o prefixo antigo no texto:
  - `[Fonte: MODELO_DE_OFICIO_PDDE.pdf | Página: 1]`
- `chunk_metadata_json` está vazio (`{}`)
- `page_start` e `page_end` estão preenchidos como `1`

## Conclusão técnica da inspeção remota

Não há evidência de mistura entre gerações de embeddings no corpus remoto atual.

O estado real é outro:

- existe apenas **um documento legado**
- existem **dois chunks legados**
- não existem embeddings persistidos para esse documento
- o legado ainda usa o formato antigo de chunk, com prefixo textual embutido

Em termos práticos, o BLOCO 4B não está bloqueado por contaminação entre modelos; ele está bloqueado por **ausência de reprocessamento do legado no contrato novo**.

## Smoke test público do chat

Ambiente testado:

- produção canônica `https://clarainova02.vercel.app`
- deploy READY em `main` apontando para `fdd85e5c32d6617c6cefc5ed8a611106311d4f5e`

Consultas verificadas no chat público:

1. `Conciliação bancária.`
   - a produção respondeu com orientação estruturada
   - a interface exibiu referência explícita:
     - `Base documental CLARA. MODELO_DE_OFICIO_PDDE.pdf. p. 1.`
2. `Quais documentos devo anexar no encaminhamento do PDDE?`
   - a produção respondeu com orientação operacional coerente com o documento legado
   - o chat permaneceu estável e conectado durante a segunda consulta

## Leitura operacional do smoke test

O grounding público continua funcional mesmo sem embeddings persistidos no único documento remoto atual, o que indica recuperação lexical/fallback documental ainda operando.

Isso é suficiente para provar **resiliência mínima da experiência pública**, mas **não fecha o BLOCO 4B**. O fechamento exige ao menos um documento processado sob o contrato novo de embeddings, com:

- `embedding_model = gemini-embedding-2-preview`
- `embedding_dim = 768`
- `embedded_at` preenchido
- `chunk_metadata_json` com `task_type`, `title_used` e `normalization`

## Próxima ação objetiva

1. reprocessar o PDF legado `MODELO_DE_OFICIO_PDDE.pdf` no contrato novo
   - ou subir um novo PDF real pequeno via admin
2. confirmar no banco remoto a persistência dos metadados novos de embedding
3. repetir 1 a 3 perguntas grounded já com embeddings reais persistidos

## Backlog Gemini preservado

As oportunidades abaixo foram registradas como trilhas futuras válidas, sem competir com a prioridade atual do BLOCO 4:

1. **Matryoshka / redução de dimensionalidade**
   - avaliar depois que o baseline em `768` estiver estável e auditável
2. **Context caching**
   - candidato natural para system prompt longo e contextos documentais repetidos
3. **Google Search grounding nativo**
   - forte candidato de fallback externo controlado depois da estabilização do grounding interno
4. **Multimodalidade com prints de tela**
   - evolução futura de alto valor prático para o uso do SEI-Rio

## Status do BLOCO 4B após esta rodada

- inspeção remota do corpus: `concluída`
- smoke test público mínimo: `concluído`
- verificação de embeddings novos persistidos: `pendente`
- fechamento do BLOCO 4B: `ainda não concluído`

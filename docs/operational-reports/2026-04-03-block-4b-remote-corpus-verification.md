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

## República das functions Gemini

Depois da inspeção remota, as Edge Functions canônicas do projeto foram republicadas manualmente no Supabase oficial para garantir que o runtime já refletisse o contrato novo integrado em `main`.

Estado remoto após a publicação:

- `embed-chunks`
  - versão inicial após o BLOCO 4A: `11`
  - versão após correção de auth do BLOCO 4B: `13`
- `chat`
  - versão: `13`
  - atualização observada: `2026-04-03 05:22:48 UTC`
- `get-usage-stats`
  - versão após correção de auth do BLOCO 4B: `11`

Com isso, o ambiente remoto já está apto a:

- receber chunks estruturados sem prefixo artificial
- gerar embeddings com `gemini-embedding-2-preview`
- aplicar `taskType` e `title`
- persistir `embedding_model`, `embedding_dim`, `embedded_at` e `chunk_metadata_json`

## Observação operacional sobre a conta do painel

O formulário do admin exibe uma conta provisionada que autentica sessão e permite entrar na página, mas ela **não** corresponde ao admin bootstrap ativo em `public.admin_users`.

Evidência observada:

- a conta visível na tela entrou no painel
- `get-usage-stats` respondeu `401`
- a listagem do painel não exibiu o documento legado já presente no banco
- o `admin_users` remoto segue apontando apenas para a conta administrativa real de Wilson

Portanto, o teste de upload do BLOCO 4B deve ser feito com a conta administrativa real já validada no seu navegador, e não com a conta visível por padrão no formulário.

## Correção do bloqueio nas functions administrativas

Na primeira tentativa de upload do PDF real pequeno, o documento foi criado em `documents`, mas o processamento falhou antes de salvar qualquer chunk:

- documento: `SEI-Guia-do-usuario-Versao-final.pdf`
- `failure_reason = no_chunks_persisted`
- `Chunks 0/88`
- `Embeddings 0/88`

O erro bruto reproduzido na chamada HTTP da function foi:

```json
{"code":401,"message":"Invalid JWT"}
```

Conclusão confirmada:

- o problema não estava no schema remoto
- o problema não estava no payload estruturado novo
- o problema não estava, neste incidente, na API do Gemini
- o bloqueio estava na **borda das functions administrativas**, que ainda dependiam da validação do gateway

Correção aplicada nesta rodada:

1. `embed-chunks` e `get-usage-stats` deixaram de depender do gateway JWT e passaram a ser publicadas com `--no-verify-jwt`
2. ambas as functions agora:
   - exigem sessão válida via `auth.getUser()`
   - exigem vínculo ativo em `public.admin_users`

Verificação objetiva após a correção:

- com a conta autenticada visível no formulário, que **não** é admin real:
  - `embed-chunks` passou a responder `403 AUTH:ADMIN_REQUIRED`
  - `get-usage-stats` passou a responder `403 Acesso administrativo requerido`

Isso prova que:

- o `401 Invalid JWT` de borda foi removido
- o controle voltou para o código da function
- o próximo reteste deve ser feito com a conta administrativa real de Wilson

## Próxima ação objetiva

1. repetir o upload do PDF real pequeno via admin usando a conta administrativa real
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
- correção da autenticação das functions administrativas: `concluída`
- verificação de embeddings novos persistidos: `pendente`
- fechamento do BLOCO 4B: `ainda não concluído`

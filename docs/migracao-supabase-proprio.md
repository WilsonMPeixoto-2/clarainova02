# Migracao para um Supabase sob controle do projeto

Este guia resume como ligar a CLARA a um projeto Supabase administrado diretamente pela equipe do projeto, sem depender do backend provisionado por terceiros.

## O que ja esta pronto neste repositorio

- frontend desacoplado e publicado na Vercel;
- migrations versionadas em [`supabase/migrations`](../supabase/migrations);
- edge functions em [`supabase/functions`](../supabase/functions);
- base local do RAG preparada para telemetria, governanca de ingestao e endurecimento de acesso.

## Premissas desta migracao

- manter analytics enxutos e sem PII como dado de negocio;
- priorizar metricas agregadas de qualidade, ambiguidade, feedback e custo;
- preparar a base para auth administrativa moderna, sem complicar a area publica;
- manter a ingestao de PDFs simples no painel admin, com caminho aberto para upload resumable e leitura complementar.

O racional completo esta em [`backend-principios-clara.md`](./backend-principios-clara.md).

## O que nao migra automaticamente

- dados do banco remoto atual;
- arquivos presentes apenas no bucket remoto;
- segredos configurados fora do repositorio.

## Pre-requisitos

1. Conta com acesso ao projeto Supabase correto.
2. Projeto Supabase novo criado sob sua titularidade.
3. `project ref`, senha do banco, URL do projeto e publishable key.
4. Chave `GEMINI_API_KEY`.
5. Acesso a Vercel e GitHub, se for atualizar os ambientes publicados.

## Fluxo recomendado

### 1. Autenticar o Supabase CLI

```powershell
supabase login
```

### 2. Linkar o projeto local ao projeto remoto certo

```powershell
supabase link --project-ref SEU_PROJECT_REF -p SUA_SENHA_DO_BANCO
```

### 3. Aplicar as migrations

```powershell
supabase db push --include-all
```

### 4. Configurar segredos das functions

```powershell
supabase secrets set GEMINI_API_KEY=SUA_CHAVE
```

As variaveis padrao do proprio Supabase para functions hospedadas continuam disponiveis automaticamente no runtime.

### 5. Publicar as edge functions

```powershell
supabase functions deploy chat
supabase functions deploy embed-chunks
supabase functions deploy get-usage-stats
```

### 6. Atualizar variaveis do frontend

Defina no ambiente local e na Vercel:

```env
VITE_SUPABASE_PUBLISHABLE_KEY="NOVA_PUBLISHABLE_KEY"
VITE_SUPABASE_URL="https://NOVO_PROJECT_REF.supabase.co"
```

### 7. Reingestar a base

1. Entrar na area admin.
2. Reenviar os PDFs da base.
3. Confirmar status dos documentos.
4. Verificar se `document_chunks` recebeu embeddings.
5. Testar perguntas conhecidas no chat.

## Checklist final

- site abre normalmente;
- chat responde sem erro;
- admin autentica e lista documentos;
- ingestao atualiza documentos, chunks e eventos;
- telemetria registra uso e busca.

## Fase seguinte recomendada

Depois da conexao ao Supabase proprio:

1. configurar auth administrativa com Google no desktop;
2. avaliar passkeys/WebAuthn para o acesso administrativo em mobile;
3. endurecer o fluxo de upload com suporte resumable;
4. validar PDFs de origens variadas e adicionar fallback de leitura complementar quando necessario.

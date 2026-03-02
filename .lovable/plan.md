

# Melhoria do System Prompt: Tom Pedagogico e Compreensao de Linguagem Informal

## O que foi encontrado no repositorio externo

O projeto externo (`clarainova`) tem um sistema de prompt mais sofisticado com **duas diferencas importantes**:

### 1. Modos de Resposta (Fast vs Deep)
O outro projeto define dois modos de resposta com instrucoes explicitas:

- **Modo DIRETO (fast)**: Respostas em ate 10 linhas, passos numerados, checklists curtas
- **Modo DIDATICO (deep)**: Explica o "por que", estrutura em secoes (Resumo, Passo a passo, Observacoes, Exemplo), evita jargoes e define termos tecnicos em 1 frase

### 2. Instrucoes de Tom e Citacao de Fontes
- "Tom: acolhedor, direto e profissional. Evite sermoes e seja pratica."
- Regras explicitas para citar fontes como `[Fonte 1]`, `[Fonte 2]`
- Instrucao para redirecionar a fontes oficiais quando nao houver informacao suficiente

### 3. O que NENHUM dos dois projetos tem (e que voce pediu)
Nenhum dos projetos tem instrucoes explicitas para a IA entender **linguagem informal/coloquial** e mapear para termos tecnicos. Por exemplo:
- "colocar um PDF dentro do processo" → "anexar documento externo"
- "mandar o processo pra frente" → "tramitar o processo"
- "assinar o papel" → "assinar documento eletronicamente no SEI"

Essa e uma melhoria **original** que deve ser adicionada ao system prompt.

---

## Plano de Implementacao

Atualizar o `SYSTEM_PROMPT` na Edge Function `chat/index.ts` com tres blocos de melhorias:

### A. Modo Pedagogico (passo a passo)
Adicionar instrucoes para que a Clara sempre estruture respostas complexas em formato didatico:
- Resumo curto no inicio
- Passo a passo numerado
- Observacoes ou dicas ao final
- Quando usar termos tecnicos, explicar em linguagem simples

### B. Mapeamento de Linguagem Informal
Adicionar uma secao no prompt instruindo a IA a:
- Interpretar expressoes coloquiais como equivalentes aos termos tecnicos dos manuais
- Exemplos explicitos de mapeamento (ex: "colocar PDF" = "incluir documento externo", "mandar pra frente" = "tramitar")
- Nunca corrigir o usuario de forma pedante; simplesmente responder usando o termo correto naturalmente

### C. Citacao de Fontes da Base de Conhecimento
Quando a resposta vier da base de conhecimento (RAG), citar as fontes de forma clara e organizada.

---

## Detalhes Tecnicos

**Arquivo a editar:** `supabase/functions/chat/index.ts`

**Alteracao:** Expandir a constante `SYSTEM_PROMPT` (linhas 73-99) com as novas instrucoes, mantendo tudo o que ja existe (personalidade, especialidades, regras de seguranca).

O novo prompt adicionara aproximadamente 30-40 linhas de instrucoes comportamentais, sem alterar nenhuma outra parte do codigo (guardrails, rate limiting, fallback, RAG continuam identicos).

**Nao sera necessario** criar tabelas, migracoes SQL ou novos arquivos. E apenas uma melhoria de conteudo no prompt textual.


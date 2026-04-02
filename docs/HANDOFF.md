# HANDOFF — CLARAINOVA02

> Fonte oficial de verdade: `origin/main`

## Última atualização
- Data/hora: 2026-04-02T08:52:30.546Z
- Atualizado por: CODEX @ WILSON-MP
- Branch de referência: `main`
- Commit de base oficial: `70be0cb523d4e0d39ce5a405a4afcc12e63d5d64`
- Head da sessão: `70be0cb523d4e0d39ce5a405a4afcc12e63d5d64`
- Último relatório: `docs/operational-reports/2026-04-02-block-2-prelaunch-polish.md`

## Estado atual resumido
- Fase atual: Pré-lançamento com polimento institucional e observabilidade integrados em main
- Bloco ativo: BLOCO 2 integrado em main; retomada da trilha de engenharia dura
- Status da sessão: `partial`
- Próxima ação recomendada: Partir de origin/main para revisar RLS/policies, endurecer JWT nas functions administrativas e destravar OAuth/Gemini antes de entrar em corpus real, prova empírica do RAG e novos refinamentos.

## Itens concluídos
- BLOCO 2 integrado em origin/main via commit 70be0cb523d4e0d39ce5a405a4afcc12e63d5d64
- Camada institucional, metadados públicos, OG/PWA e identidade do PDF fortalecidos
- Observabilidade agregada do admin ampliada com grounded answers, gaps, degradação, latência e tópicos

## Itens pendentes
- RLS/policies efetivas, verify_jwt nas functions administrativas e hardening Supabase
- Google OAuth do admin, estabilidade do Gemini e carga curada real do corpus
- Prova operacional do RAG, calibração empírica e admin como cockpit leve de saúde do produto

## Bloqueios externos
- Google OAuth do admin ainda depende de configuração externa no Supabase/Google
- Embeddings reais ainda dependem da estabilidade externa do Gemini

## Notas operacionais
- Main volta a ser a fonte oficial com o BLOCO 2 já incorporado; a próxima frente técnica prioritária volta a ser segurança, integrações externas e corpus real.

## Preambulo obrigatório para qualquer IA
1. tratar `origin/main` como única fonte oficial de verdade
2. ler, nesta ordem:
   - `.continuity/current-state.json`
   - `docs/HANDOFF.md`
   - `docs/MIGRATION_STATUS.md`
   - último relatório em `docs/operational-reports/`
3. depois confirmar:
   - bloco ativo
   - branch correta
   - itens concluídos
   - itens pendentes
   - próxima ação recomendada
4. complementar a leitura com:
   - `docs/BLOCK_PLAN.md`
   - `docs/REMOTE_STATE.md`
5. não continuar se houver divergência entre o contexto local e o contexto registrado no repositório sem explicitar essa divergência
6. trabalhar em branch de sessão, nunca direto em `main`
7. ao encerrar, deixar tudo commitado, pushado e documentado

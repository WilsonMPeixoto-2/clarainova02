# HANDOFF — CLARAINOVA02

> Fonte oficial de verdade: `origin/main`

## Última atualização
- Data/hora: 2026-04-19
- Atualizado por: ANTIGRAVITY
- Branch de referência: `main`
- Commit de base oficial: `d1921e075fca6cf92b60658b1708f38c75bd1c5d`

## Estado atual resumido
- Fase atual: **TRAVAMENTO DA V1.0** (Auditoria Independente de Abril/2026 finalizada).
- Status: A CLARAINOVA02 está pronta para operação controlada em produção, com o código, governança e documentação devidamente reconciliados. O sistema provou robustez técnica e experiência madura de RAG.

## Incidentes/Sprints Fechados (Abril/2026)
1. **Auditoria Independente e Travamento v1.0:** Todo o drift entre documentação de continuidade e código foi reconciliado. As ações corretivas (prioridade 1) levantadas por auditoria externa foram totalmente resolvidas.
2. **Atualização do README:** Sincronizado para refletir o Gemini 3.1 Pro Preview como gerador principal e Flash Lite como fallback.
3. **Limpeza do Banco e Governança:** Tabelas leftovers do template inicial (`users`, `comments`, `posts`) foram removidas do banco de dados de produção para mitigar vulnerabilidades de RLS exposto.
4. **Governança de Cache:** As tabelas de cache (`chat_response_cache` e `embedding_cache`) receberam comentários SQL explicitando seu acesso interno (`service_role`), isentando a necessidade de RLS policy pública, e a política operacional de cache duplo foi escrita em `docs/cache-policy.md`.
5. **Otimizações do Chat (UX & Custos):**
   - Limite de tokens adaptativo (Modo "Direto" fixado em 4096 tokens).
   - Componente Accordion de etapas implementado (`CollapsibleStepCard`) para otimizar fluidez visual em respostas longas.
   - Navegação refinada com `Voltar ao resumo` e micro-animação pulsante ao enviar.
   - Auto-scroll focado na origem da nova resposta (evitando perda de contexto em respostas densas).

## Prioridade imediata
- Nenhuma ação corretiva crítica. O sistema aguarda validações do lado operacional sobre o corpus remoto e possível "Prova Operacional" final.
- O plano "BLOCO 6" e a ingestão de eventuais novos decretos (ex: Decreto Rio nº 55.615/2025 completo) podem ser retomados no tempo do negócio.

## Bloqueios externos / Dependências Operacionais
- Fechar a prova operacional do corpus remoto. Isso não afeta o desenvolvimento ou a estabilidade, mas é o passo final para o comissionamento do produto pela instituição.
- Projetar transição dos modelos Google Gemini do status `preview` para General Availability (`GA`) quando forem oficializados.

## Preâmbulo obrigatório para qualquer IA
1. tratar `origin/main` como única fonte oficial de verdade
2. ler, nesta ordem:
   - `.continuity/current-state.json`
   - `docs/HANDOFF.md`
   - `docs/auditoria-independente-2026-04-19.md`
3. depois confirmar:
   - bloco ativo
   - branch correta
   - itens concluídos
   - itens pendentes
   - próxima ação recomendada
4. não continuar se houver divergência entre o contexto local e o contexto registrado no repositório sem explicitar essa divergência
5. ao encerrar, deixar tudo commitado, pushado e documentado



# Auditoria Pos-Migracao: React 19 + Vite 6 + Tailwind 4

## Diagnostico

Apos revisar todos os arquivos do projeto, identifiquei as seguintes areas que precisam de adaptacao:

---

## 1. Componentes shadcn/ui com `forwardRef` (40 arquivos)

**Situacao:** Todos os 40 componentes UI usam `React.forwardRef`, que no React 19 ainda funciona mas esta **deprecated**. O padrao moderno e receber `ref` como prop direta.

**Risco:** Zero risco imediato — `forwardRef` continuara funcionando no React 19. Porem, warnings no console podem surgir em versoes futuras.

**Acao recomendada:** Reescrever os componentes mais usados no projeto para o padrao React 19 (ref como prop). Os componentes ativamente usados sao:
- `button.tsx`, `input.tsx`, `card.tsx`, `progress.tsx`, `accordion.tsx`, `scroll-area.tsx`, `toast.tsx`, `label.tsx`, `form.tsx`, `table.tsx`, `sheet.tsx`, `dialog.tsx`, `tooltip.tsx`, `popover.tsx`, `separator.tsx`, `textarea.tsx`, `select.tsx`, `checkbox.tsx`, `badge.tsx`, `skeleton.tsx`

Os demais (~20 componentes) nao sao usados ativamente e podem ser migrados depois.

---

## 2. Calendar.tsx — classNames desatualizados

**Situacao:** O componente `calendar.tsx` usa class names do `react-day-picker` v8 (`nav_button`, `caption_label`, `head_row`, `day_selected`, etc). A v9 mudou todos esses nomes para um sistema diferente.

**Risco:** O calendario pode renderizar sem estilos corretos.

**Acao:** Reescrever o mapeamento de classNames para a API v9 do react-day-picker.

---

## 3. `src/main.tsx` — StrictMode ausente

**Situacao:** O `main.tsx` nao usa `React.StrictMode`, que no React 19 ganhou novos checks uteis para detectar bugs.

**Risco:** Nenhum risco, mas perde-se deteccao precoce de problemas.

**Acao:** Adicionar `<StrictMode>` ao redor de `<App />`.

---

## 4. Edge Functions — import de versao fixa do Supabase

**Situacao:** As edge functions usam `https://esm.sh/@supabase/supabase-js@2` (versao generica v2). Funciona, mas pode ser pinado.

**Risco:** Nenhum risco critico.

**Acao:** Nenhuma — manter como esta.

---

## 5. `UsageStatsCard.tsx` — URL hardcoded

**Situacao:** Usa `https://${projectId}.supabase.co/functions/v1/get-usage-stats` em vez do cliente Supabase.

**Risco:** Nenhum risco funcional, mas inconsistente com o resto do projeto.

**Acao:** Migrar para `supabase.functions.invoke()`.

---

## 6. Tailwind 4 — verificacao de classes

**Situacao:** O `@theme` block no `index.css` mapeia todas as custom colors corretamente. As classes utilitarias usadas nos componentes (`text-muted-foreground`, `bg-primary`, `border-input`, etc) estao todas mapeadas. Nao encontrei classes orfas.

**Risco:** Nenhum.

**Acao:** Nenhuma.

---

## Resumo de Acoes

| # | Acao | Escopo | Prioridade |
|---|------|--------|------------|
| 1 | Reescrever ~20 componentes shadcn/ui ativos removendo `forwardRef` | 20 arquivos | Media |
| 2 | Atualizar `calendar.tsx` para classNames do react-day-picker v9 | 1 arquivo | Alta |
| 3 | Adicionar `StrictMode` em `main.tsx` | 1 arquivo | Baixa |
| 4 | Migrar `UsageStatsCard` para `supabase.functions.invoke()` | 1 arquivo | Baixa |

**Total: ~23 arquivos a modificar. Nenhum breaking change encontrado. O projeto esta funcional como esta — estas sao melhorias de modernizacao.**


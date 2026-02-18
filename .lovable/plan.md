
# Elevar o ClaraInova a nivel Awwwards 2026 — Plano de Implementacao

## Resumo

Melhorias focadas em 6 areas: legibilidade, posicionamento hero, tipografia, motion design, chips de perguntas, e microinteracoes. Tudo aplicavel no frontend existente sem mudar a arquitetura.

---

## Etapa 1 — P0: Legibilidade Real

**Problema:** Texto secundario (paragrafo, termos, caption) com contraste insuficiente sobre fundo complexo.

**Acoes:**
- Aumentar opacidade do scrim/overlay do hero (gradiente interno do card textual)
- Subir luminosidade do texto secundario em 1-2 steps (de ~46% para ~65-70% lightness)
- Aumentar `font-size` do paragrafo em +1 step (de ~0.875rem para ~1rem)
- Aumentar `line-height` do body text (de ~1.5 para ~1.6-1.7)
- Garantir ratio minimo WCAG 4.5:1 em todo texto normal

**Arquivos afetados:** CSS do hero (overlay classes), variaveis de cor do tema

---

## Etapa 2 — P0: Banner de Manutencao

**Problema:** O banner "CLARA em manutencao" no hero reduz confianca e compete com a proposta de valor.

**Acoes:**
- Transformar em "status pill" compacta no header (canto superior, discreta)
- Usar icone + tooltip "Saiba mais" em vez de texto longo no hero
- Quando o backend estiver ativo, remover completamente

**Arquivos afetados:** Componente do hero, header/nav

---

## Etapa 3 — P1: Reposicionamento do Hero (Split Layout)

**Problema:** Texto e imagem competem no mesmo espaco. O rosto da Clara fica parcialmente oculto.

**Implementacao:**
- Manter grid 12 colunas: texto nas colunas 1-5 (esquerda), imagem nas colunas 6-12 (direita)
- Aplicar scrim escuro forte (gradiente da esquerda, opacidade ~85%) cobrindo a area do texto
- Aplicar gradient-mask na imagem: fade suave da esquerda para revelar a Clara pela direita
- O rosto da Clara fica centralizado/direita com mais presenca
- O texto fica sobre fundo escuro limpo, sem competicao visual

```text
|  TEXTO (escuro limpo)  |  CLARA (imagem revelada)  |
|  col 1-5               |  col 6-12                 |
|  scrim forte           |  gradient-mask sutil       |
```

**Arquivos afetados:** Hero component, CSS do overlay/grid

---

## Etapa 4 — P1: Tipografia Premium

**Acoes:**
- Importar fonte display para H1 (Space Grotesk ou Clash Display via Google Fonts/Fontsource)
- Manter fonte atual (Inter ou system) para body/labels
- Ajustar tracking do H1 "CLARA" (letter-spacing: 0.04-0.06em)
- Padronizar escala de pesos: H1=800, subtitulo=600, body=400, caption=400
- Refinar line-height por nivel hierarquico

**Arquivos afetados:** CSS global, importacao de fontes, componente hero

---

## Etapa 5 — P1: Chips de Perguntas Rapidas

**Problema:** Truncamento visivel, sem indicador de scroll.

**Acoes:**
- Adicionar scroll-snap ao carrossel de chips
- Aplicar fade/gradient nas bordas laterais (indicador visual de "tem mais")
- Definir largura minima nos chips para evitar truncamento
- Aplicar `text-overflow: ellipsis` controlado apenas em telas muito pequenas
- Hover state sutil nos chips (scale + border glow)

**Arquivos afetados:** CSS dos chips, componente de perguntas rapidas

---

## Etapa 6 — P2: Motion Design Cinematografico

**Acoes (prioridade de impacto):**

1. **Entrada escalonada do hero** — Texto aparece com stagger (cada elemento 100ms apos o anterior) usando CSS `@keyframes` + `animation-delay`. Efeito clip-path reveal de baixo para cima.

2. **"Respiracao" da energia** — Animacao CSS lenta (12-20s loop) nos elementos `.hero-energy-stream` com `transform: scale` + `opacity` alternando suavemente. Sensacao de "vivo" sem distrair.

3. **Particulas douradas flutuantes** — Camada Canvas/CSS com particulas sutis (baixa opacidade, blur, movimento lento). Pode usar `tsparticles` ou CSS puro com `@keyframes` em pseudo-elementos.

4. **Scroll-triggered animations** — Feature cards da secao abaixo entram com fade-in + translateY usando `IntersectionObserver` (ja parcialmente implementado no HTML, mas com `opacity: 0` — precisa ativar).

5. **Parallax minimo** — Imagem do hero move ~5% mais lento que o texto no scroll. Apenas `transform: translateY` via CSS ou JS leve.

6. **`prefers-reduced-motion`** — Todas as animacoes respeitam essa media query, reduzindo ou desativando para acessibilidade.

**Arquivos afetados:** CSS de animacoes, possivel novo arquivo de particulas, hero component

---

## Etapa 7 — P3: Microinteracoes e Acabamentos

**Acoes:**
- Hover/focus consistente nos botoes (glow sutil dourado, scale 1.02)
- Focus-visible com outline customizado (anel dourado) em todos os interativos
- Feature cards com hover: elevacao (shadow) + borda dourada sutil
- Transicao suave no header ao scroll (backdrop-blur progressivo)
- Footer minimo com links institucionais (Termos, Privacidade, Fontes, Contato)

**Arquivos afetados:** CSS global, componentes de botao/card, header, novo componente footer

---

## Secao Tecnica: Dependencias

Nenhum pacote novo obrigatorio. Tudo pode ser feito com:
- CSS `@keyframes`, `transform`, `opacity` (GPU-friendly)
- `IntersectionObserver` nativo para scroll animations
- Pseudo-elementos CSS para particulas simples

Opcional (ganho visual alto):
- `tsparticles` — particulas douradas mais sofisticadas
- `framer-motion` — ja disponivel no ecossistema React, para AnimatePresence em rotas

---

## Ordem de Execucao

1. Legibilidade (P0) — impacto imediato, baixo esforco
2. Banner manutencao (P0) — limpeza visual
3. Split layout hero (P1) — maior transformacao visual
4. Tipografia (P1) — refinamento premium
5. Chips (P1) — acabamento funcional
6. Motion design (P2) — "wow factor"
7. Microinteracoes (P3) — polish final

**Nota:** Estes arquivos serao gerados aqui no Lovable para voce copiar e aplicar no seu projeto Vercel. O Lovable nao tera acesso ao seu deploy.

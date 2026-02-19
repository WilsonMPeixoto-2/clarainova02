# Plano Corretivo Hero v2 — Contrato Geométrico Definitivo

> **Contexto**: Múltiplas tentativas de correção apenas "moveram o erro". A raiz é um conflito estrutural entre grid colunar + imagem absoluta + card com borda dura. Este plano ataca a causa-raiz.

---

## PROMPT 1 — Auditoria de Raiz + Higienização

**Papel**: Principal Frontend Engineer (Vite + React + TS + Tailwind + Framer Motion)  
**Objetivo**: Eliminar competições de RAF/scroll/transform antes de qualquer ajuste visual.  
**Regra**: NÃO faça ajuste fino de layout aqui. Apenas estabilize.

### Passo 1: Corrigir Lenis RAF Leak

**Arquivo**: `src/components/providers/SmoothScrollProvider.tsx`

O cleanup do `useEffect` chama `lenis.destroy()` mas NÃO cancela o `requestAnimationFrame`. Isso causa um loop RAF órfão que continua rodando após desmontagem.

```tsx
// ANTES (ERRADO):
const raf = (time: number) => {
  lenis.raf(time);
  requestAnimationFrame(raf);
};
requestAnimationFrame(raf);
return () => {
  lenis.destroy();
  lenisRef.current = null;
};

// DEPOIS (CORRETO):
let rafId: number;
const raf = (time: number) => {
  lenis.raf(time);
  rafId = requestAnimationFrame(raf);
};
rafId = requestAnimationFrame(raf);
return () => {
  cancelAnimationFrame(rafId);
  lenis.destroy();
  lenisRef.current = null;
};
```

### Passo 2: Corrigir Viewport Height Instável

**Arquivo**: `src/components/HeroSection.tsx`

O hero usa `min-h-screen` (= `100vh`) DUAS VEZES: na `<section>` e no wrapper de conteúdo. No mobile, `100vh` inclui a barra do navegador, causando reflow quando ela aparece/desaparece.

```tsx
// ANTES:
<section className="relative min-h-screen overflow-hidden noise-overlay">
  ...
  <div className="... min-h-screen flex items-center">

// DEPOIS:
<section className="relative min-h-svh overflow-hidden noise-overlay">
  ...
  <div className="... min-h-[auto] flex items-center">
```

> **Nota**: Tailwind já tem `min-h-svh` no core. Apenas UM elemento deve controlar a altura mínima.

### Passo 3: Verificar Pacotes Lenis

Rodar no terminal:
```bash
npm ls lenis @studio-freight/lenis @studio-freight/react-lenis
```

- Se `@studio-freight/react-lenis` existir → **remover** (deprecado).
- Deve existir APENAS o pacote `lenis` (versão atual: ^1.3.17 ✅ confirmado).
- Garantir que não há importação de `@studio-freight/*` em nenhum arquivo.

### Passo 4: Confirmar Inventário de RAF

Devem existir exatamente **2 loops RAF ativos no desktop**:
1. `SmoothScrollProvider.tsx` — Lenis (após fix do Passo 1)
2. `AuroraBackground.tsx` — WebGL render (já tem `cancelAnimationFrame` no cleanup ✅)

E **0 loops RAF no mobile** (Aurora não renderiza no mobile por `{!isMobile && <AuroraBackground />}`).

O `useMagneticCursor.ts` usa RAF pontual (não loop), está correto ✅.

### Passo 5: useIsMobile — Detecção Síncrona

**Arquivo**: `src/hooks/use-mobile.tsx`

O hook inicializa com `undefined`, causando flash de conteúdo desktop no mobile durante hidratação.

```tsx
// ANTES:
const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

// DEPOIS:
const getInitialMobile = () =>
  typeof window !== "undefined" ? window.innerWidth < MOBILE_BREAKPOINT : false;

const [isMobile, setIsMobile] = React.useState<boolean>(getInitialMobile);
```

E no retorno:
```tsx
// ANTES:
return !!isMobile;

// DEPOIS:
return isMobile;
```

### Passo 6: CSS Defensivo Mobile

**Arquivo**: `src/index.css`

Adicionar no topo da seção de media queries existente (antes de qualquer outra regra):

```css
/* Defensive: hide heavy layers on mobile BEFORE JS runs */
@media (max-width: 899px) {
  .hero-aurora-layer,
  .hero-particles-layer,
  .hero-energy-glow {
    display: none !important;
  }
}
```

**Após Prompt 1**: Build deve rodar limpo, zero RAF leak, zero flicker mobile, zero reflow de viewport.

---

## PROMPT 2 — Contrato de Layout Definitivo

**Papel**: Creative Layout Architect (Awwwards-grade) + CSS Systems Engineer  
**Objetivo**: Travar a relação TEXTO ↔ CLARA com contrato geométrico único.  
**Princípio**: Imagem FULL-BLEED + card flutuante SEM virar divisor.

### Passo 1: Eliminar o Grid Colunar

**Arquivo**: `src/components/HeroSection.tsx`

O grid `grid-cols-12` cria a ilusão de "duas páginas". A imagem já é `absolute inset-0`, então a coluna vazia (`md:col-span-5`) não serve para nada além de criar a "parede" visual.

```tsx
// ANTES (grid que cria split):
<div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center w-full">
  <motion.div className="md:col-span-7 hero-copy-column">
    ...
  </motion.div>
  <div className="hidden md:block md:col-span-5" aria-hidden="true" />
</div>

// DEPOIS (card flutuante, sem grid):
<div className="w-full flex items-center">
  <motion.div className="hero-copy-column">
    ...
  </motion.div>
</div>
```

O card agora é posicionado pela variável `--hero-card-w` e padding do container, sem grid.

### Passo 2: Novas Variáveis de Contrato

**Arquivo**: `src/index.css`

Substituir as variáveis atuais (`--clara-pos-x`, `--clara-pos-y`, `--clara-scale`, `--clara-overlay-end`) por um contrato expandido:

```css
:root {
  /* === LAYOUT CONTRACT v2 === */
  --hero-card-w: min(92vw, 520px);      /* largura do card */
  --hero-card-ml: 0;                     /* margin-left do card */
  --clara-pos: 50% 15%;                  /* object-position da imagem */
  --clara-scale: 1;                      /* escala da imagem (1–1.06 MAX) */
  --hero-overlay-opacity: 0.85;          /* opacidade do overlay esquerdo */
}

/* >=1440px — tela grande, card mais à esquerda, Clara respira à direita */
@media (min-width: 1440px) {
  :root {
    --hero-card-w: clamp(420px, 34vw, 560px);
    --hero-card-ml: clamp(40px, 4vw, 80px);
    --clara-pos: 72% 30%;
    --clara-scale: 1;
    --hero-overlay-opacity: 0.88;
  }
}

/* 1280–1439 */
@media (min-width: 1280px) and (max-width: 1439px) {
  :root {
    --hero-card-w: clamp(400px, 36vw, 520px);
    --hero-card-ml: clamp(32px, 3vw, 64px);
    --clara-pos: 70% 30%;
    --clara-scale: 1;
    --hero-overlay-opacity: 0.88;
  }
}

/* 1024–1279 */
@media (min-width: 1024px) and (max-width: 1279px) {
  :root {
    --hero-card-w: clamp(380px, 40vw, 480px);
    --hero-card-ml: clamp(24px, 2.5vw, 48px);
    --clara-pos: 68% 32%;
    --clara-scale: 1;
    --hero-overlay-opacity: 0.90;
  }
}

/* 900–1023 — breakpoint crítico */
@media (min-width: 900px) and (max-width: 1023px) {
  :root {
    --hero-card-w: clamp(340px, 44vw, 440px);
    --hero-card-ml: clamp(16px, 2vw, 32px);
    --clara-pos: 72% 34%;
    --clara-scale: 1;
    --hero-overlay-opacity: 0.92;
  }
}

/* <900 — mobile */
@media (max-width: 899px) {
  :root {
    --hero-card-w: min(92vw, 520px);
    --hero-card-ml: auto;
    --clara-pos: 50% 20%;
    --clara-scale: 1;
    --hero-overlay-opacity: 0;
  }
}
```

### Passo 3: Aplicar Variáveis nos Estilos

**Arquivo**: `src/index.css`

```css
/* Imagem de fundo — UMA fonte de escala e posição */
.hero-clara-img {
  object-position: var(--clara-pos);
  transform: scale(var(--clara-scale));
  transform-origin: center center;
  will-change: auto; /* Não usar will-change: transform permanentemente */
}

/* Card — largura e posição controladas por contrato */
.hero-copy-column {
  width: var(--hero-card-w);
  margin-left: var(--hero-card-ml);
  max-width: none; /* Remover max-width fixos, agora controlado por --hero-card-w */
}

/* Remover os max-width por media query que existiam antes */
/* (deletar as regras .hero-copy-column dentro dos @media 1024-1279 e 900-1023) */
```

### Passo 4: Anti-Parede — Máscara no Glass Card

**Arquivo**: `src/index.css`

O card NÃO pode ter borda dura no lado direito. O fundo do card deve "sumir" gradualmente.

```css
/* Glass card com borda suave (anti-parede) */
.hero-glass-card {
  position: relative;
  overflow: hidden;
  background: transparent; /* Fundo movido para pseudo-element */
  backdrop-filter: none;   /* Backdrop movido para pseudo-element */
  border: none;            /* REMOVER borda dura */
  border-radius: 1rem;
  padding: 2.5rem 2.5rem;
}

/* Pseudo-element para fundo + blur com máscara */
.hero-glass-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: hsl(222 35% 7% / 0.50);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid hsl(220 25% 22% / 0.25);
  border-radius: inherit;
  /* Máscara: opaco à esquerda, some à direita */
  -webkit-mask-image: linear-gradient(to right, black 0%, black 75%, transparent 100%);
  mask-image: linear-gradient(to right, black 0%, black 75%, transparent 100%);
  z-index: -1;
}

/* Conteúdo do card fica acima do pseudo-element */
.hero-glass-card > * {
  position: relative;
  z-index: 1;
}

/* Mobile: card sem máscara (full-width, fundo sólido) */
@media (max-width: 899px) {
  .hero-glass-card::before {
    -webkit-mask-image: none;
    mask-image: none;
    background: hsl(222 35% 7% / 0.60);
  }
  .hero-glass-card {
    padding: 1.5rem 1.25rem;
    border-radius: 0.75rem;
  }
}
```

### Passo 5: Overlay de Legibilidade — Gradiente Suave

**Arquivo**: `src/index.css`

O overlay deve escurecer o lado do texto sem criar "emenda vertical".

```css
/* Desktop: gradiente suave controlado por variável */
@media (min-width: 900px) {
  .hero-overlay-directional {
    background: linear-gradient(
      to right,
      hsl(222 35% 7% / var(--hero-overlay-opacity)) 0%,
      hsl(222 35% 7% / calc(var(--hero-overlay-opacity) - 0.2)) 30%,
      hsl(222 35% 7% / 0.25) 55%,
      hsl(222 35% 7% / 0.08) 75%,
      transparent 100%
    );
  }
}
```

### Passo 6: Limpar Regras CSS Obsoletas

**Arquivo**: `src/index.css`

Deletar:
- Os blocos `@media` que definem `--clara-pos-x`, `--clara-pos-y` separadamente (linhas 64-112)
- As regras `.hero-copy-column` com `max-width` fixo por media query (linhas 176-187)
- As variáveis `--clara-pos-x`, `--clara-pos-y`, `--clara-overlay-end` do `:root` (substituídas por `--clara-pos` e `--hero-overlay-opacity`)

---

## Checklist de Testes

Após ambos os prompts, testar em DevTools (F12 → Toggle device toolbar):

| Viewport | O que verificar |
|----------|----------------|
| 375×812 (iPhone SE) | Card quase full-width, sem flicker, sem parallax |
| 414×896 (iPhone XR) | Mesma estabilidade |
| 768×1024 (iPad) | Transição suave para desktop, sem "split" |
| 900×600 | Breakpoint crítico — card não cobre rosto |
| 1024×768 | Card à esquerda, Clara visível à direita |
| 1280×800 | Composição harmônica, card "some" à direita |
| 1440×900 | Card mais estreito, mais espaço para Clara |
| 1920×1080 | Card na margem esquerda, composição cinematográfica |

**Para cada viewport verificar**:
- [ ] Rosto da Clara visível e não coberto pelo card
- [ ] Sem "parede" vertical entre card e imagem
- [ ] Sem flicker ao carregar
- [ ] Sem reflow ao scrollar (barra do navegador mobile)
- [ ] Card com borda suave (não corte abrupto) no desktop

---

## Resumo do Diagnóstico

| Problema | Causa Raiz | Correção |
|----------|-----------|----------|
| Card vira "parede" | Grid 12-col + borda dura | Eliminar grid, usar mask-image no card |
| "Zoom que muda" | Múltiplas fontes de scale/position | UMA variável `--clara-pos` e `--clara-scale` por breakpoint |
| Flicker mobile | useIsMobile inicia como `undefined` + 100vh | Detecção síncrona + `min-h-svh` |
| RAF leak | Lenis sem cancelAnimationFrame | Armazenar e cancelar rafId |
| Reflow viewport | `min-h-screen` (100vh) em mobile | `min-h-svh` com fallback |

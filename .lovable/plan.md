

# Refatoracao Estrutural do Hero — Video Focal + 3 Camadas

## Contexto

O usuario forneceu o video limpo `CLARA_PERFEITO.mp4` e quer uma arquitetura de Hero completamente nova, eliminando a dependencia de `object-position` percentual por breakpoint. A abordagem atual (video fullbleed com `object-cover`) causa zoom extremo em aspect ratios diferentes. A nova arquitetura usa posicionamento geometrico com o video ancorado a direita preservando proporcao.

---

## Decisoes de Arquitetura

1. **Video NAO usa `object-cover`** — preserva aspect ratio nativo com `object-contain` ou dimensionamento por width/height
2. **3 camadas separadas**: Base (fundo), Media (direita), Conteudo (esquerda)
3. **Separacao de responsabilidades** nos wrappers CSS conforme especificado
4. **Mobile**: poster estatico, sem video, sem aurora/particulas
5. **IntersectionObserver** pausa video fora da viewport
6. **`prefers-reduced-motion`**: poster estatico, sem animacoes

---

## Tokens Existentes Utilizados

| Token | Valor | Uso |
|-------|-------|-----|
| `--background` | `222 35% 7%` | Fundo base, overlays |
| `--foreground` | `40 20% 88%` | Texto principal |
| `--card` | `220 30% 11%` | Glass card bg |
| `--border` | `220 25% 18%` | Bordas sutis |
| `--primary` | `38 65% 58%` | Acentos dourados |
| `--primary-foreground` | `222 35% 7%` | Texto em botao |
| `--muted-foreground` | `215 15% 55%` | Texto secundario |
| `--surface` | `220 28% 10%` | Superficies |
| `--surface-elevated` | `220 25% 14%` | Hover states |
| `--gold` | `38 65% 58%` | Glow energy |
| `--gold-glow` | `38 80% 68%` | Shimmer |
| `--gold-dim` | `38 45% 38%` | Profundidade |
| `--font-display` | Space Grotesk | Titulos |
| `--font-body` | Inter | Corpo |

**Novos tokens criados** (minimo necessario, escopados a `.clara-hero`):

| Token | Descricao |
|-------|-----------|
| `--hero-copy-max` | Largura maxima da copy column |
| `--hero-copy-left` | Margem esquerda da copy |
| `--hero-media-width` | Largura da area focal do video |
| `--hero-overlay-strength` | Intensidade do overlay sobre a base |
| `--hero-min-h` | Altura minima do hero (svh onde possivel) |

---

## Estrutura HTML Final

```text
section.clara-hero (relative, min-h controlada por variavel)
  |
  +-- .hero-base-layer (z-0, full-bleed, fundo escuro + glow radial)
  |     +-- aurora canvas (desktop only)
  |     +-- gold particles (desktop only)
  |     +-- energy glow (desktop only)
  |
  +-- .hero-media-stage (z-10, posicao absoluta, ancorado a direita)
  |     +-- .hero-media-motion (wrapper opcional para parallax)
  |           +-- video.hero-clara-video (preserva ratio, sem object-cover)
  |           +-- img fallback (mobile, poster)
  |     +-- mascara lateral (fade esquerda, integra video com fundo)
  |
  +-- .hero-content-layer (z-20, relative, flex, copy a esquerda)
  |     +-- .hero-copy-column (largura por variavel)
  |           +-- .hero-copy-surface (glass premium, sem borda dura)
  |                 +-- badges, titulo, descricao, CTAs, chips
  |
  +-- .hero-bottom-fade (z-30, gradiente inferior)
  |
  +-- HeroDebugOverlay (z-50, condicional)
```

---

## Mudancas por Arquivo

### 1. Copiar Asset

- `CLARA_PERFEITO.mp4` -> `public/videos/clara-hero.mp4`
- Manter `energy-flow.mp4` caso necessario como fallback (pode ser removido depois)

### 2. `src/index.css` — Novo Contrato de Layout

**Remover**: todas as regras antigas do hero (`--clara-pos`, `--clara-video-pos`, `--clara-scale`, `.hero-bg-scale`, `.hero-bg-parallax`, `.hero-clara-img`, `.hero-clara-video` antigo, `.hero-copy-column` antigo, `.hero-overlay-directional`, regras de glass card do hero antigo)

**Adicionar**: novo contrato com variaveis escopadas a `.clara-hero`:

```text
Faixas e valores:

>=1600:
  --hero-copy-max: 560px
  --hero-copy-left: clamp(48px, 5vw, 96px)
  --hero-media-width: 45%
  --hero-overlay-strength: 0.85
  --hero-min-h: 100svh

1280-1599:
  --hero-copy-max: 520px
  --hero-copy-left: clamp(40px, 4vw, 72px)
  --hero-media-width: 44%
  --hero-overlay-strength: 0.87

1024-1279:
  --hero-copy-max: 480px
  --hero-copy-left: clamp(28px, 3vw, 56px)
  --hero-media-width: 42%
  --hero-overlay-strength: 0.88

900-1023:
  --hero-copy-max: 420px
  --hero-copy-left: clamp(20px, 2.5vw, 40px)
  --hero-media-width: 40%
  --hero-overlay-strength: 0.90

<900 (mobile):
  --hero-copy-max: 100%
  --hero-copy-left: 0
  --hero-media-width: 100%
  --hero-overlay-strength: 0
  --hero-min-h: auto
```

**Novas classes**:

- `.hero-base-layer` — posicao absoluta, inset 0, z-0, fundo escuro com radial glow sutil (tokens)
- `.hero-media-stage` — posicao absoluta, right 0, top 0, bottom 0, width `var(--hero-media-width)`, z-10
- `.hero-media-motion` — wrapper para parallax (translateY only)
- `.hero-clara-video` — width 100%, height 100%, `object-fit: contain`, `object-position: center`, ancorado a direita
- `.hero-media-mask` — pseudo-elemento com gradient mask (fade esquerda -> transparente)
- `.hero-copy-column` — max-width `var(--hero-copy-max)`, margin-left `var(--hero-copy-left)`
- `.hero-copy-surface` — glass premium (token-based bg, blur com fallback, borda sutil 1px, sem borda dourada grossa, fade lateral com `@supports mask-image`)

### 3. `src/components/HeroSection.tsx` — Refatoracao Completa

**Novos comportamentos**:

- `IntersectionObserver` no `sectionRef`: quando hero sai da viewport, `videoRef.current.pause()`; quando entra, `.play()`
- `prefers-reduced-motion`: se ativo, nao renderiza video, usa poster estatico
- Estado `canPlayVideo` para fade-in suave do video
- `preload="metadata"` no video
- `poster` attribute no video apontando para a imagem estatica existente

**Estrutura JSX**: segue o diagrama HTML acima, com condicional `isMobile` para suprimir video/aurora/particles

**Debug mode**: `?debug=hero` renderiza outlines tracejados na `.hero-copy-column` (verde) e `.hero-media-stage` (azul) com labels

### 4. `src/components/HeroDebugOverlay.tsx` — Atualizar

- Trocar para ler `?debug=hero` (em vez de `?debugLayout=1`)
- Mostrar safe zones: `copy-safe-zone` (tracejado verde) e `media-stage` (tracejado azul)
- Mostrar valores das novas variaveis no painel de info

### 5. Arquivos NAO alterados

- Todos os componentes fora do Hero permanecem intactos
- `Header.tsx`, `Footer.tsx`, `ServicesSection.tsx`, etc — zero mudancas
- Nenhum pacote novo instalado

---

## Regras Antigas Removidas

| Regra CSS | Motivo |
|-----------|--------|
| `--clara-pos` / `--clara-video-pos` | Substituidas por ancoragem geometrica |
| `--clara-scale` | Video preserva ratio, sem scale hack |
| `.hero-bg-scale` | Eliminado — sem scale wrapper |
| `.hero-bg-parallax` | Renomeado para `.hero-media-motion` |
| `.hero-clara-img` (object-position) | Image so no mobile, sem position hack |
| `.hero-overlay-directional` | Substituido por `.hero-media-mask` + base layer |
| `.hero-copy-column` antigo (--hero-card-w) | Novo contrato com --hero-copy-max |
| `.hero-glass-card` + pseudo | Substituido por `.hero-copy-surface` |
| `.hero-energy-glow` | Mantido (efeito sutil sobre base, nao conflita) |

---

## Checklist de Validacao

| Viewport | Validacao |
|----------|-----------|
| 375x812 | Copy vertical, poster estatico, overlay escuro, sem video |
| 414x896 | Idem mobile |
| 768x1024 | Idem mobile (< 900px) |
| 900x600 | Desktop minimo, video ancorado direita, copy esquerda |
| 1024x768 | Video 42% direita, copy ate 480px |
| 1280x800 | Video 44%, copy ate 520px |
| 1440x900 | Video 45%, copy ate 560px |
| 1920x1080 | Video 45%, max-w container limita expansao |

---

## Fallbacks Implementados

1. `@supports` para `mask-image` — sem mascara, card fica solido (funcional)
2. `@supports` para `backdrop-filter` — sem blur, bg opaco
3. `prefers-reduced-motion` — poster estatico, zero motion
4. Video `poster` attribute — imagem visivel antes do video carregar
5. Mobile — sem video, sem WebGL, sem particulas

---

## Riscos Restantes

- **Qualidade do video**: se `CLARA_PERFEITO.mp4` for vertical (9:16), `object-contain` vai deixar barras laterais. Nesse caso, o video ocupara menos que `--hero-media-width` visualmente, mas sera enquadrado corretamente sem distorcao. Ajuste fino via `object-position: right center` resolve ancoragem.
- **Peso do video**: se o mp4 for pesado (>5MB), considerar `preload="none"` com poster e play sob IntersectionObserver.


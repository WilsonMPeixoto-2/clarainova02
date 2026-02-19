# Motion Contract — ClaraInova

## O que foi animado

### Nível 1 — CSS Puro (sempre ativo)

| Elemento | Animação | Duração | Easing |
|----------|----------|---------|--------|
| Aurora (WebGL) | snoise-based, contínuo | ∞ (60fps) | linear |
| Energy Glow | opacity + scale + translateY | 28s | ease-in-out |
| Gold Particles | translateY + opacity (float) | 12–22s | linear |
| Glow Pulse (CTA) | 3-layer box-shadow | 3s | ease-in-out |
| Noise overlay | Estático | — | — |

### Nível 2 — Framer Motion (após hydration)

| Elemento | Animação | Duração | Easing |
|----------|----------|---------|--------|
| Hero stagger | opacity + y + blur(2px) | 0.7s, stagger 0.12s | [0.16, 1, 0.3, 1] |
| "CLARA" letters | opacity + y + blur(2px) | 0.5s, delay i*0.08 | [0.16, 1, 0.3, 1] |
| Parallax (image) | translateY | scroll-linked | linear map |
| Parallax (aurora) | translateY | scroll-linked | linear map |
| Feature cards | opacity + translateY | 0.7s, stagger 100ms | ease-out |

### Microinterações

| Elemento | Efeito | Detalhes |
|----------|--------|----------|
| CTA Primary | Magnetic cursor + glow pulse | max 6px, desktop only |
| CTA Secondary | Magnetic cursor + hover elevation | -translate-y-0.5 |
| Feature cards | Hover shadow + border glow | gold/5, gold/30 |
| Chips | Scale 1.03 + border glow | hover only |

## Parallax

- Camada imagem: max 24px translateY
- Camada aurora: max 16px translateY
- Texto: fixo (0px)
- Desativado fora do hero (scroll progress > 1)

## prefers-reduced-motion

Quando ativo:
- Aurora WebGL: não renderiza
- Energy glow: estático (sem animation)
- Stagger/parallax: desativado (framer-motion useReducedMotion)
- Glow pulse: desativado
- Magnetic cursor: noop
- Feature cards: visíveis sem transição
- Clara scale: transform: none

## Resiliência

- Conteúdo visível por padrão (sem opacity:0 inline)
- Feature cards: `js-enabled` class adicionada via useEffect
- Framer Motion variants com `initial="hidden"` apenas se `!shouldReduceMotion`

## Checklist de Validação

- [ ] Rosto da CLARA não some/fica mais opaco por motion
- [ ] Texto/CTAs nunca invisíveis por falha de JS
- [ ] Desktop: aurora respira + entrada escalonada + microinterações
- [ ] Mobile: motion discreto, sem lag
- [ ] LCP/CLS sem degradação evidente

## Arquivos

| Arquivo | Motivo |
|---------|--------|
| `src/index.css` | glow-pulse premium, energy-shimmer, reduced-motion rules |
| `src/components/HeroSection.tsx` | stagger, parallax, magnetic cursor |
| `src/components/AuroraBackground.tsx` | WebGL aurora (inalterado) |
| `src/components/GoldParticles.tsx` | Particle float (inalterado) |
| `src/components/FeaturesSection.tsx` | IntersectionObserver reveal (inalterado) |
| `src/hooks/useMagneticCursor.ts` | Hook de cursor magnético |

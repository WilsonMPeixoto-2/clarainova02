# Layout Contract — Hero Section

## Descrição

Contrato de layout que trava a relação espacial entre o bloco textual (COLUNA A) e a imagem da CLARA (COLUNA B) em 5 breakpoints. O rosto da Clara é enquadrado via CSS custom properties (`--clara-pos-x`, `--clara-pos-y`, `--clara-scale`) aplicadas em `object-position` e `transform: scale()`.

## Estrutura

```
Desktop (≥900px):
┌──────────────────────────────┐
│ COLUNA A (copy)  │ COLUNA B  │
│ col-span-7       │ col-span-5│
│ max-width ctrl   │ art/face  │
│ overlay forte    │ overlay ↓ │
└──────────────────────────────┘

Mobile (<900px):
┌──────────────────────────────┐
│      Imagem fullscreen       │
│      (gradiente vertical)    │
│      Copy empilhada          │
└──────────────────────────────┘
```

## Tabela de Breakpoints

| Breakpoint     | --clara-pos-x | --clara-pos-y | --clara-scale | Copy max-width | Overlay end |
|----------------|---------------|---------------|---------------|----------------|-------------|
| ≥1440px        | 74%           | 32%           | 1             | 620px          | 0.18        |
| 1280–1439px    | 72%           | 34%           | 1             | 620px          | 0.20        |
| 1024–1279px    | 70%           | 35%           | 1.02          | 540px          | 0.22        |
| 900–1023px     | 68%           | 38%           | 1.05          | 480px          | 0.25        |
| <900px         | 50%           | 15%           | 1             | 100%           | —           |

## Overlay

- **Desktop**: Gradiente horizontal (`to right`), denso à esquerda (0.92), desvanece à direita.
- **Mobile**: Gradiente vertical (`to bottom`), cobrindo texto na parte inferior.

## Debug Mode

Ative com `?debugLayout=1` na URL. Mostra:
- Contorno das colunas (verde = copy, azul = art)
- Safe frame do rosto (círculo vermelho)
- Painel com breakpoint atual e valores das variáveis

## Checklist PASS/FAIL

- [ ] Rosto visível (olhos/nariz/contorno) em todos os breakpoints
- [ ] Texto não invade área do rosto no desktop
- [ ] Breakpoint 900–1023: sem colapso de layout
- [ ] Mobile: sem regressão em chips, botões, menu
- [ ] Redimensionar janela não altera crop imprevisivelmente

## Arquivos

| Arquivo | Alteração |
|---------|-----------|
| `src/index.css` | CSS variables por breakpoint, overlay direcional, copy column max-width |
| `src/components/HeroSection.tsx` | Classes do contrato, magnetic cursor, debug overlay |
| `src/components/HeroDebugOverlay.tsx` | Novo componente de debug |
| `src/hooks/useMagneticCursor.ts` | Hook de cursor magnético |

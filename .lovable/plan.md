

# Fix: Eliminar a "Parede" que Divide o Hero em Dois Layouts

## Problema

A screenshot mostra uma divisao vertical nitida no meio da tela. Isso acontece por dois motivos:

1. **Media Stage com largura limitada (52-56%)**: o video comeca abruptamente no ponto onde o fundo escuro termina, criando uma borda visivel
2. **Glass card (`.hero-copy-surface::before`) com fundo semi-opaco**: o retangulo escuro atras do texto reforeca a separacao visual, parecendo dois paineis lado a lado

## Solucao

Transformar o video em camada full-bleed (100% da largura) com um overlay direcional longo que protege a legibilidade do texto. O card de texto perde o fundo de vidro e depende apenas do overlay + contraste tipografico.

## Mudancas Tecnicas

### 1. `src/index.css` — Media Stage full-bleed

Trocar `--hero-media-width` de valores parciais (52-56%) para **100%** em todos os breakpoints desktop. O video passa a cobrir toda a tela, e a integracao com o texto e feita exclusivamente pelo overlay direcional (`::after`).

```text
Breakpoints atualizados:
  >=900:  --hero-media-width: 100%
  >=1024: --hero-media-width: 100%
  >=1280: --hero-media-width: 100%
  >=1600: --hero-media-width: 100%
```

### 2. `src/index.css` — Overlay direcional mais longo e suave

A mascara lateral (`.hero-media-stage::after`) precisa cobrir ~50% da tela com opacidade decrescente, protegendo a area de leitura do texto:

```css
/* Proposto */
background: linear-gradient(
  to right,
  hsl(var(--background)) 0%,
  hsl(var(--background) / 0.92) 20%,
  hsl(var(--background) / 0.6) 38%,
  hsl(var(--background) / 0.15) 58%,
  transparent 75%
);
```

Isso cria uma transicao de ~75% da largura do video (que agora e 100% da tela), eliminando qualquer "corte seco".

### 3. `src/index.css` — Remover fundo do glass card

Tornar `.hero-copy-surface::before` invisivel no desktop (sem background, sem blur, sem borda). O texto fica legivel pelo overlay direcional + radial glow da base layer. Manter a versao mobile com fundo para legibilidade.

```css
/* Desktop: sem card visivel */
@media (min-width: 900px) {
  .hero-copy-surface::before {
    background: transparent;
    border: none;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}
```

### 4. `src/index.css` — Reforcar base layer glow

Aumentar levemente o radial glow da `.hero-base-layer` na zona esquerda para garantir contraste do texto mesmo sem o card:

```css
.hero-base-layer {
  background:
    radial-gradient(ellipse 50% 70% at 25% 50%, hsl(var(--background) / 0.97) 0%, transparent 70%),
    radial-gradient(ellipse 60% 50% at 70% 40%, hsl(var(--gold-dim) / 0.08) 0%, transparent 70%),
    hsl(var(--background));
}
```

### Arquivos alterados

| Arquivo | Mudanca |
|---------|---------|
| `src/index.css` | Media width -> 100%, overlay mais longo, card transparente no desktop, base glow reforco |

### Nenhuma mudanca em

- `HeroSection.tsx` (estrutura JSX intacta)
- `HeroDebugOverlay.tsx`
- Qualquer componente fora do Hero

## Resultado esperado

- Video da Clara ocupa toda a largura como fundo imersivo
- Overlay direcional cria zona escura gradual a esquerda para texto
- Sem "parede" ou divisao visivel
- Texto legivel por contraste com overlay (sem caixa de vidro)
- Mobile: sem mudanca (card com fundo mantido)

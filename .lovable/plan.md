

# Polimento Awwwards — "Liquid Authority" Final

## Visao Geral

Cinco intervencoes cirurgicas para elevar o Hero de "layout funcional" para obra de arte digital, mantendo performance e acessibilidade.

---

## A. Tipografia Editorial e Tracking

**Titulo "CLARA"**
- Aumentar para `text-[4.5rem] md:text-[5rem]` com tracking `0.08em`
- Adicionar text-shadow dourado sutil para efeito de glow cinematografico
- Line-height reduzido para `0.9` (wordmark monumental)

**Subtitulo Acronimo**
- Capitulares (C, L, A, R, A) com glow ambar via `drop-shadow(0 0 8px hsl(38 80% 60% / 0.6))`
- Texto restante em `text-foreground/70` (branco translucido elegante)
- Line-height aumentado para `1.45` (respiracao editorial)
- Tamanho `text-[1.5rem] md:text-[1.65rem]`

**Descricao**
- Tamanho `text-[0.95rem] md:text-[1rem]` com line-height `1.75`

## B. Glassmorphism 2.0 ("Vidro Invisivel")

No desktop, o card ja e transparente (conforme implementacao anterior). No mobile, refinar:
- Reduzir opacidade do fundo de `0.52` para `0.35`
- Aumentar blur de `10px` para `24px`
- Borda sutil: `1px solid hsl(var(--border) / 0.08)`
- Adicionar bevel edge superior com gradiente branco 3%

## C. Emulsao Cinematografica (Film Grain)

O `.noise-overlay` ja existe na section mas usa opacidade de 3%. Refinar:
- Aumentar para `opacity: 0.04` e adicionar `mix-blend-mode: overlay`
- Garantir que cobre todas as camadas (z-index adequado)

## D. Botoes de Autoridade

- Borda do botao primario: `border border-primary/20` visivel por padrao
- Hover: borda ilumina para `border-primary/60` com transicao `300ms`
- Botao secundario: hover com `bg-white/5` e `border-white/15`
- Ambos: `transition-all duration-300 ease-out` (fisica mais suave)
- Remover `glow-pulse` constante do primario (muito "SaaS"), substituir por glow apenas no hover

## E. Espacamento e Posicionamento

- Subir conteudo: `pt-12 md:pt-10`
- Badge de manutencao: ponto laranja com animacao `pulse` para chamar atencao
- Gap entre titulo e subtitulo: `space-y-5 md:space-y-6`
- Chips de perguntas rapidas: borda `border-white/8` e hover `border-gold/25`

---

## Arquivos Editados

| Arquivo | Mudanca |
|---|---|
| `src/components/HeroSection.tsx` | Tipografia, botoes, espacamento, glow nas capitulares |
| `src/index.css` | Glassmorphism mobile, film grain refinado, botao hover states |

## Impacto

- Zero dependencias novas
- Performance inalterada (apenas CSS/classes)
- Acessibilidade mantida (contraste WCAG AA preservado)
- Reduced motion respeitado




# Integracao da Personagem Clara no Mobile

## Objetivo

Melhorar a visibilidade da personagem Clara na versao mobile, inspirado na referencia enviada onde o rosto/perfil da personagem fica claramente visivel por tras do texto, criando uma composicao cinematografica integrada. **Nenhuma alteracao no desktop/notebook.**

## O Que Muda

### 1. Posicionamento da Imagem (Mobile)

Atualmente a imagem usa `object-cover` generico. A Clara fica cortada de forma imprevisivel.

**Mudanca**: Ajustar `object-position` no mobile para `65% 20%`, priorizando o enquadramento do rosto/perfil da personagem (similar a referencia onde o rosto aparece no terco direito da tela).

### 2. Overlay Mais Leve e Inteligente

O gradiente atual sobre a imagem no mobile e muito pesado (opacidades de 0.55 a 0.9), escondendo a personagem.

**Mudanca**: Reduzir as opacidades do gradiente vertical para:
- Topo: `0.45` (era 0.55) — levemente mais transparente na area do badge
- Meio: `0.20` (era 0.35) — zona do rosto da Clara fica mais visivel  
- Inferior: `0.55` (era 0.65) — area dos botoes, ainda legivel mas mais aberta
- Base: `0.88` (era 0.9) — mantem legibilidade na zona dos chips

### 3. Glass Card Mobile Mais Transparente

O `.hero-copy-surface::before` no mobile usa `hsl(var(--card) / 0.52)` — uma parede fosca.

**Mudanca**: Reduzir para `0.30` e aumentar `backdrop-blur` para `20px`, criando o efeito de "ar denso" que permite ver a personagem por tras do texto.

### 4. Borda Sutil no Glass Mobile

Adicionar `border: 1px solid hsl(var(--border) / 0.08)` com um gradiente superior branco de 3% para efeito bevel, refinando o glassmorphism.

---

## Arquivos Editados

| Arquivo | O Que Muda |
|---|---|
| `src/components/HeroSection.tsx` | `object-position` condicional no mobile, opacidades do overlay reduzidas |
| `src/index.css` | `.hero-copy-surface::before` — opacidade e blur refinados para mobile |

## Impacto

- Zero alteracoes no desktop (condicional via `isMobile` e media query `max-width: 899px`)
- Performance mantida (nenhum asset novo, apenas CSS)
- Texto continua legivel (contraste WCAG AA respeitado com o gradiente ajustado)




# Analise do Problema e Plano de Solucao

## Diagnostico

O efeito atual (WebGL shader com domain warping) gera um **plasma generico** sobreposto a imagem. Ele nao sabe onde estao os fios de cabelo, os contornos do corpo ou a direcao do fluxo. O resultado e uma mancha dourada semitransparente que nao se parece com "energia viva fluindo pelo cabelo" como no video.

O video mostra energia que **segue os fios de cabelo individualmente**, com direcionalidade, velocidade e luminosidade que respeitam a anatomia da personagem. Replicar isso proceduralmente com um shader "cego" (sem informacao da imagem) e praticamente impossivel.

## Abordagem Proposta: Video Overlay com Blend Mode

A solucao mais eficaz e pragmatica e usar o **proprio video como camada de overlay** com `mix-blend-mode: screen` sobre a imagem da Clara. Isso garante exatamente a qualidade cinematografica do video, sem tentar reimplementar algo que foi gerado por IA generativa (Veo).

### Como funciona

1. Copiar o video para `public/videos/energy-flow.mp4`
2. Substituir o componente `EnergyFlow.tsx` por um elemento `<video>` com:
   - `autoPlay`, `muted`, `loop`, `playsInline`
   - `mix-blend-mode: screen` (fundo preto desaparece, so a energia brilha)
   - `pointer-events: none`
   - Posicionamento absoluto cobrindo a area da Clara
3. Manter `prefers-reduced-motion` e deteccao mobile (nao exibir em mobile)
4. Fallback: se o video nao carregar, nao mostra nada (graceful degradation)

### Vantagens

- Qualidade cinematografica identica ao video
- Zero custo de GPU em runtime (video decodificado por hardware)
- Implementacao simples e robusta
- Sem dependencias extras

### Requisito do video

O video precisa ter **fundo preto puro** para que o `mix-blend-mode: screen` funcione (preto = transparente, luz = visivel). Se o video atual nao tiver fundo preto, sera necessario um ajuste externo.

---

## Detalhes Tecnicos

### Arquivo: `src/components/EnergyFlow.tsx`
- Remover todo o codigo WebGL (shader, canvas, uniforms)
- Substituir por um componente que renderiza `<video>` posicionado sobre a Clara
- Atributos: `autoPlay muted loop playsInline`
- CSS: `position: absolute`, `mix-blend-mode: screen`, `object-fit: cover`
- Respeitar `prefers-reduced-motion` e `isMobile`

### Arquivo: `public/videos/energy-flow.mp4`
- Copiar o video enviado pelo usuario

### Arquivo: `src/components/HeroSection.tsx`
- Nenhuma alteracao necessaria (ja importa e renderiza `<EnergyFlow />`)


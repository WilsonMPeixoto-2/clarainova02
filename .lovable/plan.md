

# Bypass Inteligente: Video como Asset Principal

## Diagnostico

O video `energy-flow.mp4` contem a Clara completa + efeito de energia. Usar `mix-blend-mode: screen` sobre a imagem estatica cria "double exposure" (ghosting). A solucao correta e usar o video como substituto da imagem no desktop, nao como overlay.

## Mudancas

### 1. `src/components/HeroSection.tsx`

**Background layer (linhas 70-86):** Alterar para mostrar o video no desktop e a imagem estatica no mobile:

```text
Antes:
  <img src={claraHero} ... />   (sempre visivel)
  + EnergyFlow overlay com blend

Depois:
  <video ... />                  (desktop only, hidden em mobile)
  <img src={claraHero} ... />    (mobile only, hidden em desktop)
```

- O `<video>` recebe as mesmas classes da imagem (`hero-clara-img w-full h-full object-cover`) + `hidden md:block`
- A `<img>` recebe `md:hidden` para sumir no desktop
- Manter o parallax wrapper e o overlay gradient intactos
- Adicionar fade-in suave no video (`onCanPlayThrough` + estado `canPlay`)

### 2. `src/components/EnergyFlow.tsx`

- Remover completamente o componente (ou esvaziar para retornar `null`)
- Ja nao e necessario como overlay

### 3. `src/components/HeroSection.tsx` (import cleanup)

- Remover import do `EnergyFlow`
- Remover a renderizacao `{!isMobile && <EnergyFlow />}` (linha ~98)

## Resultado

- Desktop: video cinematografico com energia viva (decodificacao por hardware, zero GPU extra)
- Mobile: imagem estatica leve (economia de dados e bateria)
- Zero ghosting, zero WebGL, zero blend mode hack
- Parallax, aurora, gold particles e overlay gradient continuam funcionando normalmente sobre o video


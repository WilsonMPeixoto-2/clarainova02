
# Fix: Mover Copy Column para a Esquerda (Sair de Cima do Rosto)

## Problema

O bloco textual esta avancando sobre o rosto da Clara. A copy column precisa ser mais estreita e ficar mais colada a margem esquerda.

## Mudancas em `src/index.css`

### 1. Reduzir `--hero-copy-max` em todos os breakpoints

Os valores atuais permitem que o texto se estenda demais para a direita. Reducao de ~60-80px por faixa:

```text
900-1023:  --hero-copy-max: 320px  (era 380px)
1024-1279: --hero-copy-max: 360px  (era 420px)
1280-1599: --hero-copy-max: 400px  (era 460px)
>=1600:    --hero-copy-max: 440px  (era 520px)
```

### 2. Reduzir o clamp base da `.hero-copy-column`

Trocar `clamp(320px, 30vw, 520px)` para `clamp(280px, 26vw, 440px)` para que a coluna nunca ultrapasse a zona segura.

### 3. Nenhuma outra mudanca

- HeroSection.tsx: intacto
- Overlay/media: intactos
- Mobile: intacto

## Resultado esperado

Texto compacto e colado a esquerda, rosto da Clara totalmente livre a direita.

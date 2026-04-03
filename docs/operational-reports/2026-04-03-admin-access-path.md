# 2026-04-03 — Ajuste de caminho público para a área administrativa

## Objetivo

Eliminar a lacuna de navegabilidade pública na página inicial da CLARA, que não oferecia nenhum caminho discreto para `/admin`.

## O que foi feito

- Mantido o link `Acesso administrativo` no drawer móvel do [Header](C:/Users/okidata/clarainova02-main-publish/src/components/Header.tsx), logo abaixo da ação principal de abertura do chat.
- Adicionado também um link discreto `Acesso administrativo` no [Footer](C:/Users/okidata/clarainova02-main-publish/src/components/Footer.tsx), dentro da seção `Transparência`.
- Atualizada a cobertura do [Header.test.tsx](C:/Users/okidata/clarainova02-main-publish/src/test/Header.test.tsx) para garantir a presença do link no drawer.
- Criado o teste [Footer.test.tsx](C:/Users/okidata/clarainova02-main-publish/src/test/Footer.test.tsx) para validar o caminho público para `/admin`.

## Resultado

- A home passa a oferecer caminho público e discreto para a área administrativa em mobile e desktop.
- O ajuste não polui a navegação principal nem expõe o admin como CTA primário.
- A política de acesso continua intacta: o link existe, mas a autenticação/admin authorization seguem sendo exigidas normalmente.

## Validação

- `npm test -- src/test/Header.test.tsx src/test/Footer.test.tsx`
- `npm run validate`
- `npm run continuity:check`

## Observação

Esse ajuste melhora descoberta e navegabilidade, mas não substitui a futura configuração do Google OAuth admin nem altera o modelo de autenticação atual.


# Corrigir Diagramacao Hero: Restaurar Media Full-Width como Producao

## Problema

Na ultima correcao, o `.hero-media-stage` foi alterado para `left: auto` e `width: 50-55%`, empurrando o video fisicamente para a metade direita. Isso cortou a Clara e criou uma separacao artificial onde parte do video fica atras do card textual.

Na producao (clarainova.vercel.app), a abordagem e diferente: o video ocupa 100% da largura (`left: 0`, `width: 100%`) e a separacao visual e feita APENAS pelo gradiente de mascara (`mask-image`) e pelo overlay escuro. O resultado e uma integracao organica onde a Clara "emerge" do fundo escuro.

```text
PRODUCAO (correto):                   LOVABLE (atual - quebrado):
+-----------------------------+       +-----------+--------------+
| overlay  | mask  | CLARA    |       | texto     | CLARA cortada|
| escuro   | fade  | full-w   |       | sem video | width: 50%   |
| texto    |       | video    |       |           | left: auto   |
+-----------------------------+       +-----------+--------------+
  media-stage: width 100%, left 0      media-stage: width 50%, left auto
  separacao via gradient overlay        separacao fisica (errado)
```

## Correcoes no CSS (src/index.css)

### 1. Restaurar hero-media-stage para full-width

Reverter `.hero-media-stage` para usar `left: 0` e `width: 100%` em todos os breakpoints, identico a producao:

- Linha 398: trocar `left: auto` para `left: 0`
- `--hero-media-width` volta para `100%` em todos os breakpoints (linhas 344, 354, 363, 372)

### 2. Ajustar mask-image para fade organico

Ajustar o gradiente da mascara para `transparent 0%, black 15%` (producao usa 15%, nos usamos 20%):

- Linhas 402-403: trocar `black 20%` para `black 15%`

### 3. Remover o pseudo-elemento `clara-hero::after` de overlay separado

Na producao, NAO existe um `::after` com overlay horizontal. A protecao do texto e feita pela propria mascara do media-stage + o glass do `hero-copy-surface` + o backdrop-filter. O `::after` que adicionamos esta criando uma camada extra desnecessaria que escurece demais a cena.

- Remover o bloco `.clara-hero::after` (linhas 407-419)
- Zerar `--hero-overlay-strength` ja que nao sera mais usado

### 4. Restaurar variaveis de breakpoint

| Breakpoint | hero-media-width (atual) | hero-media-width (corrigido) |
|-----------|--------------------------|------------------------------|
| 900px     | 50%                      | 100%                         |
| 1024px    | 52%                      | 100%                         |
| 1280px    | 55%                      | 100%                         |
| 1600px    | 55%                      | 100%                         |

## Arquivo a editar

| Arquivo | Mudanca |
|---------|---------|
| `src/index.css` | Restaurar media full-width, ajustar mask fade para 15%, remover overlay ::after |

## Resultado esperado

Clara visivel em full-width com integracao organica via mask-image fade, texto protegido pelo glass card com backdrop-blur, identico ao site de producao.

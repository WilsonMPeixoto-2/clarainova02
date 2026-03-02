
# Corrigir Posicionamento da Imagem da Clara no Hero

## Problema

A imagem da Clara esta cobrindo toda a tela, invadindo a area do texto. No site de producao (Vercel), a Clara fica posicionada na metade direita da tela, enquanto a metade esquerda tem um overlay escuro que protege o texto.

## Comparacao Visual

```text
PRODUCAO (Vercel):                    LOVABLE (atual):
+------------------+----------+       +-----------------------------+
| TEXTO LEGIVEL    | CLARA    |       | CLARA POR CIMA DE TUDO     |
| overlay escuro   | visivel  |       | texto ilegivel misturado   |
| fundo protegido  | direita  |       | sem separacao              |
+------------------+----------+       +-----------------------------+
```

## Correcoes no CSS (src/index.css)

### 1. Reposicionar hero-media-stage para a direita

Alterar o `.hero-media-stage` no desktop para ocupar apenas a metade direita da tela em vez de 100%:
- Remover `left: 0`
- Adicionar `left: auto` no desktop (>= 900px)
- Definir `width: 55%` (em vez de 100%) para que a Clara ocupe apenas o lado direito
- Ajustar a mascara de gradiente para um fade mais suave na borda esquerda

### 2. Fortalecer overlay na area do texto

Adicionar um overlay escuro mais forte no lado esquerdo para garantir legibilidade do texto, similar ao que existe na producao:
- Gradiente horizontal (`to right`) partindo de opacidade alta (0.92) ate transparente

### 3. Ajustar object-position do video/imagem

Manter `object-position: 80% center` mas garantir que funcione corretamente quando o container esta limitado ao lado direito.

### 4. Valores por breakpoint

| Breakpoint   | Media width | Mask fade | Overlay |
|-------------|-------------|-----------|---------|
| >= 1600px   | 55%         | 0-20%     | 0.85    |
| >= 1280px   | 55%         | 0-18%     | 0.87    |
| >= 1024px   | 52%         | 0-15%     | 0.88    |
| >= 900px    | 50%         | 0-12%     | 0.90    |
| < 900px     | 100%        | none      | vertical|

## Arquivo a editar

| Arquivo | Mudanca |
|---------|---------|
| `src/index.css` | Reposicionar hero-media-stage para direita, fortalecer overlay esquerdo, ajustar media-width por breakpoint |

## Resultado esperado

Clara visivel no lado direito da tela, texto perfeitamente legivel no lado esquerdo com overlay escuro, identico ao site de producao na Vercel.

# 2026-04-03 — Clara Symbol System

## Objetivo

Abrir uma frente paralela de identidade reduzida da CLARA a partir das imagens de referência aprovadas pelo usuário, sem mexer em backend nem interromper a prioridade funcional do `BLOCO 4C`.

## O que foi feito

- Análise comparativa das imagens em `C:\Users\okidata\OneDrive\Área de Trabalho\CLARAINOVA02\IMAGENS`
- Escolha de `favicon.png` como base principal do selo reduzido da CLARA
- Geração de um pacote de assets públicos em `public/brand/`:
  - `clara-seal-512.png`
  - `clara-seal-1024.png`
  - `clara-seal.svg`
  - `clara-avatar-1024.png`
  - `clara-wordmark-1600.png`
- Substituição dos ícones públicos da aplicação:
  - `favicon.svg`
  - `favicon.png`
  - `favicon-32x32.png`
  - `favicon-16x16.png`
  - `favicon.ico`
  - `apple-touch-icon.png`
  - `icon-192.png`
  - `icon-512.png`
  - `icon-maskable-512.png`
- Atualização dos cartões públicos de compartilhamento:
  - `og-clara-public.png`
  - `og-clara.png`
- Integração do novo selo ao app em `src/components/ClaraMonogram.tsx`
- Ajuste do texto alternativo dos metadados públicos para refletir o novo símbolo

## O que foi provado

- A nova identidade reduzida já tem material suficiente para favicon, PWA, header, chat e share card
- O selo baseado em perfil neural/fios de dados sustenta melhor o conceito premium da CLARA do que o monograma anterior
- A aplicação continua íntegra após a troca dos assets visuais
- `npm run validate` passou com `71` testes

## O que ficou pendente

- Decidir se esta frente será promovida imediatamente para `main` e produção
- Debater, em etapa seguinte, se o selo atual deve receber uma versão vetorial ainda mais depurada
- Avaliar se o `wordmark` horizontal deve ganhar uso direto no site além do share card

## Observações

- Esta rodada é estética e de sistema de marca; ela não altera a prioridade funcional do `BLOCO 4C`
- A base visual escolhida veio das referências produzidas pelo usuário, evitando invenção desconectada do hero e da linguagem já consolidada

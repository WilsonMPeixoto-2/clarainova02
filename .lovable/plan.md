

# Plano: Espelho Exato do clarainova.vercel.app

## Diagnostico Visual - Diferencas Encontradas

Apos comparar pixel a pixel os screenshots do site de producao com a versao local, identifiquei as seguintes diferencas:

### HERO SECTION

1. **Titulo "CLARA"**: No original, o texto usa `font-weight: 800` (extrabold) e e visivelmente maior (~7rem no desktop). A versao local ja esta proxima mas o `letter-spacing` e `line-height` precisam de ajuste fino para bater exatamente.

2. **Subtitulo "Consultora de..."**: No original, cada linha quebra naturalmente com as iniciais douradas (C, L, A, R, A). O tamanho no original e maior (~2rem no desktop). A versao local esta proxima mas precisa de ajuste na quebra de linha e tamanho.

3. **Badges de status**: No original, o badge "INTELIGENCIA ADMINISTRATIVA" tem um icone de foguete (rocket emoji) e ponto verde. O badge de manutencao tem ponto laranja/amarelo. A versao local usa emoji diferente e precisa de ajuste.

4. **Botoes CTA**: No original, "Iniciar conversa" tem borda arredondada (pill shape) com background dourado solido. "Ver topicos" tem borda fina com fundo transparente. A versao local ja esta proxima.

5. **Perguntas rapidas**: No original, as perguntas terminam com "?" e usam um estilo de chip/pill com fundo glass sutil. A versao local mostra as mesmas perguntas mas algumas sem "?".

### SECOES ABAIXO DO HERO

6. **Knowledge Base Section**: Alinhamento e espacamento estao corretos.

7. **Services Section**: Os cards de servico no original sao clicaveis e abrem o chat com query params. A versao local nao tem essa funcionalidade (secundario, visual ok).

8. **Numbered Features (01, 02, 03)**: Visualmente alinhados. O numero grande com opacity reduzida e gradiente dourado esta correto.

9. **Steps Section**: Os 3 passos estao corretos.

10. **FAQ Section**: Titulo correto "DUVIDAS FREQUENTES" (uppercase tracking). A versao local mostra "Duvidas Frequentes" - precisa uppercase.

11. **Footer**: Visualmente alinhado com a producao.

### PAGINAS LEGAIS

12. **Privacidade e Termos**: No original sao paginas `.html` estaticas (`/privacidade.html`, `/termos.html`). A versao local usa rotas React (`/privacidade`, `/termos`) - isso e aceitavel para o espelho funcional.

---

## Acoes de Correcao

### 1. HeroSection.tsx - Ajustes finos

- Remover o emoji `"🔮"` do badge e usar apenas texto + ponto verde (como no original)
- Garantir que as perguntas rapidas tenham interrogacao no final (verificar dados)
- Ajustar `tracking` do titulo "CLARA" para `0.06em` (original usa tracking mais sutil)

### 2. FAQSection.tsx - Label uppercase

- Mudar o label de `"Dúvidas Frequentes"` para usar `uppercase tracking-[0.2em]` mais proximo do original que mostra "DUVIDAS FREQUENTES"

### 3. src/index.css - Ajustes finos de glass card

- Fine-tune do `.hero-glass-card` para match exato do blur e opacidade do original
- Verificar que o overlay direcional esta correto

### 4. Verificacao de conteudo das perguntas rapidas

- Confirmar que todas as 12 perguntas batem com o original (ja verificado via markdown scrape - estao corretas)

---

## Detalhes Tecnicos

### Arquivos a modificar:

| Arquivo | Mudanca |
|---------|---------|
| `src/components/HeroSection.tsx` | Remover emoji do badge, ajustar tracking do titulo |
| `src/components/FAQSection.tsx` | Label uppercase ja esta correto, verificar |
| `src/index.css` | Fine-tune minimo de glass card |

### Nota sobre fidelidade

A versao local ja esta bastante proxima da producao. As diferencas restantes sao sutis:
- Micro-ajustes de `letter-spacing` e `font-weight`
- Remocao do emoji extra no badge
- A imagem de hero (`clara-hero.jpg`) pode ser ligeiramente diferente da producao (`clara-hero-fallback-B3f4Yo1M.jpg`) - se a imagem local for a mesma base, o resultado visual sera identico

Apos essas correcoes, o site local sera um espelho funcional do original, permitindo que voce replique problemas e teste solucoes aqui antes de aplicar no site real.


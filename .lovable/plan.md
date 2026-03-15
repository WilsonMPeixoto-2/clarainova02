

## Plano de Correções — 3 Itens

### 1. Tag de manutenção → Versão prévia 2.1

No `HeroSection.tsx` (linha 261), trocar o texto e o estilo do chip:
- **De**: `CLARA em manutenção e atualização. Volta em breve.`
- **Para**: `Versão prévia 2.1`
- Trocar a classe `maintenance-dot animate-pulse-subtle` por um indicador estático ou de versão (sem pulse de alerta).

### 2. Clara mais à direita (menos competição com texto)

O `object-position` atual da imagem/vídeo no desktop é `80% center` (linha 500 do `index.css`). A Clara está muito centralizada. Ajustar para empurrá-la mais para a direita:

| Breakpoint | `object-position` atual | Novo valor |
|---|---|---|
| ≥900px | `80% center` | `85% center` |

Adicionalmente, o `mask-image` do `.hero-media-stage` (fade de 15%) pode ser ajustado para começar o fade um pouco antes (~20%), criando mais separação visual entre o texto e a personagem.

### 3. Inconsistência nas respostas — `temperature: 0.7`

A causa raiz está no `chat/index.ts` linha 162: `temperature: 0.7`. Este valor introduz aleatoriedade significativa nas respostas do Gemini. Para respostas consistentes e determinísticas (ideal para um assistente de legislação/procedimentos):

- **Reduzir `temperature` de `0.7` para `0.2`** — mantém criatividade mínima na formatação mas garante que o conteúdo factual seja reproduzível.
- Opcionalmente adicionar `topP: 0.9` para reforçar a consistência.

### Arquivos a editar

| # | Arquivo | Alteração |
|---|---------|-----------|
| 1 | `src/components/HeroSection.tsx` | Texto do chip: "Versão prévia 2.1" |
| 2 | `src/index.css` | `object-position: 85% center`, mask fade 20% |
| 3 | `supabase/functions/chat/index.ts` | `temperature: 0.2` |

Três edições cirúrgicas, zero risco estrutural.


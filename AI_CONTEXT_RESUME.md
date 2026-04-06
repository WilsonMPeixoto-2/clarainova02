# Contexto da Sessão: Clara API e Resolução de Quota

## Onde Paramos
- **Problema de UI (Resolvido):** O problema de "flickering" e congelamento na versão Mobile foi 100% resolvido graças aos parâmetros corretos detectados pelo usuário e pela ferramenta Lovable (ajuste na Media Query do Grid, remoção do `.scanline` abaixo de 900px, e correção de laço infinito no `useEffect` do `ChatSheet.tsx`). O código foi feito o deploy na Vercel e estabilizado.
- **Nosso Bloqueio Atual (Urgente):** O sistema de Embeddings da Clara (`gemini-embedding-2-preview`) e a API do chat (`gemini-3.1-pro`) estão sofrendo paralisia constante por erro **429 RESOURCE_EXHAUSTED**. Isso ocorre porque o projeto atual no Google Cloud (ID: `854144673782`) está travado nos limites severos da camada gratuita (Free Tier / 2 Requests Per Minute).

## Próximos Passos no Computador do Trabalho

Ao iniciar uma nova sessão ou reabrir o terminal com a IA, **o primeiro objetivo não é mexer em código**, mas sim diagnosticar a cota da conta Google Cloud.

1. **Autenticação:** Abra o terminal (PowerShell) e faça o login no Google Cloud via navegador usando a conta dona do projeto Clara:
   ```powershell
   gcloud auth login
   ```

2. **Diagnóstico de Faturamento e Quota:**
   Após o login, peça ou rode os seguintes comandos para investigar por que os limites estão barrando a aplicação:
   ```powershell
   gcloud billing projects describe 854144673782
   ```

   Para listar serviços travados:
   ```powershell
   gcloud services list --project=854144673782
   ```

**Nota para a IA na próxima sessão:** 
Você deve assumir um perfil totalmente focado na resolução da infraestrutura (Backend/GCP) da Clara. Cancele qualquer suposição visual e concentre-se em ler esses logs do `gcloud` para orientar o usuário a migrar a conta para Pay-as-you-go ou aplicar os créditos promocionais, destravando finalmente o RAG e o Chat.

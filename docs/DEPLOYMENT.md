# Guia de Deploy na Vercel

Este documento fornece instruções detalhadas para fazer o deploy da aplicação CLARAINOVA02 na Vercel.

## ✅ Pré-requisitos

Antes de começar, certifique-se de ter:

1. ✅ Conta na [Vercel](https://vercel.com) (gratuita)
2. ✅ Projeto Supabase configurado com:
   - Edge Functions ativas
   - Banco de dados pgvector configurado
   - Credenciais de acesso (Project ID, URL, e Anon Key)
3. ✅ Repositório Git (GitHub, GitLab, ou Bitbucket)

## 🚀 Método 1: Deploy via GitHub (Recomendado)

Este é o método mais simples e permite deploys automáticos em cada push.

### Passo 1: Conectar Repositório

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Clique em "Import Project"
3. Selecione seu provedor Git (GitHub)
4. Autorize o acesso ao repositório
5. Selecione o repositório `clarainova02`

### Passo 2: Configurar Projeto

A Vercel detectará automaticamente que é um projeto Vite. Confirme as configurações:

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### Passo 3: Configurar Variáveis de Ambiente

Na seção "Environment Variables", adicione as seguintes variáveis:

| Nome | Valor | Onde obter |
|------|-------|------------|
| `VITE_SUPABASE_PROJECT_ID` | ID do projeto | [Supabase Dashboard](https://supabase.com/dashboard) → Settings → General |
| `VITE_SUPABASE_URL` | URL completa | Supabase Dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave anon/public | Supabase Dashboard → Settings → API → anon/public |

⚠️ **Importante**: Adicione estas variáveis para todos os ambientes (Production, Preview, Development)

### Passo 4: Deploy

1. Clique em "Deploy"
2. Aguarde o build completar (geralmente 2-3 minutos)
3. Acesse a URL fornecida pela Vercel

## 🖥️ Método 2: Deploy via Vercel CLI

Para desenvolvedores que preferem linha de comando.

### Passo 1: Instalar Vercel CLI

```bash
npm install -g vercel
```

### Passo 2: Login

```bash
vercel login
```

Siga as instruções para autenticar via email ou GitHub.

### Passo 3: Configurar Variáveis de Ambiente Localmente

Crie um arquivo `.env` na raiz do projeto (se ainda não existir):

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais reais do Supabase.

### Passo 4: Deploy para Produção

```bash
# Para preview (ambiente de teste)
vercel

# Para produção
vercel --prod
```

Durante o primeiro deploy, a CLI fará algumas perguntas:

```
? Set up and deploy "~/clarainova02"? [Y/n] y
? Which scope do you want to deploy to? Your Username
? Link to existing project? [y/N] n
? What's your project's name? clarainova02
? In which directory is your code located? ./
? Want to override the settings? [y/N] n
```

### Passo 5: Adicionar Variáveis de Ambiente

Você pode adicionar variáveis de ambiente via CLI:

```bash
vercel env add VITE_SUPABASE_PROJECT_ID production
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production
```

Ou adicione via dashboard: [vercel.com/dashboard](https://vercel.com/dashboard) → Projeto → Settings → Environment Variables

## 🔄 Deploy Automático

Após o primeiro deploy via GitHub:

1. **Produção**: Cada push na branch `main` dispara deploy automático
2. **Preview**: Cada push em outras branches ou PRs cria um preview deployment
3. **Rollback**: Você pode reverter para qualquer deploy anterior via dashboard

## 🔧 Configuração Avançada

### Domínio Personalizado

1. Vá para Settings → Domains
2. Adicione seu domínio
3. Configure os registros DNS conforme instruído

### Headers de Segurança

O arquivo `vercel.json` já está configurado. Para adicionar headers customizados:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

### Otimização de Performance

A aplicação já está configurada com:
- ✅ Code splitting automático
- ✅ Lazy loading de rotas
- ✅ Compressão gzip
- ✅ Cache de assets estáticos
- ✅ Chunks otimizados (vendor, ui, motion, etc.)

## 🐛 Troubleshooting

### Erro: "Build failed"

**Solução**: Verifique os logs de build no dashboard da Vercel. Causas comuns:
- Dependências faltando no `package.json`
- Erros de TypeScript
- Variáveis de ambiente não configuradas

### Erro: "404 on page refresh"

**Solução**: Isso já está resolvido no `vercel.json` com a configuração de rewrites. Se persistir, verifique se o arquivo existe na raiz do projeto.

### Erro: "Failed to fetch data from Supabase"

**Solução**: Verifique as variáveis de ambiente:
1. Vá para Settings → Environment Variables
2. Confirme que todas as 3 variáveis estão presentes
3. Verifique se não há espaços extras nos valores
4. Faça um redeploy após adicionar/corrigir variáveis

### Página em branco após deploy

**Solução**:
1. Abra o console do navegador (F12)
2. Verifique erros de JavaScript
3. Confirme que as variáveis de ambiente estão corretas
4. Limpe o cache do navegador

## 📊 Monitoramento

Após o deploy, você pode monitorar:

- **Analytics**: Dashboard → Analytics (requer upgrade)
- **Logs**: Dashboard → Deployments → [Seu Deploy] → Logs
- **Performance**: Dashboard → Speed Insights

## 🔐 Segurança

### Checklist de Segurança

- [x] `.env` está no `.gitignore`
- [x] Variáveis de ambiente configuradas na Vercel (não no código)
- [x] Supabase RLS (Row Level Security) habilitado
- [x] CORS configurado no Supabase
- [ ] Rate limiting configurado (opcional)
- [ ] Domínio com HTTPS (automático na Vercel)

### Rotação de Credenciais

Se precisar rotacionar as credenciais do Supabase:

1. Gere novas keys no Supabase Dashboard
2. Atualize as variáveis de ambiente na Vercel
3. Faça um redeploy: `vercel --prod` ou via dashboard

## 📚 Recursos Adicionais

- [Documentação Vercel](https://vercel.com/docs)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Supabase com Vercel](https://supabase.com/docs/guides/hosting/vercel)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs no dashboard da Vercel
2. Consulte a [documentação oficial](https://vercel.com/docs)
3. Verifique as [issues conhecidas](https://github.com/vercel/vercel/issues)
4. Entre em contato com o suporte da Vercel

---

**Status**: ✅ Projeto pronto para deploy
**Última atualização**: 2026-03-03

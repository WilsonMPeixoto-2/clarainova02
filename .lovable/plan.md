

# Corrigir Acesso ao Painel Admin

## Problema
O formulario de login em `/admin` so permite entrar com credenciais existentes, mas nenhuma conta foi criada. Alem disso, nao ha como visualizar a senha digitada.

## Solucao

### 1. Adicionar fluxo de cadastro (signup) ao AdminAuth
- Adicionar um toggle "Criar conta" / "Ja tenho conta" no formulario
- No modo cadastro, usar `supabase.auth.signUp()` com email e senha
- Manter o formulario simples (email + senha) sem campos extras
- Apos o cadastro, informar que a conta foi criada (verificacao de email depende da configuracao atual)

### 2. Botao de mostrar/ocultar senha
- Adicionar um icone de olho (Eye/EyeOff do lucide-react) dentro do campo de senha
- Alternar entre `type="password"` e `type="text"` ao clicar

## Detalhes Tecnicos

**Arquivo a editar:** `src/components/AdminAuth.tsx`

Alteracoes:
- Novo estado `isSignUp` (boolean) para alternar entre login e cadastro
- Novo estado `showPassword` (boolean) para visibilidade da senha
- No submit: chamar `signInWithPassword` ou `signUp` conforme o modo
- Adicionar icone Eye/EyeOff posicionado dentro do input de senha (absolute right)
- Link "Criar conta" / "Ja tenho conta" abaixo do botao

Nenhuma alteracao de banco de dados ou edge functions necessaria.

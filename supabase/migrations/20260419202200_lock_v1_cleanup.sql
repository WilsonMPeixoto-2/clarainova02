-- Limpeza de tabelas não utilizadas vindas do bootstrap/template inicial
-- Isso resolve os avisos críticos de segurança sobre RLS exposto
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Documentação do modelo de acesso às tabelas de cache (resolvendo advisor de RLS sem policy)
COMMENT ON TABLE public.embedding_cache IS 'Tabela de cache de embeddings. Acesso restrito à Edge Function via service_role, por isso não há RLS policies públicas.';
COMMENT ON TABLE public.chat_response_cache IS 'Tabela de cache de respostas. Acesso restrito à Edge Function via service_role, por isso não há RLS policies públicas.';

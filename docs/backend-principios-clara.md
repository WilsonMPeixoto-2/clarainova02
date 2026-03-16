# Principios do backend da CLARA

Este documento registra as decisoes de produto e arquitetura que orientam a proxima fase do backend da CLARA. A ideia e manter a ferramenta sob controle proprio, com governanca simples e foco no que realmente ajuda a evoluir o produto.

## 1. Analytics enxutos e sem PII

A CLARA nao precisa rastrear quem fez cada pergunta. O objetivo da telemetria e melhorar a ferramenta, nao montar perfil de usuario.

### O que vale coletar

- assunto e subassunto estimados da duvida;
- se a resposta saiu com boa confianca ou nao;
- se houve ambiguidade na pergunta;
- se houve ambiguidade entre fontes;
- se a analise interna precisou ser ampliada;
- se houve web fallback oficial;
- feedback positivo, negativo ou neutro;
- latencia e consumo de APIs;
- referencias e fontes principais usadas na resposta.

### O que nao deve virar dado de negocio

- nome, email ou identidade do usuario do chat publico;
- historico pessoal por usuario;
- perfil comportamental individual;
- analytics invasivos ou qualquer coleta desnecessaria de PII.

### Observacao importante

`rate_limits` pode continuar existindo como mecanismo tecnico de protecao contra abuso, mas isso nao deve ser tratado como trilha analitica de usuario.

## 2. Autenticacao do administrador

O painel administrativo deve ser simples para o uso real do projeto e seguro o suficiente para evitar improvisos.

### Direcao desejada

- desktop/notebook: login com Google;
- celular: passkey/WebAuthn, usando biometria do aparelho quando disponivel;
- fallback claro para Google quando a passkey ainda nao estiver cadastrada.

### Principio

A biometria no celular deve ser tratada como desbloqueio de passkey, e nao como mecanismo isolado fora dos padroes modernos da web.

### Estado atual

Hoje o frontend ainda usa login simples com email e senha porque a camada de auth definitiva depende do backend proprio. Quando o projeto Supabase sob titularidade do projeto estiver pronto, esta sera a primeira melhoria funcional da area admin.

## 3. Upload e ingestao de PDFs

O objetivo da CLARA nao e ter uma interface "tecnica"; e permitir que a base seja atualizada com poucos passos e sem fragilidade desnecessaria.

### Experiencia desejada

- upload simples no painel admin;
- suporte a envio de varios PDFs;
- feedback claro de extração, chunking, embedding e verificacao;
- preparacao para PDFs vindos de origens variadas.

### Pipeline em camadas

#### Camada atual

- upload pelo frontend admin;
- extração inicial com `unpdf`;
- chunking semantico com `@langchain/textsplitters`;
- embeddings e persistencia via edge function.

#### Evolucao recomendada

- manter upload simples para arquivos pequenos;
- preparar upload resumable/TUS quando o novo Supabase estiver ligado;
- manter parser textual primario;
- adicionar fallback de leitura complementar para PDFs mais dificeis;
- quando necessario, usar entendimento documental por IA para casos em que a extração textual pura for insuficiente.

### Regra pratica

Nem todo PDF "parece PDF" do mesmo jeito por dentro. A CLARA deve assumir desde cedo que documentos exportados por suites e fluxos diferentes podem exigir tratamento complementar.

## 4. Base documental e RAG

A base da CLARA continua sendo:

- `documents`
- `document_chunks`

O restante deve ser construido em torno da qualidade da resposta, nao em torno de coleta excessiva.

### Estrutura analitica minima desejada

- `chat_metrics`
- `search_metrics`
- `query_analytics`
- `usage_logs`

Essas estruturas ja cobrem o suficiente para:

- medir custo e latencia;
- identificar topicos mais perguntados;
- localizar temas com mais ambiguidade;
- detectar onde a base interna ainda esta fraca.

## 5. Prioridade de implementacao

1. criar o projeto Supabase sob titularidade do projeto;
2. aplicar migrations e publicar as edge functions;
3. reingerir os PDFs oficiais;
4. validar o chat e a telemetria minima;
5. configurar auth do admin com Google e passkeys;
6. endurecer o upload com estrategia resumable e fallback documental mais robusto.

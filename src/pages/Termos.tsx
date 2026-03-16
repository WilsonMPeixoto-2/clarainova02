import { Link } from "react-router-dom";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

const Termos = () => {
  useDocumentMeta({
    title: "Termos de Serviço — CLARA",
    description:
      "Termos de Serviço da CLARA, ferramenta de apoio ao uso do SEI-Rio e a rotinas administrativas, com foco em escopo, limites e responsabilidades de uso.",
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="flex items-center justify-center gap-6 py-6 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground transition-colors">← Voltar para CLARA</Link>
        <Link to="/privacidade" className="hover:text-foreground transition-colors">Política de Privacidade</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pb-24">
        <h1 className="font-display text-4xl font-bold text-center mb-2">Termos de Serviço</h1>
        <p className="text-center text-primary font-medium mb-1">CLARA - Inteligência Administrativa</p>
        <p className="text-center text-sm text-muted-foreground mb-12">Última atualização: 15 de março de 2026</p>

        <div className="space-y-8">
          {[
            {
              title: "1. Aceitação dos Termos",
              content: "Ao acessar e utilizar a CLARA, você concorda com estes Termos de Serviço. Caso não concorde com as condições aqui descritas, o uso da aplicação deve ser interrompido.",
            },
            {
              title: "2. Descrição do Serviço",
              content: (
                <>
                  <p>A CLARA é uma ferramenta de apoio operacional. Nesta fase do projeto, ela foi desenhada principalmente para:</p>
                  <ul className="list-disc pl-6 mt-3 space-y-2">
                    <li>orientar tarefas frequentes no SEI-Rio;</li>
                    <li>ajudar na organização de documentos, anexos e blocos de assinatura;</li>
                    <li>apoiar a conferência de etapas antes de encaminhamentos e tramitações;</li>
                    <li>oferecer respostas curtas ou passo a passo quando houver base suficiente.</li>
                  </ul>
                </>
              ),
            },
            {
              title: "3. Escopo e limites",
              content: (
                <>
                  <p>A CLARA não substitui decisão administrativa, leitura dos documentos oficiais, validação interna da sua unidade, análise normativa especializada ou parecer jurídico.</p>
                  <p className="mt-4">O serviço também não deve ser apresentado como fonte oficial, ato formal, despacho ou validação final de processo.</p>
                </>
              ),
            },
            {
              title: "4. Uso permitido",
              content: (
                <>
                  <p>O uso é permitido para apoio a atividades legítimas de orientação operacional e consulta sobre rotinas administrativas.</p>
                  <p className="mt-4"><strong>Não é permitido:</strong> tentar burlar o sistema, explorar falhas, usar o serviço para fins ilícitos, inserir conteúdo indevido na administração da base ou reproduzir material de forma abusiva.</p>
                </>
              ),
            },
            {
              title: "5. Responsabilidade do usuário",
              content: (
                <>
                  <p>Ao utilizar a CLARA, o usuário deve:</p>
                  <ul className="list-disc pl-6 mt-3 space-y-2">
                    <li>formular perguntas compatíveis com o escopo do serviço;</li>
                    <li>validar orientações com documentos oficiais e fluxos internos aplicáveis;</li>
                    <li>evitar o envio de dados pessoais, sigilosos ou sensíveis sem necessidade;</li>
                    <li>confirmar a etapa final antes de praticar qualquer ato no processo administrativo.</li>
                  </ul>
                </>
              ),
            },
            {
              title: "6. Disponibilidade e evolução",
              content: (
                <>
                  <p>A CLARA pode ser atualizada, ajustada, expandida ou ter funcionalidades revistas ao longo do projeto, inclusive quanto à base documental e aos fluxos de resposta.</p>
                  <p className="mt-4">Mudanças de escopo, interface ou comportamento não criam obrigação de manutenção de funcionalidades experimentais ou provisórias.</p>
                </>
              ),
            },
            {
              title: "7. Limitação de responsabilidade",
              content: (
                <>
                  <p>A CLARA é uma ferramenta de apoio. Suas respostas podem conter simplificações, omissões ou imprecisões decorrentes do escopo da base e do processamento automatizado.</p>
                  <p className="mt-4">O uso do sistema não elimina a responsabilidade do usuário por conferir a orientação recebida, os documentos oficiais aplicáveis e as regras internas da sua unidade.</p>
                  <ul className="list-disc pl-6 mt-3 space-y-2">
                    <li>não substitui leitura do documento oficial;</li>
                    <li>não substitui análise jurídica ou técnica especializada;</li>
                    <li>não produz efeito vinculante;</li>
                    <li>não dispensa validação humana antes da execução do procedimento.</li>
                  </ul>
                </>
              ),
            },
          ].map((section, i) => (
            <div key={i} className="glass-card rounded-xl p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold text-foreground mb-4">{section.title}</h2>
              <div className="text-muted-foreground text-sm leading-relaxed" style={{ lineHeight: "1.7" }}>
                {typeof section.content === "string" ? <p>{section.content}</p> : section.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Termos;

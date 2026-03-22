import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import LegalPageLayout from "@/components/LegalPageLayout";

const Privacidade = () => {
  useDocumentMeta({
    title: "Política de Privacidade — CLARA",
    description:
      "Política de Privacidade da CLARA, ferramenta de apoio ao uso do SEI-Rio e a rotinas administrativas, com informações sobre dados tratados e limites de uso.",
  });

  const sections = [
    {
      title: "1. Escopo desta política",
      content: (
        <>
          <p>A CLARA é uma ferramenta de apoio ao uso do SEI-Rio e a rotinas administrativas. Esta política descreve quais dados podem ser tratados durante o uso do site, do chat e da área administrativa, bem como a finalidade desse tratamento.</p>
          <p className="mt-4">A proposta do serviço é orientar tarefas operacionais, com foco em documentos, assinatura, tramitação e conferência de etapas. O uso do sistema deve sempre respeitar a LGPD, as normas internas da sua unidade e os documentos oficiais aplicáveis.</p>
        </>
      ),
    },
    {
      title: "2. Dados que podem ser tratados",
      content: (
        <>
          <p>Dependendo da funcionalidade utilizada, a CLARA pode tratar:</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li><strong>Mensagens do chat:</strong> perguntas e contexto digitados pelo usuário para receber orientação operacional.</li>
            <li><strong>Metadados técnicos:</strong> registros mínimos de uso, desempenho e falhas necessários ao funcionamento e ao monitoramento do serviço.</li>
            <li><strong>Dados de autenticação administrativa:</strong> email e sessão de acesso, quando houver login na área administrativa.</li>
            <li><strong>Arquivos enviados na administração:</strong> documentos inseridos manualmente para ingestão e organização da base.</li>
          </ul>
          <p className="mt-4"><strong>Orientação importante:</strong> evite inserir dados pessoais, sigilosos ou sensíveis que não sejam estritamente necessários para formular a dúvida.</p>
        </>
      ),
    },
    {
      title: "3. Finalidade do tratamento",
      content: (
        <>
          <p>Os dados tratados pela CLARA são usados para:</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>gerar respostas relacionadas ao uso do SEI-Rio e a rotinas administrativas;</li>
            <li>manter a operação técnica do site, do chat e da área administrativa;</li>
            <li>monitorar qualidade, desempenho e eventuais falhas do serviço;</li>
            <li>administrar a base documental utilizada no apoio às respostas.</li>
          </ul>
        </>
      ),
    },
    {
      title: "4. Infraestrutura e processamento",
      content: (
        <>
          <p>A CLARA utiliza infraestrutura de terceiros para operação do frontend, armazenamento e processamento das respostas, incluindo Vercel, Supabase e Google Gemini.</p>
          <p className="mt-4">Esses serviços atuam como parte da infraestrutura técnica do projeto. O envio de perguntas ao chat pode envolver processamento automatizado por esses provedores para que a resposta seja gerada.</p>
        </>
      ),
    },
    {
      title: "5. Retenção e revisão",
      content: (
        <>
          <p>Os registros operacionais e dados administrativos podem ser mantidos pelo tempo necessário para funcionamento, segurança, auditoria técnica e manutenção da base.</p>
          <p className="mt-4">Solicitações de revisão, esclarecimento ou exclusão devem ser avaliadas conforme a natureza dos dados, o contexto institucional e a legislação aplicável.</p>
        </>
      ),
    },
    {
      title: "6. Boas práticas de uso",
      content: (
        <>
          <p>Para reduzir riscos, prefira formular perguntas com foco em procedimento e evite reproduzir dados pessoais, sigilosos ou informações processuais desnecessárias.</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>use exemplos genéricos sempre que possível;</li>
            <li>valide orientações com os documentos oficiais da sua unidade;</li>
            <li>não trate a CLARA como repositório permanente de informações sensíveis.</li>
          </ul>
        </>
      ),
    },
    {
      title: "7. Contato",
      content: (
        <>
          <p>Em caso de dúvida sobre esta política ou sobre o tratamento de dados no projeto, utilize o contato informado na própria aplicação.</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li><strong>Email:</strong> wilsonmp2@gmail.com</li>
          </ul>
        </>
      ),
    },
  ];

  return (
    <LegalPageLayout
      kicker="Política de Privacidade"
      title="Privacidade com transparência operacional"
      description="Como a CLARA trata dados, quais limites orientam o uso do serviço e quais cuidados continuam valendo no uso do site e do chat."
      updatedAt="Última atualização: 15 de março de 2026"
      sections={sections}
    />
  );
};

export default Privacidade;

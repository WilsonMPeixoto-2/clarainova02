import { DocumentMeta } from "@/components/DocumentMeta";
import LegalPageLayout from "@/components/LegalPageLayout";

const Privacidade = () => {
  const sections = [
    {
      title: "1. Escopo desta política",
      content: (
        <>
          <p>A CLARA é uma ferramenta de apoio ao uso do SEI-Rio e a rotinas administrativas. Esta política descreve, de forma operacional, quais dados podem ser tratados no site, no chat e na área administrativa, bem como a finalidade desse tratamento.</p>
          <p className="mt-4">O texto reflete o estado atual do produto. Se novas modalidades de entrada, como envio de imagens ou outros anexos pelo chat público, forem publicadas futuramente, esta política deverá ser atualizada.</p>
        </>
      ),
    },
    {
      title: "2. Dados que podem ser tratados",
      content: (
        <>
          <p>Dependendo da funcionalidade utilizada, a CLARA pode tratar:</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li><strong>Armazenamento local no navegador:</strong> histórico recente da conversa e preferência entre modo Direto e Didático, salvos localmente para continuidade da experiência.</li>
            <li><strong>Mensagens do chat:</strong> perguntas e contexto digitados pelo usuário para receber orientação operacional.</li>
            <li><strong>Metadados técnicos:</strong> registros mínimos de uso, desempenho, falhas e disponibilidade necessários ao funcionamento e ao monitoramento do serviço.</li>
            <li><strong>Métricas agregadas:</strong> contagens operacionais como uso do chat, buscas documentais e documentos ingeridos, sem desenho orientado a perfilamento individual do usuário final.</li>
            <li><strong>Dados de autenticação administrativa:</strong> email e sessão de acesso, quando houver login na área administrativa.</li>
            <li><strong>Arquivos e metadados administrativos:</strong> documentos inseridos manualmente para ingestão, classificação e organização da base, incluindo metadados de governança documental.</li>
          </ul>
          <p className="mt-4"><strong>Orientação importante:</strong> evite inserir dados pessoais, sigilosos ou sensíveis que não sejam estritamente necessários para formular a dúvida ou operar a base.</p>
          <p className="mt-4">Na versão atual, a CLARA não recebe imagens ou capturas de tela pelo chat público.</p>
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
          <p className="mt-4">Quando possível, a leitura operacional de uso é feita por sinais agregados e não por histórico individual detalhado de cada usuário final.</p>
        </>
      ),
    },
    {
      title: "4. Infraestrutura, provedores e processamento",
      content: (
        <>
          <p>A CLARA utiliza infraestrutura de terceiros para operação do frontend, armazenamento e processamento das respostas, incluindo Vercel, Supabase e Google Gemini.</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li><strong>Vercel:</strong> publicação do frontend e entrega da aplicação web.</li>
            <li><strong>Supabase:</strong> autenticação administrativa, banco de dados, armazenamento e funções de backend.</li>
            <li><strong>Google Gemini:</strong> processamento automatizado de partes do fluxo de resposta e de embeddings, conforme a disponibilidade do provedor.</li>
          </ul>
          <p className="mt-4">Esses serviços atuam como parte da infraestrutura técnica do projeto. O envio de perguntas ao chat e o processamento administrativo podem envolver tratamento automatizado por esses provedores para que a resposta seja gerada ou a base seja mantida.</p>
        </>
      ),
    },
    {
      title: "5. Retenção, armazenamento local e revisão",
      content: (
        <>
          <p>O histórico recente do chat e a preferência de modo de resposta podem permanecer no navegador até que o próprio usuário limpe o armazenamento local ou apague a conversa.</p>
          <p className="mt-4">Registros operacionais, dados administrativos e documentos ingeridos podem ser mantidos pelo tempo necessário para funcionamento, segurança, auditoria técnica, manutenção da base e governança do corpus.</p>
          <p className="mt-4">Documentos administrativos podem permanecer armazenados enquanto estiverem ativos, em revisão, em manutenção ou até sua exclusão deliberada por operador autorizado.</p>
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
            <li>não trate a CLARA como repositório permanente de informações sensíveis;</li>
            <li>na área administrativa, envie apenas o material que possa integrar legitimamente a base documental.</li>
          </ul>
        </>
      ),
    },
    {
      title: "7. Autoria, manutenção e contato",
      content: (
        <>
          <p>A CLARA é mantida por Wilson M. Peixoto - SME/RJ, no contexto de um projeto institucional em maturação.</p>
          <p className="mt-4">Em caso de dúvida sobre esta política ou sobre o tratamento de dados no projeto, utilize o contato informado na própria aplicação.</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li><strong>Email:</strong> wilsonmp2@gmail.com</li>
          </ul>
        </>
      ),
    },
  ];

  return (
    <>
      <DocumentMeta 
        title="Política de Privacidade — CLARA"
        description="Política de Privacidade da CLARA, com esclarecimentos sobre dados tratados, armazenamento local, métricas agregadas, provedores envolvidos e retenção operacional."
        canonical="https://clarainova02.vercel.app/privacidade"
      />
      <LegalPageLayout
      kicker="Política de Privacidade"
      title="Privacidade com transparência operacional real"
      description="Como a CLARA trata dados no estado atual do produto, quais provedores participam da operação e quais cuidados continuam obrigatórios no uso do site, do chat e da área administrativa."
      updatedAt="Última atualização: 31 de março de 2026"
      sections={sections}
    />
    </>
  );
};

export default Privacidade;

import { DocumentMeta } from "@/components/DocumentMeta";
import LegalPageLayout from "@/components/LegalPageLayout";

const Privacidade = () => {
  const sections = [
    {
      title: "1. Identificação do aviso e escopo",
      content: (
        <>
          <p>Esta Política de Privacidade descreve o tratamento de dados no ambiente público atualmente publicado da CLARA, incluindo site, chat e área administrativa. O texto foi alinhado ao comportamento real do código e do ambiente versionado até 31 de março de 2026.</p>
          <p className="mt-4">A autoria técnica identificada na aplicação é de Wilson M. Peixoto. A menção à SME/RJ, quando exibida no projeto, informa contexto profissional de atuação do autor e não equivale, por si só, à designação formal de controlador institucional do ambiente publicado. Se essa governança mudar, este aviso deverá ser atualizado.</p>
        </>
      ),
    },
    {
      title: "2. Dados tratados no navegador do usuário",
      content: (
        <>
          <p>Sem depender de login para o chat público, a CLARA já grava localmente no navegador alguns dados de experiência para continuar a conversa com mais conforto.</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li><strong>Histórico local do chat:</strong> até 50 mensagens recentes podem ficar salvas em <code>localStorage</code> no próprio navegador do usuário.</li>
            <li><strong>Preferência de resposta:</strong> o modo “Direto” ou “Didático” também pode ser salvo localmente para reutilização nas próximas interações.</li>
            <li><strong>Sessão administrativa no navegador:</strong> quando o acesso administrativo está ativo, a sessão do Supabase Auth pode ser persistida localmente para manter o login.</li>
          </ul>
          <p className="mt-4"><strong>Orientação importante:</strong> se o dispositivo for compartilhado, limpe a conversa ao final do uso e evite inserir dados pessoais, sigilosos ou sensíveis que não sejam estritamente necessários.</p>
        </>
      ),
    },
    {
      title: "3. Dados enviados ao backend do chat",
      content: (
        <>
          <p>Quando o backend está ativo, a pergunta enviada no chat público é transmitida para a infraestrutura da CLARA para processamento da resposta. Nessa etapa, o projeto pode tratar:</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li><strong>mensagens do chat e contexto enviado pelo usuário</strong>, para gerar a resposta;</li>
            <li><strong>registros de telemetria operacional</strong>, incluindo texto da pergunta, versão normalizada da consulta, texto da resposta, status da resposta, latência, contagem de resultados e referências selecionadas;</li>
            <li><strong>identificadores técnicos para proteção contra abuso</strong>, como chave derivada de IP e user agent para limitação de requisições; em eventos de bloqueio de segurança, metadados técnicos adicionais podem ser registrados;</li>
            <li><strong>logs agregados de uso</strong>, voltados a manutenção, monitoramento, investigação de falhas e evolução do serviço.</li>
          </ul>
          <p className="mt-4">O projeto não foi desenhado para cadastro do usuário público nem para perfilamento comercial. Ainda assim, o conteúdo da própria pergunta pode conter dados pessoais se o usuário os escrever no chat. Por isso, a recomendação continua sendo evitar inserir dados pessoais, sigilosos ou sensíveis sem necessidade estrita.</p>
        </>
      ),
    },
    {
      title: "4. Dados tratados na área administrativa e no corpus",
      content: (
        <>
          <p>A área administrativa é restrita a contas autenticadas no ambiente operacional. Quando utilizada, ela pode tratar:</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li><strong>dados de autenticação</strong>, como email, sessão e identidade retornada pelo provedor de login;</li>
            <li><strong>arquivos PDF enviados pelo administrador</strong>, com armazenamento em bucket privado do projeto;</li>
            <li><strong>metadados documentais e de governança</strong>, como origem institucional, tipo documental, nível de autoridade, prioridade de ingestão, datas de revisão e observações de curadoria;</li>
            <li><strong>fragmentos e índices do corpus</strong>, gerados a partir dos documentos enviados para fins de busca e resposta grounded;</li>
            <li><strong>eventos de processamento e uso administrativo</strong>, inclusive registros de ingestão e métricas agregadas do painel.</li>
          </ul>
          <p className="mt-4">O envio de documentos para a área administrativa pressupõe autorização para tratar esse material no projeto, observância do regime de sigilo aplicável e revisão humana da aderência institucional do conteúdo antes e depois da ingestão.</p>
        </>
      ),
    },
    {
      title: "5. Infraestrutura e compartilhamento com operadores técnicos",
      content: (
        <>
          <p>A CLARA utiliza infraestrutura de terceiros para hospedagem, autenticação, armazenamento e processamento das respostas, incluindo, no estado atual do projeto, Vercel, Supabase e Google Gemini.</p>
          <p className="mt-4">Esses serviços participam da operação técnica do ambiente publicado. Dependendo da funcionalidade acionada, dados do chat, do login administrativo, de documentos enviados e de métricas operacionais podem transitar por esses provedores para que o serviço funcione, com a limitação de escopo definida pelo projeto e pelos próprios contratos da infraestrutura.</p>
        </>
      ),
    },
    {
      title: "6. Retenção, exclusão e acesso administrativo",
      content: (
        <>
          <p>O código atual não define um prazo automático único de retenção para todos os registros do projeto. Por isso, o tempo de permanência varia conforme a natureza do dado e a necessidade operacional do ambiente.</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li><strong>Histórico local do chat:</strong> permanece no navegador até que o usuário limpe a conversa, apague o armazenamento local ou utilize outro ambiente/dispositivo.</li>
            <li><strong>Telemetria do backend:</strong> pode permanecer enquanto for necessária para segurança, auditoria técnica, diagnóstico de falhas, manutenção ou revisão do serviço.</li>
            <li><strong>Documentos administrativos e corpus:</strong> podem permanecer até revisão administrativa, desativação, exclusão manual ou migração de ambiente. Quando um documento é removido pelo painel administrativo, o fluxo do código também remove o arquivo do storage e seus fragmentos associados.</li>
            <li><strong>Acesso aos dados:</strong> documentos, chunks e logs administrativos usam políticas de acesso autenticado no ambiente Supabase atualmente versionado.</li>
          </ul>
          <p className="mt-4">Quando possível, a leitura operacional de uso é feita por sinais agregados e não por histórico individual detalhado de cada usuário final.</p>
        </>
      ),
    },
    {
      title: "7. Direitos, revisão humana e contato",
      content: (
        <>
          <p>Solicitações de esclarecimento, revisão ou tratamento de demandas relacionadas a esta política devem ser avaliadas conforme a natureza dos dados, o contexto institucional do ambiente em operação e a legislação aplicável, especialmente a LGPD.</p>
          <p className="mt-4">Na versão pública identificada neste projeto, o contato atualmente informado para dúvidas sobre a operação e este aviso é <strong>wilsonmp2@gmail.com</strong>. Caso o projeto passe a contar com controlador institucional formal ou encarregado específico no ambiente publicado, esta política deverá ser atualizada para refletir essa designação.</p>
          <p className="mt-4">Mesmo com este aviso, a CLARA deve ser usada com revisão humana. Em assuntos sensíveis, normativos ou decisórios, prevalecem os fluxos oficiais da unidade competente e os documentos institucionais aplicáveis.</p>
        </>
      ),
    },
  ];

  return (
    <>
      <DocumentMeta
        title="Política de Privacidade — CLARA"
        description="Política de Privacidade da CLARA, com descrição do tratamento de dados no chat, na telemetria, no painel administrativo e no armazenamento local do navegador."
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

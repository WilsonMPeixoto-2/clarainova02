import { DocumentMeta } from "@/components/DocumentMeta";
import LegalPageLayout from "@/components/LegalPageLayout";
import {
  SITE_AUTHOR_NAME,
  SITE_CANONICAL_URL,
  SITE_CONTACT_EMAIL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_PUBLIC_NATURE,
} from "@/lib/site-identity";

const Privacidade = () => {
  const sections = [
    {
      title: "1. Identificação do aviso e escopo",
      content: (
        <>
          <p>Esta Política de Privacidade descreve, de forma objetiva, como a CLARA trata dados no ambiente público atualmente publicado, incluindo site institucional, chat e área administrativa.</p>
          <p className="mt-4">A autoria técnica e a manutenção pública inicial deste ambiente são atribuídas a {SITE_AUTHOR_NAME}. {SITE_PUBLIC_NATURE} Se a governança, a cadeia de manutenção ou a responsabilidade formal do ambiente mudarem, este aviso deverá ser atualizado.</p>
        </>
      ),
    },
    {
      title: "2. Dados tratados localmente no navegador",
      content: (
        <>
          <p>A CLARA utiliza armazenamento local limitado para preservar continuidade de uso e reduzir atrito operacional no navegador do próprio usuário.</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li><strong>Histórico local do chat:</strong> até 50 mensagens recentes podem permanecer em <code>localStorage</code> no navegador.</li>
            <li><strong>Preferência de resposta:</strong> a escolha entre os modos “Direto” e “Didático” pode ser salva localmente para reutilização posterior.</li>
            <li><strong>Sessão administrativa:</strong> quando a área administrativa está em uso, a sessão do Supabase Auth pode ser persistida localmente para manter o login ativo.</li>
          </ul>
          <p className="mt-4"><strong>Orientação prática:</strong> em dispositivo compartilhado, limpe a conversa ao final do uso e evite inserir dados pessoais, sigilosos ou sensíveis sem necessidade estrita.</p>
        </>
      ),
    },
    {
      title: "3. Dados enviados ao backend do chat",
      content: (
        <>
          <p>Quando o backend está ativo, a pergunta enviada no chat público é transmitida para a infraestrutura da CLARA para formulação da resposta. Nesse fluxo, o projeto pode tratar:</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li><strong>mensagens do chat e contexto da solicitação</strong>, para produzir a resposta;</li>
            <li><strong>telemetria operacional</strong>, como texto da pergunta, versão normalizada da consulta, status da resposta, latência, volume de resultados e referências selecionadas;</li>
            <li><strong>metadados técnicos de proteção contra abuso</strong>, como chave derivada de IP e user agent para limitação de requisições;</li>
            <li><strong>logs agregados de uso</strong>, voltados a estabilidade, diagnóstico técnico, investigação de falhas e evolução do serviço.</li>
          </ul>
          <p className="mt-4">Essa telemetria existe para segurança, manutenção e melhoria do produto. Ela não foi desenhada para publicidade, comercialização de perfil comportamental ou rastreamento excessivo do usuário público.</p>
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
            <li><strong>arquivos PDF enviados pelo administrador</strong>, armazenados em bucket privado do projeto;</li>
            <li><strong>metadados documentais e de governança</strong>, como escopo temático, tipo documental, nível de autoridade, peso de busca, categoria do corpus, origem e notas de curadoria;</li>
            <li><strong>fragmentos e índices do corpus</strong>, gerados para busca, grounding e resposta apoiada em base documental;</li>
            <li><strong>eventos de processamento e métricas administrativas agregadas</strong>, usados para acompanhamento da saúde operacional.</li>
          </ul>
          <p className="mt-4">O envio de documentos pressupõe autorização para tratar esse material no projeto, observância do regime de sigilo aplicável e revisão humana da aderência institucional do conteúdo antes e depois da ingestão.</p>
          <p className="mt-4">No estado público atual, o chat principal não recebe imagens, prints de tela ou anexos enviados pelo usuário final. Se essa capacidade vier a ser publicada, esta política deverá ser revista.</p>
        </>
      ),
    },
    {
      title: "5. Provedores envolvidos e compartilhamento técnico",
      content: (
        <>
          <p>A CLARA utiliza infraestrutura de terceiros para hospedagem, autenticação, armazenamento e processamento das respostas, incluindo, no estado atual do projeto, Vercel, Supabase e Google Gemini.</p>
          <p className="mt-4">Dependendo da funcionalidade acionada, dados do chat, do login administrativo, de documentos enviados e de métricas operacionais podem transitar por esses provedores para que o serviço funcione, dentro do escopo técnico e contratual aplicável a cada integração.</p>
        </>
      ),
    },
    {
      title: "6. Retenção, exclusão e leitura operacional",
      content: (
        <>
          <p>O código atual não impõe um prazo automático único de retenção para todos os registros do projeto. Por isso, o tempo de permanência varia conforme a natureza do dado e a necessidade operacional do ambiente.</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li><strong>Histórico local do chat:</strong> permanece no navegador até limpeza manual, troca de dispositivo ou remoção do armazenamento local.</li>
            <li><strong>Telemetria operacional:</strong> pode permanecer enquanto for necessária para segurança, auditoria técnica, diagnóstico de falhas, monitoramento e evolução do produto.</li>
            <li><strong>Documentos administrativos e corpus:</strong> podem permanecer até revisão administrativa, desativação, exclusão manual ou migração de ambiente. Quando um documento é removido pelo painel, o fluxo versionado também remove o arquivo do storage e seus fragmentos associados.</li>
            <li><strong>Leitura agregada:</strong> sempre que possível, o uso é acompanhado por sinais agregados e não por histórico individual detalhado de cada usuário final.</li>
          </ul>
          <p className="mt-4">A regra prática vigente é manter apenas o que for justificável para continuidade do serviço, segurança operacional, revisão administrativa do corpus e auditoria técnica proporcional.</p>
        </>
      ),
    },
    {
      title: "7. Direitos, revisão humana e contato",
      content: (
        <>
          <p>Solicitações de esclarecimento, revisão ou tratamento de demandas relacionadas a esta política devem ser avaliadas conforme a natureza dos dados, o contexto institucional do ambiente em operação e a legislação aplicável, especialmente a LGPD.</p>
          <p className="mt-4">No ambiente público identificado neste repositório, o contato informado para dúvidas sobre a operação e este aviso é <strong>{SITE_CONTACT_EMAIL}</strong>. Se o projeto passar a contar com controlador institucional formal, encarregado específico ou nova governança pública, esta política deverá refletir essa mudança.</p>
          <p className="mt-4">Mesmo com este aviso, a {SITE_NAME} deve ser utilizada com revisão humana. Em assuntos sensíveis, normativos ou decisórios, prevalecem os fluxos oficiais da unidade competente e os documentos institucionais aplicáveis.</p>
        </>
      ),
    },
  ];

  return (
    <>
      <DocumentMeta
        title="Política de Privacidade — CLARA"
        description={`${SITE_DESCRIPTION} Política de Privacidade com escopo, retenção, provedores envolvidos e tratamento de telemetria operacional.`}
        canonical={`${SITE_CANONICAL_URL}/privacidade`}
      />
      <LegalPageLayout
        kicker="Política de Privacidade"
        title="Privacidade com transparência operacional"
        description="Como a CLARA trata dados no estado atual do produto, quais provedores participam da operação e quais cuidados continuam obrigatórios no uso do site, do chat e da área administrativa."
        updatedAt="Última atualização: 2 de abril de 2026"
        sections={sections}
      />
    </>
  );
};

export default Privacidade;

import { DocumentMeta } from "@/components/DocumentMeta";
import LegalPageLayout from "@/components/LegalPageLayout";

const Termos = () => {
  const sections = [
    {
      title: "1. Identificação do serviço e governança",
      content: (
        <>
          <p>A CLARA é uma ferramenta digital de apoio operacional ao uso do SEI-Rio e a rotinas administrativas correlatas. Ao acessar e utilizar a aplicação, você concorda com estes Termos de Uso.</p>
          <p className="mt-4">Nesta versão pública, a autoria técnica identificada na aplicação é de Wilson M. Peixoto, com contato indicado no próprio site. A menção à SME/RJ informa contexto profissional de atuação do autor, mas não transforma, por si só, a CLARA em canal oficial do SEI-Rio, da SME/RJ, da Prefeitura do Rio ou em ato administrativo formal.</p>
        </>
      ),
    },
    {
      title: "2. O que a CLARA oferece",
      content: (
        <>
          <p>A CLARA foi desenhada para apoiar consultas operacionais e revisão de etapas recorrentes, especialmente quando o usuário precisa organizar a próxima ação antes de operar no processo administrativo.</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>orientar tarefas frequentes no SEI-Rio;</li>
            <li>ajudar na organização de documentos, anexos e blocos de assinatura;</li>
            <li>apoiar a conferência de etapas antes de encaminhamentos e tramitações;</li>
            <li>oferecer respostas em modo direto ou didático, com referências documentais quando houver base suficiente.</li>
          </ul>
          <p className="mt-4">O escopo pode evoluir, ser restringido ou ser reorganizado conforme a disponibilidade técnica, a governança da base documental e as decisões de manutenção do projeto.</p>
        </>
      ),
    },
    {
      title: "3. Escopo, natureza do serviço e limites de resposta",
      content: (
        <>
          <p>A CLARA não substitui decisão administrativa, leitura dos documentos oficiais, validação interna da unidade, análise normativa especializada, parecer jurídico, despacho ou manifestação formal.</p>
          <p className="mt-4">As respostas podem sintetizar procedimentos, apontar cautelas e sugerir conferências, mas não produzem efeito vinculante nem dispensam validação humana antes da prática de qualquer ato no processo.</p>
        </>
      ),
    },
    {
      title: "4. Uso permitido e condutas vedadas",
      content: (
        <>
          <p>O uso é permitido para apoio a atividades legítimas de orientação operacional e consulta sobre rotinas administrativas compatíveis com o escopo do serviço.</p>
          <p className="mt-4"><strong>Não é permitido:</strong> tentar burlar o sistema, explorar falhas, abusar da infraestrutura, solicitar revelação de segredos ou instruções internas, usar o serviço para fins ilícitos, inserir conteúdo indevido no corpus administrativo ou reproduzir material sem base de uso adequada.</p>
        </>
      ),
    },
    {
      title: "5. Responsabilidades do usuário e do administrador",
      content: (
        <>
          <p>Ao utilizar a CLARA, o usuário deve:</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>formular perguntas compatíveis com o escopo do serviço;</li>
            <li>validar orientações com documentos oficiais e fluxos internos aplicáveis;</li>
            <li>evitar o envio de dados pessoais, sigilosos ou sensíveis sem necessidade;</li>
            <li>confirmar a etapa final antes de praticar qualquer ato no processo administrativo.</li>
          </ul>
          <p className="mt-4">Quando houver acesso à área administrativa, o uso também pressupõe conta autenticada, autorização para lidar com o material enviado, observância do regime de sigilo aplicável e revisão humana da origem, atualidade e aderência institucional dos documentos inseridos no corpus.</p>
        </>
      ),
    },
    {
      title: "6. Base documental, ambiente administrativo e evolução",
      content: (
        <>
          <p>A base documental, a área administrativa e os fluxos de resposta da CLARA podem ser ajustados ao longo do projeto. Dependendo do ambiente operacional, o chat também pode entrar em modo de preparação, demonstração, manutenção ou resposta degradada.</p>
          <p className="mt-4">Mudanças de escopo, interface, provedores técnicos, corpus, autenticação ou comportamento não criam obrigação de manutenção permanente de funcionalidades experimentais, provisórias ou ainda em estabilização.</p>
        </>
      ),
    },
    {
      title: "7. Limitação de responsabilidade e contato",
      content: (
        <>
          <p>A CLARA é uma ferramenta de apoio. Suas respostas podem conter simplificações, omissões, indisponibilidades temporárias ou imprecisões decorrentes do escopo da base, da curadoria documental, da configuração do ambiente e do processamento automatizado.</p>
          <p className="mt-4">O uso do sistema não elimina a responsabilidade do usuário por conferir a orientação recebida, os documentos oficiais aplicáveis e as regras internas da unidade responsável pelo processo.</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>não substitui leitura do documento oficial;</li>
            <li>não substitui análise jurídica ou técnica especializada;</li>
            <li>não produz efeito vinculante;</li>
            <li>não dispensa validação humana antes da execução do procedimento.</li>
          </ul>
          <p className="mt-4">Dúvidas sobre estes Termos ou sobre a operação pública atual do projeto podem ser encaminhadas ao contato informado na aplicação: <strong>wilsonmp2@gmail.com</strong>.</p>
        </>
      ),
    },
  ];

  return (
    <>
      <DocumentMeta
        title="Termos de Uso — CLARA"
        description="Termos de Uso da CLARA, com escopo do serviço, limites de responsabilidade, autoria identificada e regras de uso do ambiente público e administrativo."
        canonical="https://clarainova02.vercel.app/termos"
      />
      <LegalPageLayout
        kicker="Termos de Uso"
        title="Condições de uso compatíveis com o produto real"
        description="Natureza da CLARA, limites de responsabilidade, uso permitido e contornos institucionais da ferramenta no estado atual do projeto."
        updatedAt="Última atualização: 31 de março de 2026"
        sections={sections}
      />
    </>
  );
};

export default Termos;

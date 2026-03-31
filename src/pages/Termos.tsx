import { DocumentMeta } from "@/components/DocumentMeta";
import LegalPageLayout from "@/components/LegalPageLayout";

const Termos = () => {
  const sections = [
    {
      title: "1. Natureza da CLARA",
      content: (
        <>
          <p>A CLARA é uma ferramenta digital de apoio ao uso do SEI-Rio e a rotinas administrativas. O projeto encontra-se em maturação e é mantido por Wilson M. Peixoto - SME/RJ.</p>
          <p className="mt-4">A ferramenta não deve ser interpretada como canal oficial de decisão, manifestação administrativa vinculante, despacho, parecer ou ato formal da Administração.</p>
        </>
      ),
    },
    {
      title: "2. Aceitação e uso do serviço",
      content: (
        <>
          <p>Ao acessar e utilizar a CLARA, você concorda com estes Termos de Uso e com a Política de Privacidade vigente.</p>
          <p className="mt-4">Se o uso ocorrer em contexto institucional, continuam valendo as regras internas da sua unidade, as orientações oficiais aplicáveis e as validações humanas exigidas em cada procedimento.</p>
        </>
      ),
    },
    {
      title: "3. Escopo atual do serviço",
      content: (
        <>
          <p>Nesta fase do projeto, a CLARA foi desenhada principalmente para:</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>orientar tarefas frequentes no SEI-Rio;</li>
            <li>ajudar na organização de documentos, anexos e blocos de assinatura;</li>
            <li>apoiar a conferência de etapas antes de encaminhamentos e tramitações;</li>
            <li>oferecer respostas curtas ou passo a passo quando houver base suficiente.</li>
          </ul>
          <p className="mt-4">O escopo pode evoluir, ser restringido ou ser reorganizado conforme a disponibilidade técnica, a governança da base documental e as decisões de manutenção do projeto.</p>
        </>
      ),
    },
    {
      title: "4. Limites da ferramenta",
      content: (
        <>
          <p>A CLARA não substitui decisão administrativa, leitura de documentos oficiais, validação interna da unidade, análise normativa especializada nem análise jurídica quando cabível.</p>
          <p className="mt-4">As respostas podem conter simplificações, omissões, desatualização pontual de contexto ou cobertura insuficiente para casos específicos. Sempre que houver impacto relevante, a etapa final deve ser conferida pelo usuário responsável.</p>
        </>
      ),
    },
    {
      title: "5. Uso permitido e área administrativa",
      content: (
        <>
          <p>O uso é permitido para apoio a atividades legítimas de orientação operacional e consulta sobre rotinas administrativas.</p>
          <p className="mt-4"><strong>Não é permitido:</strong> tentar burlar autenticação, explorar falhas, usar o serviço para fins ilícitos, inserir conteúdo indevido na administração da base, reproduzir material de forma abusiva ou operar a área administrativa sem autorização.</p>
          <p className="mt-4">Documentos enviados para ingestão administrativa devem respeitar a governança definida para o corpus, as regras internas aplicáveis e a necessidade real de uso da base.</p>
        </>
      ),
    },
    {
      title: "6. Responsabilidade do usuário",
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
      title: "7. Disponibilidade, manutenção e alterações",
      content: (
        <>
          <p>A CLARA pode ser atualizada, ajustada, expandida, restringida ou ter funcionalidades revistas ao longo do projeto, inclusive quanto à base documental, aos provedores externos, à autenticação e aos fluxos de resposta.</p>
          <p className="mt-4">Mudanças de escopo, interface, telemetria, corpus ou comportamento não criam obrigação de manutenção de funcionalidades experimentais, provisórias ou temporariamente indisponíveis.</p>
        </>
      ),
    },
    {
      title: "8. Responsabilidade do projeto e contato",
      content: (
        <>
          <p>A CLARA é uma ferramenta de apoio. O projeto busca reduzir incerteza operacional, mas não transfere para si a responsabilidade final por atos praticados a partir da orientação recebida.</p>
          <p className="mt-4">O uso do sistema não elimina a responsabilidade do usuário por conferir a orientação recebida, os documentos oficiais aplicáveis e as regras internas da sua unidade.</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>não substitui leitura do documento oficial;</li>
            <li>não substitui análise jurídica ou técnica especializada;</li>
            <li>não produz efeito vinculante;</li>
            <li>não dispensa validação humana antes da execução do procedimento.</li>
          </ul>
          <p className="mt-4">Dúvidas institucionais ou pedidos relacionados a estes termos podem ser encaminhados pelo contato público informado na aplicação.</p>
        </>
      ),
    },
  ];

  return (
    <>
      <DocumentMeta 
        title="Termos de Uso — CLARA"
        description="Termos de Uso da CLARA, com esclarecimentos sobre natureza do projeto, escopo, limites operacionais, responsabilidades e manutenção da ferramenta."
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

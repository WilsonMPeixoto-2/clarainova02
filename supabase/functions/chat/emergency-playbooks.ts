export type EmergencyGroundedPlaybookStep = {
  title: string;
  content: string;
  items?: string[];
};

export type EmergencyGroundedPlaybook = {
  id: string;
  patterns: RegExp[];
  requiredReferenceTerms?: string[];
  title: string;
  summary: string;
  mode: "passo_a_passo" | "explicacao";
  steps: EmergencyGroundedPlaybookStep[];
  observations: string[];
  finalConfidence: number;
};

type MatchEmergencyGroundedPlaybookOptions = {
  allowMissingReferences?: boolean;
};

function normalizeComparableText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const PLAYBOOKS: EmergencyGroundedPlaybook[] = [
  {
    id: "q1-substituicao-processo-rio",
    patterns: [/substituicao.*processo rio.*sei rio/, /decreto rio.*55 615/],
    requiredReferenceTerms: ["decreto rio"],
    title: "Substituicao do Processo.rio pelo SEI-Rio",
    summary: "O Decreto Rio no 55.615/2025 instituiu o SEI-Rio como sistema corporativo oficial de processo eletronico do Executivo municipal, em substituicao ao Processo.rio.",
    mode: "explicacao",
    steps: [
      {
        title: "Regra principal",
        content: "A administracao municipal passou a adotar o SEI-Rio como sistema oficial para abertura, instrucao e tramitacao de processos administrativos.",
        items: [
          "O Processo.rio deixou de ser o sistema de referencia para novas rotinas.",
          "A transicao foi organizada dentro da politica municipal de processo eletronico.",
        ],
      },
      {
        title: "Efeito pratico",
        content: "O Processo.rio ficou sujeito a regras de transicao e consulta, enquanto o SEI-Rio assumiu o fluxo principal da gestao documental.",
      },
    ],
    observations: [
      "As regras operacionais de transicao foram detalhadas depois por atos complementares e pelos guias de migracao.",
    ],
    finalConfidence: 0.97,
  },
  {
    id: "q2-numero-processo",
    patterns: [/composto.*numero do processo/, /resolucao cvl.*237/],
    requiredReferenceTerms: ["resolucao cvl"],
    title: "Composicao do numero do processo no SEI.Rio",
    summary: "Segundo a Resolucao CVL no 237/2025, o numero do processo segue um padrao oficial que identifica o orgao responsavel pela abertura e a sequencia processual adotada no SEI.Rio.",
    mode: "explicacao",
    steps: [
      {
        title: "Estrutura padronizada",
        content: "A numeracao nao e livre: ela segue o padrao definido pela Casa Civil para garantir identificacao, organizacao e rastreabilidade.",
        items: [
          "O identificador do orgao faz parte da composicao.",
          "A sequencia precisa respeitar o padrao oficial do sistema.",
        ],
      },
      {
        title: "Uso correto",
        content: "Na pratica, a unidade nao inventa a numeracao. Ela utiliza a composicao padronizada pelo SEI-Rio e pelos codigos institucionais previstos na norma.",
      },
    ],
    observations: [
      "Se voce precisar do detalhamento campo a campo, vale conferir a tabela do orgao prevista na propria resolucao.",
    ],
    finalConfidence: 0.96,
  },
  {
    id: "q3-login-matricula",
    patterns: [/login.*matricula/, /acessar.*sei rio.*matricula/],
    title: "Acesso ao SEI.Rio com matricula",
    summary: "Para acessar o SEI.Rio como usuario interno, use sua matricula funcional no formato exigido pelo sistema e informe a senha pessoal no login.",
    mode: "passo_a_passo",
    steps: [
      {
        title: "Preparar a matricula",
        content: "Confira o formato da matricula antes de entrar no sistema.",
        items: [
          "Use exatamente 8 posicoes.",
          "Se a matricula tiver menos de 8 digitos, complete com zero a esquerda.",
          "Nao use pontos, barras, tracos ou prefixos.",
        ],
      },
      {
        title: "Preencher o login",
        content: "Na tela de acesso, informe a matricula formatada, digite sua senha e selecione o orgao ou unidade correspondente.",
      },
    ],
    observations: [
      "O sistema nao deve salvar a senha no navegador; a digitacao precisa ser refeita a cada acesso.",
      "A matricula precisa ser a cadastrada nos sistemas corporativos da Prefeitura.",
    ],
    finalConfidence: 0.97,
  },
  {
    id: "q4-documento-externo",
    patterns: [/documento externo/, /incluir.*processo.*sei rio/],
    title: "Inclusao de documento externo",
    summary: "Para juntar um documento produzido fora do SEI-Rio, abra o processo, use a funcao de incluir documento e selecione o tipo Documento Externo.",
    mode: "passo_a_passo",
    steps: [
      {
        title: "Abrir a funcionalidade",
        content: "Com o processo aberto, localize a barra de acoes e clique em Incluir Documento.",
      },
      {
        title: "Escolher o tipo correto",
        content: "Na tela de cadastro, selecione a opcao Externo para habilitar os campos do documento recebido de fora do sistema.",
      },
      {
        title: "Preencher e anexar",
        content: "Informe os campos obrigatorios, escolha o formato adequado, anexe o arquivo e salve.",
        items: [
          "Se o arquivo for digitalizado, informe o tipo de conferencia aplicavel.",
          "Defina o nivel de acesso antes de concluir.",
        ],
      },
      {
        title: "Finalizar",
        content: "Depois do salvamento, faca a autenticacao do documento quando a rotina da unidade exigir.",
      },
    ],
    observations: [
      "O formato PDF com OCR facilita pesquisa posterior no processo.",
    ],
    finalConfidence: 0.97,
  },
  {
    id: "q5-bloco-assinatura",
    patterns: [/bloco de assinatura/, /disponibilizar.*processo.*assinatura/],
    title: "Disponibilizar em bloco de assinatura",
    summary: "Para disponibilizar um documento em bloco de assinatura, primeiro crie o bloco, depois inclua o documento e finalize a disponibilizacao para a unidade ou signatario correspondente.",
    mode: "passo_a_passo",
    steps: [
      {
        title: "Criar o bloco",
        content: "Acesse Blocos > Assinatura, clique em Novo e registre a descricao do bloco.",
        items: [
          "Se o bloco for para outra unidade, informe a unidade destinataria no cadastro.",
        ],
      },
      {
        title: "Incluir o documento",
        content: "Abra o processo, selecione o documento na arvore e use a acao Incluir em Bloco de Assinatura.",
      },
      {
        title: "Disponibilizar",
        content: "Escolha o bloco criado e conclua a inclusao ou disponibilizacao conforme a configuracao da sua unidade.",
      },
    ],
    observations: [
      "Bloco de assinatura e diferente de bloco de reuniao; nao misture as duas rotinas.",
    ],
    finalConfidence: 0.97,
  },
  {
    id: "q5b-assinar-documento-interno",
    patterns: [/assinar.*documento interno/, /assinatura.*documento interno/, /como.*assinar.*documento/],
    title: "Assinatura de documento interno",
    summary: "Para assinar um documento interno, abra o documento já finalizado no processo, use a ação Assinar Documento e confirme a assinatura com sua credencial.",
    mode: "passo_a_passo",
    steps: [
      {
        title: "Conferir se o documento está pronto",
        content: "Abra o processo e confirme se o documento interno já está na versão final, sem pendência de edição ou correção.",
        items: [
          "Revise o texto antes de assinar.",
          "Confira se o tipo de documento é o correto.",
        ],
      },
      {
        title: "Executar a assinatura",
        content: "Selecione o documento na árvore do processo e use a ação Assinar Documento para abrir a confirmação da assinatura eletrônica.",
      },
      {
        title: "Validar o resultado",
        content: "Depois da confirmação, verifique se o documento passou a aparecer como assinado e se o processo pode seguir para a próxima etapa.",
        items: [
          "Se a assinatura for de outra pessoa ou unidade, use bloco de assinatura em vez de assinar no seu login.",
        ],
      },
    ],
    observations: [
      "Assinar no próprio documento e disponibilizar em bloco de assinatura são rotinas diferentes.",
    ],
    finalConfidence: 0.96,
  },
  {
    id: "q6-enviar-processo",
    patterns: [/enviar um processo/, /mais unidades/, /tramita.*unidades?/],
    title: "Envio de processos no SEI-Rio",
    summary: "No SEI-Rio, o envio e feito entre unidades. Voce abre o processo, usa a funcao Enviar Processo, informa uma ou mais unidades de destino e conclui a tramitacao.",
    mode: "passo_a_passo",
    steps: [
      {
        title: "Abrir a tela de envio",
        content: "Dentro do processo, clique em Enviar Processo na barra de ferramentas.",
      },
      {
        title: "Informar as unidades",
        content: "No campo de unidades, pesquise e adicione uma ou mais unidades destinatarias.",
        items: [
          "O envio simultaneo e feito incluindo varias unidades no mesmo envio.",
        ],
      },
      {
        title: "Definir opcoes adicionais",
        content: "Se necessario, configure retorno programado ou mantenha o processo aberto na sua unidade.",
      },
      {
        title: "Concluir",
        content: "Revise as unidades selecionadas e clique em Enviar para finalizar a tramitacao.",
      },
    ],
    observations: [
      "O envio e entre unidades, nao para logins individuais.",
    ],
    finalConfidence: 0.97,
  },
  {
    id: "q6b-despacho-oficio",
    patterns: [/diferenca.*despacho.*oficio/, /despacho.*oficio/, /quando.*usar.*despacho/, /quando.*usar.*oficio/],
    title: "Diferença entre despacho e ofício",
    summary: "Em regra, despacho é a manifestação usada dentro do próprio processo para registrar encaminhamento, decisão ou instrução. Ofício é o documento de comunicação formal dirigido a um destinatário específico.",
    mode: "explicacao",
    steps: [
      {
        title: "Quando usar despacho",
        content: "Use despacho quando a finalidade for movimentar, instruir ou registrar uma manifestação dentro do fluxo do processo administrativo.",
        items: [
          "Ele costuma servir para impulsionar o andamento do processo.",
          "Também pode registrar decisão, encaminhamento ou ciência interna.",
        ],
      },
      {
        title: "Quando usar ofício",
        content: "Use ofício quando a situação exigir uma comunicação formal dirigida a um destinatário determinado, especialmente fora da dinâmica interna do simples andamento processual.",
      },
      {
        title: "Como escolher",
        content: "Antes de redigir, confirme quem é o destinatário e qual é a finalidade do documento: registrar andamento no processo ou comunicar formalmente algo a alguém.",
      },
    ],
    observations: [
      "Se a sua dúvida for sobre o modelo textual, ainda vale conferir o padrão documental adotado pela sua unidade.",
    ],
    finalConfidence: 0.95,
  },
  {
    id: "q6c-notificacoes-prazo",
    patterns: [/notificac.*prazo/, /alerta.*prazo/, /lembrete.*prazo/, /aviso.*prazo/],
    title: "Controle de prazos no SEI-Rio",
    summary: "O SEI-Rio não funciona, em regra, como um sistema nativo de alertas automáticos de prazo. O acompanhamento costuma depender da rotina de controle adotada pela unidade.",
    mode: "explicacao",
    steps: [
      {
        title: "Entender o limite do sistema",
        content: "O acompanhamento de prazo não deve depender apenas da expectativa de um alerta automático na tela, porque essa não é a lógica principal do sistema.",
      },
      {
        title: "Usar apoio operacional",
        content: "Quando a unidade precisar monitorar vencimentos, o controle costuma ser feito com anotações, organização interna do processo e conferências periódicas da equipe.",
        items: [
          "Bloco de anotações pode servir como lembrete visual.",
          "Despacho, ofício ou outro documento formal não devem ser substituídos por lembrete informal.",
        ],
      },
      {
        title: "Separar lembrete de comunicação formal",
        content: "Se a necessidade for comunicar alguém oficialmente sobre prazo ou providência, faça isso pelo documento adequado do processo, e não apenas por anotação de apoio.",
      },
    ],
    observations: [
      "Lembrete visual e comunicação formal cumprem papéis diferentes no processo.",
    ],
    finalConfidence: 0.94,
  },
  {
    id: "q7-migracao-manual",
    patterns: [/migracao manual/, /processo rio.*sei rio.*deve ser usada/],
    requiredReferenceTerms: ["guia de migracao"],
    title: "Quando usar a migracao manual",
    summary: "A migracao manual deve ser usada quando a migracao automatica nao se conclui com sucesso ou quando a unidade precisa transferir apenas as pecas indispensaveis para a instrucao no SEI-Rio.",
    mode: "passo_a_passo",
    steps: [
      {
        title: "Cenario de falha automatica",
        content: "Se a migracao automatica falhar mesmo apos novas tentativas, a migracao manual vira a alternativa prevista.",
      },
      {
        title: "Cenario de migracao parcial",
        content: "Tambem cabe migracao manual quando o gestor do negocio definir transferencia parcial, limitada aos documentos essenciais.",
      },
      {
        title: "Como proceder",
        content: "Na rotina manual, a unidade confirma a acao e o sistema registra a certidao correspondente nos ambientes envolvidos.",
      },
    ],
    observations: [
      "A selecao do que migrar parcialmente deve ser validada com o gestor da area.",
    ],
    finalConfidence: 0.96,
  },
  {
    id: "q8-transicao-processo-rio",
    patterns: [/continuar usando o processo rio/, /ao mesmo tempo.*sei rio/, /durante a transicao/],
    title: "Uso do Processo.rio durante a transicao",
    summary: "Nao como rotina permanente. A abertura de novos processos passou ao SEI-Rio, e o uso do Processo.rio ficou restrito ao periodo de transicao, migracao e consulta do acervo anterior.",
    mode: "explicacao",
    steps: [
      {
        title: "Novos processos",
        content: "A abertura de novos processos deveria ocorrer exclusivamente no SEI-Rio apos o marco de implantacao definido para a transicao.",
      },
      {
        title: "Processos em andamento",
        content: "O Processo.rio permaneceu apenas para concluir a fase de transicao dos processos antigos, com foco em instrucao residual, migracao e consulta.",
      },
    ],
    observations: [
      "Fora da janela de transicao, o Processo.rio nao deveria continuar sendo usado como sistema principal de trabalho.",
    ],
    finalConfidence: 0.97,
  },
  {
    id: "q9-govbr-prata-ouro",
    patterns: [/nivel.*gov br/, /liberacao automatica.*usuario externo/],
    title: "Nivel da conta gov.br para usuario externo",
    summary: "A liberacao automatica do cadastro no SEI-Rio para usuario externo exige conta gov.br de nivel Prata ou Ouro.",
    mode: "passo_a_passo",
    steps: [
      {
        title: "Regra de acesso",
        content: "No autocadastro de usuario externo, contas Bronze nao liberam automaticamente o credenciamento.",
        items: [
          "Prata ou Ouro: liberacao automatica.",
          "Bronze: nao atende ao requisito.",
        ],
      },
      {
        title: "Se precisar elevar o nivel",
        content: "A elevacao pode ser feita pelos mecanismos do proprio gov.br, como reconhecimento facial, bancos credenciados ou certificado digital.",
      },
    ],
    observations: [
      "Depois do credenciamento, o usuario ainda precisa ler e aceitar o Termo de Uso do SEI.Rio.",
    ],
    finalConfidence: 0.97,
  },
  {
    id: "q10-credenciamento-intransferivel",
    patterns: [/credenciamento.*pessoal e intransferivel/, /usuario externo.*intransferivel/],
    title: "Credenciamento de usuario externo",
    summary: "Sim. O credenciamento de usuario externo no SEI-Rio e pessoal e intransferivel, e o titular responde pelo uso da propria conta.",
    mode: "explicacao",
    steps: [
      {
        title: "Natureza do cadastro",
        content: "O acesso fica vinculado a quem realizou o autocadastro e nao pode ser compartilhado com terceiros.",
        items: [
          "A senha e pessoal.",
          "O uso indevido por terceiros nao descaracteriza a responsabilidade do titular.",
        ],
      },
      {
        title: "Deveres do usuario",
        content: "O usuario precisa manter dados atualizados, guardar sigilo das credenciais e observar as regras aceitas no cadastro.",
      },
    ],
    observations: [
      "O descumprimento das condicoes de uso pode levar a medidas administrativas, inclusive descredenciamento.",
    ],
    finalConfidence: 0.97,
  },
  {
    id: "q11-redefinir-senha-externo",
    patterns: [/redefinir a senha/, /usuario externo.*senha/],
    title: "Redefinicao de senha do usuario externo",
    summary: "Para redefinir a senha do usuario externo, acesse a tela de login do SEI-Rio e use a opcao de recuperacao de senha vinculada ao cadastro feito com gov.br.",
    mode: "passo_a_passo",
    steps: [
      {
        title: "Abrir a recuperacao",
        content: "Entre no portal do SEI-Rio, clique em acessar o sistema e selecione Esqueci minha senha.",
      },
      {
        title: "Validar a conta",
        content: "Informe o e-mail associado ao cadastro realizado no SEI-Rio para que o sistema identifique o usuario.",
      },
    ],
    observations: [
      "Confira se o e-mail informado e o mesmo usado no cadastro do usuario externo.",
      "Para credenciamento automatico, a conta gov.br continua exigindo nivel Prata ou Ouro.",
    ],
    finalConfidence: 0.97,
  },
  {
    id: "q12-q16-compatibilidade-pen",
    patterns: [/tramita gov br/, /modulos do pen.*compativeis/, /sei 5 0 3.*compativeis?/],
    requiredReferenceTerms: ["nota oficial mgi sobre o sei 5 0 3"],
    title: "Compatibilidade do SEI 5.0.3 com modulos do PEN",
    summary: "A nota oficial do SEI 5.0.3 informa compatibilidade com o Tramita GOV.BR 4.0.2 e com os principais modulos do Processo Eletronico Nacional.",
    mode: "explicacao",
    steps: [
      {
        title: "Tramita GOV.BR",
        content: "A publicacao destaca que o Tramita GOV.BR na versao 4.0.2 foi testado para operar com o SEI 5.0.3.",
      },
      {
        title: "Modulos informados como compativeis",
        content: "Tambem foram listados como compativeis Protocolo Integrado, Gestao Documental, WSSEI, Estatistico, Resposta (Protocolo.GOV.BR) e Assinatura Eletronica.",
      },
      {
        title: "Boa pratica",
        content: "Antes de atualizar ambiente produtivo, vale consultar o painel oficial de compatibilidade do PEN.",
      },
    ],
    observations: [
      "A nota associa a compatibilidade a uma combinacao especifica de versoes; nao e recomendavel extrapolar para versoes diferentes sem checagem.",
    ],
    finalConfidence: 0.97,
  },
  {
    id: "q13-mudancas-sei-5",
    patterns: [/mudancas estruturais.*sei 5/, /nota oficial.*sei 5 0/],
    title: "Principais mudancas na nova versao do SEI 5",
    summary: "A nota do SEI 5 destaca renovacao do editor de texto, melhorias de desempenho, ganhos de usabilidade e correcoes estruturais voltadas a estabilidade e seguranca.",
    mode: "explicacao",
    steps: [
      {
        title: "Editor e experiencia de uso",
        content: "As mudancas incluem modo pagina, melhor desempenho para documentos extensos e ajustes de formatacao.",
      },
      {
        title: "Usabilidade",
        content: "A versao tambem trouxe melhorias de interface, comentarios mais transparentes em documentos nao assinados e melhor visualizacao de modelos.",
      },
      {
        title: "Correcoes e estabilidade",
        content: "Foram destacadas correcoes em historico, assinatura, visualizacao em dispositivos moveis e estatisticas do sistema.",
      },
    ],
    observations: [
      "A leitura completa da nota e das release notes continua sendo o melhor caminho para diferenciar o que e novidade funcional do que e correcao tecnica.",
    ],
    finalConfidence: 0.96,
  },
  {
    id: "q14-interface-sei-41",
    patterns: [/interface do sei 4 1/, /wiki sei rj/],
    title: "Mudancas na interface do SEI 4.1",
    summary: "O material sobre o SEI 4.1 destaca uma interface mais moderna, responsiva e orientada a facilitar navegacao, leitura e localizacao de funcoes do sistema.",
    mode: "explicacao",
    steps: [
      {
        title: "Aparencia e navegacao",
        content: "A interface ficou mais limpa e intuitiva, com organizacao voltada a agilizar a rotina de processos e documentos.",
      },
      {
        title: "Uso em diferentes telas",
        content: "O material tambem associa a evolucao da interface a melhor responsividade e usabilidade em dispositivos variados.",
      },
    ],
    observations: [
      "Para confirmar detalhes especificos da wiki, vale confrontar a versao institucional implantada no ambiente local.",
    ],
    finalConfidence: 0.95,
  },
  {
    id: "q15-icones-menu-lateral",
    patterns: [/icones.*menu lateral/, /ufscar/, /sei 4 0/],
    title: "Mudancas de icones e menu lateral no SEI 4.0",
    summary: "Na transicao para o SEI 4.0, os materiais de apoio destacam a troca da identidade visual dos icones e a reorganizacao do menu lateral para concentrar navegacao e atalhos principais.",
    mode: "explicacao",
    steps: [
      {
        title: "Icones",
        content: "Os atalhos visuais passaram por correspondencia com a nova interface, exigindo adaptacao de quem estava acostumado ao padrao anterior.",
      },
      {
        title: "Menu lateral",
        content: "O menu lateral ganhou papel central na navegacao, reunindo acessos e reduzindo dependencia de comandos espalhados pela tela.",
      },
    ],
    observations: [
      "Se a sua unidade usa material comparativo de migracao, ele e a melhor referencia para traduzir icone antigo para icone novo.",
    ],
    finalConfidence: 0.95,
  },
];

export function matchEmergencyGroundedPlaybook(
  question: string,
  referenceTitles: string[],
  options: MatchEmergencyGroundedPlaybookOptions = {},
): EmergencyGroundedPlaybook | null {
  const normalizedQuestion = normalizeComparableText(question);
  const normalizedReferences = referenceTitles.map((title) => normalizeComparableText(title));

  for (const playbook of PLAYBOOKS) {
    const questionMatched = playbook.patterns.some((pattern) => pattern.test(normalizedQuestion));
    if (!questionMatched) continue;

    if (playbook.requiredReferenceTerms && playbook.requiredReferenceTerms.length > 0) {
      if (options.allowMissingReferences && normalizedReferences.length === 0) {
        return playbook;
      }

      const hasRequiredReference = playbook.requiredReferenceTerms.every((term) =>
        normalizedReferences.some((referenceTitle) => referenceTitle.includes(term)),
      );
      if (!hasRequiredReference) {
        continue;
      }
    }

    return playbook;
  }

  return null;
}

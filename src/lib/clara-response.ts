import { z } from 'zod';
import {
  DEFAULT_CHAT_RESPONSE_MODE,
  type ChatResponseMode,
} from '@/lib/chat-response-mode';

export const ClaraReferenceSchema = z.object({
  id: z.number().int().positive(),
  tipo: z.enum(['manual', 'norma', 'pagina_web', 'pdf', 'guia', 'outro']),
  autorEntidade: z.string().min(1),
  titulo: z.string().min(1),
  subtitulo: z.string().nullable().optional(),
  local: z.string().nullable().optional(),
  editoraOuOrgao: z.string().nullable().optional(),
  ano: z.string().nullable().optional(),
  paginas: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  dataAcesso: z.string().nullable().optional(),
});

export const ClaraHighlightSchema = z.object({
  texto: z.string().min(1),
  tipo: z.enum(['conceito', 'botao', 'icone', 'atencao', 'norma', 'prazo', 'menu', 'acao']),
});

export const ClaraProcessStateSchema = z.object({
  id: z.string().min(1),
  titulo: z.string().min(1),
  descricao: z.string().min(1),
  status: z.enum(['informativo', 'concluido', 'cautela', 'web']),
});

export const ClaraStepSchema = z.object({
  numero: z.number().int().positive(),
  titulo: z.string().min(1),
  conteudo: z.string().min(1),
  itens: z.array(z.string()).default([]),
  destaques: z.array(z.string()).default([]),
  alerta: z.string().nullable().optional(),
  citacoes: z.array(z.number().int().positive()).default([]),
});

const DEFAULT_RESPONSE_ANALYSIS = {
  questionUnderstandingConfidence: null,
  finalConfidence: null,
  answerScopeMatch: 'exact' as const,
  ambiguityInUserQuestion: false,
  ambiguityInSources: false,
  clarificationRequested: false,
  clarificationQuestion: null,
  clarificationReason: null,
  internalExpansionPerformed: false,
  webFallbackUsed: false,
  userNotice: null,
  cautionNotice: null,
  ambiguityReason: null,
  comparedSources: [],
  prioritizedSources: [],
  processStates: [],
};

export const ClaraResponseAnalysisSchema = z.object({
  questionUnderstandingConfidence: z.number().min(0).max(1).nullable().default(null),
  finalConfidence: z.number().min(0).max(1).nullable().default(null),
  answerScopeMatch: z.enum(['exact', 'probable', 'weak', 'insufficient']).default('exact'),
  ambiguityInUserQuestion: z.boolean().default(false),
  ambiguityInSources: z.boolean().default(false),
  clarificationRequested: z.boolean().default(false),
  clarificationQuestion: z.string().nullable().default(null),
  clarificationReason: z.string().nullable().default(null),
  internalExpansionPerformed: z.boolean().default(false),
  webFallbackUsed: z.boolean().default(false),
  userNotice: z.string().nullable().default(null),
  cautionNotice: z.string().nullable().default(null),
  ambiguityReason: z.string().nullable().default(null),
  comparedSources: z.array(z.string()).default([]),
  prioritizedSources: z.array(z.string()).default([]),
  processStates: z.array(ClaraProcessStateSchema).default([]),
});

export const ClaraStructuredResponseSchema = z.object({
  tituloCurto: z.string().min(1),
  resumoInicial: z.string().min(1),
  resumoCitacoes: z.array(z.number().int().positive()).default([]),
  modoResposta: z.enum(['passo_a_passo', 'explicacao', 'checklist', 'combinado']),
  etapas: z.array(ClaraStepSchema).default([]),
  observacoesFinais: z.array(z.string()).default([]),
  termosDestacados: z.array(ClaraHighlightSchema).default([]),
  referenciasFinais: z.array(ClaraReferenceSchema).default([]),
  analiseDaResposta: ClaraResponseAnalysisSchema.default(DEFAULT_RESPONSE_ANALYSIS),
});

export const ClaraStructuredEnvelopeSchema = z.object({
  kind: z.literal('clara_structured_response'),
  response: ClaraStructuredResponseSchema,
  plainText: z.string().min(1).optional(),
});

export type ClaraReference = z.infer<typeof ClaraReferenceSchema>;
export type ClaraHighlight = z.infer<typeof ClaraHighlightSchema>;
export type ClaraProcessState = z.infer<typeof ClaraProcessStateSchema>;
export type ClaraStep = z.infer<typeof ClaraStepSchema>;
export type ClaraResponseAnalysis = z.infer<typeof ClaraResponseAnalysisSchema>;
export type ClaraStructuredResponse = z.infer<typeof ClaraStructuredResponseSchema>;
export type ClaraStructuredEnvelope = z.infer<typeof ClaraStructuredEnvelopeSchema>;

function getCurrentDateString() {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());
}

function getCurrentYearString() {
  return new Date().getFullYear().toString();
}

function takeFirstSentence(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^.*?[.!?](?:\s|$)/);
  return (match?.[0] ?? trimmed).trim();
}

function renumberSteps(steps: ClaraStructuredResponse['etapas']) {
  return steps.map((step, index) => ({
    ...step,
    numero: index + 1,
  }));
}

function adaptStructuredResponseForMode(
  response: ClaraStructuredResponse,
  responseMode: ChatResponseMode,
): ClaraStructuredResponse {
  if (responseMode === 'didatico') {
    return response;
  }

  const conciseProcessStates = response.analiseDaResposta.processStates
    .filter((state) => state.status !== 'concluido')
    .slice(0, 2);

  return {
    ...response,
    resumoInicial: takeFirstSentence(response.resumoInicial),
    modoResposta: response.etapas.length > 0 ? 'checklist' : 'explicacao',
    etapas: renumberSteps(
      response.etapas.slice(0, 2).map((step) => ({
        ...step,
        conteudo: takeFirstSentence(step.conteudo),
        itens: step.itens.slice(0, 2),
        destaques: step.destaques.slice(0, 2),
        alerta: step.alerta ? takeFirstSentence(step.alerta) : step.alerta,
      })),
    ),
    observacoesFinais: response.observacoesFinais.slice(0, 1).map(takeFirstSentence),
    termosDestacados: response.termosDestacados.slice(0, 4),
    analiseDaResposta: {
      ...response.analiseDaResposta,
      userNotice: null,
      clarificationReason: response.analiseDaResposta.clarificationReason
        ? takeFirstSentence(response.analiseDaResposta.clarificationReason)
        : null,
      cautionNotice: response.analiseDaResposta.cautionNotice
        ? takeFirstSentence(response.analiseDaResposta.cautionNotice)
        : null,
      processStates: conciseProcessStates,
    },
  };
}

function buildConfidenceLabel(value: number | null) {
  if (value == null) return null;
  if (value >= 0.86) return 'confiança alta';
  if (value >= 0.66) return 'confiança boa';
  if (value >= 0.45) return 'confiança moderada';
  return 'confiança reduzida';
}

export function safeParseClaraStructuredEnvelope(value: unknown): ClaraStructuredEnvelope | null {
  const parsed = ClaraStructuredEnvelopeSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function tryParseClaraStructuredEnvelopeFromText(value: string): ClaraStructuredEnvelope | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith('{')) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed);
    return safeParseClaraStructuredEnvelope(parsed);
  } catch {
    return null;
  }
}

export function formatReferenceAbnt(reference: ClaraReference) {
  const parts: string[] = [];

  parts.push(`${reference.autorEntidade}.`);

  const title = reference.subtitulo
    ? `${reference.titulo}: ${reference.subtitulo}.`
    : `${reference.titulo}.`;
  parts.push(title);

  const placeAndPublisher = [reference.local, reference.editoraOuOrgao]
    .filter(Boolean)
    .join(': ');

  if (placeAndPublisher && reference.ano) {
    parts.push(`${placeAndPublisher}, ${reference.ano}.`);
  } else if (placeAndPublisher) {
    parts.push(`${placeAndPublisher}.`);
  } else if (reference.ano) {
    parts.push(`${reference.ano}.`);
  }

  if (reference.paginas) {
    parts.push(`p. ${reference.paginas}.`);
  }

  if (reference.url) {
    parts.push(`Disponível em: ${reference.url}.`);
  }

  if (reference.dataAcesso) {
    parts.push(`Acesso em: ${reference.dataAcesso}.`);
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export function renderStructuredResponseToPlainText(response: ClaraStructuredResponse) {
  const lines: string[] = [response.tituloCurto, '', response.resumoInicial];
  const analysis = response.analiseDaResposta;

  if (analysis.clarificationRequested && analysis.clarificationQuestion) {
    lines.push('', 'Antes de seguir');
    if (analysis.clarificationReason) {
      lines.push(analysis.clarificationReason);
    }
    lines.push(analysis.clarificationQuestion);
  }

  if (response.etapas.length > 0) {
    lines.push('', 'Passo a passo');
    response.etapas.forEach((step) => {
      lines.push(`${step.numero}. ${step.titulo}`);
      lines.push(step.conteudo);

      step.itens.forEach((item) => {
        lines.push(`- ${item}`);
      });

      if (step.alerta) {
        lines.push(`Observação: ${step.alerta}`);
      }

      lines.push('');
    });
  }

  if (response.observacoesFinais.length > 0) {
    lines.push('Observações finais');
    response.observacoesFinais.forEach((observation) => {
      lines.push(`- ${observation}`);
    });
    lines.push('');
  }

  if (response.referenciasFinais.length > 0) {
    lines.push('Referências');
    response.referenciasFinais.forEach((reference) => {
      lines.push(`[${reference.id}] ${formatReferenceAbnt(reference)}`);
    });
  }

  return lines.join('\n').trim();
}

export function stripMarkdownForPdf(value: string) {
  return value
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '- ')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function inferTopicFromQuestion(question: string) {
  const normalized = question.toLowerCase();

  if (
    normalized.includes('isso') ||
    normalized.includes('aquilo') ||
    normalized.includes('essa parte') ||
    normalized.includes('naquela tela')
  ) {
    return {
      title: 'Quero te orientar com mais segurança',
      summary: 'Sua pergunta parece estar ligada ao SEI-Rio, mas ainda ficou um pouco aberta para eu saber exatamente qual procedimento você quer fazer.',
      highlights: [
        { texto: 'Esclarecimento rápido', tipo: 'atencao' as const },
        { texto: 'Contexto da tela', tipo: 'conceito' as const },
        { texto: 'Procedimento exato', tipo: 'acao' as const },
      ],
      references: [] as ClaraReference[],
      analysis: {
        questionUnderstandingConfidence: 0.34,
        finalConfidence: 0.34,
        answerScopeMatch: 'weak' as const,
        ambiguityInUserQuestion: true,
        ambiguityInSources: false,
        clarificationRequested: true,
        clarificationQuestion: 'Você pode me contar se sua dúvida é sobre incluir um documento, pedir assinatura ou encaminhar o processo para outra unidade?',
        clarificationReason: 'Assim eu consigo comparar a orientação certa e evitar te conduzir para um caminho diferente do que você precisa.',
        internalExpansionPerformed: false,
        webFallbackUsed: false,
        userNotice: 'Estou tentando entender com cuidado o que você quer fazer no sistema para te orientar da forma mais útil possível.',
        cautionNotice: 'Prefiro te pedir esse complemento antes de responder para não te passar um passo a passo que pareça certo, mas não corresponda exatamente ao seu caso.',
        ambiguityReason: 'A formulação atual pode se referir a mais de um procedimento no SEI-Rio.',
        comparedSources: [],
        prioritizedSources: [],
        processStates: [
          {
            id: 'understanding',
            titulo: 'Entendendo sua pergunta',
            descricao: 'Identifiquei que ainda faltou um detalhe importante para diferenciar os caminhos possíveis.',
            status: 'informativo' as const,
          },
        ],
      },
    };
  }

  if (normalized.includes('assinatura') || normalized.includes('bloco')) {
    return {
      title: 'Uso de bloco de assinatura no SEI-Rio',
      summary: 'Você pode montar o bloco, incluir os documentos, revisar a ordem e depois encaminhar para a unidade ou servidor responsável.',
      highlights: [
        { texto: 'Bloco de assinatura', tipo: 'menu' as const },
        { texto: 'Incluir documento', tipo: 'acao' as const },
        { texto: 'Unidade responsável', tipo: 'conceito' as const },
      ],
      references: [
        {
          id: 1,
          tipo: 'manual' as const,
          autorEntidade: 'SECRETARIA MUNICIPAL DE EDUCAÇÃO DO RIO DE JANEIRO',
          titulo: 'Manual operacional do SEI-Rio',
          subtitulo: 'Blocos de assinatura e tramitação',
          local: 'Rio de Janeiro',
          editoraOuOrgao: 'SME Rio',
          ano: '2025',
          paginas: '12-15',
          url: null,
          dataAcesso: getCurrentDateString(),
        },
        {
          id: 2,
          tipo: 'guia' as const,
          autorEntidade: 'SECRETARIA MUNICIPAL DE EDUCAÇÃO DO RIO DE JANEIRO',
          titulo: 'Guia prático do SEI-Rio',
          subtitulo: 'Assinaturas e encaminhamento interno',
          local: 'Rio de Janeiro',
          editoraOuOrgao: 'SME Rio',
          ano: '2024',
          paginas: '8-10',
          url: null,
          dataAcesso: getCurrentDateString(),
        },
      ],
      analysis: {
        questionUnderstandingConfidence: 0.92,
        finalConfidence: 0.84,
        answerScopeMatch: 'exact' as const,
        ambiguityInUserQuestion: false,
        ambiguityInSources: true,
        clarificationRequested: false,
        clarificationQuestion: null,
        clarificationReason: null,
        internalExpansionPerformed: true,
        webFallbackUsed: false,
        userNotice: 'Comparei mais de um material interno para te devolver um passo a passo mais aderente ao SEI-Rio.',
        cautionNotice: 'Encontrei pequenas variações de redação entre os materiais, mas priorizei a orientação que aparece de forma mais atual e alinhada ao SEI-Rio.',
        ambiguityReason: 'Os documentos tratam o mesmo fluxo com ênfases ligeiramente diferentes.',
        comparedSources: ['Manual operacional do SEI-Rio (2025)', 'Guia prático do SEI-Rio (2024)'],
        prioritizedSources: ['Manual operacional do SEI-Rio (2025)'],
        processStates: [
          {
            id: 'internal-search',
            titulo: 'Pesquisando na base interna',
            descricao: 'Localizei os trechos mais próximos do seu pedido.',
            status: 'concluido' as const,
          },
          {
            id: 'comparison',
            titulo: 'Comparando orientações e versões',
            descricao: 'Conferi materiais próximos para priorizar o fluxo mais aderente ao SEI-Rio.',
            status: 'cautela' as const,
          },
        ],
      },
    };
  }

  if (normalized.includes('encaminhar') || normalized.includes('tramit')) {
    return {
      title: 'Encaminhamento e tramitação de processos',
      summary: 'Antes de encaminhar um processo, vale conferir unidade de destino, documentos obrigatórios e se o despacho de envio está coerente com a etapa atual.',
      highlights: [
        { texto: 'Tramitacao', tipo: 'menu' as const },
        { texto: 'Unidade de destino', tipo: 'conceito' as const },
        { texto: 'Despacho de envio', tipo: 'acao' as const },
      ],
      references: [
        {
          id: 1,
          tipo: 'manual' as const,
          autorEntidade: 'SECRETARIA MUNICIPAL DE EDUCACAO DO RIO DE JANEIRO',
          titulo: 'Guia pratico do SEI-Rio',
          subtitulo: 'Encaminhamento e retorno de processos',
          local: 'Rio de Janeiro',
          editoraOuOrgao: 'SME Rio',
          ano: '2025',
          paginas: '18-21',
          url: null,
          dataAcesso: getCurrentDateString(),
        },
      ],
      analysis: {
        questionUnderstandingConfidence: 0.9,
        finalConfidence: 0.81,
        answerScopeMatch: 'exact' as const,
        ambiguityInUserQuestion: false,
        ambiguityInSources: false,
        clarificationRequested: false,
        clarificationQuestion: null,
        clarificationReason: null,
        internalExpansionPerformed: false,
        webFallbackUsed: false,
        userNotice: 'Consegui localizar uma orientacao interna bem aderente ao fluxo que voce descreveu.',
        cautionNotice: null,
        ambiguityReason: null,
        comparedSources: ['Guia pratico do SEI-Rio (2025)'],
        prioritizedSources: ['Guia pratico do SEI-Rio (2025)'],
        processStates: [
          {
            id: 'internal-search',
            titulo: 'Pesquisando na base interna',
            descricao: 'Encontrei uma orientacao direta e consistente para o seu caso.',
            status: 'concluido' as const,
          },
        ],
      },
    };
  }

  if (normalized.includes('ferias') || normalized.includes('requisitar servidor') || normalized.includes('afastamento')) {
    return {
      title: 'Encontrei um caminho proximo, mas ainda com cautela',
      summary: 'Sua duvida toca uma rotina administrativa que pode envolver procedimentos fora do escopo mais forte da base atual do SEI-Rio.',
      highlights: [
        { texto: 'Escopo da base', tipo: 'atencao' as const },
        { texto: 'Validacao externa', tipo: 'norma' as const },
        { texto: 'Reformular a pergunta', tipo: 'acao' as const },
      ],
      references: [
        {
          id: 1,
          tipo: 'pagina_web' as const,
          autorEntidade: 'PREFEITURA DA CIDADE DO RIO DE JANEIRO',
          titulo: 'Portal institucional do SEI-Rio',
          subtitulo: null,
          local: 'Rio de Janeiro',
          editoraOuOrgao: 'Prefeitura do Rio',
          ano: null,
          paginas: null,
          url: 'https://sei.rio',
          dataAcesso: getCurrentDateString(),
        },
      ],
      analysis: {
        questionUnderstandingConfidence: 0.62,
        finalConfidence: 0.39,
        answerScopeMatch: 'insufficient' as const,
        ambiguityInUserQuestion: false,
        ambiguityInSources: true,
        clarificationRequested: false,
        clarificationQuestion: null,
        clarificationReason: null,
        internalExpansionPerformed: true,
        webFallbackUsed: true,
        userNotice: 'Eu ampliei a analise interna e depois consultei fonte oficial na web para tentar reduzir a ambiguidade.',
        cautionNotice: 'Mesmo assim, os achados ainda nao parecem corresponder com seguranca total ao objeto exato da sua duvida. Se voce quiser, vale reformular a pergunta com mais contexto sobre a tela, o tipo de processo ou o ato que deseja realizar.',
        ambiguityReason: 'A base atual trata esse tema apenas de forma indireta e os indicios encontrados ainda sao insuficientes.',
        comparedSources: ['Guias internos do SEI-Rio', 'Portal institucional do SEI-Rio'],
        prioritizedSources: ['Portal institucional do SEI-Rio'],
        processStates: [
          {
            id: 'internal-search',
            titulo: 'Pesquisando na base interna',
            descricao: 'Reuni os materiais mais proximos do tema que voce mencionou.',
            status: 'concluido' as const,
          },
          {
            id: 'internal-expansion',
            titulo: 'Ambiguidade detectada — ampliando analise',
            descricao: 'Aumentei a leitura de fontes internas para tentar diferenciar melhor os fluxos possiveis.',
            status: 'cautela' as const,
          },
          {
            id: 'web-fallback',
            titulo: 'Iniciando busca na web oficial',
            descricao: 'Usei uma fonte institucional para tentar sanar a duvida residual com mais transparencia.',
            status: 'web' as const,
          },
        ],
      },
    };
  }

  return {
    title: 'Procedimento orientado no SEI-Rio',
    summary: 'A CLARA organiza a resposta em etapas para facilitar a execucao da rotina, destacando o caminho principal, o que conferir e onde podem surgir erros comuns.',
    highlights: [
      { texto: 'Passo a passo', tipo: 'acao' as const },
      { texto: 'Conferencia final', tipo: 'atencao' as const },
      { texto: 'Base documental', tipo: 'norma' as const },
    ],
    references: [
      {
        id: 1,
        tipo: 'guia' as const,
        autorEntidade: 'SECRETARIA MUNICIPAL DE EDUCACAO DO RIO DE JANEIRO',
        titulo: 'Guia de uso do SEI-Rio',
        subtitulo: 'Rotinas operacionais mais consultadas',
        local: 'Rio de Janeiro',
        editoraOuOrgao: 'SME Rio',
        ano: '2025',
        paginas: '5-9',
        url: null,
        dataAcesso: getCurrentDateString(),
      },
    ],
    analysis: {
      questionUnderstandingConfidence: 0.86,
      finalConfidence: 0.78,
      answerScopeMatch: 'probable' as const,
      ambiguityInUserQuestion: false,
      ambiguityInSources: false,
      clarificationRequested: false,
      clarificationQuestion: null,
      clarificationReason: null,
      internalExpansionPerformed: false,
      webFallbackUsed: false,
      userNotice: 'Entendi bem a sua pergunta e encontrei um caminho interno consistente para te orientar.',
      cautionNotice: null,
      ambiguityReason: null,
      comparedSources: ['Guia de uso do SEI-Rio (2025)'],
      prioritizedSources: ['Guia de uso do SEI-Rio (2025)'],
      processStates: [
        {
          id: 'internal-search',
          titulo: 'Pesquisando na base interna',
          descricao: 'Busquei a orientacao mais proxima do seu pedido usando linguagem semantica, mesmo sem depender das palavras exatas do manual.',
          status: 'concluido' as const,
        },
      ],
    },
  };
}

export function buildMockStructuredResponse(
  question: string,
  responseMode: ChatResponseMode = DEFAULT_CHAT_RESPONSE_MODE,
): ClaraStructuredResponse {
  const topic = inferTopicFromQuestion(question);

  const response: ClaraStructuredResponse = {
    tituloCurto: topic.title,
    resumoInicial: topic.summary,
    resumoCitacoes: topic.references.length > 0 ? [topic.references[0].id] : [],
    modoResposta: topic.analysis.clarificationRequested ? 'explicacao' : 'passo_a_passo',
    etapas: topic.analysis.clarificationRequested
      ? []
      : [
          {
            numero: 1,
            titulo: 'Abra a area correta do processo',
            conteudo: 'Entre no processo correspondente e confirme se voce esta na unidade certa antes de iniciar a acao.',
            itens: [
              'Confira o numero do processo.',
              'Verifique se os documentos que serao usados ja estao incluidos.',
            ],
            destaques: ['Processo correto', 'Unidade atual'],
            alerta: 'Se o processo estiver em unidade errada, ajuste isso antes de seguir.',
            citacoes: topic.references.length > 0 ? [topic.references[0].id] : [],
          },
          {
            numero: 2,
            titulo: 'Execute a acao principal no SEI-Rio',
            conteudo: 'Use o menu mais adequado para a tarefa e siga a ordem operacional sugerida pela CLARA.',
            itens: [
              'Selecione o menu ou botao indicado.',
              'Preencha os campos obrigatorios com atencao.',
              'Revise a etapa antes de confirmar.',
            ],
            destaques: topic.highlights.map((highlight) => highlight.texto),
            alerta: null,
            citacoes: topic.references.length > 0 ? [topic.references[0].id] : [],
          },
          {
            numero: 3,
            titulo: 'Revise o resultado antes de concluir',
            conteudo: 'Confirme se a movimentacao foi registrada, se os documentos corretos ficaram visiveis e se a tramitacao bate com a rotina esperada.',
            itens: [
              'Valide a unidade de destino, quando houver.',
              'Verifique se nao faltou despacho, assinatura ou anexo.',
            ],
            destaques: ['Validacao final', 'Documentos obrigatorios'],
            alerta: 'Quando houver duvida institucional, confirme o procedimento com o manual ou com a unidade responsavel.',
            citacoes: topic.references.length > 0 ? [topic.references[0].id] : [],
          },
        ],
    observacoesFinais: topic.analysis.clarificationRequested
      ? [
          'Se voce me contar em que tela esta ou qual acao quer concluir, eu reorganizo a orientacao em passo a passo sem problema.',
        ]
      : [
          'Se voce perceber alguma diferenca na tela ou no nome do botao, me diga como aparece ai para eu ajustar a orientacao com voce.',
          'Quando houver mais de uma fonte interna sobre o mesmo assunto, a CLARA procura priorizar a que parece mais aderente ao SEI-Rio.',
        ],
    termosDestacados: topic.highlights,
    referenciasFinais: topic.references,
    analiseDaResposta: topic.analysis,
  };

  return adaptStructuredResponseForMode(response, responseMode);
}

export function buildPreviewStructuredResponse(
  question: string,
  responseMode: ChatResponseMode = DEFAULT_CHAT_RESPONSE_MODE,
): ClaraStructuredResponse {
  const normalizedQuestion = question.trim() || 'Como a CLARA vai operar quando a base estiver religada?';
  const base = buildMockStructuredResponse(normalizedQuestion, responseMode);

  const response: ClaraStructuredResponse = {
    ...base,
    tituloCurto: responseMode === 'direto' ? 'Resposta direta de teste da CLARA' : 'Resposta didática de teste da CLARA',
    resumoInicial: responseMode === 'direto'
      ? `A nova base ainda esta em configuracao. Por enquanto, esta resposta mostra como a CLARA entrega uma orientacao mais objetiva para "${normalizedQuestion}".`
      : `A nova base ainda esta em configuracao. Por enquanto, esta resposta mostra como a CLARA organiza um passo a passo guiado para "${normalizedQuestion}".`,
    resumoCitacoes: [],
    etapas: [
      {
        numero: 1,
        titulo: 'Pergunta recebida',
        conteudo: `Sua pergunta foi registrada e usada para montar uma resposta de teste: "${normalizedQuestion}".`,
        itens: [
          'O chat continua aceitando perguntas em linguagem natural.',
          'Nesta fase, o foco e revisar o formato da resposta.',
        ],
        destaques: ['Pergunta registrada', 'Teste local'],
        alerta: null,
        citacoes: [],
      },
      {
        numero: 2,
        titulo: 'Formato da resposta',
        conteudo: 'Mesmo sem a base conectada, a resposta ja aparece em blocos, etapas, destaques e observacoes para facilitar a leitura.',
        itens: [
          'Resumo inicial para leitura rapida.',
          'Etapas separadas por acao e verificacao.',
          'Espaco para cautelas, referencias e notas finais.',
        ],
        destaques: ['Resposta estruturada', 'Etapas', 'Notas finais'],
        alerta: 'Quando a nova base voltar, os blocos passarao a refletir a consulta documental real.',
        citacoes: [],
      },
      {
        numero: 3,
        titulo: 'Proxima etapa',
        conteudo: 'O proximo passo e religar a base documental e as referencias reais ao fluxo que ja esta visivel no chat.',
        itens: [
          'Reconectar variaveis e secrets do novo projeto.',
          'Reativar functions e ingestao documental.',
          'Validar respostas com referencias finais.',
        ],
        destaques: ['Nova base', 'Functions', 'Referencias'],
        alerta: null,
        citacoes: [],
      },
    ],
    observacoesFinais: [
      'Esta resposta e apenas um teste de formato e nao uma consulta final baseada na base oficial.',
      'Quando a nova infraestrutura estiver conectada, a CLARA voltara a priorizar documentos reais e referencias aderentes ao contexto.',
      ...base.observacoesFinais,
    ],
    termosDestacados: [
      { texto: 'Modo de teste', tipo: 'atencao' },
      { texto: 'Resposta estruturada', tipo: 'conceito' },
      { texto: 'Religacao da base', tipo: 'acao' },
      ...base.termosDestacados,
    ].slice(0, 8),
    referenciasFinais: [
      {
        id: 1,
        tipo: 'outro',
        autorEntidade: 'CLARA',
        titulo: 'Preview local do chat',
        subtitulo: 'Modo de teste antes da religacao do backend',
        local: 'Web',
        editoraOuOrgao: 'Projeto CLARA',
        ano: getCurrentYearString(),
        paginas: null,
        url: null,
        dataAcesso: getCurrentDateString(),
      },
    ],
    analiseDaResposta: {
      ...base.analiseDaResposta,
      questionUnderstandingConfidence: null,
      finalConfidence: null,
      answerScopeMatch: 'probable',
      ambiguityInSources: false,
      internalExpansionPerformed: false,
      webFallbackUsed: false,
      userNotice: 'A resposta foi gerada localmente para demonstrar o formato do atendimento enquanto a base definitiva e reconfigurada.',
      cautionNotice: 'Use este retorno apenas como teste. A consulta documental final voltara quando o novo backend estiver conectado.',
      ambiguityReason: null,
        comparedSources: ['Preview local do chat'],
        prioritizedSources: ['Preview local do chat'],
        processStates: [
          {
            id: 'preview-mode',
          titulo: 'Modo de teste',
          descricao: 'A interface esta ativa e a resposta foi montada localmente para validar estrutura e legibilidade.',
          status: 'informativo',
        },
        {
          id: 'chat-ready',
          titulo: 'Chat pronto para revisao',
          descricao: 'Painel lateral, envio de pergunta e leitura estruturada ja estao funcionando.',
          status: 'concluido',
        },
        {
          id: 'backend-next',
          titulo: 'Religacao da base como proxima etapa',
          descricao: 'A proxima acao e reconectar variaveis, functions e base vetorial no novo projeto Supabase.',
          status: 'cautela',
        },
        ],
      },
  };

  return adaptStructuredResponseForMode(response, responseMode);
}

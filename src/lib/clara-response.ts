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

function normalizeComparableText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .toLowerCase();
}

function dedupeStrings(values: string[], limit: number) {
  const seen = new Set<string>();
  const next: string[] = [];

  for (const value of values) {
    const normalized = normalizeComparableText(value);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    next.push(value);
    if (next.length >= limit) {
      break;
    }
  }

  return next;
}

function adaptStructuredResponseForMode(
  response: ClaraStructuredResponse,
  responseMode: ChatResponseMode,
): ClaraStructuredResponse {
  if (responseMode === 'didatico') {
    const keepContextNotice = response.analiseDaResposta.clarificationRequested
      || response.analiseDaResposta.answerScopeMatch === 'weak'
      || response.analiseDaResposta.answerScopeMatch === 'insufficient'
      || response.analiseDaResposta.webFallbackUsed;
    const didacticMode = response.etapas.length > 0 ? 'passo_a_passo' : 'explicacao';

    return {
      ...response,
      modoResposta: didacticMode,
      etapas: renumberSteps(
        response.etapas.slice(0, 4).map((step) => ({
          ...step,
          conteudo: step.conteudo.trim(),
          itens: dedupeStrings(step.itens, 3),
          destaques: dedupeStrings(step.destaques, 2),
          alerta: step.alerta ? takeFirstSentence(step.alerta) : step.alerta,
        })),
      ),
      observacoesFinais: dedupeStrings(response.observacoesFinais, 2),
      termosDestacados: response.termosDestacados
        .filter((highlight, index, all) => {
          const normalized = normalizeComparableText(highlight.texto);
          return all.findIndex((candidate) => normalizeComparableText(candidate.texto) === normalized) === index;
        })
        .slice(0, 3),
      analiseDaResposta: {
        ...response.analiseDaResposta,
        userNotice: keepContextNotice ? response.analiseDaResposta.userNotice : null,
        clarificationReason: response.analiseDaResposta.clarificationReason
          ? takeFirstSentence(response.analiseDaResposta.clarificationReason)
          : null,
        ambiguityReason: response.analiseDaResposta.ambiguityReason
          ? takeFirstSentence(response.analiseDaResposta.ambiguityReason)
          : null,
        cautionNotice: response.analiseDaResposta.cautionNotice
          ? takeFirstSentence(response.analiseDaResposta.cautionNotice)
          : null,
        processStates: response.analiseDaResposta.processStates
          .filter((state) => state.status !== 'concluido' && state.status !== 'informativo')
          .slice(0, 1),
      },
    };
  }

  const conciseProcessStates = response.analiseDaResposta.processStates
    .filter((state) => state.status !== 'concluido')
    .slice(0, 2);

  return {
    ...response,
    resumoInicial: takeFirstSentence(response.resumoInicial),
    modoResposta: response.etapas.length > 0 ? 'checklist' : 'explicacao',
    etapas: renumberSteps(
      response.etapas.slice(0, 3).map((step) => ({
        ...step,
        conteudo: takeFirstSentence(step.conteudo),
        itens: dedupeStrings(step.itens, 2),
        destaques: dedupeStrings(step.destaques, 2),
        alerta: step.alerta ? takeFirstSentence(step.alerta) : step.alerta,
      })),
    ),
    observacoesFinais: dedupeStrings(response.observacoesFinais.map(takeFirstSentence), 1),
    termosDestacados: response.termosDestacados
      .filter((highlight, index, all) => {
        const normalized = normalizeComparableText(highlight.texto);
        return all.findIndex((candidate) => normalizeComparableText(candidate.texto) === normalized) === index;
      })
      .slice(0, 2),
    analiseDaResposta: {
      ...response.analiseDaResposta,
      userNotice: null,
      clarificationReason: response.analiseDaResposta.clarificationReason
        ? takeFirstSentence(response.analiseDaResposta.clarificationReason)
        : null,
      ambiguityReason: response.analiseDaResposta.ambiguityReason
        ? takeFirstSentence(response.analiseDaResposta.ambiguityReason)
        : null,
      cautionNotice: response.analiseDaResposta.cautionNotice
        ? takeFirstSentence(response.analiseDaResposta.cautionNotice)
        : null,
      processStates: conciseProcessStates.slice(0, 1),
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
  const isChecklist = response.modoResposta === 'checklist';

  if (analysis.clarificationRequested && analysis.clarificationQuestion) {
    lines.push('', 'Antes de seguir');
    if (analysis.clarificationReason) {
      lines.push(analysis.clarificationReason);
    }
    lines.push(analysis.clarificationQuestion);
  }

  if (analysis.userNotice) {
    lines.push('', isChecklist ? 'Observação' : 'Orientação inicial');
    lines.push(analysis.userNotice);
  }

  if (analysis.cautionNotice) {
    lines.push('', 'Atenção');
    lines.push(analysis.cautionNotice);
  }

  if (response.etapas.length > 0) {
    lines.push('', isChecklist ? 'Checklist rápido' : 'Passo a passo guiado');
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
    lines.push(isChecklist ? 'Conferência final' : 'Observações finais');
    response.observacoesFinais.forEach((observation) => {
      lines.push(`- ${observation}`);
    });
    lines.push('');
  }

  if (!isChecklist && response.termosDestacados.length > 0) {
    lines.push('Termos importantes');
    response.termosDestacados.forEach((highlight) => {
      lines.push(`- ${highlight.texto}`);
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
        userNotice: 'Quero te orientar com segurança, então primeiro preciso entender exatamente qual ação você quer concluir.',
        cautionNotice: 'Prefiro te pedir esse complemento antes de responder para não te passar um passo a passo que pareça certo, mas não corresponda exatamente ao seu caso.',
        ambiguityReason: 'A formulação atual pode se referir a mais de um procedimento no SEI-Rio.',
        comparedSources: [],
        prioritizedSources: [],
        processStates: [
          {
            id: 'understanding',
            titulo: 'Ponto de atenção identificado',
            descricao: 'Percebi que ainda falta um detalhe para eu diferenciar com segurança os caminhos possíveis.',
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
        userNotice: 'Conferi mais de uma orientação disponível para te devolver um caminho mais seguro e aderente ao SEI-Rio.',
        cautionNotice: 'Encontrei pequenas diferenças de redação entre os materiais, mas o caminho principal permaneceu consistente.',
        ambiguityReason: 'Os documentos tratam o mesmo fluxo com ênfases ligeiramente diferentes.',
        comparedSources: ['Manual operacional do SEI-Rio (2025)', 'Guia prático do SEI-Rio (2024)'],
        prioritizedSources: ['Manual operacional do SEI-Rio (2025)'],
        processStates: [
          {
            id: 'internal-search',
            titulo: 'Consultando orientações disponíveis',
            descricao: 'Localizei os trechos mais próximos do fluxo que você descreveu.',
            status: 'concluido' as const,
          },
          {
            id: 'comparison',
            titulo: 'Conferindo diferenças de redação',
            descricao: 'Comparei os materiais para priorizar a orientação mais aplicável ao seu caso.',
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
        userNotice: 'Encontrei uma orientação consistente para o fluxo que você descreveu.',
        cautionNotice: null,
        ambiguityReason: null,
        comparedSources: ['Guia pratico do SEI-Rio (2025)'],
        prioritizedSources: ['Guia pratico do SEI-Rio (2025)'],
        processStates: [
          {
            id: 'internal-search',
            titulo: 'Orientação localizada',
            descricao: 'Encontrei um caminho direto e consistente para o seu caso.',
            status: 'concluido' as const,
          },
        ],
      },
    };
  }

  if (normalized.includes('ferias') || normalized.includes('requisitar servidor') || normalized.includes('afastamento')) {
    return {
      title: 'Encontrei um caminho próximo, mas ainda com cautela',
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
        userNotice: 'Conferi mais de uma orientação disponível e também recorri a uma referência oficial complementar para reduzir a dúvida.',
        cautionNotice: 'Mesmo assim, ainda não tenho segurança total de que esse seja o procedimento exato do seu caso. Se você quiser, me conte a tela, o tipo de processo ou o ato que pretende realizar.',
        ambiguityReason: 'A base atual trata esse tema apenas de forma indireta e os indicios encontrados ainda sao insuficientes.',
        comparedSources: ['Guias internos do SEI-Rio', 'Portal institucional do SEI-Rio'],
        prioritizedSources: ['Portal institucional do SEI-Rio'],
        processStates: [
          {
            id: 'internal-search',
            titulo: 'Consultando orientações disponíveis',
            descricao: 'Reuni os materiais mais próximos do tema que você mencionou.',
            status: 'concluido' as const,
          },
          {
            id: 'internal-expansion',
            titulo: 'Conferindo caminhos possíveis',
            descricao: 'Aprofundei a leitura das orientações para diferenciar melhor os fluxos possíveis.',
            status: 'cautela' as const,
          },
          {
            id: 'web-fallback',
            titulo: 'Buscando referência oficial complementar',
            descricao: 'Consultei uma fonte institucional para tentar reduzir a dúvida com mais transparência.',
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
      userNotice: 'Entendi bem a sua pergunta e encontrei um caminho consistente para te orientar.',
      cautionNotice: null,
      ambiguityReason: null,
      comparedSources: ['Guia de uso do SEI-Rio (2025)'],
      prioritizedSources: ['Guia de uso do SEI-Rio (2025)'],
      processStates: [
        {
          id: 'internal-search',
          titulo: 'Consultando orientações disponíveis',
          descricao: 'Busquei a orientação mais próxima do seu pedido para organizar um caminho útil e claro.',
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
          'Quando houver mais de uma orientacao sobre o mesmo assunto, a CLARA procura priorizar a que parece mais aderente ao SEI-Rio.',
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
  const normalizedQuestion = question.trim() || 'Como a CLARA vai me orientar quando o atendimento oficial estiver ativo?';
  const base = buildMockStructuredResponse(normalizedQuestion, responseMode);

  const response: ClaraStructuredResponse = {
    ...base,
    tituloCurto: responseMode === 'direto' ? 'Resposta direta de teste da CLARA' : 'Resposta didática de teste da CLARA',
    resumoInicial: responseMode === 'direto'
      ? `Você está em uma demonstração da CLARA. Por enquanto, esta resposta mostra como uma orientação mais objetiva pode aparecer para "${normalizedQuestion}".`
      : `Você está em uma demonstração da CLARA. Por enquanto, esta resposta mostra como um passo a passo guiado pode aparecer para "${normalizedQuestion}".`,
    resumoCitacoes: [],
    etapas: [
      {
        numero: 1,
        titulo: 'Sua pergunta entrou no atendimento',
        conteudo: `Usei sua pergunta para montar uma demonstração de resposta da CLARA: "${normalizedQuestion}".`,
        itens: [
          'O chat já recebe perguntas em linguagem natural.',
          'Nesta fase, o foco é validar clareza, tom e organização da resposta.',
        ],
        destaques: ['Pergunta recebida', 'Demonstração ativa'],
        alerta: null,
        citacoes: [],
      },
    {
      numero: 2,
      titulo: 'Como a orientação aparece no chat',
      conteudo: 'Mesmo em modo demonstrativo, a resposta já prioriza leitura contínua, sequência curta e explicação clara do que fazer primeiro.',
      itens: [
        'Resumo inicial para leitura rápida.',
        'Etapas curtas com ação e conferência.',
        'Referências e alertas só quando realmente ajudam a decidir o próximo passo.',
      ],
      destaques: ['Leitura clara', 'Etapas curtas'],
      alerta: 'Quando a base oficial estiver ativa, esse mesmo formato passa a refletir orientações e referências documentais reais.',
      citacoes: [],
    },
      {
        numero: 3,
        titulo: 'O que muda na próxima etapa',
        conteudo: 'Na etapa seguinte, o atendimento deixa de ser demonstrativo e passa a consultar a base oficial sem mudar a forma de uso do chat.',
        itens: [
          'Ativar o uso das orientações oficiais no atendimento.',
          'Trazer referências documentais reais para o final da resposta.',
          'Validar a experiência com perguntas operacionais de uso real.',
        ],
        destaques: ['Base oficial', 'Referências reais', 'Próxima etapa'],
        alerta: null,
        citacoes: [],
      },
    ],
    observacoesFinais: [
      'Esta resposta ainda é demonstrativa e não substitui uma consulta final baseada na base oficial.',
      'Quando o ambiente principal estiver ativo, a CLARA passa a responder com base documental real sem mudar a forma de uso do chat.',
      ...base.observacoesFinais,
    ],
    termosDestacados: [
      { texto: 'Ambiente demonstrativo', tipo: 'atencao' },
      { texto: 'Base oficial', tipo: 'acao' },
      ...base.termosDestacados,
    ].slice(0, 4),
    referenciasFinais: [
      {
        id: 1,
        tipo: 'outro',
        autorEntidade: 'CLARA',
        titulo: 'Demonstração do chat da CLARA',
        subtitulo: 'Ambiente demonstrativo antes da base oficial',
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
      userNotice: null,
      cautionNotice: 'Use este retorno como demonstração da experiência. As orientações finais passam a refletir a base oficial assim que a conexão principal for concluída.',
      ambiguityReason: null,
        comparedSources: ['Preview local do chat'],
        prioritizedSources: ['Preview local do chat'],
        processStates: [
        {
          id: 'backend-next',
          titulo: 'Base oficial na próxima etapa',
          descricao: 'A próxima etapa é fazer este mesmo atendimento consultar as orientações oficiais do projeto.',
          status: 'cautela',
        },
        ],
      },
  };

  return adaptStructuredResponseForMode(response, responseMode);
}

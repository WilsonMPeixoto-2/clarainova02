import React from 'react';
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

import {
  type ClaraStructuredResponse,
  formatReferenceAbnt,
  stripMarkdownForPdf,
} from '@/lib/clara-response';

export type PdfChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  structuredResponse?: ClaraStructuredResponse | null;
};

type ChatSessionPdfDocumentProps = {
  messages: PdfChatMessage[];
  generatedAt: Date;
  sessionTitle: string;
  logoSrc?: string | null;
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 92,
    paddingBottom: 58,
    paddingHorizontal: 42,
    backgroundColor: '#F8F6F1',
    color: '#122033',
    fontSize: 10.5,
    lineHeight: 1.55,
  },
  header: {
    position: 'absolute',
    top: 28,
    left: 42,
    right: 42,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#D8C7A1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: '#E0B66A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: {
    color: '#122033',
    fontSize: 16,
    fontWeight: 700,
  },
  brandLogo: {
    width: 38,
    height: 38,
    borderRadius: 999,
  },
  brandName: {
    fontSize: 15,
    fontWeight: 700,
    color: '#122033',
  },
  brandSubtitle: {
    marginTop: 1,
    fontSize: 8.8,
    color: '#536072',
    maxWidth: 230,
  },
  headerMeta: {
    alignItems: 'flex-end',
    gap: 2,
  },
  headerMetaLabel: {
    fontSize: 8,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#8A6A2F',
  },
  headerMetaValue: {
    fontSize: 9.2,
    color: '#223247',
  },
  introCard: {
    borderRadius: 18,
    backgroundColor: '#122033',
    padding: 22,
    marginBottom: 18,
  },
  introKicker: {
    color: '#E0B66A',
    fontSize: 8.2,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  introTitle: {
    color: '#F7F4EE',
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 8,
  },
  introText: {
    color: '#D0D7E0',
    fontSize: 10,
    lineHeight: 1.55,
  },
  introMetaGrid: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  introMetaCard: {
    minWidth: 120,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D425C',
    backgroundColor: '#192E46',
  },
  introMetaLabel: {
    color: '#B8C3D1',
    fontSize: 7.8,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  introMetaValue: {
    marginTop: 4,
    color: '#F7F4EE',
    fontSize: 13.4,
    fontWeight: 700,
  },
  introMetaCopy: {
    marginTop: 2,
    color: '#D0D7E0',
    fontSize: 8.4,
    lineHeight: 1.42,
  },
  messageBlock: {
    marginBottom: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D7DDE6',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  messageHeader: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userHeader: {
    backgroundColor: '#EEF3F8',
  },
  assistantHeader: {
    backgroundColor: '#13263D',
  },
  messageLabel: {
    fontSize: 8.3,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    fontWeight: 700,
  },
  userLabel: {
    color: '#42546A',
  },
  assistantLabel: {
    color: '#E0B66A',
  },
  messageMeta: {
    fontSize: 8.4,
    color: '#E4E8EE',
  },
  messageBody: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  paragraph: {
    color: '#223247',
    fontSize: 10.4,
    lineHeight: 1.58,
  },
  structuredTitle: {
    color: '#122033',
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 6,
  },
  summaryCard: {
    borderRadius: 12,
    backgroundColor: '#F3F6FA',
    borderWidth: 1,
    borderColor: '#D8E1EC',
    padding: 12,
    marginBottom: 10,
  },
  summaryText: {
    color: '#223247',
    fontSize: 10.1,
    lineHeight: 1.58,
  },
  stepCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0CFA6',
    backgroundColor: '#FFFDF8',
    padding: 12,
    marginBottom: 10,
  },
  stepHeader: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: '#E0B66A',
    color: '#122033',
    fontSize: 10,
    fontWeight: 700,
    textAlign: 'center',
    paddingTop: 4,
  },
  stepTitleWrap: {
    flexGrow: 1,
  },
  stepTitle: {
    fontSize: 11.2,
    fontWeight: 700,
    color: '#122033',
    marginBottom: 3,
  },
  stepText: {
    color: '#26364A',
    fontSize: 10,
    lineHeight: 1.52,
  },
  list: {
    marginTop: 8,
    gap: 4,
  },
  listItem: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  bullet: {
    color: '#C8871A',
    fontSize: 12,
    marginTop: -1,
  },
  listText: {
    flexGrow: 1,
    color: '#26364A',
    fontSize: 9.8,
    lineHeight: 1.5,
  },
  alertBox: {
    marginTop: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1C78B',
    backgroundColor: '#FFF5E7',
    padding: 10,
  },
  alertLabel: {
    color: '#9A6114',
    fontSize: 8.2,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  alertText: {
    color: '#5D4A2E',
    fontSize: 9.8,
    lineHeight: 1.5,
  },
  observationBox: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8E1EC',
    backgroundColor: '#F6F8FB',
    padding: 12,
  },
  observationTitle: {
    color: '#122033',
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 5,
  },
  noticeBox: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8C7A1',
    backgroundColor: '#FDF8EE',
    padding: 12,
  },
  noticeTitle: {
    color: '#8A6A2F',
    fontSize: 9.6,
    fontWeight: 700,
    marginBottom: 4,
  },
  noticeBody: {
    color: '#394A5E',
    fontSize: 9.4,
    lineHeight: 1.5,
  },
  processBox: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8E1EC',
    backgroundColor: '#F8FAFD',
    padding: 12,
  },
  processTitle: {
    color: '#122033',
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 6,
  },
  processItem: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  processBullet: {
    color: '#C8871A',
    fontSize: 11,
  },
  processCopy: {
    flexGrow: 1,
  },
  processItemTitle: {
    color: '#223247',
    fontSize: 9.6,
    fontWeight: 700,
    marginBottom: 2,
  },
  processItemText: {
    color: '#4A5D72',
    fontSize: 9.2,
    lineHeight: 1.45,
  },
  traceBox: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8E1EC',
    backgroundColor: '#FFFFFF',
    padding: 12,
  },
  traceTitle: {
    color: '#122033',
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 6,
  },
  traceSubtitle: {
    color: '#536072',
    fontSize: 8.8,
    fontWeight: 700,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  referencesBox: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#D8C7A1',
    paddingTop: 10,
  },
  referencesTitle: {
    color: '#8A6A2F',
    fontSize: 9.4,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  referenceRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  referenceIndex: {
    color: '#8A6A2F',
    fontSize: 9.6,
    width: 14,
    fontWeight: 700,
  },
  referenceText: {
    flexGrow: 1,
    color: '#394A5E',
    fontSize: 9.1,
    lineHeight: 1.45,
  },
  footer: {
    position: 'absolute',
    left: 42,
    right: 42,
    bottom: 22,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#D8C7A1',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    color: '#536072',
    fontSize: 8.5,
  },
});

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(value);
}

function renderPlainMessage(content: string) {
  return stripMarkdownForPdf(content)
    .split('\n')
    .filter(Boolean)
    .map((line, index) => (
      <Text key={`${line}-${index}`} style={styles.paragraph}>
        {line}
      </Text>
    ));
}

function renderStructuredMessage(response: ClaraStructuredResponse) {
  const analysis = response.analiseDaResposta;

  return (
    <View>
      <Text style={styles.structuredTitle}>{response.tituloCurto}</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryText}>{response.resumoInicial}</Text>
      </View>

      {analysis.userNotice && (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeTitle}>Como a CLARA conduziu esta resposta</Text>
          <Text style={styles.noticeBody}>{analysis.userNotice}</Text>
        </View>
      )}

      {analysis.clarificationRequested && analysis.clarificationQuestion && (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeTitle}>Antes de seguir</Text>
          {analysis.clarificationReason && <Text style={styles.noticeBody}>{analysis.clarificationReason}</Text>}
          <Text style={[styles.noticeBody, { marginTop: 4 }]}>{analysis.clarificationQuestion}</Text>
        </View>
      )}

      {response.etapas.map((step) => (
        <View key={step.numero} style={styles.stepCard} wrap={false}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepNumber}>{step.numero}</Text>
            <View style={styles.stepTitleWrap}>
              <Text style={styles.stepTitle}>{step.titulo}</Text>
              <Text style={styles.stepText}>{step.conteudo}</Text>
            </View>
          </View>

          {step.itens.length > 0 && (
            <View style={styles.list}>
              {step.itens.map((item, index) => (
                <View key={`${step.numero}-${index}`} style={styles.listItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {step.alerta && (
            <View style={styles.alertBox}>
              <Text style={styles.alertLabel}>Atencao</Text>
              <Text style={styles.alertText}>{step.alerta}</Text>
            </View>
          )}
        </View>
      ))}

      {response.observacoesFinais.length > 0 && (
        <View style={styles.observationBox}>
          <Text style={styles.observationTitle}>Observacoes finais</Text>
          {response.observacoesFinais.map((item, index) => (
            <View key={`${item}-${index}`} style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      {analysis.cautionNotice && (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeTitle}>Ponto de atencao</Text>
          <Text style={styles.noticeBody}>{analysis.cautionNotice}</Text>
        </View>
      )}

      {analysis.processStates.length > 0 && (
        <View style={styles.processBox}>
          <Text style={styles.processTitle}>O que a CLARA fez para chegar aqui</Text>
          {analysis.processStates.map((state) => (
            <View key={state.id} style={styles.processItem}>
              <Text style={styles.processBullet}>•</Text>
              <View style={styles.processCopy}>
                <Text style={styles.processItemTitle}>{state.titulo}</Text>
                <Text style={styles.processItemText}>{state.descricao}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {(analysis.comparedSources.length > 0 || analysis.prioritizedSources.length > 0) && (
        <View style={styles.traceBox}>
          <Text style={styles.traceTitle}>Fontes comparadas e priorizadas</Text>

          {analysis.comparedSources.length > 0 && (
            <View style={{ marginBottom: analysis.prioritizedSources.length > 0 ? 8 : 0 }}>
              <Text style={styles.traceSubtitle}>Fontes comparadas</Text>
              {analysis.comparedSources.map((source, index) => (
                <View key={`${source}-${index}`} style={styles.listItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.listText}>{source}</Text>
                </View>
              ))}
            </View>
          )}

          {analysis.prioritizedSources.length > 0 && (
            <View>
              <Text style={styles.traceSubtitle}>Fontes priorizadas</Text>
              {analysis.prioritizedSources.map((source, index) => (
                <View key={`${source}-${index}`} style={styles.listItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.listText}>{source}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {response.referenciasFinais.length > 0 && (
        <View style={styles.referencesBox}>
          <Text style={styles.referencesTitle}>Referencias</Text>
          {response.referenciasFinais.map((reference) => (
            <View key={reference.id} style={styles.referenceRow}>
              <Text style={styles.referenceIndex}>[{reference.id}]</Text>
              <Text style={styles.referenceText}>{formatReferenceAbnt(reference)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function summarizeSession(messages: PdfChatMessage[]) {
  const questions = messages.filter((message) => message.role === 'user').length;
  const answers = messages.filter((message) => message.role === 'assistant').length;
  const groundedAnswers = messages.filter(
    (message) => message.role === 'assistant' && (message.structuredResponse?.referenciasFinais.length ?? 0) > 0,
  ).length;

  return {
    questions,
    answers,
    groundedAnswers,
  };
}

function BrandMark({ logoSrc }: { logoSrc?: string | null }) {
  if (logoSrc) {
    return <Image src={logoSrc} style={styles.brandLogo} />;
  }

  return (
    <View style={styles.brandMark}>
      <Text style={styles.brandMarkText}>C</Text>
    </View>
  );
}

export function ChatSessionPdfDocument({
  messages,
  generatedAt,
  sessionTitle,
  logoSrc,
}: ChatSessionPdfDocumentProps) {
  const sessionSummary = summarizeSession(messages);
  let questionIndex = 0;
  let answerIndex = 0;

  return (
    <Document
      title={`CLARA - ${sessionTitle}`}
      author="CLARA"
      subject="Exportacao de sessao do chat da CLARA"
      creator="CLARA"
      language="pt-BR"
      creationDate={generatedAt}
      modificationDate={generatedAt}
    >
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header} fixed>
          <View style={styles.brandRow}>
            <BrandMark logoSrc={logoSrc} />
            <View>
              <Text style={styles.brandName}>CLARA</Text>
              <Text style={styles.brandSubtitle}>Consultora de Legislacao e Apoio a Rotinas Administrativas</Text>
            </View>
          </View>
          <View style={styles.headerMeta}>
            <Text style={styles.headerMetaLabel}>Sessao exportada</Text>
            <Text style={styles.headerMetaValue}>{formatDateTime(generatedAt)}</Text>
          </View>
        </View>

        <View style={styles.introCard}>
          <Text style={styles.introKicker}>Exportacao da sessao atual</Text>
          <Text style={styles.introTitle}>{sessionTitle}</Text>
          <Text style={styles.introText}>
            Documento gerado automaticamente a partir da conversa atual no chat da CLARA, com perguntas e respostas organizadas para consulta posterior.
          </Text>
          <View style={styles.introMetaGrid}>
            <View style={styles.introMetaCard}>
              <Text style={styles.introMetaLabel}>Perguntas</Text>
              <Text style={styles.introMetaValue}>{sessionSummary.questions}</Text>
              <Text style={styles.introMetaCopy}>Entradas do usuario registradas nesta sessao.</Text>
            </View>
            <View style={styles.introMetaCard}>
              <Text style={styles.introMetaLabel}>Respostas</Text>
              <Text style={styles.introMetaValue}>{sessionSummary.answers}</Text>
              <Text style={styles.introMetaCopy}>Orientacoes emitidas pela CLARA.</Text>
            </View>
            <View style={styles.introMetaCard}>
              <Text style={styles.introMetaLabel}>Base documental</Text>
              <Text style={styles.introMetaValue}>{sessionSummary.groundedAnswers}</Text>
              <Text style={styles.introMetaCopy}>Respostas com referencias listadas no proprio PDF.</Text>
            </View>
          </View>
        </View>

        {messages.map((message, index) => {
          const entryNumber = message.role === 'user' ? ++questionIndex : ++answerIndex;

          return (
            <View key={`${message.role}-${index}`} style={styles.messageBlock}>
              <View style={[styles.messageHeader, message.role === 'user' ? styles.userHeader : styles.assistantHeader]}>
                <Text style={[styles.messageLabel, message.role === 'user' ? styles.userLabel : styles.assistantLabel]}>
                  {message.role === 'user'
                    ? `Pergunta ${String(entryNumber).padStart(2, '0')}`
                    : `Resposta ${String(entryNumber).padStart(2, '0')}`}
                </Text>
                <Text style={styles.messageMeta}>
                  {message.role === 'user'
                    ? 'Solicitacao registrada'
                    : message.structuredResponse?.referenciasFinais.length
                      ? 'Com base documental'
                      : 'Orientacao conversacional'}
                </Text>
              </View>
              <View style={styles.messageBody}>
                {message.structuredResponse && message.role === 'assistant'
                  ? renderStructuredMessage(message.structuredResponse)
                  : renderPlainMessage(message.content)}
              </View>
            </View>
          );
        })}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>CLARA - Registro de atendimento exportado do chat institucional</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}

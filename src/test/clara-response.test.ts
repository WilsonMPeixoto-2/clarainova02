import { describe, expect, it } from 'vitest';

import {
  buildMockStructuredResponse,
  formatReferenceAbnt,
  renderStructuredResponseToPlainText,
  safeParseClaraStructuredEnvelope,
} from '@/lib/clara-response';

describe('clara-response helpers', () => {
  it('parses a valid structured envelope', () => {
    const response = buildMockStructuredResponse('Como montar um bloco de assinatura?');
    const parsed = safeParseClaraStructuredEnvelope({
      kind: 'clara_structured_response',
      response,
      plainText: renderStructuredResponseToPlainText(response),
    });

    expect(parsed).not.toBeNull();
    expect(parsed?.response.tituloCurto).toContain('assinatura');
  });

  it('formats references in ABNT-like style without inventing missing fields', () => {
    const formatted = formatReferenceAbnt({
      id: 1,
      tipo: 'manual',
      autorEntidade: 'SECRETARIA MUNICIPAL DE EDUCACAO DO RIO DE JANEIRO',
      titulo: 'Manual operacional do SEI-Rio',
      subtitulo: 'Blocos de assinatura',
      local: 'Rio de Janeiro',
      editoraOuOrgao: 'SME Rio',
      ano: '2025',
      paginas: '12-15',
      url: null,
      dataAcesso: '15/03/2026',
    });

    expect(formatted).toContain('SECRETARIA MUNICIPAL DE EDUCACAO DO RIO DE JANEIRO.');
    expect(formatted).toContain('Manual operacional do SEI-Rio: Blocos de assinatura.');
    expect(formatted).toContain('Rio de Janeiro: SME Rio, 2025.');
    expect(formatted).toContain('p. 12-15.');
    expect(formatted).toContain('Acesso em: 15/03/2026.');
  });

  it('renders structured response into plain text with steps and references', () => {
    const response = buildMockStructuredResponse('Como encaminhar um processo para outra unidade?');
    const plainText = renderStructuredResponseToPlainText(response);

    expect(plainText).toContain('Passo a passo');
    expect(plainText).toContain('1. Abra a area correta do processo');
    expect(plainText).toContain('Referencias');
    expect(plainText).toContain('[1]');
  });

  it('preserves clarification and caution metadata in the structured response', () => {
    const response = buildMockStructuredResponse('Como faco isso naquela tela?');

    expect(response.analiseDaResposta.clarificationRequested).toBe(true);
    expect(response.analiseDaResposta.clarificationQuestion).toContain('Voce pode me contar');
    expect(response.analiseDaResposta.answerScopeMatch).toBe('weak');
    expect(response.etapas).toHaveLength(0);
  });

  it('plain text does NOT contain internal diagnostic sections', () => {
    const response = buildMockStructuredResponse('Como requisitar ferias no sistema?');
    const plainText = renderStructuredResponseToPlainText(response);

    expect(plainText).not.toContain('Como cheguei a esta resposta');
    expect(plainText).not.toContain('Fontes comparadas');
    expect(plainText).not.toContain('Fontes priorizadas');
    expect(plainText).not.toContain('Leitura de confianca');
    expect(plainText).not.toContain('Aviso importante');
  });
});

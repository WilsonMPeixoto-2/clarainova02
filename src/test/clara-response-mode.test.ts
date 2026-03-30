import { describe, expect, it } from 'vitest';

import {
  buildMockStructuredResponse,
  buildPreviewStructuredResponse,
} from '@/lib/clara-response';

describe('clara response modes', () => {
  it('keeps the didatico mode more guided than the direto mode in mock responses', () => {
    const direct = buildMockStructuredResponse('Como montar um bloco de assinatura?', 'direto');
    const didactic = buildMockStructuredResponse('Como montar um bloco de assinatura?', 'didatico');

    expect(direct.etapas.length).toBeLessThanOrEqual(2);
    expect(didactic.etapas.length).toBeGreaterThanOrEqual(direct.etapas.length);
    expect(direct.observacoesFinais.length).toBeLessThanOrEqual(didactic.observacoesFinais.length);
    expect(direct.analiseDaResposta.userNotice).toBeNull();
  });

  it('exposes different preview titles for direto and didatico', () => {
    const direct = buildPreviewStructuredResponse('Como incluir documento externo?', 'direto');
    const didactic = buildPreviewStructuredResponse('Como incluir documento externo?', 'didatico');

    expect(direct.tituloCurto).toContain('direta');
    expect(didactic.tituloCurto).toContain('didática');
  });
});

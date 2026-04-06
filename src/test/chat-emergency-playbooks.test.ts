import { describe, expect, it } from 'vitest';

import { matchEmergencyGroundedPlaybook } from '../../supabase/functions/chat/emergency-playbooks';

describe('chat emergency grounded playbooks', () => {
  it('matches the internal document signature routine', () => {
    const playbook = matchEmergencyGroundedPlaybook(
      'Como assinar um documento interno?',
      ['Guia do usuário interno – SEI.Rio'],
    );

    expect(playbook?.id).toBe('q5b-assinar-documento-interno');
    expect(playbook?.mode).toBe('passo_a_passo');
  });

  it('matches the despacho versus oficio explanation', () => {
    const playbook = matchEmergencyGroundedPlaybook(
      'Qual é a diferença entre despacho e ofício no SEI-Rio?',
      ['Guia do usuário interno – SEI.Rio'],
    );

    expect(playbook?.id).toBe('q6b-despacho-oficio');
    expect(playbook?.mode).toBe('explicacao');
  });

  it('matches prazo and alerta questions without depending on the provider', () => {
    const playbook = matchEmergencyGroundedPlaybook(
      'O SEI-Rio gera notificações automáticas de prazo?',
      ['Guia do usuário interno – SEI.Rio'],
    );

    expect(playbook?.id).toBe('q6c-notificacoes-prazo');
    expect(playbook?.title).toContain('prazos');
  });

  it('still matches critical operational playbooks when no references are available', () => {
    const despacho = matchEmergencyGroundedPlaybook(
      'Qual é a diferença entre despacho e ofício no SEI-Rio?',
      [],
      { allowMissingReferences: true },
    );

    const prazo = matchEmergencyGroundedPlaybook(
      'Como gerar notificações de prazos no SEI-Rio?',
      [],
      { allowMissingReferences: true },
    );

    expect(despacho?.id).toBe('q6b-despacho-oficio');
    expect(prazo?.id).toBe('q6c-notificacoes-prazo');
  });
});

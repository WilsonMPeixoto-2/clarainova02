import { describe, expect, it } from "vitest";

import { ClaraStructuredResponseSchema } from "@/lib/clara-response";
import {
  type ClaraStructuredResponse,
} from "../../supabase/functions/chat/response-schema";
import { assessStructuredResponseQuality } from "../../supabase/functions/chat/response-quality";

function buildBaseResponse(): ClaraStructuredResponse {
  return {
    tituloCurto: "Enviar processo",
    resumoInicial: "Para enviar um processo, abra a funcionalidade de envio e confirme a unidade de destino. Confira se a unidade certa foi informada antes de concluir.",
    resumoCitacoes: [1],
    modoResposta: "passo_a_passo",
    etapas: [
      {
        numero: 1,
        titulo: "Abrir a tela de envio",
        conteudo: "Abra o processo e clique em Enviar Processo na barra superior. Confira se o processo certo está aberto antes de seguir.",
        itens: [],
        destaques: [],
        alerta: null,
        citacoes: [1],
      },
      {
        numero: 2,
        titulo: "Escolher a unidade",
        conteudo: "Preencha o campo de unidade de destino. Revise o nome completo da unidade antes de confirmar o envio.",
        itens: ["Campo Unidade", "Revisar destinatário"],
        destaques: [],
        alerta: null,
        citacoes: [1],
      },
    ],
    observacoesFinais: ["Antes de concluir, confira se a unidade destinatária e o tipo de envio correspondem ao caso."],
    termosDestacados: [],
    referenciasFinais: [
      {
        id: 1,
        tipo: "guia",
        autorEntidade: "Base documental CLARA",
        titulo: "Guia do usuário interno – SEI.Rio",
        subtitulo: null,
        local: null,
        editoraOuOrgao: null,
        ano: null,
        paginas: "35",
        url: null,
        dataAcesso: null,
      },
    ],
    analiseDaResposta: {
      questionUnderstandingConfidence: 1,
      finalConfidence: 0.94,
      answerScopeMatch: "exact",
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
    },
  };
}

describe("structured response quality gate", () => {
  it("flags didatico responses that are too shallow for a procedural question", () => {
    const response: ClaraStructuredResponse = {
      ...buildBaseResponse(),
      resumoInicial: "Abra o processo. Depois envie.",
      etapas: [
        {
          numero: 1,
          titulo: "Enviar",
          conteudo: "Clique em enviar.",
          itens: [],
          destaques: [],
          alerta: null,
          citacoes: [1],
        },
      ],
      observacoesFinais: [],
    };

    const assessment = assessStructuredResponseQuality(response, {
      responseMode: "didatico",
      intentLabel: "como_fazer",
    });

    expect(assessment.needsRepair).toBe(true);
    expect(assessment.issues).toContain("didactic_steps_too_shallow");
    expect(assessment.issues).toContain("didactic_missing_final_checks");
  });

  it("flags conceptual didatico responses that fall back to an artificial step-by-step shape", () => {
    const response: ClaraStructuredResponse = {
      ...buildBaseResponse(),
      tituloCurto: "Bloco de assinatura",
      resumoInicial:
        "O bloco de assinatura serve para reunir minutas e facilitar a coleta de assinaturas. Ele ajuda quando mais de uma pessoa precisa assinar documentos relacionados.",
      etapas: [
        {
          numero: 1,
          titulo: "Identificar quando usar",
          conteudo:
            "Use o bloco quando precisar organizar assinaturas de uma ou mais pessoas. Ele também ajuda a acompanhar documentos que ainda dependem de validação.",
          itens: [],
          destaques: [],
          alerta: null,
          citacoes: [1],
        },
      ],
      observacoesFinais: ["Confira se os signatários corretos foram incluídos antes de disponibilizar o bloco."],
    };

    const assessment = assessStructuredResponseQuality(response, {
      responseMode: "didatico",
      intentLabel: "conceito",
    });

    expect(assessment.needsRepair).toBe(true);
    expect(assessment.issues).toContain("conceptual_answer_should_be_explanatory");
  });

  it("flags direct responses with visibly truncated copy", () => {
    const response: ClaraStructuredResponse = {
      ...buildBaseResponse(),
      modoResposta: "checklist",
      etapas: [
        {
          numero: 1,
          titulo: "Abrir envio",
          conteudo: "Abra o processo e clique em Enviar Processo...",
          itens: [],
          destaques: [],
          alerta: null,
          citacoes: [1],
        },
      ],
    };

    const assessment = assessStructuredResponseQuality(response, {
      responseMode: "direto",
      intentLabel: "como_fazer",
    });

    expect(assessment.needsRepair).toBe(true);
    expect(assessment.issues).toContain("truncated_visible_copy");
  });
});

describe("frontend structured response contract", () => {
  it("accepts the insufficient mode emitted by the backend", () => {
    const parsed = ClaraStructuredResponseSchema.safeParse({
      ...buildBaseResponse(),
      modoResposta: "insuficiente",
    });

    expect(parsed.success).toBe(true);
  });
});

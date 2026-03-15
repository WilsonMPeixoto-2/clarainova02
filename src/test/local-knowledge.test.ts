import { describe, expect, it } from "vitest";

import {
  answerQuestionFromChunks,
  selectLocalKnowledgeResponse,
  type LocalKnowledgeChunk,
} from "@/lib/localKnowledge";

describe("answerQuestionFromChunks", () => {
  it("builds a grounded response from relevant local chunks", () => {
    const chunks: LocalKnowledgeChunk[] = [
      {
        id: "1",
        document_id: "doc-1",
        document_name: "guia_pratico_sei.pdf",
        chunk_index: 10,
        content:
          "Para anexar documentos no SEI, abra o processo e selecione a opcao Incluir Documento. Em seguida, escolha o tipo documental e preencha os campos obrigatorios antes de confirmar.",
      },
      {
        id: "2",
        document_id: "doc-1",
        document_name: "guia_pratico_sei.pdf",
        chunk_index: 11,
        content:
          "Depois de incluir o documento, revise o conteudo, salve e assine quando a etapa exigir formalizacao do responsavel pela unidade.",
      },
    ];

    const answer = answerQuestionFromChunks("Como anexar documentos no SEI?", chunks);

    expect(answer.found).toBe(true);
    expect(answer.response).toContain("base documental local");
    expect(answer.response).toContain("Incluir Documento");
    expect(answer.sources).toContain("guia_pratico_sei.pdf");
  });

  it("returns a safe not-found response when no chunk is relevant", () => {
    const chunks: LocalKnowledgeChunk[] = [
      {
        id: "3",
        document_id: "doc-2",
        document_name: "manual_financeiro.pdf",
        chunk_index: 2,
        content:
          "O relatorio financeiro consolidado deve ser enviado ate o quinto dia util do mes seguinte.",
      },
    ];

    const answer = answerQuestionFromChunks("Como configurar bloco de assinatura no SEI?", chunks);

    expect(answer.found).toBe(false);
    expect(answer.response).toContain("Nao encontrei");
  });

  it("falls back to the backend when local retrieval is not confident enough", () => {
    const answer = {
      found: false,
      response: "Nao encontrei uma resposta confiavel na base local.",
      sources: [],
      topScore: 0,
    };

    expect(selectLocalKnowledgeResponse(answer, true)).toBeNull();
  });

  it("keeps the local response when no remote backend is available", () => {
    const answer = {
      found: false,
      response: "Nao encontrei uma resposta confiavel na base local.",
      sources: [],
      topScore: 0,
    };

    expect(selectLocalKnowledgeResponse(answer, false)).toContain("Nao encontrei");
  });
});

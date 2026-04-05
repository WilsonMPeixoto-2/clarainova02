import { describe, expect, it } from "vitest";

import {
  buildPreparedChunksFromPages,
  computeBlobHash,
  computeFileHash,
  sanitizeFileName,
  type PageText,
} from "@/lib/admin-ingestion";

describe("admin ingestion helpers", () => {
  it("sanitizes file names for storage paths", () => {
    expect(sanitizeFileName("Guia do usuário SEI-Rio.pdf")).toBe("Guia_do_usuario_SEI-Rio.pdf");
    expect(sanitizeFileName("Manual:::SEI###2026.pdf")).toBe("Manual_SEI_2026.pdf");
  });

  it("builds structured chunks with clean semantic content and separate source metadata", async () => {
    const pages: PageText[] = [
      {
        pageNumber: 7,
        text: "Assinatura de documentos no SEI-Rio requer conferência prévia antes do envio final.",
      },
    ];

    const chunks = await buildPreparedChunksFromPages(pages, "manual-sei.pdf");

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0]).toMatchObject({
      pageStart: 7,
      pageEnd: 7,
      sourceTag: "manual-sei.pdf",
      sectionTitle: null,
    });
    expect(chunks[0].content).toBe("Assinatura de documentos no SEI-Rio requer conferência prévia antes do envio final.");
  });

  it("computes a stable SHA-256 hash per file content", async () => {
    const fileA = new File(["conteudo do manual"], "manual-a.pdf", { type: "application/pdf" });
    const fileB = new File(["conteudo do manual"], "manual-b.pdf", { type: "application/pdf" });
    const fileC = new File(["conteudo atualizado do manual"], "manual-c.pdf", { type: "application/pdf" });

    const [hashA, hashB, hashC] = await Promise.all([
      computeFileHash(fileA),
      computeFileHash(fileB),
      computeFileHash(fileC),
    ]);

    expect(hashA).toBe(hashB);
    expect(hashA).not.toBe(hashC);
    expect(hashA).toMatch(/^[a-f0-9]{64}$/);
  });

  it("computes the same hash for a stored blob and the original file bytes", async () => {
    const payload = "conteudo do manual";
    const file = new File([payload], "manual.pdf", { type: "application/pdf" });
    const blob = new Blob([payload], { type: "application/pdf" });

    const [fileHash, blobHash] = await Promise.all([
      computeFileHash(file),
      computeBlobHash(blob),
    ]);

    expect(blobHash).toBe(fileHash);
  });
});

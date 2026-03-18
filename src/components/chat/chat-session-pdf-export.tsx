import { pdf } from '@react-pdf/renderer';

import type { ChatMessage } from '@/hooks/useChatStore';

import { ChatSessionPdfDocument } from './ChatSessionPdfDocument';

function buildPdfFileName(sessionTitle: string, generatedAt: Date) {
  const stamp = new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(generatedAt)
    .replace(/-/g, '')
    .replace(' ', '-')
    .replace(':', 'h');

  const slug = sessionTitle
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);

  return `clara-sessao-${slug || 'atendimento'}-${stamp}.pdf`;
}

export async function exportChatSessionPdf(options: {
  messages: ChatMessage[];
  generatedAt?: Date;
  sessionTitle: string;
  logoSrc?: string | null;
}) {
  const generatedAt = options.generatedAt ?? new Date();
  const pdfDocument = (
    <ChatSessionPdfDocument
      messages={options.messages}
      generatedAt={generatedAt}
      sessionTitle={options.sessionTitle}
      logoSrc={options.logoSrc ?? null}
    />
  );

  const blob = await pdf(pdfDocument).toBlob();
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = window.document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = buildPdfFileName(options.sessionTitle, generatedAt);
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(downloadUrl);
}

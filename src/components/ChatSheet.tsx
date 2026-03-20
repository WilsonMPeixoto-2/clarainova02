import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Download,
  Loader2,
  Maximize2,
  MessageCircle,
  Minimize2,
  PanelRightOpen,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';

import { ChatStructuredMessage } from '@/components/chat/ChatStructuredMessage';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChat } from '@/hooks/useChatStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

const STARTER_PROMPTS = [
  'Como incluir um documento externo no SEI-Rio?',
  'Como montar um bloco de assinatura para outra unidade?',
  'Como enviar um processo para mais de uma unidade?',
  'Quais etapas devo conferir antes de encaminhar um processo?',
];

type ChatPanelMode = 'default' | 'expanded' | 'fullscreen';

const LOADING_PHASES = [
  {
    title: 'Entendendo sua pergunta',
    description: 'Estou tentando captar exatamente o que voce quer fazer no SEI-Rio.',
  },
  {
    title: 'Pesquisando na base interna',
    description: 'Estou procurando os trechos mais proximos na documentacao da CLARA.',
  },
  {
    title: 'Comparando informacoes',
    description: 'Se eu encontrar variacoes entre materiais, vou priorizar a orientacao mais aderente ao SEI-Rio.',
  },
  {
    title: 'Consolidando a resposta',
    description: 'Ja estou organizando tudo em um formato mais claro, com observacoes e referencias quando couber.',
  },
];

function formatSessionTitle(question: string) {
  const trimmed = question.trim();
  if (trimmed.length <= 76) {
    return trimmed;
  }

  return `${trimmed.slice(0, 73).trimEnd()}...`;
}

const ChatSheet = () => {
  const { isOpen, messages, pendingQuestion, isLoading, isStreaming, closeChat, sendMessage, clearMessages } = useChat();
  const isMobile = useIsMobile();
  const [input, setInput] = useState('');
  const [panelMode, setPanelMode] = useState<ChatPanelMode>('default');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [loadingPhaseIndex, setLoadingPhaseIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const exportableMessages = useMemo(
    () => messages.filter((message) => message.content.trim().length > 0 || message.structuredResponse),
    [messages],
  );

  const sessionTitle = useMemo(() => {
    const firstQuestion = exportableMessages.find((message) => message.role === 'user')?.content;
    return firstQuestion ? formatSessionTitle(firstQuestion) : 'Sessao atual da CLARA';
  }, [exportableMessages]);

  useEffect(() => {
    if (isMobile && panelMode !== 'fullscreen') {
      setPanelMode('fullscreen');
    }
    if (!isMobile && panelMode === 'fullscreen') {
      setPanelMode('default');
    }
  }, [isMobile, panelMode]);

  useEffect(() => {
    if (isOpen && pendingQuestion) {
      sendMessage(pendingQuestion);
    }
  }, [isOpen, pendingQuestion, sendMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: isStreaming ? 'auto' : 'smooth',
    });
  }, [messages, isStreaming]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isLoading || isStreaming) {
      setLoadingPhaseIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setLoadingPhaseIndex((current) => (current + 1) % LOADING_PHASES.length);
    }, 1900);

    return () => window.clearInterval(interval);
  }, [isLoading, isStreaming]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        closeChat();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, closeChat]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim()) return;

    sendMessage(input);
    setInput('');
  };

  const handlePanelMode = (nextMode: ChatPanelMode) => {
    setPanelMode(nextMode);
  };

  const handleExportPdf = async () => {
    if (exportableMessages.length === 0 || isExportingPdf) {
      return;
    }

    setIsExportingPdf(true);
    try {
      const { exportChatSessionPdf } = await import('@/components/chat/chat-session-pdf-export');

      await exportChatSessionPdf({
        messages: exportableMessages,
        sessionTitle,
        logoSrc: typeof window !== 'undefined' ? `${window.location.origin}/favicon.png` : null,
      });

      toast.success('PDF gerado', {
        description: 'A sessao atual foi exportada para consulta posterior.',
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Nao foi possivel gerar o PDF', {
        description: 'Tente novamente em alguns instantes.',
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const sheetWidth = isMobile
    ? '100vw'
    : panelMode === 'default'
      ? 'clamp(560px, 50vw, 920px)'
      : panelMode === 'expanded'
        ? 'clamp(760px, 78vw, 1440px)'
        : '100vw';

  const assistantMessageMaxWidth = isMobile ? 'max-w-[96%]' : 'max-w-[94%]';
  const activeLoadingPhase = LOADING_PHASES[loadingPhaseIndex];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeChat}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            className={`chat-shell fixed top-0 right-0 z-[100] h-full flex flex-col border-l border-[hsl(var(--border-subtle))] ${panelMode === 'fullscreen' ? 'left-0 border-l-0' : ''}`}
            style={{ width: sheetWidth }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            role="dialog"
            aria-label="Chat com CLARA"
            aria-modal="true"
          >
            <div className="chat-header-surface flex items-center justify-between gap-3 px-4 py-4 border-b border-[hsl(var(--border-subtle))] md:px-5">
              <div className="flex items-center gap-3 min-w-0">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-primary/35 bg-primary/10 text-primary shrink-0">
                  <MessageCircle size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">CLARA</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[11px] text-muted-foreground">Apoio ao SEI-Rio</p>
                    <span className="chat-status-pill">Base interna priorizada</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {exportableMessages.length > 0 && (
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    disabled={isExportingPdf}
                    className="chat-header-action"
                    aria-label="Baixar sessao em PDF"
                    title="Baixar sessao em PDF"
                  >
                    {isExportingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  </button>
                )}

                {!isMobile && (
                  <>
                    <button
                      type="button"
                      onClick={() => handlePanelMode(panelMode === 'default' ? 'expanded' : 'default')}
                      className="chat-header-action"
                      aria-label={panelMode === 'default' ? 'Ampliar painel do chat' : 'Restaurar tamanho padrao'}
                      title={panelMode === 'default' ? 'Ampliar painel do chat' : 'Restaurar tamanho padrao'}
                    >
                      {panelMode === 'default' ? <PanelRightOpen size={16} /> : <Minimize2 size={16} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePanelMode(panelMode === 'fullscreen' ? 'expanded' : 'fullscreen')}
                      className="chat-header-action"
                      aria-label={panelMode === 'fullscreen' ? 'Sair do modo tela inteira' : 'Expandir chat para toda a tela'}
                      title={panelMode === 'fullscreen' ? 'Sair do modo tela inteira' : 'Expandir chat para toda a tela'}
                    >
                      {panelMode === 'fullscreen' ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                  </>
                )}

                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={clearMessages}
                    className="chat-header-action"
                    aria-label="Limpar conversa"
                    title="Limpar conversa"
                  >
                    <Trash2 size={16} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={closeChat}
                  className="chat-header-action"
                  aria-label="Fechar chat"
                  title="Fechar chat"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="px-4 py-4 space-y-4 md:px-5">
                {messages.length === 0 && !isLoading && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-14 h-14 rounded-full border border-primary/25 bg-primary/5 flex items-center justify-center mb-4">
                      <MessageCircle className="w-6 h-6 text-primary/60" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">Ola! Sou a CLARA.</p>
                    <p className="text-xs text-muted-foreground max-w-[28ch]">
                      Faca uma pergunta sobre etapas, documentos, assinatura ou tramitacao no SEI-Rio.
                    </p>
                    <div className="chat-starter-grid mt-5">
                      {STARTER_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          className="chat-starter-chip"
                          onClick={() => sendMessage(prompt)}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        message.role === 'user'
                          ? 'chat-message-user text-primary-foreground rounded-br-md max-w-[85%]'
                          : `chat-message-assistant text-foreground rounded-bl-md ${message.structuredResponse ? assistantMessageMaxWidth : 'max-w-[90%]'}`
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        message.structuredResponse ? (
                          <ChatStructuredMessage response={message.structuredResponse} />
                        ) : (
                          <div className="clara-prose">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        )
                      ) : (
                        message.content
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && !isStreaming && (
                  <div className="flex justify-start">
                    <div className="chat-loading-card">
                      <div className="chat-loading-head">
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        <span>{activeLoadingPhase.title}</span>
                      </div>
                      <p className="chat-loading-copy">{activeLoadingPhase.description}</p>
                      <p className="chat-loading-hint">
                        Se eu encontrar alguma ambiguidade, vou te avisar com cuidado e posso pedir um esclarecimento ou consultar fonte oficial.
                      </p>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <form
              onSubmit={handleSubmit}
              className="px-4 py-3 border-t border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface-1))]"
            >
              <div className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface-2)/0.6)] px-3 py-1.5 focus-within:border-primary/40 transition-colors">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Pergunte sobre etapas, documentos ou tramitacao..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none py-2"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2 rounded-lg text-primary hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Enviar mensagem"
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                <p className="text-[10px] text-muted-foreground/60">
                  Respostas preferencialmente organizadas em blocos, com fontes ao final quando houver base suficiente.
                </p>
                {!isMobile && (
                  <span className="text-[10px] text-muted-foreground/50">
                    Painel padrao: metade da tela
                  </span>
                )}
              </div>
            </form>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatSheet;

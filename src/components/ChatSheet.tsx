import { useEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { DownloadSimple, CircleNotch, ArrowsOut, ChatCircle, ArrowsIn, Sidebar, PaperPlaneRight, Trash, X } from "@phosphor-icons/react";
import { AnimatePresence, motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

import { ChatStructuredMessage } from '@/components/chat/ChatStructuredMessage';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useChat } from '@/hooks/useChatStore';
import {
  CHAT_RESPONSE_MODES,
  getChatResponseModePresentation,
} from '@/lib/chat-response-mode';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
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
    description: 'Estou tentando captar exatamente o que você quer fazer no SEI-Rio.',
  },
  {
    title: 'Pesquisando na base documental',
    description: 'Estou procurando os trechos mais próximos na documentação disponível.',
  },
  {
    title: 'Comparando informações',
    description: 'Se eu encontrar variações entre materiais, vou priorizar a orientação mais aderente ao SEI-Rio.',
  },
  {
    title: 'Consolidando a resposta',
    description: 'Já estou organizando tudo em um formato mais claro, com observações e referências quando couber.',
  },
];

function formatSessionTitle(question: string) {
  const trimmed = question.trim();
  if (trimmed.length <= 76) {
    return trimmed;
  }

  return `${trimmed.slice(0, 73).trimEnd()}...`;
}

function ChatHeaderActionButton({
  label,
  children,
  className = '',
  showLabel = false,
  ...buttonProps
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
  showLabel?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          title={label}
          className={`chat-header-action ${className}`.trim()}
          {...buttonProps}
        >
          {children}
          {showLabel && <span className="chat-header-action-label">{label}</span>}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

const ChatSheet = () => {
  const {
    isOpen,
    messages,
    pendingQuestion,
    isLoading,
    isStreaming,
    responseMode,
    runtimeMode,
    runtimeLabel,
    runtimeDescription,
    closeChat,
    sendMessage,
    clearMessages,
    setResponseMode,
  } = useChat();
  const isMobile = useIsMobile();
  const isOnline = useOnlineStatus();
  const [input, setInput] = useState('');
  const [panelMode, setPanelMode] = useState<ChatPanelMode>('default');
  const [customWidth, setCustomWidth] = useState<number | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const newWidth = window.innerWidth - e.clientX;
      setCustomWidth(Math.max(420, Math.min(newWidth, window.innerWidth - 20)));
    };
    const handlePointerUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = '';
    };

    if (isOpen) {
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isOpen]);
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
        description: 'A conversa atual foi exportada em PDF para consulta posterior.',
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Nao foi possivel gerar o PDF', {
        description: 'Tente exportar novamente em alguns instantes.',
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const sheetWidth = isMobile
    ? '100vw'
    : panelMode === 'fullscreen'
      ? '100vw'
      : customWidth 
        ? `${customWidth}px`
        : panelMode === 'default'
          ? 'clamp(560px, 45vw, 840px)'
          : 'clamp(760px, 78vw, 1440px)';

  const assistantMessageMaxWidth = isMobile ? 'max-w-[96%]' : 'max-w-[94%]';
  const activeLoadingPhase = LOADING_PHASES[loadingPhaseIndex];
  const isPreviewMode = runtimeMode === 'preview';
  const isMockMode = runtimeMode === 'mock';
  const responseModePresentation = getChatResponseModePresentation(responseMode);
  const panelModeHint = panelMode === 'default'
    ? 'Painel padrão, com foco em consulta rápida'
    : panelMode === 'expanded'
      ? 'Painel ampliado para leitura operacional'
      : 'Tela inteira para leitura longa';
  const inputPlaceholder = isPreviewMode
    ? responseMode === 'direto'
      ? 'Pergunte para testar uma resposta mais objetiva enquanto a nova base e preparada...'
      : 'Pergunte para testar um passo a passo guiado enquanto a nova base e preparada...'
    : isMockMode
      ? responseMode === 'direto'
        ? 'Pergunte para testar o modo direto da CLARA...'
        : 'Pergunte para testar o modo didatico da CLARA...'
      : responseModePresentation.placeholder;

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
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                const focusable = e.currentTarget.querySelectorAll<HTMLElement>(
                  'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
                );
                if (focusable.length === 0) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first.focus();
                }
              }
            }}
          >
            {/* Drag Handle para resize nativo pelo usuário */}
            {!isMobile && panelMode !== 'fullscreen' && (
              <div
                className="absolute top-0 bottom-0 left-0 w-3 -ml-[1.5px] cursor-col-resize z-50 hover:bg-primary/20 active:bg-primary/30 active:backdrop-blur-sm transition-colors group flex items-center justify-center"
                onPointerDown={(e) => {
                  isDraggingRef.current = true;
                  document.body.style.cursor = 'col-resize';
                  e.preventDefault();
                }}
                title="Arraste para redimensionar"
              >
                <div className="w-[3px] h-12 bg-border/40 rounded-full group-hover:bg-primary/50 group-active:bg-primary/80 transition-colors" />
              </div>
            )}

            <div className="chat-header-surface flex items-center justify-between gap-3 px-4 py-4 border-b border-[hsl(var(--border-subtle))] md:px-5">
              <div className="flex items-center gap-3 min-w-0">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-primary/35 bg-primary/10 text-primary shrink-0">
                  <ChatCircle size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">CLARA</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[11px] text-muted-foreground">Apoio ao SEI-Rio</p>
                    <span className="chat-status-pill" data-mode={runtimeMode}>{runtimeLabel}</span>
                    <span className="chat-response-mode-pill" data-mode={responseMode}>{responseModePresentation.label}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {exportableMessages.length > 0 && (
                  <ChatHeaderActionButton
                    onClick={handleExportPdf}
                    disabled={isExportingPdf}
                    className="is-prominent"
                    label="Exportar PDF"
                    showLabel={!isMobile}
                  >
                    {isExportingPdf ? <CircleNotch size={16} className="animate-spin" /> : <DownloadSimple size={16} />}
                  </ChatHeaderActionButton>
                )}

                {!isMobile && (
                  <>
                    <ChatHeaderActionButton
                      onClick={() => {
                        setCustomWidth(null);
                        handlePanelMode(panelMode === 'default' ? 'expanded' : 'default');
                      }}
                      label={panelMode === 'default' ? 'Ampliar painel' : 'Restaurar largura'}
                    >
                      {panelMode === 'default' ? <Sidebar size={16} /> : <ArrowsIn size={16} />}
                    </ChatHeaderActionButton>

                    <ChatHeaderActionButton
                      onClick={() => {
                        setCustomWidth(null);
                        handlePanelMode(panelMode === 'fullscreen' ? 'expanded' : 'fullscreen');
                      }}
                      label={panelMode === 'fullscreen' ? 'Sair da tela inteira' : 'Tela inteira'}
                    >
                      {panelMode === 'fullscreen' ? <ArrowsIn size={16} /> : <ArrowsOut size={16} />}
                    </ChatHeaderActionButton>
                  </>
                )}

                {messages.length > 0 && (
                  <ChatHeaderActionButton
                    onClick={clearMessages}
                    label="Limpar conversa"
                  >
                    <Trash size={16} />
                  </ChatHeaderActionButton>
                )}

                <ChatHeaderActionButton
                  onClick={closeChat}
                  label="Fechar chat"
                >
                  <X size={18} />
                </ChatHeaderActionButton>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="px-4 py-4 space-y-4 md:px-5">
                {runtimeMode !== 'online' && (
                  <section className="chat-runtime-banner" data-mode={runtimeMode} aria-label={runtimeLabel}>
                    <div className="chat-runtime-banner-head">
                      <span className="chat-runtime-banner-badge">{runtimeLabel}</span>
                      <span className="chat-runtime-banner-kicker">CLARA / estado atual</span>
                    </div>
                    <p className="chat-runtime-banner-copy">{runtimeDescription}</p>
                  </section>
                )}

                {messages.length === 0 && !isLoading && (
                  <div className="chat-empty-state">
                    <div className="chat-empty-avatar">
                      <ChatCircle className="w-6 h-6 text-primary/60" />
                    </div>
                    <p className="chat-empty-kicker">{runtimeLabel}</p>
                    <p className="chat-empty-title">CLARA pronta para conversar.</p>
                    <p className="chat-empty-copy">
                      {isPreviewMode
                        ? 'Enquanto a nova base é configurada, você já pode testar perguntas e ver como a resposta será organizada.'
                        : 'Faça uma pergunta sobre etapas, documentos, assinatura ou tramitação no SEI-Rio.'}
                    </p>
                    <div className="chat-mode-summary">
                      <p className="chat-mode-summary-kicker">Modo selecionado</p>
                      <p className="chat-mode-summary-copy">
                        <strong>{responseModePresentation.label}</strong>: {responseModePresentation.description}
                      </p>
                    </div>

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
                  <motion.div
                    key={`${message.role}-${index}`}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
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
                            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{message.content}</ReactMarkdown>
                          </div>
                        )
                      ) : (
                        message.content
                      )}
                    </div>
                  </motion.div>
                ))}

                {isLoading && !isStreaming && (
                  <motion.div
                    className="flex justify-start"
                    role="status"
                    aria-live="polite"
                    aria-busy="true"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="chat-loading-card">
                      <div className="chat-loading-head">
                        <CircleNotch className="w-4 h-4 text-primary animate-spin" />
                        <span>{activeLoadingPhase.title}</span>
                      </div>
                      <p className="chat-loading-copy">{activeLoadingPhase.description}</p>
                      <p className="chat-loading-hint">
                        {responseModePresentation.loadingHint} Se eu encontrar alguma ambiguidade, vou te avisar com cuidado e posso pedir um esclarecimento ou consultar fonte oficial.
                      </p>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {!isOnline && (
              <div className="px-4 py-2 bg-yellow-900/30 border-t border-yellow-600/30 text-center" role="alert">
                <p className="text-xs text-yellow-400 font-medium">Sem conexão — verifique sua internet para enviar mensagens.</p>
              </div>
            )}
            <form
              onSubmit={handleSubmit}
              className="px-4 py-3 border-t border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface-1))]"
            >
              <div className="chat-response-mode-shell" aria-label="Modo de resposta">
                <div className="chat-response-mode-copy-block">
                  <p className="chat-response-mode-kicker">Modo de resposta</p>
                  <p className="chat-response-mode-copy">{responseModePresentation.description}</p>
                </div>
                <div className="chat-response-mode-toggle" role="group" aria-label="Selecionar modo de resposta">
                  {CHAT_RESPONSE_MODES.map((modeOption) => {
                    const optionPresentation = getChatResponseModePresentation(modeOption);
                    const isActive = responseMode === modeOption;

                    return (
                      <button
                        key={modeOption}
                        type="button"
                        onClick={() => setResponseMode(modeOption)}
                        disabled={isLoading || isStreaming}
                        className={`chat-response-mode-option ${isActive ? 'is-active' : ''}`}
                        aria-pressed={isActive}
                      >
                        {optionPresentation.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface-2)/0.6)] px-3 py-1.5 focus-within:border-primary/40 transition-colors">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={inputPlaceholder}
                  maxLength={2000}
                  aria-label="Sua pergunta para a CLARA"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none py-2"
                  disabled={isLoading || !isOnline}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading || !isOnline}
                  className="p-2 rounded-lg text-primary hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Enviar mensagem"
                >
                  <PaperPlaneRight size={18} />
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                <p className="text-[10px] text-muted-foreground/60">
                  {isPreviewMode
                    ? `Modo de preparação: você pode testar o modo ${responseModePresentation.label.toLowerCase()} antes da reconexão definitiva da base.`
                    : `Modo atual: ${responseModePresentation.label}. Quando houver base suficiente, as fontes continuam ao final da resposta.`}
                </p>
                {!isMobile && (
                  <span className="text-[10px] text-muted-foreground/50">
                    {panelModeHint}
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

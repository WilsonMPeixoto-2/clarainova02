import { forwardRef, useEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { DownloadSimple, CircleNotch, ArrowsOut, ArrowsIn, Sidebar, PaperPlaneRight, Trash, X } from "@phosphor-icons/react";
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
import { useModalAccessibility } from '@/hooks/useModalAccessibility';
import { ClaraMonogram } from '@/components/ClaraMonogram';
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
    title: 'Entendendo sua dúvida',
    description: 'Estou identificando com cuidado o que você quer fazer no SEI-Rio.',
  },
  {
    title: 'Localizando orientações úteis',
    description: 'Estou reunindo as orientações mais próximas do seu caso.',
  },
  {
    title: 'Conferindo pontos sensíveis',
    description: 'Se houver diferenças entre orientações, vou destacar o caminho mais seguro para você.',
  },
  {
    title: 'Montando sua resposta',
    description: 'Já estou organizando a orientação em um formato claro, com alertas e referências quando fizer sentido.',
  },
];

function formatSessionTitle(question: string) {
  const trimmed = question.trim();
  if (trimmed.length <= 76) {
    return trimmed;
  }

  return `${trimmed.slice(0, 73).trimEnd()}...`;
}

const ChatHeaderActionButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  visibleLabel?: string;
  children: ReactNode;
  showLabel?: boolean;
}>(function ChatHeaderActionButton({
  label,
  visibleLabel,
  children,
  className = '',
  showLabel = false,
  ...buttonProps
}, ref) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          ref={ref}
          type="button"
          aria-label={label}
          title={label}
          className={`chat-header-action ${showLabel ? 'has-label' : ''} ${className}`.trim()}
          {...buttonProps}
        >
          {children}
          {showLabel && <span className="chat-header-action-label">{visibleLabel ?? label}</span>}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
});


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
  const [panelMode, setPanelMode] = useState<ChatPanelMode>('fullscreen');
  const [customWidth, setCustomWidth] = useState<number | null>(null);
  const isDraggingRef = useRef(false);
  const sheetRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  useModalAccessibility({
    active: isOpen,
    containerRef: sheetRef,
    initialFocusRef: closeButtonRef,
    onClose: closeChat,
  });

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
        logoSrc: typeof window !== 'undefined' ? `${window.location.origin}/icon-192.png` : null,
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
          ? 'clamp(580px, 46vw, 860px)'
          : 'clamp(840px, 82vw, 1480px)';

  const assistantMessageMaxWidth = isMobile ? 'max-w-[96%]' : 'max-w-[94%]';
  const activeLoadingPhase = LOADING_PHASES[loadingPhaseIndex];
  const isPreviewMode = runtimeMode === 'preview';
  const isMockMode = runtimeMode === 'mock';
  const responseModePresentation = getChatResponseModePresentation(responseMode);
  const inputPlaceholder = isPreviewMode
    ? responseMode === 'direto'
      ? 'Pergunte para experimentar uma resposta mais objetiva nesta demonstração da CLARA...'
      : 'Pergunte para experimentar um passo a passo guiado nesta demonstração da CLARA...'
    : isMockMode
      ? responseMode === 'direto'
        ? 'Pergunte para experimentar o modo direto da CLARA...'
        : 'Pergunte para experimentar o modo didático da CLARA...'
      : responseModePresentation.placeholder;

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
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
            ref={sheetRef}
            className={`chat-shell fixed top-0 right-0 z-[100] h-full flex flex-col border-l border-[hsl(var(--border-subtle))] ${panelMode === 'fullscreen' ? 'left-0 border-l-0' : ''}`}
            data-panel-mode={panelMode}
            style={{ width: sheetWidth }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            role="dialog"
            aria-labelledby="clara-chat-title"
            aria-modal="true"
            tabIndex={-1}
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

            <div className="chat-header-surface flex items-center justify-between gap-3 px-5 py-3 border-b border-[hsl(var(--border-subtle))]">
              <div className="flex items-center gap-3 min-w-0">
                <span className="chat-header-avatar">
                  <ClaraMonogram className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p id="clara-chat-title" className="text-sm font-semibold text-foreground tracking-wide">CLARA</p>
                    <span className="chat-status-dot" data-mode={runtimeMode} />
                    <span className="chat-status-label" data-mode={runtimeMode}>{runtimeLabel}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground/70 mt-0.5">Apoio ao SEI-Rio</p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <ChatHeaderActionButton
                  onClick={handleExportPdf}
                  disabled={isExportingPdf || exportableMessages.length === 0}
                  className="is-prominent"
                  label="Exportar conversa em PDF"
                  visibleLabel="PDF"
                  showLabel={!isMobile}
                >
                  {isExportingPdf ? <CircleNotch size={16} className="animate-spin" /> : <DownloadSimple size={16} />}
                </ChatHeaderActionButton>

                {!isMobile && (
                  <>
                    <ChatHeaderActionButton
                      onClick={() => {
                        setCustomWidth(null);
                        if (panelMode === 'fullscreen') handlePanelMode('expanded');
                        else if (panelMode === 'expanded') handlePanelMode('default');
                        else handlePanelMode('fullscreen');
                      }}
                      label={
                        panelMode === 'fullscreen' ? 'Reduzir painel'
                          : panelMode === 'expanded' ? 'Painel compacto'
                          : 'Tela cheia'
                      }
                      visibleLabel={
                        panelMode === 'fullscreen' ? 'Reduzir'
                          : panelMode === 'expanded' ? 'Compacto'
                          : 'Expandir'
                      }
                      showLabel
                    >
                      {panelMode === 'fullscreen' ? <ArrowsIn size={16} /> : panelMode === 'expanded' ? <Sidebar size={16} /> : <ArrowsOut size={16} />}
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
                  ref={closeButtonRef}
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
                    <span className="chat-empty-avatar">
                      <ClaraMonogram className="w-8 h-8" />
                    </span>
                    <p className="chat-empty-copy chat-empty-copy--spaced">
                      {isPreviewMode
                        ? 'Teste perguntas e veja como a CLARA organiza a orientação.'
                        : 'Faça uma pergunta sobre etapas, documentos, assinatura ou tramitação no SEI-Rio.'}
                    </p>

                    <div className="chat-starter-grid mt-4">
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
                        {responseModePresentation.loadingHint} Se aparecer alguma ambiguidade, eu vou te avisar com clareza e pedir só o complemento necessário para seguir com segurança.
                      </p>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {!isOnline && (
              <div className="px-4 py-2 bg-yellow-900/30 border-t border-yellow-600/30 text-center" role="alert">
                <p className="text-xs text-yellow-400 font-medium">Você está sem conexão. Assim que a internet voltar, eu continuo com você.</p>
              </div>
            )}
            <form
              onSubmit={handleSubmit}
              className="px-4 py-3 border-t border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface-1))]"
            >
              <div className="chat-response-mode-shell" aria-label="Modo de resposta">
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
                        data-mode={modeOption}
                        aria-pressed={isActive}
                      >
                        <span className="chat-response-mode-option-title">{optionPresentation.label}</span>
                        <span className="chat-response-mode-option-copy">{optionPresentation.selectionHint}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-end gap-2 rounded-xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface-2)/0.6)] px-3 py-2 focus-within:border-primary/40 transition-colors">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      if (input.trim() && !isLoading && isOnline) {
                        sendMessage(input);
                        setInput('');
                      }
                    }
                  }}
                  placeholder={inputPlaceholder}
                  maxLength={2000}
                  rows={3}
                  aria-label="Sua pergunta para a CLARA"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none py-1 resize-none leading-relaxed chat-input-textarea"
                  disabled={isLoading || !isOnline}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading || !isOnline}
                  className="p-2 rounded-lg text-primary hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0 mb-0.5"
                  aria-label="Enviar mensagem"
                >
                  <PaperPlaneRight size={18} />
                </button>
              </div>
              <p className="chat-footer-hint">
                  {isPreviewMode
                    ? 'Modo demonstrativo'
                    : `${responseModePresentation.label} · Referências aparecem ao final`}
                </p>
            </form>
          </motion.aside>
        )}
      </AnimatePresence>
    </>,
    document.body,
  );
};

export default ChatSheet;

import { forwardRef, useEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { DownloadSimple, CircleNotch, Printer, PaperPlaneRight, Trash, X } from "@phosphor-icons/react";
import { AnimatePresence, motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

import { ClaraMonogram } from '@/components/ClaraMonogram';
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
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { toast } from 'sonner';

const STARTER_PROMPTS = [
  'Como incluir um documento externo no SEI-Rio?',
  'Como montar um bloco de assinatura para outra unidade?',
  'Como enviar um processo para mais de uma unidade?',
  'Quais etapas devo conferir antes de encaminhar um processo?',
];

type ChatPanelMode = 'compact' | 'medium' | 'wide' | 'fullscreen';

const CHAT_PANEL_PRESETS: Array<{
  mode: Exclude<ChatPanelMode, 'fullscreen'>;
  label: string;
  shortLabel: string;
  ratio: number;
  width: string;
}> = [
  { mode: 'compact', label: '25%', shortLabel: '25', ratio: 0.25, width: 'clamp(420px, 25vw, 520px)' },
  { mode: 'medium', label: '50%', shortLabel: '50', ratio: 0.5, width: 'clamp(620px, 50vw, 980px)' },
  { mode: 'wide', label: '75%', shortLabel: '75', ratio: 0.75, width: 'clamp(860px, 75vw, 1480px)' },
];

const MIN_PANEL_WIDTH = 420;
const PANEL_VIEWPORT_MARGIN = 20;
const PANEL_RESIZE_STEP = 72;
const CHAT_PANEL_STORAGE_KEY = 'clara-chat-panel-preference';
const CHAT_PANEL_STORAGE_VERSION = 1;

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

interface PersistedChatPanelPreference {
  version: number;
  mode: ChatPanelMode;
  customWidth: number | null;
}

function isChatPanelMode(value: unknown): value is ChatPanelMode {
  return value === 'compact' || value === 'medium' || value === 'wide' || value === 'fullscreen';
}

function formatSessionTitle(question: string) {
  const trimmed = question.trim();
  if (trimmed.length <= 76) {
    return trimmed;
  }

  return `${trimmed.slice(0, 73).trimEnd()}...`;
}

function clampPanelWidth(width: number) {
  if (typeof window === 'undefined') {
    return width;
  }

  return Math.max(MIN_PANEL_WIDTH, Math.min(width, window.innerWidth - PANEL_VIEWPORT_MARGIN));
}

function loadPersistedPanelPreference(): PersistedChatPanelPreference {
  if (typeof window === 'undefined') {
    return {
      version: CHAT_PANEL_STORAGE_VERSION,
      mode: 'wide',
      customWidth: null,
    };
  }

  try {
    const raw = window.localStorage.getItem(CHAT_PANEL_STORAGE_KEY);
    if (!raw) {
      return {
        version: CHAT_PANEL_STORAGE_VERSION,
        mode: 'wide',
        customWidth: null,
      };
    }

    const parsed = JSON.parse(raw) as Partial<PersistedChatPanelPreference>;
    const mode = isChatPanelMode(parsed.mode) ? parsed.mode : 'wide';
    const customWidth = typeof parsed.customWidth === 'number' && Number.isFinite(parsed.customWidth)
      ? clampPanelWidth(parsed.customWidth)
      : null;

    return {
      version: CHAT_PANEL_STORAGE_VERSION,
      mode,
      customWidth,
    };
  } catch {
    return {
      version: CHAT_PANEL_STORAGE_VERSION,
      mode: 'wide',
      customWidth: null,
    };
  }
}

function persistPanelPreference(preference: PersistedChatPanelPreference) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(CHAT_PANEL_STORAGE_KEY, JSON.stringify(preference));
  } catch {
    // Storage unavailable — silently ignore
  }
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
  const [panelPreferenceSeed] = useState(loadPersistedPanelPreference);
  const [panelMode, setPanelMode] = useState<ChatPanelMode>(panelPreferenceSeed.mode);
  const [customWidth, setCustomWidth] = useState<number | null>(panelPreferenceSeed.customWidth);
  const isDraggingRef = useRef(false);
  const sheetRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const resolvedPanelWidth = useMemo(() => {
    if (typeof window === 'undefined') {
      return MIN_PANEL_WIDTH;
    }

    if (isMobile || panelMode === 'fullscreen') {
      return window.innerWidth;
    }

    if (customWidth) {
      return clampPanelWidth(customWidth);
    }

    const ratio = CHAT_PANEL_PRESETS.find((preset) => preset.mode === panelMode)?.ratio ?? 0.75;
    return clampPanelWidth(Math.round(window.innerWidth * ratio));
  }, [customWidth, isMobile, panelMode]);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const newWidth = window.innerWidth - e.clientX;
      setCustomWidth(clampPanelWidth(newWidth));
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
  const [isPrintingPdf, setIsPrintingPdf] = useState(false);
  const [loadingPhaseIndex, setLoadingPhaseIndex] = useState(0);

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
      setPanelMode('wide');
    }
  }, [isMobile, panelMode]);

  useEffect(() => {
    if (isMobile) {
      return;
    }

    persistPanelPreference({
      version: CHAT_PANEL_STORAGE_VERSION,
      mode: panelMode,
      customWidth: customWidth ? clampPanelWidth(customWidth) : null,
    });
  }, [customWidth, isMobile, panelMode]);

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
    const textarea = inputRef.current;
    if (!textarea) return;

    textarea.style.height = '0px';
    const nextHeight = Math.min(textarea.scrollHeight, 192);
    textarea.style.height = `${Math.max(52, nextHeight)}px`;
  }, [input, isOpen]);

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

  const handleResizeKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (isMobile || panelMode === 'fullscreen') {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setCustomWidth(clampPanelWidth(resolvedPanelWidth + PANEL_RESIZE_STEP));
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setCustomWidth(clampPanelWidth(resolvedPanelWidth - PANEL_RESIZE_STEP));
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      setCustomWidth(MIN_PANEL_WIDTH);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      setCustomWidth(window.innerWidth - PANEL_VIEWPORT_MARGIN);
    }
  };

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!input.trim() || isLoading || !isOnline) {
        return;
      }

      sendMessage(input);
      setInput('');
    }
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

  const handlePrintPdf = async () => {
    if (exportableMessages.length === 0 || isPrintingPdf) {
      return;
    }

    setIsPrintingPdf(true);
    try {
      const { printChatSessionPdf } = await import('@/components/chat/chat-session-pdf-export');

      await printChatSessionPdf({
        messages: exportableMessages,
        sessionTitle,
        logoSrc: typeof window !== 'undefined' ? `${window.location.origin}/icon-192.png` : null,
      });
    } catch (error) {
      console.error('PDF print error:', error);
      toast.error('Nao foi possivel abrir a impressao', {
        description: 'Verifique se o navegador bloqueou a janela de impressao e tente novamente.',
      });
    } finally {
      setIsPrintingPdf(false);
    }
  };

  const sheetWidth = isMobile
    ? '100vw'
    : panelMode === 'fullscreen'
      ? '100vw'
      : customWidth
        ? `${customWidth}px`
        : CHAT_PANEL_PRESETS.find((preset) => preset.mode === panelMode)?.width ?? 'clamp(860px, 75vw, 1480px)';

  const assistantMessageMaxWidth = isMobile ? 'max-w-[96%]' : 'max-w-[94%]';
  const activeLoadingPhase = LOADING_PHASES[loadingPhaseIndex];
  const isPreviewMode = runtimeMode === 'preview';
  const isMockMode = runtimeMode === 'mock';
  const hasMessages = messages.length > 0;
  const responseModePresentation = getChatResponseModePresentation(responseMode);
  const showRuntimePill = runtimeMode !== 'online' || !hasMessages;
  const showRuntimeBanner = runtimeMode !== 'online' && !hasMessages;
  const showRuntimeInlineNote = runtimeMode !== 'online' && hasMessages;
  const headerContextLabel = hasMessages ? 'Sessao ativa' : 'Consulta institucional ao SEI-Rio';
  const responseModeHelperCopy = hasMessages
    ? 'Alterne o tom quando quiser mais objetividade ou mais contexto.'
    : 'Escolha o tom da resposta antes de comecar. Voce pode mudar isso a qualquer momento.';
  const composerSupportCopy = hasMessages
    ? 'Referencias e cautelas aparecem ao final sempre que houver base aplicavel.'
    : 'Voce pode comecar com uma pergunta curta ou colar um contexto maior para eu organizar a orientacao.';
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
            className="fixed inset-0 z-[90] bg-black/72 backdrop-blur-md"
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
            style={{ width: sheetWidth }}
            data-chat-stage={hasMessages ? 'active' : 'empty'}
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
                className="chat-resize-handle absolute top-0 bottom-0 left-0 z-50 flex items-center justify-center"
                onPointerDown={(e) => {
                  isDraggingRef.current = true;
                  document.body.style.cursor = 'col-resize';
                  e.preventDefault();
                }}
                onKeyDown={handleResizeKeyDown}
                title="Arraste para redimensionar"
                role="separator"
                aria-label="Redimensionar painel da CLARA"
                aria-orientation="vertical"
                aria-valuemin={MIN_PANEL_WIDTH}
                aria-valuemax={Math.max(MIN_PANEL_WIDTH, typeof window === 'undefined' ? MIN_PANEL_WIDTH : window.innerWidth - PANEL_VIEWPORT_MARGIN)}
                aria-valuenow={resolvedPanelWidth}
                aria-describedby="clara-chat-resize-hint"
                tabIndex={0}
              >
                <div className="chat-resize-grip" />
                <span id="clara-chat-resize-hint" className="sr-only">
                  Arraste para redimensionar ou use as setas esquerda e direita para ajustar a largura do painel.
                </span>
              </div>
            )}

            <div className={`chat-header-surface flex items-center justify-between gap-3 px-4 py-4 border-b border-[hsl(var(--border-subtle))] md:px-5 ${hasMessages ? 'is-compact' : ''}`}>
              <div className="flex items-center gap-3 min-w-0">
                <span className="chat-brand-mark inline-flex items-center justify-center w-10 h-10 rounded-full shrink-0">
                  <ClaraMonogram className="h-6 w-6" title="" />
                </span>
                <div className="min-w-0">
                  <div className="chat-header-title-row">
                    <p id="clara-chat-title" className="text-sm font-semibold text-foreground">CLARA</p>
                  </div>
                  <p className="chat-header-context-label">{headerContextLabel}</p>
                  <div className="chat-header-meta-row">
                    {showRuntimePill && <span className="chat-status-pill" data-mode={runtimeMode}>{runtimeLabel}</span>}
                    <span className="chat-response-mode-pill" data-mode={responseMode}>{responseModePresentation.label}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!isMobile && (
                  <div className="chat-size-control" aria-label="Tamanho da janela">
                    <span className="chat-size-control-label">Tamanho</span>
                    <div className="chat-size-control-options" role="group" aria-label="Selecionar tamanho da janela">
                      {CHAT_PANEL_PRESETS.map((preset) => {
                        const isActive = panelMode === preset.mode && customWidth === null;

                        return (
                          <button
                            key={preset.mode}
                            type="button"
                            className={`chat-size-control-option ${isActive ? 'is-active' : ''}`}
                            onClick={() => {
                              setCustomWidth(null);
                              setPanelMode(preset.mode);
                            }}
                            aria-pressed={isActive}
                          >
                            {preset.shortLabel}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        className={`chat-size-control-option ${panelMode === 'fullscreen' ? 'is-active' : ''}`}
                        onClick={() => {
                          setCustomWidth(null);
                          setPanelMode('fullscreen');
                        }}
                        aria-pressed={panelMode === 'fullscreen'}
                      >
                        100
                      </button>
                    </div>
                  </div>
                )}

                {exportableMessages.length > 0 && (
                  <>
                    <ChatHeaderActionButton
                      onClick={handleExportPdf}
                      disabled={isExportingPdf}
                      className="is-prominent"
                      label="Exportar conversa em PDF"
                      visibleLabel="PDF"
                      showLabel={!isMobile}
                    >
                      {isExportingPdf ? <CircleNotch size={16} className="animate-spin" /> : <DownloadSimple size={16} />}
                    </ChatHeaderActionButton>

                    <ChatHeaderActionButton
                      onClick={handlePrintPdf}
                      disabled={isPrintingPdf}
                      className="is-secondary"
                      label="Imprimir conversa"
                      visibleLabel="Imprimir"
                      showLabel={!isMobile}
                    >
                      {isPrintingPdf ? <CircleNotch size={16} className="animate-spin" /> : <Printer size={16} />}
                    </ChatHeaderActionButton>
                  </>
                )}

                {messages.length > 0 && (
                  <ChatHeaderActionButton
                    onClick={clearMessages}
                    className="is-quiet"
                    label="Limpar conversa"
                    visibleLabel="Limpar"
                    showLabel={!isMobile}
                  >
                    <Trash size={16} />
                  </ChatHeaderActionButton>
                )}

                <ChatHeaderActionButton
                  ref={closeButtonRef}
                  onClick={closeChat}
                  className="is-quiet"
                  label="Fechar chat"
                >
                  <X size={18} />
                </ChatHeaderActionButton>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className={`px-4 py-4 md:px-5 ${hasMessages ? 'space-y-3' : 'space-y-5'}`}>
                {showRuntimeBanner && (
                  <section className="chat-runtime-banner" data-mode={runtimeMode} aria-label={runtimeLabel}>
                    <div className="chat-runtime-banner-head">
                      <span className="chat-runtime-banner-badge">{runtimeLabel}</span>
                      <span className="chat-runtime-banner-kicker">Estado atual</span>
                    </div>
                    <p className="chat-runtime-banner-copy">{runtimeDescription}</p>
                  </section>
                )}

                {showRuntimeInlineNote && (
                  <section className="chat-runtime-inline-note" data-mode={runtimeMode} aria-label={runtimeLabel}>
                    <span className="chat-runtime-inline-badge">{runtimeLabel}</span>
                    <p className="chat-runtime-inline-copy">{runtimeDescription}</p>
                  </section>
                )}

                {messages.length === 0 && !isLoading && (
                  <div className="chat-empty-state">
                    <div className="chat-empty-avatar">
                      <ClaraMonogram className="w-8 h-8" title="" />
                    </div>
                    <p className="chat-empty-title">
                      {isPreviewMode ? 'O que voce quer testar agora?' : 'Destrave a proxima etapa.'}
                    </p>
                    <p className="chat-empty-copy">
                      {isPreviewMode
                        ? 'Experimente uma pergunta e veja como a CLARA organiza a orientacao com referencias e cautelas.'
                        : 'Pergunte sobre assinatura, tramitacao, documentos ou revisao de fluxo. Eu organizo o caminho com clareza e o nivel de detalhe que voce escolher.'}
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
                  <motion.div
                    key={`${message.role}-${index}`}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div
                      className={`rounded-2xl text-sm leading-relaxed ${
                        message.role === 'user'
                          ? 'chat-message-user text-primary-foreground rounded-br-md max-w-[85%] px-4 py-3'
                          : `chat-message-assistant text-foreground rounded-bl-md px-4 pt-5 pb-3 ${message.structuredResponse ? assistantMessageMaxWidth : 'max-w-[90%]'}`
                      }`}
                      data-response-kind={message.role === 'assistant' ? (message.structuredResponse ? 'structured' : 'plain') : undefined}
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
              className="chat-composer-form px-4 py-3 border-t border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface-1))]"
            >
              <div className={`chat-response-mode-shell ${hasMessages ? 'is-compact' : ''}`} aria-label="Modo de resposta">
                <div className="chat-response-mode-head">
                  <p className="chat-response-mode-kicker">Modo de resposta</p>
                  {!hasMessages && (
                    <p className="chat-response-mode-copy">
                      {responseModeHelperCopy}
                    </p>
                  )}
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
                        data-mode={modeOption}
                      >
                        <span className="chat-response-mode-option-title">{optionPresentation.label}</span>
                        <span className="chat-response-mode-option-copy">{optionPresentation.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="chat-composer-box flex items-end gap-2 rounded-xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface-2)/0.6)] px-3 py-1.5 focus-within:border-primary/40 transition-colors">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder={inputPlaceholder}
                  maxLength={2000}
                  aria-label="Sua pergunta para a CLARA"
                  rows={2}
                  className="chat-composer-textarea flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  disabled={isLoading || !isOnline}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading || !isOnline}
                  className="chat-composer-submit mb-1 p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Enviar mensagem"
                >
                  <PaperPlaneRight size={18} />
                </button>
              </div>
              <div className="chat-composer-meta flex flex-wrap items-center justify-between gap-2 mt-2">
                {(!hasMessages || isPreviewMode) && (
                  <p className="chat-composer-footnote text-[10px] text-muted-foreground/60">
                    {isPreviewMode
                      ? 'Ambiente demonstrativo: respostas e referencias servem para validar a experiencia da CLARA.'
                      : composerSupportCopy}
                  </p>
                )}
                <span className="chat-composer-shortcut text-[10px] text-muted-foreground/50">
                  Enter envia. Shift + Enter cria nova linha.
                </span>
              </div>
            </form>
          </motion.aside>
        )}
      </AnimatePresence>
    </>,
    document.body,
  );
};

export default ChatSheet;

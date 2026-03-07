import { useEffect, useRef, useState } from 'react';
import { X, Send, Trash2, Loader2, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { useChat } from '@/hooks/useChatStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';

const ChatSheet = () => {
  const { isOpen, messages, pendingQuestion, isLoading, isStreaming, closeChat, sendMessage, clearMessages } = useChat();
  const isMobile = useIsMobile();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-send pending question
  useEffect(() => {
    if (isOpen && pendingQuestion) {
      sendMessage(pendingQuestion);
    }
  }, [isOpen, pendingQuestion, sendMessage]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: isStreaming ? 'auto' : 'smooth'
    });
  }, [messages, isStreaming]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) closeChat();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, closeChat]);

  const sheetWidth = isMobile ? '100vw' : 'min(420px, 90vw)';

  return (
    <>
      {/* Backdrop */}
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

      {/* Sheet */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            className="fixed top-0 right-0 z-[100] h-full flex flex-col border-l border-[hsl(var(--border-subtle))]"
            style={{
              width: sheetWidth,
              background: 'hsl(var(--surface-1))',
            }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            role="dialog"
            aria-label="Chat com CLARA"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(var(--border-subtle))]">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-primary/35 bg-primary/10 text-primary">
                  <MessageCircle size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">CLARA</p>
                  <p className="text-[11px] text-muted-foreground">Assistente Administrativa</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={clearMessages}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--surface-3)/0.5)] transition-colors"
                    aria-label="Limpar conversa"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button
                  onClick={closeChat}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--surface-3)/0.5)] transition-colors"
                  aria-label="Fechar chat"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1">
              <div className="px-5 py-4 space-y-4">
                {messages.length === 0 && !isLoading && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-14 h-14 rounded-full border border-primary/25 bg-primary/5 flex items-center justify-center mb-4">
                      <MessageCircle className="w-6 h-6 text-primary/60" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">Olá! Sou a CLARA.</p>
                    <p className="text-xs text-muted-foreground max-w-[28ch]">
                      Faça uma pergunta sobre SEI-Rio, legislação ou rotinas administrativas.
                    </p>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-[hsl(var(--surface-2))] text-foreground border border-[hsl(var(--border-subtle))] rounded-bl-md'
                        }`}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="clara-prose">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && !isStreaming && (
                  <div className="flex justify-start">
                    <div className="bg-[hsl(var(--surface-2))] border border-[hsl(var(--border-subtle))] rounded-2xl rounded-bl-md px-4 py-3">
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="px-4 py-3 border-t border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface-1))]"
            >
              <div className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface-2)/0.6)] px-3 py-1.5 focus-within:border-primary/40 transition-colors">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Digite sua pergunta..."
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
              <p className="text-[10px] text-muted-foreground/60 text-center mt-2">
                CLARA pode cometer erros. Valide informações com fontes oficiais.
              </p>
            </form>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatSheet;

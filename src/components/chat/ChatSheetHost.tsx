import { lazy, Suspense, useEffect, useState } from 'react';

import { useChat } from '@/hooks/useChatStore';

const ChatSheet = lazy(() => import('@/components/ChatSheet'));

export function ChatSheetHost() {
  const { isOpen } = useChat();
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setShouldLoad(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isOpen]);

  if (!shouldLoad) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <ChatSheet />
    </Suspense>
  );
}

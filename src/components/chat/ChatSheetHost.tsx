import { lazy, Suspense, useState, useEffect } from "react";

import { useChat } from "@/hooks/useChatStore";

const ChatSheet = lazy(() => import("@/components/ChatSheet"));

export function ChatSheetHost() {
  const { isOpen } = useChat();
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => setShouldRender(true));
    }
  }, [isOpen]);

  if (!shouldRender) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <ChatSheet />
    </Suspense>
  );
}

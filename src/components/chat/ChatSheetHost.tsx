import { lazy, Suspense, useEffect, useState } from "react";

import { useChat } from "@/hooks/useChatStore";

const ChatSheet = lazy(() => import("@/components/ChatSheet"));

export function ChatSheetHost() {
  const { isOpen } = useChat();
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
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

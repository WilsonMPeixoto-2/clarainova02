import { type RefObject, useEffect, useRef } from 'react';

type FocusableElement = HTMLElement & {
  disabled?: boolean;
};

type UseModalAccessibilityOptions = {
  active: boolean;
  containerRef: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onClose?: () => void;
};

let activeModalCount = 0;
let previousBodyOverflow = '';

function getFocusableElements(container: HTMLElement) {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(container.querySelectorAll<FocusableElement>(selector)).filter((element) => {
    if (element.hidden) return false;
    if (element.getAttribute('aria-hidden') === 'true') return false;

    const computedStyle = window.getComputedStyle(element);
    return computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden';
  });
}

function setAppInert(shouldInert: boolean) {
  const appRoot = document.getElementById('root');
  if (!appRoot) return;

  const inertCapableRoot = appRoot as HTMLElement & { inert?: boolean };

  if (shouldInert) {
    if (activeModalCount === 0) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      inertCapableRoot.inert = true;
      appRoot.setAttribute('aria-hidden', 'true');
    }

    activeModalCount += 1;
    return;
  }

  activeModalCount = Math.max(0, activeModalCount - 1);
  if (activeModalCount > 0) return;

  inertCapableRoot.inert = false;
  appRoot.removeAttribute('aria-hidden');
  document.body.style.overflow = previousBodyOverflow;
}

export function useModalAccessibility({
  active,
  containerRef,
  initialFocusRef,
  onClose,
}: UseModalAccessibilityOptions) {
  const previousFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return undefined;

    previousFocusedElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    setAppInert(true);

    const focusInitialTarget = () => {
      const container = containerRef.current;
      if (!container) return;

      const explicitTarget = initialFocusRef?.current;
      const fallbackTarget = getFocusableElements(container)[0] ?? container;
      (explicitTarget ?? fallbackTarget)?.focus({ preventScroll: true });
    };

    const rafId = window.requestAnimationFrame(focusInitialTarget);

    const handleKeyDown = (event: KeyboardEvent) => {
      const container = containerRef.current;
      if (!container) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements(container);
      if (focusableElements.length === 0) {
        event.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (activeElement === firstElement || !container.contains(activeElement)) {
          event.preventDefault();
          lastElement.focus({ preventScroll: true });
        }
        return;
      }

      if (activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus({ preventScroll: true });
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(rafId);
      document.removeEventListener('keydown', handleKeyDown);
      setAppInert(false);

      if (activeModalCount === 0 && previousFocusedElementRef.current?.isConnected) {
        previousFocusedElementRef.current.focus({ preventScroll: true });
      }
    };
  }, [active, containerRef, initialFocusRef, onClose]);
}

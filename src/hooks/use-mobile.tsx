import * as React from "react";

const MOBILE_BREAKPOINT = 768;

const getInitialMobile = () =>
  typeof window !== "undefined" ? window.innerWidth < MOBILE_BREAKPOINT : false;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(getInitialMobile);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    onChange();
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}

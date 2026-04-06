import { lazy, Suspense, useEffect, useRef } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import { SoftWaveDivider } from "@/components/animations/SoftWaveDivider";
import GlobalStars from "@/components/animations/GlobalStars";
import { useChatActions } from "@/hooks/useChatStore";
import { DocumentMeta } from "@/components/DocumentMeta";
import { useLocation } from "react-router-dom";

const FeaturesSection = lazy(() => import("@/components/FeaturesSection"));
const FAQSection = lazy(() => import("@/components/FAQSection"));
import Footer from "@/components/Footer";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site-identity";

const GenericSkeleton = () => (
  <div className="w-full py-24 px-6 flex flex-col items-center justify-center gap-8 animate-pulse">
    <div className="w-full max-w-[280px] h-10 bg-white/5 rounded-xl" />
    <div className="w-full max-w-4xl h-[400px] bg-white/5 rounded-2xl" />
  </div>
);

const IndexContent = () => {
  const { openChat } = useChatActions();
  const location = useLocation();
  const handledSearchRef = useRef<string | null>(null);



  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shouldOpenChat = params.get("chat") === "1";
    const prefixedQuestion = params.get("q");

    if (!shouldOpenChat || handledSearchRef.current === location.search) return;

    handledSearchRef.current = location.search;
    openChat(prefixedQuestion || undefined);
  }, [location.search, openChat]);

  useEffect(() => {
    if (!location.hash) return;

    const id = location.hash.replace("#", "");
    const target = document.getElementById(id);
    if (!target) return;

    const frame = window.requestAnimationFrame(() => {
      const headerOffset = 104;
      const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top, behavior: "smooth" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-background">
      <DocumentMeta 
        title={SITE_TITLE}
        description={SITE_DESCRIPTION}
      />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg"
      >
        Pular para o conteúdo principal
      </a>

      <Header />
      <main id="main-content" className="site-main-canvas">
        <HeroSection />
        <SoftWaveDivider />
        <div className="relative max-w-[100vw] overflow-hidden">
          <GlobalStars />
          <Suspense fallback={<GenericSkeleton />}>
            <FeaturesSection />
            <FAQSection />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default IndexContent;

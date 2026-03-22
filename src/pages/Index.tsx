import { useEffect, useRef } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ManifestSection from "@/components/ManifestSection";
import FeaturesSection from "@/components/FeaturesSection";
import { SoftWaveDivider } from "@/components/animations/SoftWaveDivider";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import { useChat } from "@/hooks/useChatStore";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { useLocation } from "react-router-dom";

const IndexContent = () => {
  const { openChat } = useChat();
  const location = useLocation();
  const handledSearchRef = useRef<string | null>(null);

  useDocumentMeta({
    title: "CLARA — apoio ao uso do SEI-Rio e a rotinas administrativas",
    description:
      "CLARA é uma ferramenta de apoio para dúvidas sobre uso do SEI-Rio, documentos, tramitação, assinatura e etapas operacionais em rotinas administrativas.",
  });

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
        <FeaturesSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
};

export default IndexContent;

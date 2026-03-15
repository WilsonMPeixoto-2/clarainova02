import { lazy, Suspense } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import { ChatProvider } from "@/hooks/useChatStore";

const ChatSheet = lazy(() => import("@/components/ChatSheet"));

const Index = () => {
  return (
    <ChatProvider>
      <title>CLARA — apoio ao uso do SEI-Rio e a rotinas administrativas</title>
      <meta name="description" content="CLARA é uma ferramenta de apoio para dúvidas sobre uso do SEI-Rio, documentos, tramitação e etapas operacionais em rotinas administrativas." />
      <div className="min-h-screen bg-background">
        {/* Skip link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg"
        >
          Pular para o conteúdo principal
        </a>

        <Header />
        <main id="main-content" className="site-main-canvas">
          <HeroSection />
          <FeaturesSection />
          <FAQSection />
        </main>
        <Footer />
        <Suspense fallback={null}>
          <ChatSheet />
        </Suspense>
      </div>
    </ChatProvider>
  );
};

export default Index;

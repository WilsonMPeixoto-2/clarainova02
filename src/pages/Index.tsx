import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import ChatSheet from "@/components/ChatSheet";
import { ChatProvider } from "@/hooks/useChatStore";

const Index = () => {
  return (
    <ChatProvider>
      <title>CLARA — Consultora de Legislação e Apoio a Rotinas Administrativas</title>
      <meta name="description" content="CLARA é sua assistente especializada em sistemas eletrônicos de informações e procedimentos administrativos. Orientações passo a passo com indicação de fontes documentais." />
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
        <ChatSheet />
      </div>
    </ChatProvider>
  );
};

export default Index;

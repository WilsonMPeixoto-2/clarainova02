import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import KnowledgeBaseSection from "@/components/KnowledgeBaseSection";
import ServicesSection from "@/components/ServicesSection";
import FeaturesSection from "@/components/FeaturesSection";
import NumberedFeaturesSection from "@/components/NumberedFeaturesSection";
import StepsSection from "@/components/StepsSection";
import CTASection from "@/components/CTASection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <KnowledgeBaseSection />
        <ServicesSection />
        <FeaturesSection />
        <NumberedFeaturesSection />
        <StepsSection />
        <CTASection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

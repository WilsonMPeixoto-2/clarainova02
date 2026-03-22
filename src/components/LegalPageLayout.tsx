import type { ReactNode } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import Footer from '@/components/Footer';
import Header from '@/components/Header';

interface LegalSection {
  title: string;
  content: ReactNode;
}

interface LegalPageLayoutProps {
  kicker: string;
  title: string;
  description: string;
  updatedAt: string;
  sections: LegalSection[];
}

const LegalPageLayout = ({
  kicker,
  title,
  description,
  updatedAt,
  sections,
}: LegalPageLayoutProps) => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="legal-page-shell">
        <section className="legal-hero-section">
          <div className="container mx-auto px-6">
            <div className="legal-hero-card">
              <div className="legal-breadcrumbs">
                <Link to="/" className="legal-back-link">
                  <ArrowLeft size={15} aria-hidden="true" />
                  Voltar para a CLARA
                </Link>
                <span className="legal-meta-pill">{updatedAt}</span>
              </div>

              <span className="legal-kicker">
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                {kicker}
              </span>
              <h1 className="legal-title">{title}</h1>
              <p className="legal-description">{description}</p>
            </div>
          </div>
        </section>

        <section className="legal-content-section">
          <div className="container mx-auto px-6">
            <div className="legal-section-grid">
              {sections.map((section) => (
                <article key={section.title} className="legal-section-card">
                  <h2 className="legal-section-title">{section.title}</h2>
                  <div className="legal-section-body">{section.content}</div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LegalPageLayout;

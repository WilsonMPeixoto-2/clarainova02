const KnowledgeBaseSection = () => {
  return (
    <section className="relative py-24 px-6 noise-overlay">
      <div className="relative z-10 max-w-6xl mx-auto text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">
          Base de Conhecimento
        </p>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
          Um fluxo premium para transformar{" "}
          <span className="text-gradient-gold">dúvida em decisão</span>
        </h2>
        <p className="text-muted-foreground text-lg max-w-3xl mx-auto" style={{ lineHeight: "1.7" }}>
          Estrutura visual, técnica e operacional pensada para produtividade real: clareza, velocidade e precisão.
        </p>
      </div>
    </section>
  );
};

export default KnowledgeBaseSection;

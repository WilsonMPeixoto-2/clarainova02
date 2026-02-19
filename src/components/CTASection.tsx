const CTASection = () => {
  return (
    <section className="relative py-24 px-6 noise-overlay">
      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
          Pronto para validar um caso real da sua rotina?
        </h2>
        <button className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold text-base transition-all glow-pulse hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20 flex items-center justify-center gap-2 mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
          Iniciar análise com a CLARA
        </button>
      </div>
    </section>
  );
};

export default CTASection;

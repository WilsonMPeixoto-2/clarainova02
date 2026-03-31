import { useLocation, Link } from "react-router-dom";
import { ArrowLeft, ChatCircle } from "@phosphor-icons/react";
import { motion } from "motion/react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { DocumentMeta } from "@/components/DocumentMeta";
import { ClaraMonogram } from "@/components/ClaraMonogram";

const NotFound = () => {
  const location = useLocation();

  return (
    <>
      <DocumentMeta 
        title="Página não encontrada — CLARA"
        description="A rota solicitada não foi encontrada. Volte para a home da CLARA ou abra o chat para continuar a navegação."
      />
      <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-6 relative overflow-hidden">
        {/* Ambient glow */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[160px] opacity-20 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, hsl(var(--gold-2) / 0.4), hsl(var(--teal-1) / 0.15), transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          aria-hidden="true"
        />

        <motion.div
          className="glass-card rounded-2xl p-10 sm:p-14 max-w-xl w-full text-center space-y-6 relative z-10"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl border border-primary/30 bg-primary/10 mx-auto"
            initial={{ rotate: -8 }}
            animate={{ rotate: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <ClaraMonogram className="h-10 w-10" title="" />
          </motion.div>

          <div className="space-y-2">
            <h1 className="font-display text-7xl sm:text-8xl font-bold text-gradient-gold leading-none">
              404
            </h1>
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">
              Rota não encontrada
            </p>
          </div>

          <p className="text-muted-foreground text-base max-w-sm mx-auto">
            O caminho <strong className="text-foreground font-medium">{location.pathname}</strong> não existe ou foi movido. Mas a CLARA continua aqui para ajudar.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/"
              className="px-6 py-3 rounded-full border border-[hsl(var(--border-default))] text-foreground font-medium text-sm hover:border-primary/40 hover:bg-[hsl(var(--surface-2)/0.5)] transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para a home
            </Link>
            <Link
              to="/?chat=1"
              className="btn-clara-primary px-6 py-3 rounded-full font-semibold text-sm flex items-center gap-2"
            >
              <ChatCircle className="w-4 h-4" />
              Falar com a CLARA
            </Link>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
    </>
  );
};

export default NotFound;

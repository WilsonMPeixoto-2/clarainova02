import { Link } from "react-router-dom";

const Privacidade = () => {
  return (
    <>
    <title>Política de Privacidade — CLARA</title>
    <meta name="description" content="Política de Privacidade da CLARA - Consultora de Legislação e Apoio a Rotinas Administrativas, em conformidade com a LGPD." />
    <div className="min-h-screen bg-background text-foreground">
      <nav className="flex items-center justify-center gap-6 py-6 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground transition-colors">← Voltar para CLARA</Link>
        <Link to="/termos" className="hover:text-foreground transition-colors">Termos de Serviço</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pb-24">
        <h1 className="font-display text-4xl font-bold text-center mb-2">Política de Privacidade</h1>
        <p className="text-center text-primary font-medium mb-1">CLARA - Inteligência Administrativa</p>
        <p className="text-center text-sm text-muted-foreground mb-12">Última atualização: 25 de janeiro de 2026</p>

        <div className="space-y-8">
          {[
            {
              title: "1. Introdução",
              content: (
                <>
                  <p>A CLARA (Consultora de Legislação e Apoio a Rotinas Administrativas) é um assistente virtual especializado em orientações sobre legislação e procedimentos administrativos. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais quando você utiliza nosso serviço.</p>
                  <p className="mt-4">Estamos comprometidos com a proteção da sua privacidade e com o cumprimento da Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).</p>
                </>
              ),
            },
            {
              title: "2. Dados Coletados",
              content: (
                <>
                  <p>Ao utilizar a CLARA com autenticação via Google, coletamos os seguintes dados:</p>
                  <ul className="list-disc pl-6 mt-3 space-y-2">
                    <li><strong>Nome:</strong> Seu nome de exibição do perfil Google</li>
                    <li><strong>Email:</strong> Seu endereço de email do Google</li>
                    <li><strong>Foto do perfil:</strong> Sua foto de perfil do Google (opcional)</li>
                    <li><strong>Histórico de conversas:</strong> As mensagens trocadas com a CLARA</li>
                  </ul>
                  <p className="mt-4"><strong>Nota:</strong> Você pode utilizar a CLARA sem autenticação, porém o histórico de conversas não será salvo entre sessões.</p>
                </>
              ),
            },
            {
              title: "3. Uso dos Dados",
              content: (
                <p>Usamos seus dados exclusivamente para fornecer os serviços que você solicitou, incluindo personalização da experiência, manutenção do histórico de conversas e melhoria contínua do serviço.</p>
              ),
            },
            {
              title: "4. Seus Direitos",
              content: (
                <>
                  <p>Conforme a LGPD, você tem direito a:</p>
                  <ul className="list-disc pl-6 mt-3 space-y-2">
                    <li>Acessar seus dados pessoais</li>
                    <li>Corrigir dados incompletos ou desatualizados</li>
                    <li>Solicitar a exclusão dos seus dados</li>
                    <li>Revogar seu consentimento a qualquer momento</li>
                  </ul>
                </>
              ),
            },
          ].map((section, i) => (
            <div key={i} className="glass-card rounded-xl p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold text-foreground mb-4">{section.title}</h2>
              <div className="text-muted-foreground text-sm leading-relaxed" style={{ lineHeight: "1.7" }}>
                {section.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
};

export default Privacidade;

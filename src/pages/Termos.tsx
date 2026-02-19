import { Link } from "react-router-dom";

const Termos = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="flex items-center justify-center gap-6 py-6 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground transition-colors">← Voltar para CLARA</Link>
        <Link to="/privacidade" className="hover:text-foreground transition-colors">Política de Privacidade</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pb-24">
        <h1 className="font-display text-4xl font-bold text-center mb-2">Termos de Serviço</h1>
        <p className="text-center text-primary font-medium mb-1">CLARA - Inteligência Administrativa</p>
        <p className="text-center text-sm text-muted-foreground mb-12">Última atualização: 25 de janeiro de 2026</p>

        <div className="space-y-8">
          {[
            {
              title: "1. Aceitação dos Termos",
              content: "Ao acessar e utilizar a CLARA (Consultora de Legislação e Apoio a Rotinas Administrativas), você concorda em cumprir e estar vinculado a estes Termos de Serviço. Se você não concordar com qualquer parte destes termos, não poderá acessar o serviço.",
            },
            {
              title: "2. Descrição do Serviço",
              content: (
                <>
                  <p>A CLARA é um assistente virtual especializado em:</p>
                  <ul className="list-disc pl-6 mt-3 space-y-2">
                    <li>Orientações sobre o Sistema Eletrônico de Informações (SEI)</li>
                    <li>Procedimentos e rotinas administrativas</li>
                    <li>Consultas à legislação e normas aplicáveis</li>
                    <li>Sistemas de gestão pública</li>
                  </ul>
                </>
              ),
            },
            {
              title: "3. Uso Permitido",
              content: (
                <>
                  <p>Você pode utilizar a CLARA para consultas pessoais sobre procedimentos administrativos, auxílio em atividades profissionais e pesquisas sobre legislação.</p>
                  <p className="mt-4"><strong>É vedado:</strong> uso comercial ou revenda, tentativa de manipular o sistema, uso para fins ilegais ou antiéticos, e reprodução em massa do conteúdo.</p>
                </>
              ),
            },
            {
              title: "4. Limitação de Responsabilidade",
              content: (
                <>
                  <p className="text-primary font-medium mb-3">⚠️ Aviso Importante</p>
                  <p>A CLARA é uma ferramenta de apoio e suas orientações:</p>
                  <ul className="list-disc pl-6 mt-3 space-y-2">
                    <li><strong>NÃO substituem</strong> a consulta direta às normas oficiais</li>
                    <li><strong>NÃO substituem</strong> assessoria jurídica especializada</li>
                    <li><strong>NÃO têm</strong> caráter oficial ou vinculante</li>
                    <li>Podem conter imprecisões ou informações desatualizadas</li>
                  </ul>
                </>
              ),
            },
          ].map((section, i) => (
            <div key={i} className="glass-card rounded-xl p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold text-foreground mb-4">{section.title}</h2>
              <div className="text-muted-foreground text-sm leading-relaxed" style={{ lineHeight: "1.7" }}>
                {typeof section.content === "string" ? <p>{section.content}</p> : section.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Termos;

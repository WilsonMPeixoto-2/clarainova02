import { ArrowLeft, SignOut } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

interface AdminPageHeaderProps {
  onSignOut: () => void;
}

export default function AdminPageHeader({ onSignOut }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3 sm:gap-4">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2 px-2.5">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Voltar</span>
          </Button>
        </Link>
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            Base de Conhecimento — CLARA
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Governe o corpus da CLARA com curadoria, prioridade e leitura honesta do estado documental antes de cada ingestao.
          </p>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={onSignOut} title="Sair" className="w-full gap-2 sm:w-auto">
        <SignOut className="h-5 w-5" />
        <span>Sair</span>
      </Button>
    </div>
  );
}

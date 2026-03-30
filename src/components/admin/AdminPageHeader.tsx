import { ArrowLeft, SignOut } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

interface AdminPageHeaderProps {
  onSignOut: () => void;
}

export default function AdminPageHeader({ onSignOut }: AdminPageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Base de Conhecimento — CLARA
          </h1>
          <p className="text-sm text-muted-foreground">
            Governe o corpus inicial da CLARA com prioridade, metadados e curadoria antes de cada ingestao.
          </p>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={onSignOut} title="Sair">
        <SignOut className="h-5 w-5" />
      </Button>
    </div>
  );
}

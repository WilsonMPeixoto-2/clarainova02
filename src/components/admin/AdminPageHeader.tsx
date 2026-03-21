import { ArrowLeft, LogOut } from "lucide-react";
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
            Faça upload de PDFs para alimentar a base de conhecimento da assistente.
          </p>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={onSignOut} title="Sair">
        <LogOut className="h-5 w-5" />
      </Button>
    </div>
  );
}

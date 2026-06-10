import { useState } from "react";
import {
  Check,
  Download,
  FileCheck,
  Wallet,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader, PageShell } from "@/components/layout/PageShell";
import { cn } from "@/lib/utils";

type EngagementRow = {
  id: string;
  date: string;
  demandeur: string;
  objet: string;
  montant: string;
  statut: "En attente" | "Visé" | "Rejeté";
};

const statusVariant: Record<
  EngagementRow["statut"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  "En attente": "secondary",
  Visé: "default",
  Rejeté: "destructive",
};

const statusClass: Record<EngagementRow["statut"], string> = {
  "En attente": "bg-amber-100 text-amber-800 hover:bg-amber-100",
  Visé: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  Rejeté: "bg-red-100 text-red-800 hover:bg-red-100",
};

export default function VisaEngagements() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [data, setData] = useState<EngagementRow[]>([]);

  const pendingCount = data.filter((r) => r.statut === "En attente").length;

  const handleAction = (id: string, newStatus: EngagementRow["statut"]) => {
    const msg =
      newStatus === "Visé"
        ? "Confirmer le visa ?"
        : "Motif du rejet obligatoire :";
    if (window.confirm(msg)) {
      setData(
        data.map((item) =>
          item.id === id ? { ...item, statut: newStatus } : item
        )
      );
    }
  };

  return (
    <PageShell>
      <PageHeader
        icon={<FileCheck className="h-6 w-6 text-white" />}
        title="Visa des engagements budgétaires"
        description="Validez ou rejetez les dossiers soumis en attente de visa."
        badge="Module Engagements"
        action={
          <div className="rounded-xl bg-white/10 px-5 py-3 text-right backdrop-blur-sm ring-1 ring-white/20">
            <p className="text-xs font-medium uppercase tracking-wide text-white/70">
              Disponibilité
            </p>
            <p className="text-lg font-bold text-emerald-300">0 FCFA</p>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "En attente", value: pendingCount, color: "text-amber-600" },
          { label: "Visés", value: data.filter((r) => r.statut === "Visé").length, color: "text-emerald-600" },
          { label: "Rejetés", value: data.filter((r) => r.statut === "Rejeté").length, color: "text-red-600" },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 bg-white/80 shadow-sm backdrop-blur-sm">
            <CardContent className="flex items-center justify-between p-5">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden border-0 bg-white/90 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-indigo-600" />
            <h2 className="font-semibold text-gray-900">Registre des dossiers</h2>
          </div>
          <Button
            size="sm"
            className="gap-2 bg-slate-800 hover:bg-slate-900"
          >
            <Download className="h-4 w-4" />
            Exporter le registre
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                {["Réf", "Date", "Demandeur", "Objet", "Montant", "Statut", "Actions"].map(
                  (h) => (
                    <TableHead key={h} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {h}
                    </TableHead>
                  )
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    Aucun dossier en attente de visa
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => setActiveId(row.id)}
                    className={cn(
                      "cursor-pointer transition-colors",
                      activeId === row.id && "bg-indigo-50/60"
                    )}
                  >
                    <TableCell className="font-semibold text-indigo-600">
                      {row.id}
                    </TableCell>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.demandeur}</TableCell>
                    <TableCell>{row.objet}</TableCell>
                    <TableCell className="font-semibold">{row.montant}</TableCell>
                    <TableCell>
                      <Badge className={statusClass[row.statut]} variant={statusVariant[row.statut]}>
                        {row.statut}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {row.statut === "En attente" && (
                        <div className="flex gap-1.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(row.id, "Visé");
                            }}
                            title="Viser"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(row.id, "Rejeté");
                            }}
                            title="Rejeter"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </PageShell>
  );
}

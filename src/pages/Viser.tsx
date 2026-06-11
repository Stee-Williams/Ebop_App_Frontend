import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Download,
  FileCheck,
  Search,
  Wallet,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader, PageShell } from "@/components/layout/PageShell";
import {
  canVisaEngagements,
  ensureUserProvince,
  filterByUserProvince,
  getBudgetConsultation,
  getEngagements,
  getUserSession,
  updateEngagement,
  type EngagementItem,
} from "@/config/app";
import { useToast } from "@/hooks/use-toast";
import {
  buildExportRow,
  exportEngagementsPdf,
} from "@/lib/exportEngagementsPdf";
import { cn } from "@/lib/utils";

type VisaStatut = "En attente" | "Visé" | "Rejeté";

const STATUT_OPTIONS: { value: string; label: string }[] = [
  { value: "tous", label: "Tous les statuts" },
  { value: "En attente", label: "En attente" },
  { value: "Visé", label: "Visé" },
  { value: "Rejeté", label: "Rejeté" },
];

const statusVariant: Record<
  VisaStatut,
  "default" | "secondary" | "destructive" | "outline"
> = {
  "En attente": "secondary",
  Visé: "default",
  Rejeté: "destructive",
};

const statusClass: Record<VisaStatut, string> = {
  "En attente": "bg-amber-100 text-amber-800 hover:bg-amber-100",
  Visé: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  Rejeté: "bg-red-100 text-red-800 hover:bg-red-100",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XAF",
    maximumFractionDigits: 0,
  }).format(n);

const fmtDate = (d: string) => {
  const [y, m, day] = d.split("-");
  return day && m && y ? `${day}/${m}/${y}` : d;
};

function normalizeStatut(statut: string): VisaStatut {
  if (statut === "Visé" || statut === "Validé") return "Visé";
  if (statut === "Rejeté") return "Rejeté";
  return "En attente";
}

export default function VisaEngagements() {
  const { toast } = useToast();
  const user = getUserSession();
  const peutViser = user ? canVisaEngagements(user.role) : false;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EngagementItem[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("En attente");
  const [exporting, setExporting] = useState(false);
  const [budgetDisponible, setBudgetDisponible] = useState<number | null>(null);
  const [provinceNom, setProvinceNom] = useState<string | null>(null);

  const loadEngagements = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = (await ensureUserProvince()) ?? getUserSession();
      const provinceId = currentUser?.province_id ?? null;
      setProvinceNom(currentUser?.province_nom ?? null);

      const [items, budgetData] = await Promise.all([
        getEngagements(),
        getBudgetConsultation(),
      ]);
      setData(items);

      const lignes = filterByUserProvince(budgetData.lignes, provinceId);
      setBudgetDisponible(
        lignes.reduce((sum, l) => sum + l.montant_disponible, 0)
      );
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de charger les engagements.",
        variant: "destructive",
      });
      setBudgetDisponible(null);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadEngagements();
  }, [loadEngagements]);

  const stats = useMemo(
    () => ({
      pending: data.filter((r) => normalizeStatut(r.statut) === "En attente")
        .length,
      vised: data.filter((r) => normalizeStatut(r.statut) === "Visé").length,
      rejected: data.filter((r) => normalizeStatut(r.statut) === "Rejeté")
        .length,
    }),
    [data]
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return data.filter((row) => {
      const statut = normalizeStatut(row.statut);
      const matchStatut =
        filtreStatut === "tous" || statut === filtreStatut;

      if (!matchStatut) return false;

      if (!query) return true;

      const haystack = [
        row.numero,
        row.objet,
        row.titre,
        row.demandeur,
        row.fournisseur,
        row.administration_nom,
        row.province_nom,
        statut,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [data, filtreStatut, search]);

  const filtreLabel =
    STATUT_OPTIONS.find((o) => o.value === filtreStatut)?.label ??
    filtreStatut;

  const handleExport = () => {
    if (filteredRows.length === 0) {
      toast({
        title: "Aucune donnée",
        description: "Aucun engagement à exporter avec les filtres actuels.",
        variant: "destructive",
      });
      return;
    }

    setExporting(true);
    try {
      const user = getUserSession();
      exportEngagementsPdf({
        title: "Registre des engagements budgétaires",
        subtitle: "Visa des engagements — DGCPT",
        filtreStatut: filtreLabel,
        exportedBy: user?.nom,
        rows: filteredRows.map((row) =>
          buildExportRow(row, fmt, fmtDate, (s) => normalizeStatut(s))
        ),
      });
      toast({
        title: "Export réussi",
        description: `${filteredRows.length} engagement(s) exporté(s) en PDF.`,
      });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleAction = async (id: number, newStatus: "Visé" | "Rejeté") => {
    const msg =
      newStatus === "Visé"
        ? "Confirmer le visa ?"
        : "Motif du rejet obligatoire :";
    if (!window.confirm(msg)) return;

    setUpdatingId(id);
    try {
      await updateEngagement(id, { statut: newStatus });
      setData((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, statut: newStatus } : item
        )
      );
      toast({
        title: newStatus === "Visé" ? "Engagement visé" : "Engagement rejeté",
        description: "Le statut a été mis à jour.",
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description:
          err instanceof Error
            ? err.message
            : "Impossible de mettre à jour l'engagement.",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <PageShell>
      <PageHeader
        icon={<FileCheck className="h-6 w-6 text-white" />}
        title={
          peutViser
            ? "Visa des engagements budgétaires"
            : "Consultation des engagements"
        }
        description={
          peutViser
            ? "Validez ou rejetez les dossiers soumis en attente de visa."
            : "Consultez les dossiers soumis et leur statut de traitement."
        }
        badge="Module Engagements"
        action={
          <div className="rounded-xl bg-white/10 px-5 py-3 text-right backdrop-blur-sm ring-1 ring-white/20">
            <p className="text-xs font-medium uppercase tracking-wide text-white/70">
              Budget disponible
              {provinceNom ? ` · ${provinceNom}` : ""}
            </p>
            <p className="text-lg font-bold text-emerald-300">
              {loading
                ? "…"
                : budgetDisponible != null
                  ? fmt(budgetDisponible)
                  : "—"}
            </p>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "En attente", value: stats.pending, color: "text-amber-600" },
          { label: "Visés", value: stats.vised, color: "text-emerald-600" },
          { label: "Rejetés", value: stats.rejected, color: "text-red-600" },
        ].map((stat) => (
          <Card
            key={stat.label}
            className="border-0 bg-white/80 shadow-sm backdrop-blur-sm"
          >
            <CardContent className="flex items-center justify-between p-5">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={cn("text-2xl font-bold", stat.color)}>
                {loading ? "—" : stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 bg-white/80 shadow-sm backdrop-blur-sm">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par réf., objet, demandeur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 border-gray-200 bg-white pl-10"
            />
          </div>
          <Select value={filtreStatut} onValueChange={setFiltreStatut}>
            <SelectTrigger className="h-11 w-full border-gray-200 bg-white sm:w-52">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              {STATUT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-0 bg-white/90 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-indigo-600" />
            <h2 className="font-semibold text-gray-900">Registre des dossiers</h2>
            <span className="text-sm text-muted-foreground">
              {loading
                ? ""
                : `· ${filteredRows.length} résultat(s) · ${filtreLabel.toLowerCase()}`}
            </span>
          </div>
          <Button
            size="sm"
            className="gap-2 bg-slate-800 hover:bg-slate-900"
            onClick={handleExport}
            disabled={exporting || loading || filteredRows.length === 0}
          >
            <Download className="h-4 w-4" />
            {exporting ? "Export..." : "Exporter le registre"}
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                {[
                  "Réf",
                  "Date",
                  "Demandeur",
                  "Objet",
                  "Montant",
                  "Statut",
                  ...(peutViser ? ["Actions"] : []),
                ].map((h) => (
                  <TableHead
                    key={h}
                    className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={peutViser ? 7 : 6}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={peutViser ? 7 : 6}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Aucun dossier trouvé pour ce filtre
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => {
                  const statut = normalizeStatut(row.statut);
                  const canAct = peutViser && statut === "En attente";

                  return (
                    <TableRow
                      key={row.id}
                      onClick={() => setActiveId(row.id)}
                      className={cn(
                        "cursor-pointer transition-colors",
                        activeId === row.id && "bg-indigo-50/60"
                      )}
                    >
                      <TableCell className="font-semibold text-indigo-600">
                        {row.numero}
                      </TableCell>
                      <TableCell>{fmtDate(row.date)}</TableCell>
                      <TableCell>{row.demandeur ?? "—"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {row.objet ??
                          row.titre ??
                          row.ligne_budgetaire_libelle ??
                          "—"}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {fmt(row.montant)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={statusClass[statut]}
                          variant={statusVariant[statut]}
                        >
                          {statut}
                        </Badge>
                      </TableCell>
                      {peutViser && (
                        <TableCell>
                          {canAct ? (
                            <div className="flex gap-1.5">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700"
                                disabled={updatingId === row.id}
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
                                disabled={updatingId === row.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction(row.id, "Rejeté");
                                }}
                                title="Rejeter"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </PageShell>
  );
}

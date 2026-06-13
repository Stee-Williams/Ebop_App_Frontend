import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Download,
  Eye,
  FileCheck,
  Search,
  Wallet,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { TablePagination } from "@/components/TablePagination";

const PAGE_SIZE = 6;
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
  if (statut === "Réglé") return "Visé";
  return "En attente";
}

function isRegle(statut: string): boolean {
  return statut === "Réglé";
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
  const [pendingAction, setPendingAction] = useState<{
    id: number;
    status: "Visé" | "Rejeté";
    row: EngagementItem;
  } | null>(null);
  const [motifRejet, setMotifRejet] = useState("");
  const [detailRow, setDetailRow] = useState<EngagementItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

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
      setData(items.filter((item) => !isRegle(item.statut)));

      const budgets = filterByUserProvince(budgetData.budgets, provinceId);
      setBudgetDisponible(
        budgets.length > 0
          ? budgets.reduce((sum, b) => sum + b.montant, 0)
          : filterByUserProvince(budgetData.lignes, provinceId).reduce(
              (sum, l) => sum + l.montant_alloue,
              0
            )
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
      pending: data.filter(
        (r) => !isRegle(r.statut) && normalizeStatut(r.statut) === "En attente"
      ).length,
      vised: data.filter(
        (r) => !isRegle(r.statut) && normalizeStatut(r.statut) === "Visé"
      ).length,
      rejected: data.filter((r) => normalizeStatut(r.statut) === "Rejeté")
        .length,
    }),
    [data]
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return data.filter((row) => {
      if (isRegle(row.statut)) return false;

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

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filtreStatut]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const filtreLabel =
    STATUT_OPTIONS.find((o) => o.value === filtreStatut)?.label ??
    filtreStatut;

  const handleExport = async () => {
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
      await exportEngagementsPdf({
        title: "Registre des engagements budgétaires",
        subtitle: "Visa des engagements — DGCPT",
        filtreStatut: filtreLabel,
        exportedBy: user?.nom,
        rows: filteredRows.map((row) =>
          buildExportRow(row, fmtDate, (s) => normalizeStatut(s))
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

  const openActionDialog = (
    id: number,
    newStatus: "Visé" | "Rejeté",
    row: EngagementItem
  ) => {
    setMotifRejet("");
    setPendingAction({ id, status: newStatus, row });
  };

  const closeActionDialog = () => {
    if (updatingId !== null) return;
    setPendingAction(null);
    setMotifRejet("");
  };

  const confirmAction = async () => {
    if (!pendingAction) return;

    const { id, status, row } = pendingAction;

    if (status === "Rejeté" && !motifRejet.trim()) {
      toast({
        title: "Motif requis",
        description: "Veuillez indiquer un motif de rejet.",
        variant: "destructive",
      });
      return;
    }

    setUpdatingId(id);
    try {
      await updateEngagement(
        id,
        status === "Rejeté"
          ? { statut: status, motif_rejet: motifRejet.trim() }
          : { statut: status }
      );
      setData((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, statut: status } : item
        )
      );
      toast({
        title: status === "Visé" ? "Engagement visé" : "Engagement rejeté",
        description: "Le statut a été mis à jour.",
      });
      setPendingAction(null);
      setMotifRejet("");
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

  const pendingLabel =
    pendingAction?.row.objet ??
    pendingAction?.row.titre ??
    pendingAction?.row.ligne_budgetaire_libelle ??
    "—";

  type DetailField = {
    label: string;
    value?: string | null;
    highlight?: boolean;
    full?: boolean;
  };

  const detailFields = (row: EngagementItem): DetailField[] => [
    { label: "Référence", value: row.numero },
    { label: "Titre", value: row.titre ?? row.objet },
    { label: "Date", value: fmtDate(row.date) },
    { label: "Montant", value: fmt(row.montant), highlight: true },
    { label: "Statut", value: normalizeStatut(row.statut) },
    {
      label: "Demandeur",
      value: row.demandeur ?? (normalizeStatut(row.statut) === "En attente" ? "—" : null),
    },
    { label: "Fournisseur", value: row.fournisseur },
    { label: "Province", value: row.province_nom },
    { label: "Administration", value: row.administration_nom },
    { label: "Unité opérationnelle", value: row.unite_operationnelle_nom },
    { label: "Ligne budgétaire", value: row.ligne_budgetaire_libelle },
    {
      label: "Poste comptable",
      value: row.poste_comptable_libelle?.trim() || "Non renseigné",
    },
    ...(normalizeStatut(row.statut) === "Visé"
      ? [
          {
            label: "Date de visa",
            value: row.date_visa ? fmtDate(row.date_visa.slice(0, 10)) : null,
          },
        ]
      : []),
    ...(normalizeStatut(row.statut) === "Rejeté"
      ? [{ label: "Motif du rejet", value: row.motif_rejet, full: true }]
      : []),
  ];

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
              Enveloppe budgétaire
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
            <Wallet className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-gray-900">Registre des dossiers</h2>
            <span className="text-sm text-muted-foreground">
              {loading
                ? ""
                : `· ${filteredRows.length} résultat(s) · ${filtreLabel.toLowerCase()}`}
            </span>
          </div>
          <Button
            size="sm"
            className="gap-2 bg-primary hover:bg-primary/90"
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
                  "Actions",
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
                    colSpan={7}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Aucun dossier trouvé pour ce filtre
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((row) => {
                  const statut = normalizeStatut(row.statut);
                  const canAct = peutViser && statut === "En attente";

                  return (
                    <TableRow
                      key={row.id}
                      onClick={() => setActiveId(row.id)}
                      className={cn(
                        "cursor-pointer transition-colors",
                        activeId === row.id && "bg-primary/5"
                      )}
                    >
                      <TableCell className="font-semibold text-primary">
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
                      <TableCell>
                        <div className="flex gap-1.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="table-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailRow(row);
                            }}
                            title="Voir le détail"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canAct && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700"
                                disabled={updatingId === row.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openActionDialog(row.id, "Visé", row);
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
                                  openActionDialog(row.id, "Rejeté", row);
                                }}
                                title="Rejeter"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {!loading && filteredRows.length > 0 && (
          <TablePagination
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            totalItems={filteredRows.length}
            onPageChange={setCurrentPage}
            itemLabel="dossier"
          />
        )}
      </Card>

      <Dialog
        open={detailRow !== null}
        onOpenChange={(open) => {
          if (!open) setDetailRow(null);
        }}
      >
        <DialogContent className="max-w-lg border border-gray-200 bg-white shadow-xl">
          <DialogHeader>
            <DialogTitle>Détail de l&apos;engagement</DialogTitle>
            <DialogDescription>
              Informations complètes du dossier sélectionné.
            </DialogDescription>
          </DialogHeader>

          {detailRow && (
            <div className="grid gap-3 sm:grid-cols-2">
              {detailFields(detailRow).map((field) => (
                <div
                  key={field.label}
                  className={cn(
                    "rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5",
                    field.full && "sm:col-span-2"
                  )}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {field.label}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-sm text-gray-900",
                      field.highlight && "font-bold text-primary",
                      field.full && "whitespace-pre-wrap"
                    )}
                  >
                    {field.value?.toString().trim() || "—"}
                  </p>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailRow(null)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) closeActionDialog();
        }}
      >
        <DialogContent className="max-w-md border border-gray-200 bg-white shadow-xl">
          <DialogHeader>
            <DialogTitle>
              {pendingAction?.status === "Visé"
                ? "Confirmer le visa"
                : "Rejeter l'engagement"}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-2 text-left text-gray-600">
                <p>
                  {pendingAction?.status === "Visé"
                    ? "Voulez-vous viser cet engagement ?"
                    : "Indiquez le motif du rejet pour cet engagement."}
                </p>
                {pendingAction && (
                  <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
                    <p className="font-semibold text-gray-900">
                      {pendingAction.row.numero}
                    </p>
                    <p className="mt-1 text-gray-700">{pendingLabel}</p>
                    <p className="mt-2 font-medium text-primary">
                      {fmt(pendingAction.row.montant)}
                    </p>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          {pendingAction?.status === "Rejeté" && (
            <div className="space-y-2">
              <Label
                htmlFor="motif-rejet"
                className="text-xs font-semibold uppercase tracking-wide text-primary/80"
              >
                Motif du rejet *
              </Label>
              <Textarea
                id="motif-rejet"
                value={motifRejet}
                onChange={(e) => setMotifRejet(e.target.value)}
                placeholder="Saisissez le motif du rejet..."
                className="min-h-[100px] resize-none border-gray-200 bg-white"
              />
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={closeActionDialog}
              disabled={updatingId !== null}
            >
              Annuler
            </Button>
            <Button
              variant={pendingAction?.status === "Rejeté" ? "destructive" : "institution"}
              onClick={confirmAction}
              disabled={updatingId !== null}
              className="gap-2"
            >
              {updatingId !== null
                ? "Traitement..."
                : pendingAction?.status === "Visé"
                  ? "Confirmer le visa"
                  : "Confirmer le rejet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

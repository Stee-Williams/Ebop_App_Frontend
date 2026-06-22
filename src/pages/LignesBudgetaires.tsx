import { useEffect, useMemo, useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers,
  MapPin,
  Plus,
  Search,
  Trash2,
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
  createLigneBudgetaire,
  deleteLigneBudgetaire,
  getAdministrations,
  getBudgets,
  getLignesBudgetaires,
  getProvinces,
  type AdministrationItem,
  type BudgetListItem,
  type LigneBudgetaireListItem,
  type ProvinceItem,
} from "@/config/app";
import { useToast } from "@/hooks/use-toast";
import { useProvinceScope } from "@/hooks/useProvinceScope";
import { getPaginationRange } from "@/lib/pagination";
import { cn } from "@/lib/utils";

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XAF",
    maximumFractionDigits: 0,
  }).format(n);

const PAGE_SIZE = 6;

const emptyForm = {
  code: "",
  libelle: "",
  montant_alloue: "",
  budget_id: "",
};

export default function LignesBudgetaires() {
  const { toast } = useToast();
  const { canSelectAll, defaultFilter, filterProvinces, guardFilter } =
    useProvinceScope();
  const [loading, setLoading] = useState(true);
  const [lignes, setLignes] = useState<LigneBudgetaireListItem[]>([]);
  const [budgets, setBudgets] = useState<BudgetListItem[]>([]);
  const [provinces, setProvinces] = useState<ProvinceItem[]>([]);
  const [administrations, setAdministrations] = useState<AdministrationItem[]>([]);
  const [search, setSearch] = useState("");
  const [filtreProvince, setFiltreProvince] = useState(defaultFilter);
  const [filtreAdministration, setFiltreAdministration] = useState("tous");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<LigneBudgetaireListItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [detailLigne, setDetailLigne] = useState<LigneBudgetaireListItem | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lignesData, budgetsData, provincesData, administrationsData] =
        await Promise.all([
          getLignesBudgetaires(),
          getBudgets(),
          getProvinces(),
          getAdministrations(),
        ]);
      setLignes(lignesData);
      setBudgets(budgetsData);
      setProvinces(filterProvinces(provincesData));
      setAdministrations(administrationsData);
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de charger les lignes budgétaires.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setFiltreProvince(defaultFilter);
  }, [defaultFilter]);

  const administrationOptions = useMemo(
    () =>
      filtreProvince === "tous"
        ? administrations
        : administrations.filter(
            (a) => String(a.province_id) === filtreProvince
          ),
    [administrations, filtreProvince]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return lignes.filter((ligne) => {
      const matchProvince =
        filtreProvince === "tous" ||
        String(ligne.province_id) === filtreProvince;
      const matchAdministration =
        filtreAdministration === "tous" ||
        String(ligne.administration_id) === filtreAdministration;

      if (!matchProvince || !matchAdministration) return false;

      if (!query) return true;

      const haystack = [
        ligne.code,
        ligne.libelle,
        ligne.budget_libelle,
        ligne.province_nom,
        ligne.administration_nom,
        ligne.annee != null ? String(ligne.annee) : null,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [lignes, search, filtreProvince, filtreAdministration]);

  const handleProvinceChange = (value: string) => {
    setFiltreProvince(guardFilter(value));
    setFiltreAdministration("tous");
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filtreProvince, filtreAdministration]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const stats = useMemo(
    () => ({
      total: filtered.length,
      alloue: filtered.reduce((s, l) => s + l.montant_alloue, 0),
      utilise: filtered.reduce((s, l) => s + l.montant_utilise, 0),
    }),
    [filtered]
  );

  const handleCreate = async () => {
    if (!form.libelle.trim() || !form.montant_alloue || !form.budget_id) {
      toast({
        title: "Champs requis",
        description: "Libellé, montant alloué et budget sont obligatoires.",
        variant: "destructive",
      });
      return;
    }

    const montant = Number(form.montant_alloue);
    if (!Number.isFinite(montant) || montant <= 0) {
      toast({
        title: "Montant invalide",
        description: "Le montant alloué doit être un nombre positif.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await createLigneBudgetaire({
        code: form.code.trim() || undefined,
        libelle: form.libelle.trim(),
        montant_alloue: montant,
        budget_id: Number(form.budget_id),
      });
      toast({
        title: "Ligne créée",
        description: "La ligne budgétaire a été enregistrée.",
      });
      setShowCreate(false);
      setForm(emptyForm);
      await loadData();
    } catch (err) {
      toast({
        title: "Erreur",
        description:
          err instanceof Error ? err.message : "Création impossible.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;

    setDeletingId(deleting.id);
    try {
      await deleteLigneBudgetaire(deleting.id);
      toast({
        title: "Ligne supprimée",
        description: "La ligne budgétaire a été supprimée.",
      });
      setDeleting(null);
      await loadData();
    } catch (err) {
      toast({
        title: "Erreur",
        description:
          err instanceof Error ? err.message : "Suppression impossible.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const detailFields = (ligne: LigneBudgetaireListItem) => [
    { label: "Code", value: ligne.code },
    { label: "Libellé", value: ligne.libelle },
    { label: "Budget", value: ligne.budget_libelle },
    { label: "Année", value: ligne.annee != null ? String(ligne.annee) : null },
    { label: "Province", value: ligne.province_nom },
    { label: "Administration", value: ligne.administration_nom },
    { label: "Montant alloué", value: fmt(ligne.montant_alloue), highlight: true },
    { label: "Utilisé / décaissé", value: fmt(ligne.montant_utilise) },
    { label: "Montant disponible", value: fmt(ligne.montant_disponible) },
    {
      label: "Taux d'utilisation",
      value: `${ligne.taux_utilisation} %`,
    },
  ];

  return (
    <PageShell>
      <PageHeader
        icon={<Layers className="h-6 w-6 text-white" />}
        title="Gestion des lignes budgétaires"
        description="Consultez, créez et supprimez les lignes budgétaires rattachées aux budgets."
        badge="Administration"
        action={
          <Button
            variant="institution"
            className="gap-2 shadow-md"
            onClick={() => {
              setForm(emptyForm);
              setShowCreate(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Nouvelle ligne
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Lignes", value: stats.total },
          { label: "Total alloué", value: fmt(stats.alloue), small: true },
          { label: "Total utilisé / décaissé", value: fmt(stats.utilise), small: true },
        ].map((stat) => (
          <Card
            key={stat.label}
            className="border-0 bg-white/80 shadow-sm backdrop-blur-sm"
          >
            <CardContent className="p-5">
              <p
                className={cn(
                  "font-bold text-gray-900",
                  stat.small ? "text-lg" : "text-2xl"
                )}
              >
                {loading ? "—" : stat.value}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {stat.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 bg-white/80 shadow-sm backdrop-blur-sm">
        <CardContent className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par code, libellé, administration..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 border-gray-200 bg-white pl-10"
            />
          </div>
          <Select
            value={filtreProvince}
            onValueChange={handleProvinceChange}
            disabled={!canSelectAll}
          >
            <SelectTrigger className="h-11 border-gray-200 bg-white">
              <MapPin className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="Province" />
            </SelectTrigger>
            <SelectContent>
              {canSelectAll && (
                <SelectItem value="tous">Toutes les provinces</SelectItem>
              )}
              {provinces.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filtreAdministration}
            onValueChange={setFiltreAdministration}
          >
            <SelectTrigger className="h-11 border-gray-200 bg-white">
              <Building2 className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="Administration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Toutes les administrations</SelectItem>
              {administrationOptions.map((a) => (
                <SelectItem key={a.id} value={String(a.id)}>
                  {a.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-0 bg-white/90 shadow-sm backdrop-blur-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                {[
                  "Code",
                  "Libellé",
                  "Budget",
                  "Province",
                  "Administration",
                  "Alloué",
                  "Utilisé / décaissé",
                  "Disponible",
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
                    colSpan={9}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Aucune ligne budgétaire trouvée
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((ligne) => (
                  <TableRow
                    key={ligne.id}
                    className="table-row-interactive"
                  >
                    <TableCell className="font-mono text-sm">
                      {ligne.code || "—"}
                    </TableCell>
                    <TableCell className="max-w-[200px] font-medium">
                      {ligne.libelle}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{ligne.budget_libelle || "—"}</p>
                        {ligne.annee != null && (
                          <p className="text-xs text-muted-foreground">
                            {ligne.annee}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{ligne.province_nom || "—"}</TableCell>
                    <TableCell className="max-w-[160px] truncate">
                      {ligne.administration_nom || "—"}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {fmt(ligne.montant_alloue)}
                    </TableCell>
                    <TableCell>{fmt(ligne.montant_utilise)}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          ligne.montant_disponible <= 0
                            ? "bg-red-100 text-red-800 hover:bg-red-100"
                            : "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                        }
                      >
                        {fmt(ligne.montant_disponible)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="table-action-btn"
                          onClick={() => setDetailLigne(ligne)}
                          title="Voir le détail"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                          disabled={deletingId === ligne.id}
                          onClick={() => setDeleting(ligne)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="flex flex-col gap-4 border-t border-gray-100 bg-slate-50/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="shrink-0 text-sm text-muted-foreground">
              Affichage de{" "}
              <span className="font-medium text-gray-900">
                {(currentPage - 1) * PAGE_SIZE + 1}
              </span>
              {" à "}
              <span className="font-medium text-gray-900">
                {Math.min(currentPage * PAGE_SIZE, filtered.length)}
              </span>
              {" sur "}
              <span className="font-medium text-gray-900">
                {filtered.length}
              </span>{" "}
              ligne{filtered.length > 1 ? "s" : ""}
              {totalPages > 1 && (
                <span className="text-muted-foreground">
                  {" "}
                  · Page {currentPage}/{totalPages}
                </span>
              )}
            </p>

            {totalPages > 1 && (
              <Pagination className="mx-0 w-full justify-center sm:w-auto sm:justify-end">
                <PaginationContent className="flex-wrap justify-center gap-1 rounded-xl border border-gray-200 bg-white px-2 py-1 shadow-sm">
                  <PaginationItem>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 gap-1 px-2.5"
                      disabled={currentPage <= 1}
                      onClick={() =>
                        setCurrentPage((p) => Math.max(1, p - 1))
                      }
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Précédent</span>
                    </Button>
                  </PaginationItem>

                  {getPaginationRange(currentPage, totalPages).map(
                    (token, index) =>
                      token === "ellipsis" ? (
                        <PaginationItem key={`ellipsis-${index}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={token}>
                          <PaginationLink
                            href="#"
                            isActive={token === currentPage}
                            className={cn(
                              "h-9 w-9",
                              token === currentPage &&
                                "pagination-active"
                            )}
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(token);
                            }}
                          >
                            {token}
                          </PaginationLink>
                        </PaginationItem>
                      )
                  )}

                  <PaginationItem>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 gap-1 px-2.5"
                      disabled={currentPage >= totalPages}
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                    >
                      <span className="hidden sm:inline">Suivant</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )}
      </Card>

      <Dialog
        open={detailLigne !== null}
        onOpenChange={(open) => {
          if (!open) setDetailLigne(null);
        }}
      >
        <DialogContent className="max-w-lg border border-gray-200 bg-white shadow-xl">
          <DialogHeader>
            <DialogTitle>Détail de la ligne budgétaire</DialogTitle>
            <DialogDescription>
              Informations complètes de la ligne sélectionnée.
            </DialogDescription>
          </DialogHeader>

          {detailLigne && (
            <div className="grid gap-3 sm:grid-cols-2">
              {detailFields(detailLigne).map((field) => (
                <div
                  key={field.label}
                  className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {field.label}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-sm text-gray-900",
                      field.highlight && "font-bold text-primary"
                    )}
                  >
                    {field.value?.toString().trim() || "—"}
                  </p>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailLigne(null)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md border border-gray-200 bg-white shadow-xl">
          <DialogHeader>
            <DialogTitle>Nouvelle ligne budgétaire</DialogTitle>
            <DialogDescription>
              Rattachez la ligne à un budget existant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-primary/80">
                Budget *
              </Label>
              <Select
                value={form.budget_id}
                onValueChange={(v) => setForm({ ...form, budget_id: v })}
              >
                <SelectTrigger className="h-11 border-gray-200">
                  <SelectValue placeholder="Sélectionner un budget" />
                </SelectTrigger>
                <SelectContent>
                  {budgets.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.libelle} ({b.annee})
                      {b.province_nom ? ` — ${b.province_nom}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-primary/80">
                Code
              </Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="Ex. L001"
                className="h-11 border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-primary/80">
                Libellé *
              </Label>
              <Input
                value={form.libelle}
                onChange={(e) => setForm({ ...form, libelle: e.target.value })}
                placeholder="Ex. Fonctionnement courant"
                className="h-11 border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-primary/80">
                Montant alloué (FCFA) *
              </Label>
              <Input
                type="number"
                min={1}
                value={form.montant_alloue}
                onChange={(e) =>
                  setForm({ ...form, montant_alloue: e.target.value })
                }
                placeholder="0"
                className="h-11 border-gray-200"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowCreate(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button
              variant="institution"
              onClick={handleCreate}
              disabled={saving || budgets.length === 0}
            >
              {saving ? "Enregistrement..." : "Créer la ligne"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <DialogContent className="max-w-md border border-gray-200 bg-white shadow-xl">
          <DialogHeader>
            <DialogTitle>Supprimer la ligne budgétaire</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-2 text-left text-gray-600">
                <p>Cette action est irréversible.</p>
                {deleting && deleting.montant_utilise > 0 && (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    Cette ligne a un montant utilisé de{" "}
                    {fmt(deleting.montant_utilise)}. Les engagements liés
                    seront détachés et le budget libéré avant suppression.
                  </p>
                )}
                {deleting && (
                  <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
                    <p className="font-semibold text-gray-900">
                      {deleting.code ? `${deleting.code} — ` : ""}
                      {deleting.libelle}
                    </p>
                    <p className="mt-1 text-primary">
                      {fmt(deleting.montant_alloue)}
                    </p>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleting(null)}
              disabled={deletingId !== null}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deletingId !== null}
            >
              {deletingId !== null ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

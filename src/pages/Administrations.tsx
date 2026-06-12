import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Eye,
  Layers,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
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
import { Separator } from "@/components/ui/separator";
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
import {
  createAdministration,
  deleteAdministration,
  getAdministrationById,
  getAdministrations,
  getProvinces,
  updateAdministration,
  type AdministrationItem,
  type AdministrationUniteItem,
  type CreateAdministrationUnitePayload,
  type ProvinceItem,
} from "@/config/app";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 6;
const CURRENT_YEAR = new Date().getFullYear();

const emptyAdminForm = {
  nom: "",
  code: "",
  province_id: "",
};

type LigneDraft = {
  key: string;
  code: string;
  libelle: string;
  montant_alloue: string;
};

type UniteDraft = {
  key: string;
  nom: string;
  code: string;
  budget_annee: string;
  lignes: LigneDraft[];
};

const newLigne = (): LigneDraft => ({
  key: crypto.randomUUID(),
  code: "",
  libelle: "",
  montant_alloue: "",
});

const newUnite = (): UniteDraft => ({
  key: crypto.randomUUID(),
  nom: "",
  code: "",
  budget_annee: String(CURRENT_YEAR),
  lignes: [newLigne()],
});

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XAF",
    maximumFractionDigits: 0,
  }).format(n);

function buildUnitesPayload(unites: UniteDraft[]): CreateAdministrationUnitePayload[] {
  return unites
    .filter((u) => u.nom.trim())
    .map((u) => ({
      nom: u.nom.trim(),
      code: u.code.trim() || undefined,
      budget_annee: Number(u.budget_annee) || CURRENT_YEAR,
      lignes_budgetaires: u.lignes
        .filter((l) => l.libelle.trim() && l.montant_alloue)
        .map((l) => ({
          code: l.code.trim() || undefined,
          libelle: l.libelle.trim(),
          montant_alloue: Number(l.montant_alloue),
        }))
        .filter((l) => Number.isFinite(l.montant_alloue) && l.montant_alloue > 0),
    }));
}

export default function Administrations() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AdministrationItem[]>([]);
  const [provinces, setProvinces] = useState<ProvinceItem[]>([]);
  const [search, setSearch] = useState("");
  const [filtreProvince, setFiltreProvince] = useState("tous");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdministrationItem | null>(null);
  const [form, setForm] = useState(emptyAdminForm);
  const [unites, setUnites] = useState<UniteDraft[]>([newUnite()]);
  const [existingUnites, setExistingUnites] = useState<AdministrationUniteItem[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<AdministrationItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AdministrationItem | null>(null);
  const [loadingDetailView, setLoadingDetailView] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [administrationsData, provincesData] = await Promise.all([
        getAdministrations(),
        getProvinces(),
      ]);
      setItems(administrationsData);
      setProvinces(provincesData);
    } catch (err) {
      toast({
        title: "Erreur",
        description:
          err instanceof Error ? err.message : "Chargement impossible.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const provinceOk =
        filtreProvince === "tous" ||
        String(item.province_id) === filtreProvince;
      const searchOk =
        q === "" ||
        [item.nom, item.code, item.province_nom]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      return provinceOk && searchOk;
    });
  }, [items, search, filtreProvince]);

  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filtreProvince]);

  const resetFormState = () => {
    setForm(emptyAdminForm);
    setUnites([newUnite()]);
    setExistingUnites([]);
  };

  const openCreate = () => {
    setEditing(null);
    resetFormState();
    setShowForm(true);
  };

  const openEdit = async (item: AdministrationItem) => {
    setEditing(item);
    setForm({
      nom: item.nom,
      code: item.code,
      province_id: item.province_id != null ? String(item.province_id) : "",
    });
    setUnites([newUnite()]);
    setExistingUnites([]);
    setShowForm(true);
    setLoadingDetail(true);
    try {
      const detailData = await getAdministrationById(item.id);
      setExistingUnites(detailData.unites_operationnelles ?? []);
    } catch (err) {
      toast({
        title: "Erreur",
        description:
          err instanceof Error ? err.message : "Détail introuvable.",
        variant: "destructive",
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  const openDetail = async (item: AdministrationItem) => {
    setDetail(null);
    setLoadingDetailView(true);
    try {
      const detailData = await getAdministrationById(item.id);
      setDetail(detailData);
    } catch (err) {
      toast({
        title: "Erreur",
        description:
          err instanceof Error ? err.message : "Détail introuvable.",
        variant: "destructive",
      });
    } finally {
      setLoadingDetailView(false);
    }
  };

  const updateUnite = (key: string, patch: Partial<UniteDraft>) => {
    setUnites((prev) =>
      prev.map((u) => (u.key === key ? { ...u, ...patch } : u))
    );
  };

  const updateLigne = (
    uniteKey: string,
    ligneKey: string,
    patch: Partial<LigneDraft>
  ) => {
    setUnites((prev) =>
      prev.map((u) =>
        u.key === uniteKey
          ? {
              ...u,
              lignes: u.lignes.map((l) =>
                l.key === ligneKey ? { ...l, ...patch } : l
              ),
            }
          : u
      )
    );
  };

  const addUnite = () => setUnites((prev) => [...prev, newUnite()]);

  const removeUnite = (key: string) => {
    setUnites((prev) =>
      prev.length > 1 ? prev.filter((u) => u.key !== key) : prev
    );
  };

  const addLigne = (uniteKey: string) => {
    setUnites((prev) =>
      prev.map((u) =>
        u.key === uniteKey ? { ...u, lignes: [...u.lignes, newLigne()] } : u
      )
    );
  };

  const removeLigne = (uniteKey: string, ligneKey: string) => {
    setUnites((prev) =>
      prev.map((u) =>
        u.key === uniteKey
          ? {
              ...u,
              lignes:
                u.lignes.length > 1
                  ? u.lignes.filter((l) => l.key !== ligneKey)
                  : u.lignes,
            }
          : u
      )
    );
  };

  const handleSave = async () => {
    if (!form.nom.trim() || !form.code.trim()) {
      toast({
        title: "Champs requis",
        description: "Le nom et le code sont obligatoires.",
        variant: "destructive",
      });
      return;
    }

    const unitesPayload = buildUnitesPayload(unites);

    setSaving(true);
    try {
      const payload = {
        nom: form.nom.trim(),
        code: form.code.trim(),
        province_id: form.province_id ? Number(form.province_id) : null,
        ...(unitesPayload.length > 0
          ? { unites_operationnelles: unitesPayload }
          : {}),
      };

      if (editing) {
        await updateAdministration(editing.id, payload);
        toast({ title: "Administration mise à jour" });
      } else {
        await createAdministration(payload);
        toast({ title: "Administration créée" });
      }

      setShowForm(false);
      resetFormState();
      await loadData();
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Enregistrement impossible.",
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
      await deleteAdministration(deleting.id);
      toast({ title: "Administration supprimée" });
      setDeleting(null);
      await loadData();
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Suppression impossible.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const renderUniteEditor = (unite: UniteDraft, index: number) => (
    <div
      key={unite.key}
      className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-4"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800">
          Unité opérationnelle {index + 1}
        </p>
        {unites.length > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => removeUnite(unite.key)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-2 sm:col-span-2">
          <Label>Nom de l'unité</Label>
          <Input
            value={unite.nom}
            onChange={(e) => updateUnite(unite.key, { nom: e.target.value })}
            placeholder="Ex. Direction des finances"
          />
        </div>
        <div className="grid gap-2">
          <Label>Code</Label>
          <Input
            value={unite.code}
            onChange={(e) => updateUnite(unite.key, { code: e.target.value })}
            placeholder="UO-001"
          />
        </div>
        <div className="grid gap-2">
          <Label>Année budgétaire</Label>
          <Input
            type="number"
            min={2000}
            max={2100}
            value={unite.budget_annee}
            onChange={(e) =>
              updateUnite(unite.key, { budget_annee: e.target.value })
            }
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Layers className="h-4 w-4" />
            Lignes budgétaires
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => addLigne(unite.key)}
          >
            <Plus className="h-3.5 w-3.5" />
            Ligne
          </Button>
        </div>

        {unite.lignes.map((ligne, ligneIndex) => (
          <div
            key={ligne.key}
            className="grid gap-2 rounded-md border border-dashed border-slate-200 bg-white p-3 sm:grid-cols-12"
          >
            <div className="sm:col-span-2">
              <Label className="text-xs">Code</Label>
              <Input
                value={ligne.code}
                onChange={(e) =>
                  updateLigne(unite.key, ligne.key, { code: e.target.value })
                }
                placeholder="L001"
                className="h-9"
              />
            </div>
            <div className="sm:col-span-5">
              <Label className="text-xs">Libellé</Label>
              <Input
                value={ligne.libelle}
                onChange={(e) =>
                  updateLigne(unite.key, ligne.key, { libelle: e.target.value })
                }
                placeholder="Fonctionnement"
                className="h-9"
              />
            </div>
            <div className="sm:col-span-4">
              <Label className="text-xs">Montant alloué (XAF)</Label>
              <Input
                type="number"
                min={0}
                value={ligne.montant_alloue}
                onChange={(e) =>
                  updateLigne(unite.key, ligne.key, {
                    montant_alloue: e.target.value,
                  })
                }
                placeholder="0"
                className="h-9"
              />
            </div>
            <div className="flex items-end justify-end sm:col-span-1">
              {unite.lignes.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive"
                  onClick={() => removeLigne(unite.key, ligne.key)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground sm:col-span-12">
              Ligne {ligneIndex + 1}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <PageShell>
      <PageHeader
        icon={<Building2 className="h-6 w-6 text-white" />}
        title="Gestion des administrations"
        description="Créez une administration avec ses unités opérationnelles et lignes budgétaires."
        badge="Référentiel"
        action={
          <Button variant="institution" className="gap-2 shadow-md" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nouvelle administration
          </Button>
        }
      />

      <Card className="border-0 bg-white/80 shadow-sm backdrop-blur-sm">
        <CardContent className="flex flex-wrap items-center gap-3 p-5">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, code, province..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 border-gray-200 bg-white pl-10"
            />
          </div>
          <Select value={filtreProvince} onValueChange={setFiltreProvince}>
            <SelectTrigger className="h-11 w-full max-w-xs border-gray-200 bg-white">
              <MapPin className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="Province" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Toutes les provinces</SelectItem>
              {provinces.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.nom}
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
                {["Code", "Nom", "Province", "Unités", "Actions"].map((h) => (
                  <TableHead key={h} className="font-semibold text-slate-700">
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : pageItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    Aucune administration trouvée.
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">{item.code}</TableCell>
                    <TableCell className="font-medium">{item.nom}</TableCell>
                    <TableCell>{item.province_nom ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {item.unites_count ?? 0} UO
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => void openDetail(item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => void openEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleting(item)}
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
          <TablePagination
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            totalItems={filtered.length}
            onPageChange={setCurrentPage}
            itemLabel="administration"
          />
        )}
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden sm:max-w-3xl">
          <DialogHeader className="shrink-0">
            <DialogTitle>
              {editing ? "Modifier l'administration" : "Nouvelle administration"}
            </DialogTitle>
            <DialogDescription>
              Renseignez l'administration, puis ajoutez des unités opérationnelles
              et leurs lignes budgétaires.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-1 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="admin-code">Code administration</Label>
                <Input
                  id="admin-code"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="admin-nom">Nom</Label>
                <Input
                  id="admin-nom"
                  value={form.nom}
                  onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label>Province</Label>
                <Select
                  value={form.province_id || "none"}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      province_id: v === "none" ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une province" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    {provinces.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {editing && (
              <div className="space-y-3">
                <Separator />
                <p className="text-sm font-semibold text-slate-800">
                  Unités existantes
                </p>
                {loadingDetail ? (
                  <p className="text-sm text-muted-foreground">Chargement...</p>
                ) : existingUnites.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucune unité opérationnelle enregistrée.
                  </p>
                ) : (
                  existingUnites.map((uo) => (
                    <div
                      key={uo.id}
                      className="rounded-lg border bg-white p-3 text-sm"
                    >
                      <p className="font-medium">
                        {uo.nom}
                        {uo.code ? ` (${uo.code})` : ""}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {uo.lignes_budgetaires.length} ligne(s) budgétaire(s)
                        {uo.budget_annee ? ` · ${uo.budget_annee}` : ""}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800">
                  {editing
                    ? "Ajouter des unités opérationnelles"
                    : "Unités opérationnelles"}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={addUnite}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Unité
                </Button>
              </div>
              {unites.map((unite, index) => renderUniteEditor(unite, index))}
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t pt-4">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
            <Button variant="institution" onClick={handleSave} disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer l'administration</DialogTitle>
            <DialogDescription>
              Confirmer la suppression de « {deleting?.nom} » ? Cette action est
              irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deletingId != null}
            >
              {deletingId != null ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detail !== null || loadingDetailView} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détail administration</DialogTitle>
          </DialogHeader>
          {loadingDetailView ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Chargement...
            </p>
          ) : detail ? (
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                {[
                  { label: "Code", value: detail.code },
                  { label: "Nom", value: detail.nom },
                  { label: "Province", value: detail.province_nom ?? "—" },
                ].map((field) => (
                  <div key={field.label}>
                    <dt className="text-muted-foreground">{field.label}</dt>
                    <dd className="font-medium">{field.value}</dd>
                  </div>
                ))}
              </dl>

              <Separator />

              {(detail.unites_operationnelles ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucune unité opérationnelle.
                </p>
              ) : (
                detail.unites_operationnelles?.map((uo) => (
                  <div
                    key={uo.id}
                    className={cn(
                      "rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-3"
                    )}
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{uo.nom}</p>
                      <p className="text-xs text-muted-foreground">
                        {uo.code ?? "Sans code"}
                        {uo.budget_annee ? ` · Budget ${uo.budget_annee}` : ""}
                      </p>
                    </div>
                    {uo.lignes_budgetaires.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Aucune ligne budgétaire.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {uo.lignes_budgetaires.map((ligne) => (
                          <div
                            key={ligne.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white px-3 py-2 text-sm"
                          >
                            <div>
                              <p className="font-medium">{ligne.libelle}</p>
                              <p className="text-xs text-muted-foreground">
                                {ligne.code ?? "—"}
                              </p>
                            </div>
                            <p className="font-mono text-sm">
                              {fmt(ligne.montant_alloue)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

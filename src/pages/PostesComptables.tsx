import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Eye,
  Landmark,
  MapPin,
  Pencil,
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
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, PageShell } from "@/components/layout/PageShell";
import { TablePagination } from "@/components/TablePagination";
import {
  createPosteComptable,
  deletePosteComptable,
  getPostesComptables,
  getProvinces,
  updatePosteComptable,
  type PosteComptableItem,
  type ProvinceItem,
} from "@/config/app";
import { useToast } from "@/hooks/use-toast";
import { useProvinceScope } from "@/hooks/useProvinceScope";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 8;

const TYPE_OPTIONS = [
  { value: "tresorerie_provinciale", label: "Trésorerie provinciale" },
  { value: "recette_perception", label: "Recette-perception" },
  { value: "perception", label: "Perception" },
] as const;

const TYPE_LABELS: Record<string, string> = {
  tresorerie_provinciale: "Trésorerie provinciale",
  recette_perception: "Recette-perception",
  perception: "Perception",
};

const TYPE_VARIANT: Record<
  string,
  "default" | "secondary" | "outline"
> = {
  tresorerie_provinciale: "default",
  recette_perception: "secondary",
  perception: "outline",
};

const emptyForm = {
  code: "",
  libelle: "",
  description: "",
  type: "",
  province_id: "",
};

export default function PostesComptables() {
  const { toast } = useToast();
  const { canSelectAll, defaultFilter, filterProvinces, guardFilter, session } =
    useProvinceScope();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PosteComptableItem[]>([]);
  const [provinces, setProvinces] = useState<ProvinceItem[]>([]);
  const [search, setSearch] = useState("");
  const [filtreProvince, setFiltreProvince] = useState(defaultFilter);
  const [filtreType, setFiltreType] = useState("tous");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PosteComptableItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<PosteComptableItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [detail, setDetail] = useState<PosteComptableItem | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [postesData, provincesData] = await Promise.all([
        getPostesComptables(),
        getProvinces(),
      ]);
      setItems(postesData);
      setProvinces(filterProvinces(provincesData));
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

  useEffect(() => {
    setFiltreProvince(defaultFilter);
  }, [defaultFilter]);

  const handleProvinceChange = (value: string) => {
    setFiltreProvince(guardFilter(value));
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const provinceOk =
        filtreProvince === "tous" ||
        String(item.province_id) === filtreProvince;
      const typeOk =
        filtreType === "tous" || item.type === filtreType;
      const searchOk =
        q === "" ||
        [item.code, item.libelle, item.description, item.province_nom, item.type]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      return provinceOk && typeOk && searchOk;
    });
  }, [items, search, filtreProvince, filtreType]);

  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const stats = useMemo(() => {
    const byType = (type: string) =>
      filtered.filter((item) => item.type === type).length;
    return {
      total: filtered.length,
      tp: byType("tresorerie_provinciale"),
      rp: byType("recette_perception"),
      pc: byType("perception"),
    };
  }, [filtered]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filtreProvince, filtreType]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    if (!canSelectAll && session?.province_id != null) {
      setForm((prev) => ({
        ...prev,
        province_id: String(session.province_id),
      }));
    }
    setShowForm(true);
  };

  const openEdit = (item: PosteComptableItem) => {
    setEditing(item);
    setForm({
      code: item.code ?? "",
      libelle: item.libelle,
      description: item.description ?? "",
      type: item.type ?? "",
      province_id: item.province_id != null ? String(item.province_id) : "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.libelle.trim()) {
      toast({
        title: "Champs requis",
        description: "Le libellé est obligatoire.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: form.code.trim() || undefined,
        libelle: form.libelle.trim(),
        description: form.description.trim() || undefined,
        type: form.type || undefined,
        province_id: form.province_id ? Number(form.province_id) : null,
      };

      if (editing) {
        await updatePosteComptable(editing.id, payload);
        toast({ title: "Poste comptable mis à jour" });
      } else {
        await createPosteComptable(payload);
        toast({ title: "Poste comptable créé" });
      }

      setShowForm(false);
      resetForm();
      await loadData();
    } catch (err) {
      toast({
        title: "Erreur",
        description:
          err instanceof Error ? err.message : "Enregistrement impossible.",
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
      await deletePosteComptable(deleting.id);
      toast({ title: "Poste comptable supprimé" });
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

  return (
    <PageShell>
      <PageHeader
        icon={<Landmark className="h-6 w-6 text-white" />}
        badge="DGCPT"
        title="Postes comptables"
        description="Réseau du Trésor public — trésoreries provinciales, recettes-perceptions et perceptions (48 postes)."
        action={
          <Button variant="institution" className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nouveau poste
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total", value: stats.total, icon: Landmark },
          { label: "Trésoreries provinciales", value: stats.tp, icon: Building2 },
          { label: "Recettes-perceptions", value: stats.rp, icon: MapPin },
          { label: "Perceptions", value: stats.pc, icon: Eye },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 bg-white/80 shadow-sm">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
              <stat.icon className="h-8 w-8 text-primary/40" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 bg-white/80 shadow-sm backdrop-blur-sm">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par code, libellé, province..."
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
            <SelectTrigger className="h-11 w-full max-w-xs border-gray-200 bg-white">
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
          <Select value={filtreType} onValueChange={setFiltreType}>
            <SelectTrigger className="h-11 w-full max-w-xs border-gray-200 bg-white">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les types</SelectItem>
              {TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-0 bg-white/90 shadow-sm backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Libellé</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Province</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                  Aucun poste comptable trouvé.
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm">
                    {item.code ?? "—"}
                  </TableCell>
                  <TableCell className="font-medium">{item.libelle}</TableCell>
                  <TableCell>
                    {item.type ? (
                      <Badge variant={TYPE_VARIANT[item.type] ?? "outline"}>
                        {TYPE_LABELS[item.type] ?? item.type}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{item.province_nom ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setDetail(item)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(item)}
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

        {!loading && filtered.length > 0 && (
          <TablePagination
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            pageSize={PAGE_SIZE}
            totalItems={filtered.length}
            itemLabel="poste comptable"
          />
        )}
      </Card>

      <Dialog open={showForm} onOpenChange={(open) => !open && setShowForm(false)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier le poste comptable" : "Nouveau poste comptable"}
            </DialogTitle>
            <DialogDescription>
              Guichet du Trésor public chargé de l&apos;exécution comptable des
              opérations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pc-code">Code</Label>
                <Input
                  id="pc-code"
                  value={form.code}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, code: e.target.value }))
                  }
                  placeholder="TP-G1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pc-type">Type</Label>
                <Select
                  value={form.type || "none"}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      type: value === "none" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger id="pc-type">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Non renseigné</SelectItem>
                    {TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pc-libelle">Libellé *</Label>
              <Input
                id="pc-libelle"
                value={form.libelle}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, libelle: e.target.value }))
                }
                placeholder="Trésorerie provinciale de l'Estuaire"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pc-province">Province</Label>
              <Select
                value={form.province_id || "none"}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    province_id: value === "none" ? "" : value,
                  }))
                }
                disabled={!canSelectAll}
              >
                <SelectTrigger id="pc-province">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {canSelectAll && (
                    <SelectItem value="none">Non renseignée</SelectItem>
                  )}
                  {provinces.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pc-description">Description</Label>
              <Textarea
                id="pc-description"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
                placeholder="Localisation ou précisions..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
            <Button variant="institution" onClick={() => void handleSave()} disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detail !== null} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Détail poste comptable</DialogTitle>
          </DialogHeader>
          {detail && (
            <dl className="space-y-3 text-sm">
              {[
                { label: "Code", value: detail.code ?? "—" },
                { label: "Libellé", value: detail.libelle },
                {
                  label: "Type",
                  value: detail.type
                    ? TYPE_LABELS[detail.type] ?? detail.type
                    : "—",
                },
                { label: "Province", value: detail.province_nom ?? "—" },
                { label: "Description", value: detail.description ?? "—" },
              ].map((field) => (
                <div key={field.label}>
                  <dt className="text-muted-foreground">{field.label}</dt>
                  <dd className={cn("font-medium", field.label === "Description" && "font-normal")}>
                    {field.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer le poste comptable</DialogTitle>
            <DialogDescription>
              Confirmer la suppression de « {deleting?.libelle} » ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => void confirmDelete()}
              disabled={deletingId != null}
            >
              {deletingId != null ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

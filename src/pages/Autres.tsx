import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  Calendar,
  Eye,
  FileDown,
  MapPin,
  Search,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { TablePagination } from "@/components/TablePagination";

const PAGE_SIZE = 6;
import {
  getAdministrations,
  getEngagements,
  getEngagementById,
  getProvinces,
  getUnitesOperationnelles,
  getUserSession,
  getUsers,
  isControleurBudgetaire,
  type AdministrationItem,
  type EngagementItem,
  type ProvinceItem,
  type UniteOperationnelleItem,
  type UserListItem,
} from "@/config/app";
import {
  buildExportRow,
  exportEngagementsPdf,
} from "@/lib/exportEngagementsPdf";
import { useToast } from "@/hooks/use-toast";

const statusClass: Record<string, string> = {
  Visé: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  Validé: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  "En attente": "bg-amber-100 text-amber-800 hover:bg-amber-100",
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

export default function AutresEngagements() {
  const { toast } = useToast();
  const user = getUserSession();
  const [loading, setLoading] = useState(true);
  const [engagements, setEngagements] = useState<EngagementItem[]>([]);
  const [provinces, setProvinces] = useState<ProvinceItem[]>([]);
  const [administrations, setAdministrations] = useState<AdministrationItem[]>(
    []
  );
  const [unites, setUnites] = useState<UniteOperationnelleItem[]>([]);
  const [controleurs, setControleurs] = useState<UserListItem[]>([]);

  const [search, setSearch] = useState("");
  const [filtreProvince, setFiltreProvince] = useState(
    user?.province_id ? String(user.province_id) : "tous"
  );
  const [filtreAdministration, setFiltreAdministration] = useState("tous");
  const [filtreUo, setFiltreUo] = useState("tous");
  const [filtreDate, setFiltreDate] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [filtreControleur, setFiltreControleur] = useState("tous");
  const [selected, setSelected] = useState<EngagementItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [exportingId, setExportingId] = useState<number | null>(null);

  const openDetail = async (item: EngagementItem) => {
    setSelected(item);
    setDetailLoading(true);
    try {
      const fresh = await getEngagementById(item.id);
      setSelected(fresh);
    } catch {
      toast({
        title: "Détail incomplet",
        description: "Impossible de recharger le détail depuis le serveur.",
        variant: "destructive",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExportPdf = async (item: EngagementItem) => {
    setExportingId(item.id);
    try {
      await exportEngagementsPdf({
        title: "Fiche d'engagement budgétaire",
        subtitle: `Engagement n° ${item.numero}`,
        exportedBy: user?.nom,
        rows: [buildExportRow(item, fmtDate, (s) => s)],
      });
      toast({
        title: "Export PDF",
        description: "Le fichier a été téléchargé.",
      });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF.",
        variant: "destructive",
      });
    } finally {
      setExportingId(null);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [
          engagementsData,
          provincesData,
          administrationsData,
          unitesData,
          usersData,
        ] = await Promise.all([
          getEngagements(),
          getProvinces(),
          getAdministrations(),
          getUnitesOperationnelles(),
          getUsers(),
        ]);
        setEngagements(engagementsData);
        setProvinces(provincesData);
        setAdministrations(administrationsData);
        setUnites(unitesData);
        setControleurs(
          usersData.filter(
            (u) => u.role && isControleurBudgetaire(u.role)
          )
        );
      } catch {
        toast({
          title: "Erreur",
          description: "Impossible de charger les engagements.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  const administrationOptions = useMemo(
    () =>
      filtreProvince === "tous"
        ? administrations
        : administrations.filter(
            (a) => String(a.province_id) === filtreProvince
          ),
    [administrations, filtreProvince]
  );

  const controleurOptions = useMemo(() => {
    if (filtreProvince === "tous") return controleurs;
    return controleurs.filter(
      (c) => String(c.province_id) === filtreProvince
    );
  }, [controleurs, filtreProvince]);

  const uoOptions = useMemo(() => {
    if (filtreAdministration !== "tous") {
      return unites.filter(
        (u) => String(u.administration_id) === filtreAdministration
      );
    }
    if (filtreProvince !== "tous") {
      const adminIds = new Set(
        administrationOptions.map((a) => String(a.id))
      );
      return unites.filter((u) =>
        adminIds.has(String(u.administration_id))
      );
    }
    return unites;
  }, [unites, filtreAdministration, filtreProvince, administrationOptions]);

  const statuts = useMemo(
    () =>
      [...new Set(engagements.map((e) => e.statut).filter(Boolean))].sort(),
    [engagements]
  );

  const filteredData = useMemo(
    () =>
      engagements.filter((item) => {
        const haystack = [
          item.numero,
          item.objet,
          item.administration_nom,
          item.province_nom,
          item.unite_operationnelle_nom,
          item.demandeur,
          item.fournisseur,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchSearch =
          !search.trim() || haystack.includes(search.toLowerCase());
        const matchProvince =
          filtreProvince === "tous" ||
          String(item.province_id) === filtreProvince;
        const matchAdministration =
          filtreAdministration === "tous" ||
          String(item.administration_id) === filtreAdministration;
        const matchUo =
          filtreUo === "tous" ||
          String(item.unite_operationnelle_id) === filtreUo;
        const matchDate = !filtreDate || item.date === filtreDate;
        const matchStatut =
          filtreStatut === "tous" || item.statut === filtreStatut;
        const selectedControleur = controleurOptions.find(
          (c) => String(c.id) === filtreControleur
        );
        const matchControleur =
          filtreControleur === "tous" ||
          String(item.user_id) === filtreControleur ||
          (selectedControleur != null &&
            item.demandeur === selectedControleur.nom);

        return (
          matchSearch &&
          matchProvince &&
          matchAdministration &&
          matchUo &&
          matchDate &&
          matchStatut &&
          matchControleur
        );
      }),
    [
      engagements,
      search,
      filtreProvince,
      filtreAdministration,
      filtreUo,
      filtreDate,
      filtreStatut,
      filtreControleur,
      controleurOptions,
    ]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    filtreProvince,
    filtreAdministration,
    filtreUo,
    filtreDate,
    filtreStatut,
    filtreControleur,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredData.slice(start, start + PAGE_SIZE);
  }, [filteredData, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleProvinceChange = (value: string) => {
    setFiltreProvince(value);
    setFiltreAdministration("tous");
    setFiltreUo("tous");
    setFiltreControleur("tous");
  };

  const handleAdministrationChange = (value: string) => {
    setFiltreAdministration(value);
    setFiltreUo("tous");
  };

  const resetFilters = () => {
    setSearch("");
    setFiltreProvince(user?.province_id ? String(user.province_id) : "tous");
    setFiltreAdministration("tous");
    setFiltreUo("tous");
    setFiltreDate("");
    setFiltreStatut("tous");
    setFiltreControleur("tous");
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    filtreProvince !== "tous" ||
    filtreAdministration !== "tous" ||
    filtreUo !== "tous" ||
    filtreDate !== "" ||
    filtreStatut !== "tous" ||
    filtreControleur !== "tous";

  return (
    <PageShell>
      <PageHeader
        icon={<BarChart3 className="h-6 w-6 text-white" />}
        title="Consultation des autres engagements"
        description="Recherchez et consultez l'ensemble des engagements enregistrés dans le système."
        badge="Module Engagements"
      />

      <Card className="border-0 bg-white/80 shadow-sm backdrop-blur-sm">
        <CardContent className="p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Recherche générale..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 border-gray-200 bg-white pl-10"
              />
            </div>

            <Select value={filtreProvince} onValueChange={handleProvinceChange}>
              <SelectTrigger className="h-11 border-gray-200 bg-white">
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

            <Select
              value={filtreAdministration}
              onValueChange={handleAdministrationChange}
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

            <Select value={filtreUo} onValueChange={setFiltreUo}>
              <SelectTrigger className="h-11 border-gray-200 bg-white">
                <SelectValue placeholder="Unité opérationnelle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Toutes les unités</SelectItem>
                {uoOptions.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                value={filtreDate}
                onChange={(e) => setFiltreDate(e.target.value)}
                className="h-11 border-gray-200 bg-white pl-10"
              />
            </div>

            <Select value={filtreStatut} onValueChange={setFiltreStatut}>
              <SelectTrigger className="h-11 border-gray-200 bg-white">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                {statuts.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filtreControleur}
              onValueChange={setFiltreControleur}
            >
              <SelectTrigger className="h-11 border-gray-200 bg-white">
                <UserCheck className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="Contrôleur budgétaire" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les contrôleurs</SelectItem>
                {controleurOptions.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={resetFilters}
              >
                Réinitialiser les filtres
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-0 bg-white/90 shadow-sm backdrop-blur-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Liste des engagements</h2>
          <p className="text-sm text-muted-foreground">
            {loading
              ? "Chargement..."
              : `${filteredData.length} résultat${filteredData.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                {[
                  "N° Engagement",
                  "Date",
                  "Administration",
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
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Aucun engagement trouvé
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item) => (
                  <TableRow
                    key={item.id}
                    className="table-row-interactive"
                  >
                    <TableCell className="font-medium text-primary">
                      {item.numero}
                    </TableCell>
                    <TableCell>{fmtDate(item.date)}</TableCell>
                    <TableCell>
                      <span>{item.administration_nom ?? "—"}</span>
                      {item.province_nom && (
                        <Badge
                          variant="outline"
                          className="ml-1.5 text-[10px] text-primary"
                        >
                          {item.province_nom}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {item.objet ?? "—"}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {fmt(item.montant)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          statusClass[item.statut] ??
                          "bg-slate-100 text-slate-600 hover:bg-slate-100"
                        }
                      >
                        {item.statut}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="table-action-btn"
                          onClick={() => openDetail(item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="table-action-btn"
                          disabled={exportingId === item.id}
                          onClick={() => handleExportPdf(item)}
                          title="Télécharger le PDF"
                        >
                          <FileDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!loading && filteredData.length > 0 && (
          <TablePagination
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            totalItems={filteredData.length}
            onPageChange={setCurrentPage}
            itemLabel="engagement"
          />
        )}
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails de l&apos;engagement</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Numéro", value: selected.numero },
                { label: "Date", value: fmtDate(selected.date) },
                { label: "Province", value: selected.province_nom ?? "—" },
                {
                  label: "Administration",
                  value: selected.administration_nom ?? "—",
                },
                {
                  label: "Unité opérationnelle",
                  value: selected.unite_operationnelle_nom ?? "—",
                },
                { label: "Objet", value: selected.objet ?? "—" },
                { label: "Montant", value: fmt(selected.montant) },
                { label: "Statut", value: selected.statut },
                { label: "Demandeur", value: selected.demandeur ?? "—" },
                { label: "Fournisseur", value: selected.fournisseur ?? "—" },
                {
                  label: "Poste comptable",
                  value:
                    selected.poste_comptable_libelle?.trim() || "Non renseigné",
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-xl border border-gray-100 bg-slate-50 p-3"
                >
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 font-semibold text-gray-900">{value}</p>
                </div>
              ))}
            </div>
          )}
          <Button
            className="mt-2 w-full gap-2"
            variant="institution"
            disabled={!selected || exportingId === selected.id}
            onClick={() => selected && handleExportPdf(selected)}
          >
            <FileDown className="h-4 w-4" />
            Télécharger le PDF
          </Button>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

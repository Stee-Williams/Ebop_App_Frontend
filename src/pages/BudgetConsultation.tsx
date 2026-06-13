import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  Calendar,
  Eye,
  Layers,
  MapPin,
  Network,
  PiggyBank,
  Search,
  TrendingUp,
  Wallet,
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
import { Progress } from "@/components/ui/progress";
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
  getAdministrations,
  getBudgetConsultation,
  getProvinces,
  getUnitesOperationnelles,
  type AdministrationItem,
  type BudgetItem,
  type LigneBudgetaireItem,
  type ProvinceItem,
  type UniteOperationnelleItem,
} from "@/config/app";
import { useToast } from "@/hooks/use-toast";
import { cn, computeTauxUtilisation, formatTauxPercent } from "@/lib/utils";

const PAGE_SIZE = 6;

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XAF",
    maximumFractionDigits: 0,
  }).format(n);

function getTauxColor(taux: number): string {
  if (taux >= 90) return "bg-red-500";
  if (taux >= 70) return "bg-amber-500";
  return "bg-emerald-500";
}

function getTauxBadge(taux: number): string {
  if (taux >= 90) return "bg-red-100 text-red-800 hover:bg-red-100";
  if (taux >= 70) return "bg-amber-100 text-amber-800 hover:bg-amber-100";
  return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100";
}

export default function BudgetConsultation() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [lignes, setLignes] = useState<LigneBudgetaireItem[]>([]);
  const [provinces, setProvinces] = useState<ProvinceItem[]>([]);
  const [administrations, setAdministrations] = useState<AdministrationItem[]>(
    []
  );
  const [unites, setUnites] = useState<UniteOperationnelleItem[]>([]);
  const [stats, setStats] = useState({
    total_alloue: 0,
    total_utilise: 0,
    total_disponible: 0,
    total_decaisse: 0,
    taux_global: 0,
    nombre_lignes: 0,
    nombre_budgets: 0,
  });
  const [search, setSearch] = useState("");
  const [filtreProvince, setFiltreProvince] = useState("tous");
  const [filtreAdministration, setFiltreAdministration] = useState("tous");
  const [filtreUo, setFiltreUo] = useState("tous");
  const [filtreLigne, setFiltreLigne] = useState("tous");
  const [filtreAnnee, setFiltreAnnee] = useState("tous");
  const [selected, setSelected] = useState<LigneBudgetaireItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [data, provincesData, administrationsData, unitesData] =
          await Promise.all([
            getBudgetConsultation(),
            getProvinces(),
            getAdministrations(),
            getUnitesOperationnelles(),
          ]);
        setBudgets(data.budgets);
        setLignes(data.lignes);
        setStats(data.stats);
        setProvinces(provincesData);
        setAdministrations(administrationsData);
        setUnites(unitesData);
      } catch {
        toast({
          title: "Erreur",
          description: "Impossible de charger les données budgétaires.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  const annees = useMemo(
    () => [...new Set(budgets.map((b) => b.annee))].sort((a, b) => b - a),
    [budgets]
  );

  const administrationOptions = useMemo(
    () =>
      filtreProvince === "tous"
        ? administrations
        : administrations.filter(
            (a) => String(a.province_id) === filtreProvince
          ),
    [administrations, filtreProvince]
  );

  const uoOptions = useMemo(() => {
    if (filtreAdministration !== "tous") {
      return unites.filter(
        (u) => String(u.administration_id) === filtreAdministration
      );
    }
    if (filtreProvince !== "tous") {
      const adminIds = new Set(administrationOptions.map((a) => String(a.id)));
      return unites.filter((u) => adminIds.has(String(u.administration_id)));
    }
    return unites;
  }, [unites, filtreAdministration, filtreProvince, administrationOptions]);

  const ligneOptions = useMemo(() => {
    return lignes.filter((l) => {
      const matchProvince =
        filtreProvince === "tous" ||
        String(l.province_id) === filtreProvince;
      const matchAdministration =
        filtreAdministration === "tous" ||
        String(l.administration_id) === filtreAdministration;
      const matchUo =
        filtreUo === "tous" ||
        String(l.unite_operationnelle_id) === filtreUo;
      const matchAnnee =
        filtreAnnee === "tous" || String(l.annee) === filtreAnnee;
      return matchProvince && matchAdministration && matchUo && matchAnnee;
    });
  }, [lignes, filtreProvince, filtreAdministration, filtreUo, filtreAnnee]);

  const filteredLignes = useMemo(
    () =>
      lignes.filter((l) => {
        const query = search.trim().toLowerCase();
        const matchSearch =
          !query ||
          [
            l.code,
            l.libelle,
            l.budget_libelle,
            l.province_nom,
            l.administration_nom,
            l.unite_operationnelle_nom,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query);
        const matchProvince =
          filtreProvince === "tous" ||
          String(l.province_id) === filtreProvince;
        const matchAdministration =
          filtreAdministration === "tous" ||
          String(l.administration_id) === filtreAdministration;
        const matchUo =
          filtreUo === "tous" ||
          String(l.unite_operationnelle_id) === filtreUo;
        const matchLigne =
          filtreLigne === "tous" || String(l.id) === filtreLigne;
        const matchAnnee =
          filtreAnnee === "tous" || String(l.annee) === filtreAnnee;
        return (
          matchSearch &&
          matchProvince &&
          matchAdministration &&
          matchUo &&
          matchLigne &&
          matchAnnee
        );
      }),
    [
      lignes,
      search,
      filtreProvince,
      filtreAdministration,
      filtreUo,
      filtreLigne,
      filtreAnnee,
    ]
  );

  const filteredBudgets = useMemo(() => {
    const budgetIdsFromLignes = new Set(
      filteredLignes.map((l) => l.budget_id).filter(Boolean)
    );

    return budgets.filter((b) => {
      const matchProvince =
        filtreProvince === "tous" ||
        String(b.province_id) === filtreProvince;
      const matchAdministration =
        filtreAdministration === "tous" ||
        String(b.administration_id) === filtreAdministration;
      const matchUo =
        filtreUo === "tous" ||
        String(b.unite_operationnelle_id) === filtreUo;
      const matchAnnee =
        filtreAnnee === "tous" || String(b.annee) === filtreAnnee;
      const matchLigneScope =
        filtreLigne === "tous" || budgetIdsFromLignes.has(b.id);

      return (
        matchProvince &&
        matchAdministration &&
        matchUo &&
        matchAnnee &&
        matchLigneScope
      );
    });
  }, [
    budgets,
    filteredLignes,
    filtreProvince,
    filtreAdministration,
    filtreUo,
    filtreLigne,
    filtreAnnee,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredLignes.length / PAGE_SIZE));

  const paginatedLignes = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredLignes.slice(start, start + PAGE_SIZE);
  }, [filteredLignes, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    filtreProvince,
    filtreAdministration,
    filtreUo,
    filtreLigne,
    filtreAnnee,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const filteredStats = useMemo(() => {
    const totalAlloue = filteredLignes.reduce(
      (s, l) => s + l.montant_alloue,
      0
    );
    const totalConsomme = filteredLignes.reduce(
      (s, l) => s + l.montant_utilise,
      0
    );
    const totalEnveloppeUo = filteredBudgets.reduce((s, b) => s + b.montant, 0);
    return {
      total_alloue: totalAlloue,
      total_utilise: totalConsomme,
      total_disponible: Math.max(0, totalAlloue - totalConsomme),
      total_decaisse: totalConsomme,
      total_enveloppe_uo: totalEnveloppeUo,
      taux_global: computeTauxUtilisation(totalConsomme, totalAlloue),
      nombre_lignes: filteredLignes.length,
      nombre_budgets: filteredBudgets.length,
    };
  }, [filteredLignes, filteredBudgets]);

  const globalEnveloppeUo = useMemo(
    () => budgets.reduce((s, b) => s + b.montant, 0),
    [budgets]
  );

  const hasActiveFilters =
    filtreProvince !== "tous" ||
    filtreAdministration !== "tous" ||
    filtreUo !== "tous" ||
    filtreLigne !== "tous" ||
    filtreAnnee !== "tous" ||
    search.trim() !== "";

  const handleProvinceChange = (value: string) => {
    setFiltreProvince(value);
    setFiltreAdministration("tous");
    setFiltreUo("tous");
    setFiltreLigne("tous");
  };

  const handleAdministrationChange = (value: string) => {
    setFiltreAdministration(value);
    setFiltreUo("tous");
    setFiltreLigne("tous");
  };

  const handleUoChange = (value: string) => {
    setFiltreUo(value);
    setFiltreLigne("tous");
  };

  const statCards = [
    {
      label: "Enveloppe UO restante",
      hint: "Somme des enveloppes budgétaires UO encore disponibles. Diminue à chaque règlement.",
      value: fmt(
        hasActiveFilters
          ? filteredStats.total_enveloppe_uo
          : globalEnveloppeUo
      ),
      icon: Layers,
      gradient: "from-sky-500 to-blue-600",
      small: true,
    },
    {
      label: "Montant alloué (lignes)",
      hint: "Total réparti sur les lignes budgétaires. Ne diminue pas au règlement.",
      value: fmt(hasActiveFilters ? filteredStats.total_alloue : stats.total_alloue),
      icon: Wallet,
      gradient: "from-primary to-accent",
    },
    {
      label: "Utilisé / décaissé",
      value: fmt(hasActiveFilters ? filteredStats.total_utilise : stats.total_utilise),
      icon: TrendingUp,
      gradient: "from-amber-500 to-orange-500",
    },
    {
      label: "Disponible",
      value: fmt(
        hasActiveFilters ? filteredStats.total_disponible : stats.total_disponible
      ),
      icon: PiggyBank,
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      label: "Taux d'utilisation",
      value: formatTauxPercent(
        hasActiveFilters ? filteredStats.taux_global : stats.taux_global
      ),
      icon: BarChart3,
      gradient: "from-violet-500 to-purple-600",
      small: true,
    },
  ];

  return (
    <PageShell>
      <PageHeader
        icon={<BarChart3 className="h-6 w-6 text-white" />}
        title="Consultation du budget"
        description="Vue d'ensemble du budget global — filtrez par province, administration, unité opérationnelle et ligne budgétaire."
        badge="Module Budget"
      />

      {!loading && (
        <p className="-mt-2 text-sm text-muted-foreground">
          {hasActiveFilters
            ? `${filteredStats.nombre_budgets} budget${filteredStats.nombre_budgets !== 1 ? "s" : ""} · ${filteredStats.nombre_lignes} ligne${filteredStats.nombre_lignes !== 1 ? "s" : ""} (filtres actifs)`
            : `${stats.nombre_budgets} budget${stats.nombre_budgets !== 1 ? "s" : ""} · ${stats.nombre_lignes} ligne${stats.nombre_lignes !== 1 ? "s" : ""} au total`}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Card
            key={stat.label}
            className="group border-0 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
          >
            <CardContent className="p-4">
              <div
                className={cn(
                  "inline-flex rounded-xl bg-gradient-to-br p-2.5 text-white shadow-sm",
                  stat.gradient
                )}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <p
                className={cn(
                  "mt-3 font-bold tracking-tight text-gray-900",
                  stat.small ? "text-base lg:text-lg" : "text-lg lg:text-xl"
                )}
              >
                {loading ? "—" : stat.value}
              </p>
              <p
                className="mt-0.5 text-xs font-medium text-gray-700 lg:text-sm"
                title={"hint" in stat ? stat.hint : undefined}
              >
                {stat.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 bg-white/80 shadow-sm backdrop-blur-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-3">
            <div className="relative min-w-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Code, libellé, UO…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 border-gray-200 bg-white pl-10"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <div className="min-w-0">
                <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                  Province
                </p>
                <Select value={filtreProvince} onValueChange={handleProvinceChange}>
                  <SelectTrigger
                    className="h-10 min-w-0 border-gray-200 bg-white [&>span]:min-w-0 [&>span]:truncate"
                    title={
                      filtreProvince === "tous"
                        ? undefined
                        : provinces.find((p) => String(p.id) === filtreProvince)
                            ?.nom
                    }
                  >
                    <MapPin className="mr-1.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <SelectValue placeholder="Toutes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Toutes</SelectItem>
                    {provinces.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                  Administration
                </p>
                <Select
                  value={filtreAdministration}
                  onValueChange={handleAdministrationChange}
                >
                  <SelectTrigger
                    className="h-10 min-w-0 border-gray-200 bg-white [&>span]:min-w-0 [&>span]:truncate"
                    title={
                      filtreAdministration === "tous"
                        ? undefined
                        : administrationOptions.find(
                            (a) => String(a.id) === filtreAdministration
                          )?.nom
                    }
                  >
                    <Building2 className="mr-1.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <SelectValue placeholder="Toutes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Toutes</SelectItem>
                    {administrationOptions.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                  Unité opérationnelle
                </p>
                <Select value={filtreUo} onValueChange={handleUoChange}>
                  <SelectTrigger
                    className="h-10 min-w-0 border-gray-200 bg-white [&>span]:min-w-0 [&>span]:truncate"
                    title={
                      filtreUo === "tous"
                        ? undefined
                        : uoOptions.find((u) => String(u.id) === filtreUo)?.nom
                    }
                  >
                    <Network className="mr-1.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <SelectValue placeholder="Toutes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Toutes</SelectItem>
                    {uoOptions.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                  Ligne budgétaire
                </p>
                <Select value={filtreLigne} onValueChange={setFiltreLigne}>
                  <SelectTrigger
                    className="h-10 min-w-0 border-gray-200 bg-white [&>span]:min-w-0 [&>span]:truncate"
                    title={
                      filtreLigne === "tous"
                        ? undefined
                        : (() => {
                            const l = ligneOptions.find(
                              (x) => String(x.id) === filtreLigne
                            );
                            return l
                              ? `${l.code ? `${l.code} — ` : ""}${l.libelle}`
                              : undefined;
                          })()
                    }
                  >
                    <Layers className="mr-1.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <SelectValue placeholder="Toutes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Toutes</SelectItem>
                    {ligneOptions.map((l) => (
                      <SelectItem key={l.id} value={String(l.id)}>
                        {l.code ? `${l.code} — ` : ""}
                        {l.libelle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                  Année
                </p>
                <Select value={filtreAnnee} onValueChange={setFiltreAnnee}>
                  <SelectTrigger className="h-10 min-w-0 border-gray-200 bg-white [&>span]:min-w-0 [&>span]:truncate">
                    <Calendar className="mr-1.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <SelectValue placeholder="Toutes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Toutes</SelectItem>
                    {annees.map((a) => (
                      <SelectItem key={a} value={String(a)}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-0 bg-white/90 shadow-sm backdrop-blur-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Lignes budgétaires</h2>
          <p className="text-sm text-muted-foreground">
            {loading
              ? "Chargement..."
              : `${filteredLignes.length} ligne${filteredLignes.length !== 1 ? "s" : ""}`}
          </p>
        </div>

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
                  "UO",
                  "Enveloppe",
                  "Utilisé / décaissé",
                  "Disponible",
                  "Taux",
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
                    colSpan={11}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filteredLignes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Aucune ligne budgétaire trouvée
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLignes.map((ligne) => (
                  <TableRow
                    key={ligne.id}
                    className="table-row-interactive"
                  >
                    <TableCell className="font-medium text-primary">
                      {ligne.code ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate">
                      {ligne.libelle}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {ligne.budget_libelle ?? "—"}
                    </TableCell>
                    <TableCell>{ligne.province_nom ?? "—"}</TableCell>
                    <TableCell className="max-w-[140px] truncate">
                      {ligne.administration_nom ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[140px] truncate">
                      {ligne.unite_operationnelle_nom ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {fmt(ligne.montant_alloue)}
                    </TableCell>
                    <TableCell className="font-semibold text-amber-700">
                      {fmt(ligne.montant_utilise)}
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-700">
                      {fmt(ligne.montant_disponible)}
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-[100px] flex-col gap-1.5">
                        <Badge className={getTauxBadge(ligne.taux_utilisation)}>
                          {formatTauxPercent(ligne.taux_utilisation)}
                        </Badge>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              getTauxColor(ligne.taux_utilisation)
                            )}
                            style={{ width: `${ligne.taux_utilisation}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="table-action-btn"
                        onClick={() => setSelected(ligne)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!loading && filteredLignes.length > 0 && (
          <TablePagination
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            totalItems={filteredLignes.length}
            onPageChange={setCurrentPage}
            itemLabel="ligne"
          />
        )}
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg border border-gray-200 bg-white shadow-xl">
          <DialogHeader>
            <DialogTitle>Détail de la ligne budgétaire</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Code", value: selected.code ?? "—" },
                  { label: "Libellé", value: selected.libelle },
                  { label: "Budget", value: selected.budget_libelle ?? "—" },
                  { label: "Province", value: selected.province_nom ?? "—" },
                  {
                    label: "Administration",
                    value: selected.administration_nom ?? "—",
                  },
                  {
                    label: "Unité opérationnelle",
                    value: selected.unite_operationnelle_nom ?? "—",
                  },
                  { label: "Année", value: selected.annee ?? "—" },
                  {
                    label: "Enveloppe UO (après décaissement)",
                    value: fmt(selected.budget_montant ?? 0),
                  },
                  {
                    label: "Montant alloué",
                    value: fmt(selected.montant_alloue),
                  },
                  {
                    label: "Utilisé / décaissé",
                    value: fmt(selected.montant_utilise),
                  },
                  {
                    label: "Disponible",
                    value: fmt(selected.montant_disponible),
                  },
                  {
                    label: "Taux d'utilisation",
                    value: formatTauxPercent(selected.taux_utilisation),
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
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Progression
                </p>
                <Progress
                  value={selected.taux_utilisation}
                  className="h-2"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

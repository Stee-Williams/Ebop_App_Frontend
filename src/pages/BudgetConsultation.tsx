import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Calendar,
  Eye,
  Layers,
  MapPin,
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
import {
  getBudgetConsultation,
  type BudgetItem,
  type LigneBudgetaireItem,
} from "@/config/app";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  const [stats, setStats] = useState({
    total_alloue: 0,
    total_utilise: 0,
    total_disponible: 0,
    taux_global: 0,
    nombre_lignes: 0,
    nombre_budgets: 0,
  });
  const [search, setSearch] = useState("");
  const [filtreProvince, setFiltreProvince] = useState("tous");
  const [filtreAnnee, setFiltreAnnee] = useState("tous");
  const [filtreBudget, setFiltreBudget] = useState("tous");
  const [selected, setSelected] = useState<LigneBudgetaireItem | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getBudgetConsultation();
        setBudgets(data.budgets);
        setLignes(data.lignes);
        setStats(data.stats);
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

  const provinces = useMemo(() => {
    const map = new Map<number, string>();
    budgets.forEach((b) => {
      if (b.province_id && b.province_nom) {
        map.set(b.province_id, b.province_nom);
      }
    });
    return [...map.entries()]
      .map(([id, nom]) => ({ id, nom }))
      .sort((a, b) => a.nom.localeCompare(b.nom));
  }, [budgets]);

  const filteredBudgets = useMemo(
    () =>
      budgets.filter((b) => {
        const matchProvince =
          filtreProvince === "tous" ||
          String(b.province_id) === filtreProvince;
        const matchAnnee =
          filtreAnnee === "tous" || String(b.annee) === filtreAnnee;
        return matchProvince && matchAnnee;
      }),
    [budgets, filtreProvince, filtreAnnee]
  );

  const annees = useMemo(
    () =>
      [...new Set(budgets.map((b) => b.annee))].sort((a, b) => b - a),
    [budgets]
  );

  const filteredLignes = useMemo(
    () =>
      lignes.filter((l) => {
        const matchSearch = [l.code, l.libelle, l.budget_libelle, l.province_nom]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchProvince =
          filtreProvince === "tous" ||
          String(l.province_id) === filtreProvince;
        const matchAnnee =
          filtreAnnee === "tous" || String(l.annee) === filtreAnnee;
        const matchBudget =
          filtreBudget === "tous" || String(l.budget_id) === filtreBudget;
        return matchSearch && matchProvince && matchAnnee && matchBudget;
      }),
    [lignes, search, filtreProvince, filtreAnnee, filtreBudget]
  );

  const filteredStats = useMemo(() => {
    const totalAlloue = filteredLignes.reduce(
      (s, l) => s + l.montant_alloue,
      0
    );
    const totalUtilise = filteredLignes.reduce(
      (s, l) => s + l.montant_utilise,
      0
    );
    return {
      total_alloue: totalAlloue,
      total_utilise: totalUtilise,
      total_disponible: totalAlloue - totalUtilise,
      taux_global:
        totalAlloue > 0
          ? Math.round((totalUtilise / totalAlloue) * 1000) / 10
          : 0,
    };
  }, [filteredLignes]);

  const hasActiveFilters =
    filtreProvince !== "tous" ||
    filtreAnnee !== "tous" ||
    filtreBudget !== "tous" ||
    search.trim() !== "";

  const displayStats = hasActiveFilters ? filteredStats : stats;

  const statCards = [
    {
      label: "Montant alloué",
      value: fmt(displayStats.total_alloue),
      icon: Wallet,
      gradient: "from-indigo-500 to-blue-600",
    },
    {
      label: "Montant utilisé",
      value: fmt(displayStats.total_utilise),
      icon: TrendingUp,
      gradient: "from-amber-500 to-orange-500",
    },
    {
      label: "Disponible",
      value: fmt(displayStats.total_disponible),
      icon: PiggyBank,
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      label: "Taux d'utilisation",
      value: `${displayStats.taux_global}%`,
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
        description="Visualisez les budgets, lignes budgétaires et leur taux d'utilisation."
        badge="Module Divers"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <Card
            key={stat.label}
            className="group border-0 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
          >
            <CardContent className="p-5">
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
                  "mt-4 font-bold tracking-tight text-gray-900",
                  stat.small ? "text-lg" : "text-xl"
                )}
              >
                {loading ? "—" : stat.value}
              </p>
              <p className="mt-0.5 text-sm font-medium text-gray-700">
                {stat.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBudgets.length > 0 && (
        <div>
          <p className="mb-3 text-sm text-muted-foreground">
            {`${filteredBudgets.length} budget${filteredBudgets.length !== 1 ? "s" : ""} affiché${filteredBudgets.length !== 1 ? "s" : ""}`}
            {filtreProvince !== "tous" &&
              ` · ${provinces.find((p) => String(p.id) === filtreProvince)?.nom}`}
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2">
          {filteredBudgets.slice(0, 8).map((budget) => (
            <Card
              key={budget.id}
              className="min-w-[260px] shrink-0 border-0 bg-white/80 shadow-sm backdrop-blur-sm transition-all hover:shadow-md"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="outline" className="mb-2">
                      {budget.annee}
                    </Badge>
                    <p className="font-semibold text-gray-900">
                      {budget.libelle}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {budget.province_nom ?? "—"} ·{" "}
                      {budget.unite_operationnelle ?? "—"} ·{" "}
                      {budget.lignes_count} ligne
                      {budget.lignes_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Layers className="h-5 w-5 text-indigo-300" />
                </div>
                <p className="mt-3 text-lg font-bold text-indigo-700">
                  {fmt(budget.montant)}
                </p>
              </CardContent>
            </Card>
          ))}
          </div>
        </div>
      )}

      <Card className="border-0 bg-white/80 shadow-sm backdrop-blur-sm">
        <CardContent className="p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative sm:col-span-2 lg:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par code, libellé..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 border-gray-200 bg-white pl-10"
              />
            </div>
            <Select
              value={filtreProvince}
              onValueChange={(v) => {
                setFiltreProvince(v);
                setFiltreBudget("tous");
              }}
            >
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
            <Select value={filtreAnnee} onValueChange={setFiltreAnnee}>
              <SelectTrigger className="h-11 border-gray-200 bg-white">
                <Calendar className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Toutes les années</SelectItem>
                {annees.map((a) => (
                  <SelectItem key={a} value={String(a)}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtreBudget} onValueChange={setFiltreBudget}>
              <SelectTrigger className="h-11 border-gray-200 bg-white">
                <SelectValue placeholder="Budget" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les budgets</SelectItem>
                {filteredBudgets.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.libelle} ({b.annee})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  "Alloué",
                  "Utilisé",
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
                    colSpan={8}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filteredLignes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Aucune ligne budgétaire trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredLignes.map((ligne) => (
                  <TableRow
                    key={ligne.id}
                    className="transition-colors hover:bg-indigo-50/30"
                  >
                    <TableCell className="font-medium text-indigo-600">
                      {ligne.code ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {ligne.libelle}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {ligne.budget_libelle ?? "—"}
                      </span>
                      {ligne.province_nom && (
                        <Badge
                          variant="outline"
                          className="ml-1.5 text-[10px] text-indigo-600"
                        >
                          {ligne.province_nom}
                        </Badge>
                      )}
                      {ligne.annee && (
                        <Badge variant="outline" className="ml-1.5 text-[10px]">
                          {ligne.annee}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {fmt(ligne.montant_alloue)}
                    </TableCell>
                    <TableCell>{fmt(ligne.montant_utilise)}</TableCell>
                    <TableCell className="font-semibold text-emerald-700">
                      {fmt(ligne.montant_disponible)}
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-[100px] flex-col gap-1.5">
                        <Badge className={getTauxBadge(ligne.taux_utilisation)}>
                          {ligne.taux_utilisation}%
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
                        className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
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
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
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
                  { label: "Année", value: selected.annee ?? "—" },
                  {
                    label: "Montant alloué",
                    value: fmt(selected.montant_alloue),
                  },
                  {
                    label: "Montant utilisé",
                    value: fmt(selected.montant_utilise),
                  },
                  {
                    label: "Disponible",
                    value: fmt(selected.montant_disponible),
                  },
                  {
                    label: "Taux d'utilisation",
                    value: `${selected.taux_utilisation}%`,
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

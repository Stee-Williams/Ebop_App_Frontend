import { useEffect, useMemo, useState } from "react";
import {
  Clock,
  MapPin,
  Plus,
  Receipt,
  Search,
  UserCheck,
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
  ensureUserProvince,
  getEngagements,
  getEngagementsVises,
  getProvinces,
  getUserSession,
  getUsers,
  isControleurBudgetaire,
  isSuperAdmin,
  updateEngagement,
  type EngagementItem,
  type ProvinceItem,
  type UserListItem,
} from "@/config/app";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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

const statusClass: Record<string, string> = {
  Visé: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  "En attente de règlement": "bg-amber-100 text-amber-800 hover:bg-amber-100",
  Réglé: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
};

export default function Reglements() {
  const { toast } = useToast();
  const sessionUser = getUserSession();
  const [provinces, setProvinces] = useState<ProvinceItem[]>([]);
  const [controleurs, setControleurs] = useState<UserListItem[]>([]);
  const [enAttente, setEnAttente] = useState<EngagementItem[]>([]);
  const [regles, setRegles] = useState<EngagementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtreProvince, setFiltreProvince] = useState(
    sessionUser && !isSuperAdmin(sessionUser.role) && sessionUser.province_id
      ? String(sessionUser.province_id)
      : "tous"
  );
  const [filtreControleur, setFiltreControleur] = useState("tous");
  const [filtreStatut, setFiltreStatut] = useState("Tous");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    engagement_id: "",
    mode_paiement: "Virement",
    date_reglement: new Date().toISOString().split("T")[0],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      await ensureUserProvince();

      const [visesData, allData, provincesData, usersData] = await Promise.all([
        getEngagementsVises(),
        getEngagements(),
        getProvinces(),
        getUsers(),
      ]);

      setEnAttente(visesData);
      setRegles(allData.filter((e) => e.statut === "Réglé"));
      setProvinces(provincesData);
      setControleurs(
        usersData.filter((u) => u.role && isControleurBudgetaire(u.role))
      );
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allRows = useMemo(
    () => [
      ...enAttente.map((e) => ({
        ...e,
        displayStatut: "En attente de règlement" as const,
      })),
      ...regles.map((e) => ({
        ...e,
        displayStatut: "Réglé" as const,
      })),
    ],
    [enAttente, regles]
  );

  const controleurOptions = useMemo(() => {
    if (filtreProvince === "tous") return controleurs;
    return controleurs.filter(
      (c) => String(c.province_id) === filtreProvince
    );
  }, [controleurs, filtreProvince]);

  const filtered = useMemo(
    () =>
      allRows.filter((r) => {
        const haystack = [
          r.numero,
          r.objet,
          r.titre,
          r.fournisseur,
          r.administration_nom,
          r.province_nom,
          r.demandeur,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const matchSearch =
          !search.trim() || haystack.includes(search.toLowerCase());
        const matchStatut =
          filtreStatut === "Tous" ||
          (filtreStatut === "En attente" &&
            r.displayStatut === "En attente de règlement") ||
          (filtreStatut === "Réglé" && r.displayStatut === "Réglé");
        const matchProvince =
          filtreProvince === "tous" ||
          String(r.province_id) === filtreProvince;
        const selectedControleur = controleurOptions.find(
          (c) => String(c.id) === filtreControleur
        );
        const matchControleur =
          filtreControleur === "tous" ||
          String(r.user_id) === filtreControleur ||
          (selectedControleur != null &&
            r.demandeur === selectedControleur.nom);
        return (
          matchSearch && matchStatut && matchProvince && matchControleur
        );
      }),
    [
      allRows,
      search,
      filtreStatut,
      filtreProvince,
      filtreControleur,
      controleurOptions,
    ]
  );

  const enAttentePourReglement = useMemo(
    () =>
      allRows.filter((r) => {
        if (r.displayStatut !== "En attente de règlement") return false;
        const matchProvince =
          filtreProvince === "tous" ||
          String(r.province_id) === filtreProvince;
        const selectedControleur = controleurOptions.find(
          (c) => String(c.id) === filtreControleur
        );
        const matchControleur =
          filtreControleur === "tous" ||
          String(r.user_id) === filtreControleur ||
          (selectedControleur != null &&
            r.demandeur === selectedControleur.nom);
        return matchProvince && matchControleur;
      }),
    [allRows, filtreProvince, filtreControleur, controleurOptions]
  );

  const stats = useMemo(
    () => ({
      total: filtered.length,
      enAttente: filtered.filter(
        (r) => r.displayStatut === "En attente de règlement"
      ).length,
      regle: filtered.filter((r) => r.displayStatut === "Réglé").length,
      montantTotal: filtered
        .filter((r) => r.displayStatut === "Réglé")
        .reduce((s, r) => s + Number(r.montant), 0),
    }),
    [filtered]
  );

  const handleProvinceChange = (value: string) => {
    setFiltreProvince(value);
    setFiltreControleur("tous");
  };

  const handleCreate = async () => {
    if (!form.engagement_id) {
      toast({
        title: "Champ requis",
        description: "Sélectionnez un engagement.",
        variant: "destructive",
      });
      return;
    }
    try {
      await updateEngagement(Number(form.engagement_id), { statut: "Réglé" });
      toast({
        title: "Règlement enregistré",
        description: "Le paiement a été enregistré avec succès.",
      });
      setShowCreate(false);
      setForm({
        engagement_id: "",
        mode_paiement: "Virement",
        date_reglement: new Date().toISOString().split("T")[0],
      });
      fetchData();
    } catch (err) {
      toast({
        title: "Erreur",
        description:
          err instanceof Error ? err.message : "Erreur lors de la création.",
        variant: "destructive",
      });
    }
  };

  const statCards = [
    {
      label: "Total",
      value: stats.total,
      icon: Receipt,
      gradient: "from-indigo-500 to-blue-600",
    },
    {
      label: "En attente",
      value: stats.enAttente,
      icon: Clock,
      gradient: "from-amber-500 to-orange-500",
    },
    {
      label: "Réglés",
      value: stats.regle,
      icon: Wallet,
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      label: "Décaissé",
      value: fmt(stats.montantTotal),
      icon: Receipt,
      gradient: "from-violet-500 to-purple-600",
      small: true,
    },
  ];

  const provinceLabel = useMemo(() => {
    if (filtreProvince === "tous") return "Toutes les provinces";
    const p = provinces.find((pr) => String(pr.id) === filtreProvince);
    return p ? `Province ${p.nom}` : "Province sélectionnée";
  }, [filtreProvince, provinces]);

  return (
    <PageShell>
      <PageHeader
        icon={<Receipt className="h-6 w-6 text-white" />}
        title="Module des règlements"
        description={`Gestion des paiements sur engagements visés — ${provinceLabel}.`}
        badge="Module Règlement"
        action={
          <Button
            variant="institution"
            className="gap-2 shadow-md"
            onClick={() => setShowCreate(true)}
            disabled={enAttentePourReglement.length === 0}
          >
            <Plus className="h-4 w-4" />
            Nouveau règlement
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <Card
            key={stat.label}
            className="group border-0 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    "rounded-xl bg-gradient-to-br p-2.5 text-white shadow-sm",
                    stat.gradient
                  )}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <p
                className={cn(
                  "mt-4 font-bold tracking-tight text-gray-900",
                  stat.small ? "text-lg" : "text-2xl"
                )}
              >
                {stat.value}
              </p>
              <p className="mt-0.5 text-sm font-medium text-gray-700">
                {stat.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 bg-white/80 shadow-sm backdrop-blur-sm">
        <CardContent className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
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
          <Select value={filtreStatut} onValueChange={setFiltreStatut}>
            <SelectTrigger className="h-11 border-gray-200 bg-white sm:col-span-2 lg:col-span-1">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              {["Tous", "En attente", "Réglé"].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
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
                  "N° engagement",
                  "Objet",
                  "Fournisseur",
                  "Montant",
                  "Administration",
                  "Date",
                  "Statut",
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
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Aucun engagement visé en attente de règlement
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow
                    key={`${r.id}-${r.displayStatut}`}
                    className="transition-colors hover:bg-indigo-50/30"
                  >
                    <TableCell className="font-semibold text-indigo-600">
                      {r.numero}
                    </TableCell>
                    <TableCell>{r.objet || r.titre || "—"}</TableCell>
                    <TableCell>{r.fournisseur || "—"}</TableCell>
                    <TableCell className="font-semibold">
                      {fmt(Number(r.montant))}
                    </TableCell>
                    <TableCell>{r.administration_nom || "—"}</TableCell>
                    <TableCell>{fmtDate(r.date)}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          statusClass[r.displayStatut] ??
                          statusClass["En attente de règlement"]
                        }
                      >
                        {r.displayStatut}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau règlement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-primary/80">
                Engagement visé *
              </Label>
              <Select
                value={form.engagement_id}
                onValueChange={(v) =>
                  setForm({ ...form, engagement_id: v })
                }
              >
                <SelectTrigger className="h-11 border-gray-200">
                  <SelectValue placeholder="Sélectionner un engagement visé" />
                </SelectTrigger>
                <SelectContent>
                  {enAttentePourReglement.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.numero} — {e.objet || e.titre} —{" "}
                      {fmt(Number(e.montant))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {enAttentePourReglement.length === 0 && (
                <p className="text-xs text-amber-600">
                  Aucun engagement visé en attente de règlement pour les filtres
                  sélectionnés
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-primary/80">
                Mode de paiement *
              </Label>
              <Select
                value={form.mode_paiement}
                onValueChange={(v) =>
                  setForm({ ...form, mode_paiement: v })
                }
              >
                <SelectTrigger className="h-11 border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Virement">Virement</SelectItem>
                  <SelectItem value="Chèque">Chèque</SelectItem>
                  <SelectItem value="Espèces">Espèces</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-primary/80">
                Date de règlement *
              </Label>
              <Input
                type="date"
                value={form.date_reglement}
                onChange={(e) =>
                  setForm({ ...form, date_reglement: e.target.value })
                }
                className="h-11 border-gray-200"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowCreate(false)}
            >
              Annuler
            </Button>
            <Button
              variant="institution"
              className="flex-[2] gap-2"
              onClick={handleCreate}
            >
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

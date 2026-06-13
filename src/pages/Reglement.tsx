import { useEffect, useMemo, useState } from "react";
import {
  Clock,
  Eye,
  FileDown,
  MapPin,
  Network,
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
  DialogDescription,
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
import { TablePagination } from "@/components/TablePagination";

const PAGE_SIZE = 6;
import {
  ensureUserProvince,
  createReglement,
  getEngagementsVises,
  getProvinces,
  getReglements,
  getUnitesOperationnelles,
  getUserSession,
  getUsers,
  isControleurBudgetaire,
  isSuperAdmin,
  type EngagementItem,
  type ProvinceItem,
  type ReglementItem,
  type UniteOperationnelleItem,
  type UserListItem,
} from "@/config/app";
import { useToast } from "@/hooks/use-toast";
import {
  buildReglementExportRow,
  exportReglementPdf,
} from "@/lib/exportReglementPdf";
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

type ReglementRow = {
  id: number;
  reglement_id?: number | null;
  reference?: string | null;
  numero: string;
  objet?: string | null;
  titre?: string | null;
  fournisseur?: string | null;
  montant: number;
  administration_nom?: string | null;
  date: string;
  user_id?: number | null;
  demandeur?: string | null;
  province_id: number | null;
  province_nom: string | null;
  mode_paiement?: string | null;
  cree_par?: string | null;
  ligne_budgetaire_libelle?: string | null;
  unite_operationnelle_id?: number | null;
  unite_operationnelle_nom?: string | null;
  poste_comptable_libelle?: string | null;
  numero_compte?: string | null;
  banque_fournisseur?: string | null;
  displayStatut: "En attente de règlement" | "Réglé";
};

type DetailField = {
  label: string;
  value?: string | null;
  highlight?: boolean;
  full?: boolean;
};

export default function Reglements() {
  const { toast } = useToast();
  const sessionUser = getUserSession();
  const [provinces, setProvinces] = useState<ProvinceItem[]>([]);
  const [controleurs, setControleurs] = useState<UserListItem[]>([]);
  const [unites, setUnites] = useState<UniteOperationnelleItem[]>([]);
  const [enAttente, setEnAttente] = useState<EngagementItem[]>([]);
  const [regles, setRegles] = useState<ReglementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtreProvince, setFiltreProvince] = useState(
    sessionUser && !isSuperAdmin(sessionUser.role) && sessionUser.province_id
      ? String(sessionUser.province_id)
      : "tous"
  );
  const [filtreControleur, setFiltreControleur] = useState("tous");
  const [filtreUo, setFiltreUo] = useState("tous");
  const [filtreStatut, setFiltreStatut] = useState("Tous");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    engagement_id: "",
    mode_paiement: "Virement",
    date_reglement: new Date().toISOString().split("T")[0],
    numero_compte: "",
    banque_fournisseur: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [detailRow, setDetailRow] = useState<ReglementRow | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      await ensureUserProvince();

      const [visesData, reglementsData, provincesData, usersData, unitesData] =
        await Promise.all([
          getEngagementsVises(),
          getReglements(),
          getProvinces(),
          getUsers(),
          getUnitesOperationnelles(),
        ]);

      setEnAttente(visesData);
      setRegles(reglementsData);
      setProvinces(provincesData);
      setUnites(unitesData);
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

  const allRows = useMemo<ReglementRow[]>(
    () => [
      ...enAttente.map((e) => ({
        id: e.id,
        reglement_id: null,
        reference: null,
        numero: e.numero,
        objet: e.objet,
        titre: e.titre,
        fournisseur: e.fournisseur,
        montant: e.montant,
        administration_nom: e.administration_nom,
        date: e.date,
        user_id: e.user_id,
        demandeur: e.demandeur,
        province_id: e.province_id,
        province_nom: e.province_nom,
        mode_paiement: null,
        cree_par: null,
        ligne_budgetaire_libelle: e.ligne_budgetaire_libelle,
        unite_operationnelle_id: e.unite_operationnelle_id,
        unite_operationnelle_nom: e.unite_operationnelle_nom,
        poste_comptable_libelle: e.poste_comptable_libelle,
        displayStatut: "En attente de règlement" as const,
      })),
      ...regles.map((r) => ({
        id: r.engagement_id,
        reglement_id: r.id,
        reference: r.reference,
        numero: r.engagement_numero,
        objet: r.engagement_titre,
        titre: r.engagement_titre,
        fournisseur: r.fournisseur,
        montant: r.montant,
        administration_nom: r.administration_nom,
        date: r.date_reglement,
        user_id: r.user_id,
        demandeur: r.demandeur,
        province_id: r.province_id,
        province_nom: r.province_nom,
        mode_paiement: r.mode_paiement,
        cree_par: r.cree_par,
        ligne_budgetaire_libelle: r.ligne_budgetaire_libelle,
        unite_operationnelle_id: r.unite_operationnelle_id,
        unite_operationnelle_nom: r.unite_operationnelle_nom,
        poste_comptable_libelle: r.poste_comptable_libelle,
        numero_compte: r.numero_compte,
        banque_fournisseur: r.banque_fournisseur,
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

  const uoOptions = useMemo(() => {
    if (filtreProvince === "tous") return unites;
    return unites.filter((u) => {
      const row = allRows.find(
        (r) => String(r.unite_operationnelle_id) === String(u.id)
      );
      return row != null && String(row.province_id) === filtreProvince;
    });
  }, [unites, filtreProvince, allRows]);

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
          r.unite_operationnelle_nom,
          r.ligne_budgetaire_libelle,
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
        const matchUo =
          filtreUo === "tous" ||
          String(r.unite_operationnelle_id) === filtreUo;
        const selectedControleur = controleurOptions.find(
          (c) => String(c.id) === filtreControleur
        );
        const matchControleur =
          filtreControleur === "tous" ||
          String(r.user_id) === filtreControleur ||
          (selectedControleur != null &&
            r.demandeur === selectedControleur.nom);
        return (
          matchSearch &&
          matchStatut &&
          matchProvince &&
          matchUo &&
          matchControleur
        );
      }),
    [
      allRows,
      search,
      filtreStatut,
      filtreProvince,
      filtreUo,
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filtreStatut, filtreProvince, filtreUo, filtreControleur]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleProvinceChange = (value: string) => {
    setFiltreProvince(value);
    setFiltreControleur("tous");
    setFiltreUo("tous");
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
    if (form.mode_paiement === "Virement") {
      if (!form.numero_compte.trim() || !form.banque_fournisseur.trim()) {
        toast({
          title: "Informations bancaires requises",
          description:
            "Le numéro de compte et la banque du fournisseur sont obligatoires pour un virement.",
          variant: "destructive",
        });
        return;
      }
    }
    try {
      await createReglement({
        engagement_id: Number(form.engagement_id),
        mode_paiement: form.mode_paiement,
        date_reglement: form.date_reglement,
        ...(form.mode_paiement === "Virement"
          ? {
              numero_compte: form.numero_compte.trim(),
              banque_fournisseur: form.banque_fournisseur.trim(),
            }
          : {}),
      });
      toast({
        title: "Règlement enregistré",
        description: "Le paiement a été enregistré avec succès.",
      });
      setShowCreate(false);
      setForm({
        engagement_id: "",
        mode_paiement: "Virement",
        date_reglement: new Date().toISOString().split("T")[0],
        numero_compte: "",
        banque_fournisseur: "",
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
      gradient: "from-primary to-accent",
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

  const detailFields = (row: ReglementRow): DetailField[] => [
    { label: "N° engagement", value: row.numero },
    { label: "Référence règlement", value: row.reference ?? "—" },
    { label: "Objet", value: row.objet ?? row.titre, full: true },
    { label: "Fournisseur", value: row.fournisseur },
    { label: "Montant", value: fmt(Number(row.montant)), highlight: true },
    { label: "Statut", value: row.displayStatut },
    { label: "Date", value: fmtDate(row.date) },
    { label: "Mode de paiement", value: row.mode_paiement ?? "—" },
    ...(row.mode_paiement === "Virement"
      ? [
          { label: "N° de compte", value: row.numero_compte ?? "—" },
          { label: "Banque du fournisseur", value: row.banque_fournisseur ?? "—" },
        ]
      : []),
    { label: "Demandeur", value: row.demandeur },
    { label: "Province", value: row.province_nom },
    { label: "Administration", value: row.administration_nom },
    { label: "Unité opérationnelle", value: row.unite_operationnelle_nom },
    { label: "Ligne budgétaire", value: row.ligne_budgetaire_libelle },
    {
      label: "Poste comptable",
      value: row.poste_comptable_libelle?.trim() || "Non renseigné",
    },
    { label: "Enregistré par", value: row.cree_par ?? "—" },
  ];

  const handleExportPdf = async (row: ReglementRow) => {
    try {
      await exportReglementPdf({
        row: buildReglementExportRow(row, fmtDate),
        exportedBy: sessionUser?.nom,
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
    }
  };

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
        <CardContent className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par UO, objet..."
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
          <Select value={filtreUo} onValueChange={setFiltreUo}>
            <SelectTrigger className="h-11 border-gray-200 bg-white">
              <Network className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="Unité opérationnelle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Toutes les UO</SelectItem>
              {uoOptions.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {u.nom}
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
            <SelectTrigger className="h-11 border-gray-200 bg-white">
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
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Aucun engagement visé en attente de règlement
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((r) => (
                  <TableRow
                    key={`${r.id}-${r.displayStatut}`}
                    className="table-row-interactive"
                  >
                    <TableCell className="font-semibold text-primary">
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
                    <TableCell>
                      <div className="flex gap-1.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="table-action-btn"
                          onClick={() => setDetailRow(r)}
                          title="Voir le détail"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="table-action-btn"
                          onClick={() => handleExportPdf(r)}
                          title="Exporter en PDF"
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

        {!loading && filtered.length > 0 && (
          <TablePagination
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            totalItems={filtered.length}
            onPageChange={setCurrentPage}
            itemLabel="règlement"
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
            <DialogTitle>Détail du règlement</DialogTitle>
            <DialogDescription>
              Informations complètes sur l&apos;engagement et le paiement.
            </DialogDescription>
          </DialogHeader>

          {detailRow && (
            <>
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
                        field.highlight && "font-bold text-primary"
                      )}
                    >
                      {field.value ?? "—"}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => handleExportPdf(detailRow)}
                >
                  <FileDown className="h-4 w-4" />
                  Exporter en PDF
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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
                  setForm({
                    ...form,
                    mode_paiement: v,
                    numero_compte: v === "Virement" ? form.numero_compte : "",
                    banque_fournisseur:
                      v === "Virement" ? form.banque_fournisseur : "",
                  })
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
            {form.mode_paiement === "Virement" && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-primary/80">
                    N° de compte du fournisseur *
                  </Label>
                  <Input
                    value={form.numero_compte}
                    onChange={(e) =>
                      setForm({ ...form, numero_compte: e.target.value })
                    }
                    placeholder="Ex. 40001234567890123456789"
                    className="h-11 border-gray-200 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-primary/80">
                    Banque du fournisseur *
                  </Label>
                  <Input
                    value={form.banque_fournisseur}
                    onChange={(e) =>
                      setForm({ ...form, banque_fournisseur: e.target.value })
                    }
                    placeholder="Ex. BGFIBank Gabon"
                    className="h-11 border-gray-200"
                  />
                </div>
              </>
            )}
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

import { useEffect, useMemo, useState } from "react";
import {
  Clock,
  Plus,
  Receipt,
  Search,
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
import { authFetch } from "@/config/app";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XAF",
    maximumFractionDigits: 0,
  }).format(n);

const fmtDate = (d: string) => new Date(d).toLocaleDateString("fr-FR");

interface Reglement {
  id: number;
  reference: string;
  engagement_id: number;
  titre?: string;
  administration?: string;
  fournisseur: string;
  montant: number;
  mode_paiement: string;
  date_reglement: string;
  statut: string;
}

interface Engagement {
  id: number;
  titre: string;
  fournisseur: string;
  montant: number;
  administration: string;
}

const statusClass: Record<string, string> = {
  "En attente": "bg-amber-100 text-amber-800 hover:bg-amber-100",
  Payé: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  Rejeté: "bg-red-100 text-red-800 hover:bg-red-100",
};

export default function Reglements() {
  const { toast } = useToast();
  const [reglements, setReglements] = useState<Reglement[]>([]);
  const [engagementsVises, setEngVises] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
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
      const [r1, r2] = await Promise.all([
        authFetch(`${API}/reglements`).then((r) => r.json()),
        authFetch(`${API}/engagements/vises`).then((r) => r.json()),
      ]);
      setReglements(Array.isArray(r1) ? r1 : []);
      setEngVises(Array.isArray(r2) ? r2 : []);
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
  }, []);

  const filtered = useMemo(
    () =>
      reglements.filter((r) => {
        const matchSearch = Object.values(r)
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchStatut =
          filtreStatut === "Tous" || r.statut === filtreStatut;
        return matchSearch && matchStatut;
      }),
    [reglements, search, filtreStatut]
  );

  const stats = useMemo(
    () => ({
      total: reglements.length,
      enAttente: reglements.filter((r) => r.statut === "En attente").length,
      paye: reglements.filter((r) => r.statut === "Payé").length,
      montantTotal: reglements
        .filter((r) => r.statut === "Payé")
        .reduce((s, r) => s + Number(r.montant), 0),
    }),
    [reglements]
  );

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
      const res = await authFetch(`${API}/reglements`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        toast({
          title: "Erreur",
          description: err.error || "Erreur lors de la création.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Règlement créé",
        description: "Le paiement a été enregistré avec succès.",
      });
      setShowCreate(false);
      setForm({
        engagement_id: "",
        mode_paiement: "Virement",
        date_reglement: new Date().toISOString().split("T")[0],
      });
      fetchData();
    } catch {
      toast({
        title: "Erreur réseau",
        description: "Impossible de contacter le serveur.",
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
      label: "Payés",
      value: stats.paye,
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

  return (
    <PageShell>
      <PageHeader
        icon={<Receipt className="h-6 w-6 text-white" />}
        title="Module des règlements"
        description="Gestion des paiements sur engagements visés."
        badge="Module Règlement"
        action={
          <Button
            variant="institution"
            className="gap-2 shadow-md"
            onClick={() => setShowCreate(true)}
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
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 border-gray-200 bg-white pl-10"
            />
          </div>
          <Select value={filtreStatut} onValueChange={setFiltreStatut}>
            <SelectTrigger className="h-11 w-full border-gray-200 bg-white sm:w-44">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              {["Tous", "En attente", "Payé", "Rejeté"].map((s) => (
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
                  "Référence",
                  "Engagement",
                  "Fournisseur",
                  "Montant",
                  "Mode",
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
                    Aucun règlement trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow
                    key={r.id}
                    className="transition-colors hover:bg-indigo-50/30"
                  >
                    <TableCell className="font-semibold text-indigo-600">
                      {r.reference}
                    </TableCell>
                    <TableCell>{r.titre || `#${r.engagement_id}`}</TableCell>
                    <TableCell>{r.fournisseur}</TableCell>
                    <TableCell className="font-semibold">
                      {fmt(Number(r.montant))}
                    </TableCell>
                    <TableCell>{r.mode_paiement}</TableCell>
                    <TableCell>{fmtDate(r.date_reglement)}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          statusClass[r.statut] ?? statusClass["En attente"]
                        }
                      >
                        {r.statut}
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
                Engagement *
              </Label>
              <Select
                value={form.engagement_id}
                onValueChange={(v) =>
                  setForm({ ...form, engagement_id: v })
                }
              >
                <SelectTrigger className="h-11 border-gray-200">
                  <SelectValue placeholder="Sélectionner un engagement" />
                </SelectTrigger>
                <SelectContent>
                  {engagementsVises.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      #{e.id} — {e.titre} — {fmt(Number(e.montant))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {engagementsVises.length === 0 && (
                <p className="text-xs text-amber-600">
                  Aucun engagement visé disponible
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

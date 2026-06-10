import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  FilePlus,
  Landmark,
  Loader2,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { PageHeader, PageShell } from "@/components/layout/PageShell";
import { useToast } from "@/hooks/use-toast";
import {
  createEngagement,
  getAdministrations,
  getBudgets,
  getFournisseurs,
  getLignesBudgetaires,
  getPostesComptables,
  getProvinces,
  getUnitesOperationnelles,
  getUserSession,
  type AdministrationItem,
  type BudgetListItem,
  type FournisseurItem,
  type LigneBudgetaireListItem,
  type PosteComptableItem,
  type ProvinceItem,
  type UniteOperationnelleItem,
} from "@/config/app";
import { cn } from "@/lib/utils";

type FormState = {
  titre: string;
  montant: string;
  date: string;
  province: string;
  administration: string;
  uo: string;
  budget: string;
  ligneBudgetaire: string;
  posteComptable: string;
  fournisseur: string;
};

const initialForm: FormState = {
  titre: "",
  montant: "",
  date: "",
  province: "",
  administration: "",
  uo: "",
  budget: "",
  ligneBudgetaire: "",
  posteComptable: "",
  fournisseur: "",
};

type SectionHeaderProps = {
  icon: React.ElementType;
  title: string;
};

function SectionHeader({ icon: Icon, title }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        <Icon className="h-4 w-4" />
      </div>
      <h2 className="font-semibold text-gray-900">{title}</h2>
    </div>
  );
}

type FieldProps = {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
};

function Field({ label, htmlFor, children, className }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label
        htmlFor={htmlFor}
        className="text-xs font-semibold uppercase tracking-wide text-primary/80"
      >
        {label}
      </Label>
      {children}
    </div>
  );
}

const inputClass =
  "h-11 border-gray-200 bg-white focus-visible:ring-accent";
const selectTriggerClass = "h-11 border-gray-200 bg-white focus:ring-accent";

export default function EngagementForm() {
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [provinces, setProvinces] = useState<ProvinceItem[]>([]);
  const [administrations, setAdministrations] = useState<AdministrationItem[]>(
    []
  );
  const [unites, setUnites] = useState<UniteOperationnelleItem[]>([]);
  const [budgets, setBudgets] = useState<BudgetListItem[]>([]);
  const [lignes, setLignes] = useState<LigneBudgetaireListItem[]>([]);
  const [postes, setPostes] = useState<PosteComptableItem[]>([]);
  const [fournisseurs, setFournisseurs] = useState<FournisseurItem[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [
          provincesData,
          administrationsData,
          unitesData,
          budgetsData,
          lignesData,
          postesData,
          fournisseursData,
        ] = await Promise.all([
          getProvinces(),
          getAdministrations(),
          getUnitesOperationnelles(),
          getBudgets(),
          getLignesBudgetaires(),
          getPostesComptables(),
          getFournisseurs(),
        ]);
        setProvinces(provincesData);
        setAdministrations(administrationsData);
        setUnites(unitesData);
        setBudgets(budgetsData);
        setLignes(lignesData);
        setPostes(postesData);
        setFournisseurs(fournisseursData);
      } catch {
        toast({
          title: "Erreur",
          description: "Impossible de charger les données de référence.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  const filteredAdministrations = useMemo(
    () =>
      administrations.filter(
        (a) =>
          !form.province || String(a.province_id) === form.province
      ),
    [administrations, form.province]
  );

  const filteredUnites = useMemo(
    () =>
      unites.filter(
        (u) =>
          !form.administration ||
          String(u.administration_id) === form.administration
      ),
    [unites, form.administration]
  );

  const filteredBudgets = useMemo(
    () =>
      budgets.filter(
        (b) => !form.uo || String(b.unite_operationnelle_id) === form.uo
      ),
    [budgets, form.uo]
  );

  const filteredLignes = useMemo(
    () =>
      lignes.filter(
        (l) => !form.budget || String(l.budget_id) === form.budget
      ),
    [lignes, form.budget]
  );

  const setField = (name: keyof FormState, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "province") {
        next.administration = "";
        next.uo = "";
        next.budget = "";
        next.ligneBudgetaire = "";
      } else if (name === "administration") {
        next.uo = "";
        next.budget = "";
        next.ligneBudgetaire = "";
      } else if (name === "uo") {
        next.budget = "";
        next.ligneBudgetaire = "";
      } else if (name === "budget") {
        next.ligneBudgetaire = "";
      }

      return next;
    });
  };

  const handleReset = () => setForm(initialForm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.titre.trim() || !form.montant || !form.date) {
      toast({
        title: "Champs obligatoires",
        description: "Titre, montant et date sont requis.",
        variant: "destructive",
      });
      return;
    }

    const session = getUserSession();
    setSubmitting(true);

    try {
      await createEngagement({
        numero: form.titre.trim(),
        montant: Number(form.montant),
        date: form.date,
        statut: "En attente",
        ligne_budgetaire_id: form.ligneBudgetaire
          ? Number(form.ligneBudgetaire)
          : undefined,
        poste_comptable_id: form.posteComptable
          ? Number(form.posteComptable)
          : undefined,
        fournisseur_id: form.fournisseur
          ? Number(form.fournisseur)
          : undefined,
        user_id: session?.id,
      });

      toast({
        title: "Engagement enregistré",
        description: "Le dossier a été créé avec succès.",
      });
      setForm(initialForm);
    } catch (err) {
      toast({
        title: "Erreur",
        description:
          err instanceof Error
            ? err.message
            : "Impossible d'enregistrer l'engagement.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderSelect = (
    id: keyof FormState,
    placeholder: string,
    options: { value: string; label: string }[],
    disabled = false
  ) => (
    <Select
      value={form[id] || undefined}
      onValueChange={(v) => setField(id, v)}
      disabled={loading || disabled}
    >
      <SelectTrigger id={id} className={selectTriggerClass}>
        <SelectValue
          placeholder={loading ? "Chargement..." : placeholder}
        />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <PageShell className="max-w-4xl">
      <PageHeader
        icon={<FilePlus className="h-6 w-6 text-white" />}
        title="Création d'un engagement budgétaire"
        description="Saisissez les informations du nouveau dossier administratif."
        badge="Nouveau dossier"
      />

      <form onSubmit={handleSubmit}>
        <Card className="overflow-hidden border-0 bg-white/90 shadow-lg backdrop-blur-sm">
          <CardContent className="space-y-6 p-6 lg:p-8">
            <section>
              <SectionHeader icon={FilePlus} title="Informations générales" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Titre" htmlFor="titre" className="sm:col-span-2">
                  <Input
                    id="titre"
                    name="titre"
                    type="text"
                    value={form.titre}
                    onChange={(e) => setField("titre", e.target.value)}
                    className={inputClass}
                    placeholder="Référence ou intitulé de l'engagement"
                  />
                </Field>
                <Field label="Montant" htmlFor="montant">
                  <Input
                    id="montant"
                    name="montant"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.montant}
                    onChange={(e) => setField("montant", e.target.value)}
                    className={inputClass}
                    placeholder="0"
                  />
                </Field>
                <Field label="Date" htmlFor="date">
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={(e) => setField("date", e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
            </section>

            <Separator />

            <section>
              <SectionHeader
                icon={Building2}
                title="Affectation territoriale"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Province" htmlFor="province">
                  {renderSelect(
                    "province",
                    "Sélectionner...",
                    provinces.map((p) => ({
                      value: String(p.id),
                      label: p.nom,
                    }))
                  )}
                </Field>
                <Field label="Administration" htmlFor="administration">
                  {renderSelect(
                    "administration",
                    form.province
                      ? "Sélectionner..."
                      : "Choisir une province d'abord",
                    filteredAdministrations.map((a) => ({
                      value: String(a.id),
                      label: a.nom,
                    })),
                    !form.province
                  )}
                </Field>
                <Field
                  label="Unité opérationnelle"
                  htmlFor="uo"
                  className="sm:col-span-2"
                >
                  {renderSelect(
                    "uo",
                    form.administration
                      ? "Sélectionner..."
                      : "Choisir une administration d'abord",
                    filteredUnites.map((u) => ({
                      value: String(u.id),
                      label: u.nom,
                    })),
                    !form.administration
                  )}
                </Field>
              </div>
            </section>

            <Separator />

            <section>
              <SectionHeader icon={Landmark} title="Références budgétaires" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Budget" htmlFor="budget">
                  {renderSelect(
                    "budget",
                    form.uo
                      ? "Sélectionner..."
                      : "Choisir une unité opérationnelle d'abord",
                    filteredBudgets.map((b) => ({
                      value: String(b.id),
                      label: `${b.libelle} (${b.annee})`,
                    })),
                    !form.uo
                  )}
                </Field>
                <Field label="Ligne budgétaire" htmlFor="ligneBudgetaire">
                  {renderSelect(
                    "ligneBudgetaire",
                    form.budget
                      ? "Sélectionner..."
                      : "Choisir un budget d'abord",
                    filteredLignes.map((l) => ({
                      value: String(l.id),
                      label: l.code
                        ? `${l.code} — ${l.libelle}`
                        : l.libelle,
                    })),
                    !form.budget
                  )}
                </Field>
                <Field label="Poste comptable" htmlFor="posteComptable">
                  {renderSelect(
                    "posteComptable",
                    "Sélectionner...",
                    postes.map((p) => ({
                      value: String(p.id),
                      label: p.libelle,
                    }))
                  )}
                </Field>
                <Field label="Fournisseur" htmlFor="fournisseur">
                  {renderSelect(
                    "fournisseur",
                    "Sélectionner...",
                    fournisseurs.map((f) => ({
                      value: String(f.id),
                      label: f.nom,
                    }))
                  )}
                </Field>
              </div>
            </section>
          </CardContent>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-slate-50/80 px-6 py-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={handleReset}
              disabled={submitting}
            >
              <X className="h-4 w-4" />
              Annuler
            </Button>
            <Button
              type="submit"
              variant="institution"
              className="gap-2 shadow-md"
              disabled={submitting || loading}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Enregistrer
            </Button>
          </div>
        </Card>
      </form>
    </PageShell>
  );
}

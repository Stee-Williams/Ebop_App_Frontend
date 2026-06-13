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
import { FournisseurCombobox } from "@/components/FournisseurCombobox";
import { useToast } from "@/hooks/use-toast";
import {
  createEngagement,
  ensureUserProvince,
  getAdministrations,
  getBudgets,
  getFournisseurs,
  getLignesBudgetaires,
  getNextEngagementNumero,
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
  numero: string;
  titre: string;
  montant: string;
  date: string;
  province: string;
  administration: string;
  uo: string;
  budget: string;
  ligneBudgetaire: string;
  posteComptable: string;
  fournisseurNom: string;
  fournisseurId: string;
};

const initialForm: FormState = {
  numero: "",
  titre: "",
  montant: "",
  date: "",
  province: "",
  administration: "",
  uo: "",
  budget: "",
  ligneBudgetaire: "",
  posteComptable: "",
  fournisseurNom: "",
  fournisseurId: "",
};

type SectionHeaderProps = {
  icon: React.ElementType;
  title: string;
};

function SectionHeader({ icon: Icon, title }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/5 text-primary">
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

  const loadNextNumero = async (annee?: number) => {
    try {
      const numero = await getNextEngagementNumero(annee);
      setForm((prev) => ({ ...prev, numero }));
    } catch {
      setForm((prev) => ({ ...prev, numero: "ENG-???-2026" }));
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const currentUser = (await ensureUserProvince()) ?? getUserSession();
        const defaultProvince = currentUser?.province_id
          ? String(currentUser.province_id)
          : "";

        const [
          provincesData,
          administrationsData,
          unitesData,
          budgetsData,
          lignesData,
          postesData,
          fournisseursData,
          nextNumero,
        ] = await Promise.all([
          getProvinces(),
          getAdministrations(),
          getUnitesOperationnelles(),
          getBudgets(),
          getLignesBudgetaires(),
          getPostesComptables(),
          getFournisseurs(),
          getNextEngagementNumero(),
        ]);
        setProvinces(provincesData);
        setAdministrations(administrationsData);
        setUnites(unitesData);
        setBudgets(budgetsData);
        setLignes(lignesData);
        setPostes(postesData);
        setFournisseurs(fournisseursData);
        setForm((prev) => ({
          ...prev,
          numero: nextNumero,
          province: prev.province || defaultProvince,
        }));
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

  const filteredLignes = useMemo(() => {
    if (!form.budget) return [];
    const budgetId = Number(form.budget);
    return lignes.filter(
      (l) => l.budget_id != null && Number(l.budget_id) === budgetId
    );
  }, [lignes, form.budget]);

  const filteredPostes = useMemo(
    () =>
      postes.filter(
        (p) => !form.province || String(p.province_id) === form.province
      ),
    [postes, form.province]
  );

  const selectedBudget = useMemo(
    () => budgets.find((b) => String(b.id) === form.budget),
    [budgets, form.budget]
  );

  const setField = (name: keyof FormState, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "province") {
        next.administration = "";
        next.uo = "";
        next.budget = "";
        next.ligneBudgetaire = "";
        if (
          next.posteComptable &&
          !postes.some(
            (p) =>
              String(p.id) === next.posteComptable &&
              String(p.province_id) === value
          )
        ) {
          next.posteComptable = "";
        }
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

  const handleReset = async () => {
    const currentUser = getUserSession();
    const defaultProvince = currentUser?.province_id
      ? String(currentUser.province_id)
      : "";
    setForm({ ...initialForm, province: defaultProvince });
    await loadNextNumero();
  };

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

    if (!form.ligneBudgetaire) {
      toast({
        title: "Ligne budgétaire requise",
        description: "Sélectionnez une ligne budgétaire.",
        variant: "destructive",
      });
      return;
    }

    if (!form.posteComptable) {
      toast({
        title: "Poste comptable requis",
        description: "Sélectionnez le poste comptable de rattachement.",
        variant: "destructive",
      });
      return;
    }

    const session = getUserSession();
    setSubmitting(true);

    try {
      await createEngagement({
        titre: form.titre.trim(),
        numero: form.numero || undefined,
        montant: Number(form.montant),
        date: form.date,
        statut: "En attente",
        ligne_budgetaire_id: Number(form.ligneBudgetaire),
        poste_comptable_id: Number(form.posteComptable),
        fournisseur_id: form.fournisseurId
          ? Number(form.fournisseurId)
          : undefined,
        fournisseur_nom:
          !form.fournisseurId && form.fournisseurNom.trim()
            ? form.fournisseurNom.trim()
            : undefined,
        user_id: session?.id,
      });

      toast({
        title: "Engagement enregistré",
        description: `Dossier ${form.numero} créé avec succès.`,
      });
      if (!form.fournisseurId && form.fournisseurNom.trim()) {
        try {
          const updated = await getFournisseurs();
          setFournisseurs(updated);
        } catch {
          // liste fournisseurs optionnelle après création
        }
      }
      const currentUser = getUserSession();
      const defaultProvince = currentUser?.province_id
        ? String(currentUser.province_id)
        : "";
      setForm({ ...initialForm, province: defaultProvince });
      await loadNextNumero(
        form.date ? new Date(form.date).getFullYear() : undefined
      );
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
                <Field label="N° engagement" htmlFor="numero">
                  <Input
                    id="numero"
                    name="numero"
                    type="text"
                    value={form.numero}
                    readOnly
                    className={cn(inputClass, "bg-slate-50 font-mono text-primary")}
                  />
                </Field>
                <Field label="Titre" htmlFor="titre">
                  <Input
                    id="titre"
                    name="titre"
                    type="text"
                    value={form.titre}
                    onChange={(e) => setField("titre", e.target.value)}
                    className={inputClass}
                    placeholder="Intitulé de l'engagement"
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
                    onChange={(e) => {
                      setField("date", e.target.value);
                      if (e.target.value) {
                        void loadNextNumero(
                          new Date(e.target.value).getFullYear()
                        );
                      }
                    }}
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
                      label: `${b.libelle} (${b.annee}) — ${b.lignes_count} ligne(s)`,
                    })),
                    !form.uo
                  )}
                </Field>
                <Field label="Ligne budgétaire" htmlFor="ligneBudgetaire">
                  {renderSelect(
                    "ligneBudgetaire",
                    form.budget
                      ? filteredLignes.length > 0
                        ? "Sélectionner..."
                        : "Aucune ligne pour ce budget"
                      : "Choisir un budget d'abord",
                    filteredLignes.map((l) => ({
                      value: String(l.id),
                      label: l.code
                        ? `${l.code} — ${l.libelle}`
                        : l.libelle,
                    })),
                    !form.budget || filteredLignes.length === 0
                  )}
                  {form.budget && filteredLignes.length === 0 && (
                    <p className="text-xs text-amber-600">
                      Le budget « {selectedBudget?.libelle ?? "sélectionné"} »
                      ne contient aucune ligne budgétaire.
                    </p>
                  )}
                </Field>
                <Field label="Poste comptable *" htmlFor="posteComptable">
                  {renderSelect(
                    "posteComptable",
                    form.province
                      ? filteredPostes.length > 0
                        ? "Sélectionner..."
                        : "Aucun poste pour cette province"
                      : "Choisir une province d'abord",
                    filteredPostes.map((p) => ({
                      value: String(p.id),
                      label: p.libelle,
                    })),
                    !form.province || filteredPostes.length === 0
                  )}
                  {form.province && filteredPostes.length === 0 && (
                    <p className="text-xs text-amber-600">
                      Aucun poste comptable n&apos;est disponible pour cette
                      province.
                    </p>
                  )}
                </Field>
                <Field label="Fournisseur" htmlFor="fournisseur">
                  <FournisseurCombobox
                    id="fournisseur"
                    options={fournisseurs.map((f) => ({
                      value: String(f.id),
                      label: f.nom,
                    }))}
                    value={form.fournisseurNom}
                    selectedId={form.fournisseurId}
                    onChange={({ value, selectedId }) =>
                      setForm((prev) => ({
                        ...prev,
                        fournisseurNom: value,
                        fournisseurId: selectedId,
                      }))
                    }
                    disabled={loading}
                    placeholder="Sélectionner ou saisir..."
                  />
                  {form.fournisseurNom && !form.fournisseurId && (
                    <p className="text-xs text-muted-foreground">
                      Nouveau fournisseur « {form.fournisseurNom} » — sera
                      enregistré à la validation.
                    </p>
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

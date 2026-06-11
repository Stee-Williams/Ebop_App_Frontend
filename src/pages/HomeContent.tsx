import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Building2,
  FileCheck,
  FilePlus,
  Landmark,
  Receipt,
  Sparkles,
  TrendingUp,
  UserPlus,
  Wallet,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  canAccessPath,
  ensureUserProvince,
  filterByUserProvince,
  getBudgetConsultation,
  getEngagements,
  getUserSession,
  isControleurBudgetaire,
  isSuperAdmin,
  type EngagementItem,
  type UserSession,
} from "@/config/app";
import InstitutionLogo from "@/components/InstitutionLogo";
import { cn } from "@/lib/utils";

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XAF",
    maximumFractionDigits: 0,
  }).format(n);

const QUICK_ACTIONS = [
  {
    title: "Viser les engagements",
    desc: "Valider les dossiers en attente",
    to: "/acceuil/engagements/viser",
    icon: FileCheck,
    color: "text-indigo-600 bg-indigo-50",
  },
  {
    title: "Créer un engagement",
    desc: "Nouveau dossier budgétaire",
    to: "/acceuil/engagements/creation",
    icon: FilePlus,
    color: "text-teal-600 bg-teal-50",
  },
  {
    title: "Règlements",
    desc: "Gérer les paiements",
    to: "/acceuil/reglement",
    icon: Receipt,
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    title: "Consultations",
    desc: "Rechercher un engagement",
    to: "/acceuil/engagements/autres",
    icon: BarChart3,
    color: "text-violet-600 bg-violet-50",
  },
  {
    title: "Collectivités",
    desc: "Gestion territoriale",
    to: "/acceuil/collectivites",
    icon: Building2,
    color: "text-gray-400 bg-gray-100",
    disabled: true,
  },
  {
    title: "Gestion des EPP",
    desc: "Établissements publics",
    to: "/acceuil/epp",
    icon: Landmark,
    color: "text-gray-400 bg-gray-100",
    disabled: true,
  },
  {
    title: "Consultation budget",
    desc: "Visualiser les lignes budgétaires",
    to: "/acceuil/budget",
    icon: Wallet,
    color: "text-sky-600 bg-sky-50",
  },
  {
    title: "Gestion des utilisateurs",
    desc: "Gérer les comptes du portail",
    to: "/acceuil/utilisateurs",
    icon: UserPlus,
    color: "text-rose-600 bg-rose-50",
  },
];

function filterReglementsDuMois(
  engagements: EngagementItem[],
  provinceId: number | null
): EngagementItem[] {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const parProvince = filterByUserProvince(engagements, provinceId);

  return parProvince.filter((e) => {
    if (e.statut !== "Réglé") return false;
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
}

function computeStats(
  allEngagements: EngagementItem[],
  budgetDisponible: number,
  provinceId: number | null,
  provinceNom: string | null,
  restrictToProvince: boolean
) {
  const engagements = filterByUserProvince(allEngagements, provinceId);

  const actifs = engagements.filter((e) => e.statut === "En attente").length;

  const reglementsMois = restrictToProvince
    ? provinceId != null
      ? filterReglementsDuMois(allEngagements, provinceId).length
      : 0
    : filterReglementsDuMois(allEngagements, provinceId).length;

  const vises = engagements.filter((e) => e.statut === "Visé").length;
  const rejetes = engagements.filter((e) => e.statut === "Rejeté").length;
  const traites = vises + rejetes;
  const tauxVisa =
    traites > 0 ? `${Math.round((vises / traites) * 100)} %` : "—";

  const provinceLabel = provinceNom
    ? `Province ${provinceNom}`
    : restrictToProvince
      ? "Province non renseignée"
      : "Toutes provinces";

  return [
    {
      label: "Engagements actifs",
      value: String(actifs),
      trend: `${actifs} en attente · ${provinceLabel}`,
      icon: FileCheck,
      gradient: "from-indigo-500 to-blue-600",
    },
    {
      label: "Règlements du mois",
      value: String(reglementsMois),
      trend: `${reglementsMois} réglé(s) ce mois · ${provinceLabel}`,
      icon: Receipt,
      gradient: "from-teal-500 to-emerald-600",
    },
    {
      label: "Budget disponible",
      value: fmt(budgetDisponible),
      trend: "Exercice en cours",
      icon: Wallet,
      gradient: "from-amber-500 to-orange-500",
    },
    {
      label: "Taux de visa",
      value: tauxVisa,
      trend: `${vises} visé(s) sur ${traites} traité(s)`,
      icon: TrendingUp,
      gradient: "from-violet-500 to-purple-600",
    },
  ];
}

const HomeContent = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession | null>(() => getUserSession());
  const [stats, setStats] = useState(() =>
    computeStats([], 0, null, null, false)
  );

  useEffect(() => {
    const load = async () => {
      const currentUser = (await ensureUserProvince()) ?? getUserSession();
      setUser(currentUser);

      const superAdmin = currentUser
        ? isSuperAdmin(currentUser.role)
        : false;
      const provinceId = superAdmin
        ? null
        : (currentUser?.province_id ?? null);
      const provinceNom = superAdmin
        ? null
        : (currentUser?.province_nom ?? null);
      const restrictToProvince =
        currentUser != null &&
        isControleurBudgetaire(currentUser.role) &&
        !superAdmin;

      try {
        const [engagementsData, budgetData] = await Promise.all([
          getEngagements(),
          getBudgetConsultation(),
        ]);

        const lignes = filterByUserProvince(budgetData.lignes, provinceId);
        const budgetDisponible = lignes.reduce(
          (sum, l) => sum + l.montant_disponible,
          0
        );

        setStats(
          computeStats(
            engagementsData,
            budgetDisponible,
            provinceId,
            provinceNom,
            restrictToProvince
          )
        );
      } catch {
        setStats(
          computeStats([], 0, provinceId, provinceNom, restrictToProvince)
        );
      }
    };

    load();
  }, []);

  const quickActions = useMemo(() => {
    if (!user) return [];
    return QUICK_ACTIONS.filter(
      (action) => action.disabled || canAccessPath(user.role, action.to)
    );
  }, [user]);

  return (
    <div className="relative min-h-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="absolute -right-24 top-20 h-80 w-80 rounded-full bg-teal-100/50 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-amber-50/80 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-8 p-6 pb-10 lg:p-8">
        <section className="relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-primary via-[hsl(215,55%,28%)] to-accent p-6 text-white shadow-xl lg:p-8">
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,white_0%,transparent_60%)]" />
          </div>

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                Portail EBOP — Gestion des Crédits Administratifs
              </div>
              <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
                {user?.nom ?? "Utilisateur"}
              </h1>
              <p className="max-w-xl text-sm text-white/80 lg:text-base">
                Pilotez vos engagements, règlements et budgets depuis un espace
                unifié.
              </p>
            </div>

            <div className="hidden shrink-0 lg:block">
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md ring-1 ring-white/20">
                <InstitutionLogo className="h-28 w-28 opacity-95" />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Card
              key={stat.label}
              className="group border-0 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div
                    className={`rounded-xl bg-gradient-to-br ${stat.gradient} p-2.5 text-white shadow-sm`}
                  >
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <Landmark className="h-4 w-4 text-gray-200 transition-colors group-hover:text-gray-300" />
                </div>
                <p className="mt-4 text-2xl font-bold tracking-tight text-gray-900">
                  {stat.value}
                </p>
                <p className="mt-0.5 text-sm font-medium text-gray-700">
                  {stat.label}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stat.trend}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Accès rapides
              </h2>
              <p className="text-sm text-muted-foreground">
                Naviguez vers vos modules en un clic
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => {
              const card = (
                <div
                  className={cn(
                    "group flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200",
                    action.disabled
                      ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60"
                      : "border-gray-100 bg-white shadow-sm hover:border-indigo-100 hover:shadow-md"
                  )}
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${action.color}`}
                  >
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "font-semibold",
                        action.disabled
                          ? "text-gray-400"
                          : "text-gray-900 group-hover:text-indigo-700"
                      )}
                    >
                      {action.title}
                      {action.disabled && (
                        <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                          Bientôt
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {action.desc}
                    </p>
                  </div>
                  {!action.disabled && (
                    <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-500" />
                  )}
                </div>
              );

              if (action.disabled) {
                return (
                  <Tooltip key={action.to}>
                    <TooltipTrigger asChild>
                      <div>{card}</div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Module bientôt disponible</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <button
                  key={action.to}
                  type="button"
                  onClick={() => navigate(action.to)}
                  className="text-left"
                >
                  {card}
                </button>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col items-center justify-between gap-4 rounded-xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
            <div>
              <p className="text-sm font-semibold text-emerald-800">
                Système opérationnel
              </p>
              <p className="text-xs text-emerald-600/80">
                Tous les services sont disponibles
              </p>
            </div>
          </div>
          <p className="text-xs text-emerald-700/70">
            DGCPT — Direction Générale de la Comptabilité Publique et du Trésor
          </p>
        </section>
      </div>
    </div>
  );
};

export default HomeContent;

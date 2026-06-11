/**
 * Matrice des permissions par rôle applicatif.
 * Les rôles en base peuvent varier (CONTROLEUR_BUDGETAIRE, etc.) — normalisés ici.
 */

export type AppRole =
  | "super_admin"
  | "dba"
  | "informaticien"
  | "tresorier"
  | "controleur_budgetaire"
  | "assistant_gestionnaire";

const ALWAYS_ALLOWED_PREFIXES = ["/acceuil/profil", "/acceuil/parametres"];

/** Préfixes de routes autorisés par rôle (hors profil / paramètres). */
const ROLE_ROUTE_PREFIXES: Record<Exclude<AppRole, "super_admin">, string[]> = {
  dba: ["/acceuil/utilisateurs"],
  informaticien: ["/acceuil/utilisateurs"],
  tresorier: ["/acceuil/reglement"],
  controleur_budgetaire: [
    "/acceuil",
    "/acceuil/engagements",
    "/acceuil/budget",
  ],
  assistant_gestionnaire: [
    "/acceuil",
    "/acceuil/engagements",
    "/acceuil/budget",
  ],
};

const DEFAULT_HOME: Record<AppRole, string> = {
  super_admin: "/acceuil",
  dba: "/acceuil/utilisateurs",
  informaticien: "/acceuil/utilisateurs",
  tresorier: "/acceuil/reglement",
  controleur_budgetaire: "/acceuil",
  assistant_gestionnaire: "/acceuil",
};

export function normalizeAppRole(role: string): AppRole | null {
  const normalized = role
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");

  if (
    normalized === "SUPER_ADMIN" ||
    normalized === "SUPERADMINISTRATEUR" ||
    normalized === "SUPER_ADMINISTRATEUR" ||
    (normalized.includes("SUPER") && normalized.includes("ADMIN"))
  ) {
    return "super_admin";
  }
  if (normalized === "DBA") return "dba";
  if (normalized.includes("INFORMATICIEN")) return "informaticien";
  if (normalized.includes("TRESORIER")) return "tresorier";
  if (normalized.includes("CONTROLEUR")) return "controleur_budgetaire";
  if (normalized.includes("ASSISTANT")) return "assistant_gestionnaire";

  return null;
}

export function isSuperAdmin(role: string): boolean {
  return normalizeAppRole(role) === "super_admin";
}

function isDashboardPath(pathname: string): boolean {
  return pathname === "/acceuil" || pathname === "/acceuil/";
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  if (prefix === "/acceuil") {
    return isDashboardPath(pathname);
  }
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function canAccessPath(role: string, pathname: string): boolean {
  if (
    ALWAYS_ALLOWED_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    )
  ) {
    return true;
  }

  if (isSuperAdmin(role)) {
    return pathname.startsWith("/acceuil");
  }

  const appRole = normalizeAppRole(role);
  if (!appRole) return false;

  const prefixes = ROLE_ROUTE_PREFIXES[appRole];
  return prefixes.some((prefix) => matchesPrefix(pathname, prefix));
}

export function getDefaultHomeRoute(role: string): string {
  const appRole = normalizeAppRole(role);
  if (!appRole) return "/acceuil";
  return DEFAULT_HOME[appRole];
}

export function canManageUsers(role: string): boolean {
  if (isSuperAdmin(role)) return true;
  const appRole = normalizeAppRole(role);
  return appRole === "dba" || appRole === "informaticien";
}

export function canManageReglements(role: string): boolean {
  if (isSuperAdmin(role)) return true;
  return normalizeAppRole(role) === "tresorier";
}

export function canVisaEngagements(role: string): boolean {
  if (isSuperAdmin(role)) return true;
  return normalizeAppRole(role) === "controleur_budgetaire";
}

export function canManageEngagements(role: string): boolean {
  if (isSuperAdmin(role)) return true;
  const appRole = normalizeAppRole(role);
  return (
    appRole === "controleur_budgetaire" ||
    appRole === "assistant_gestionnaire"
  );
}

export function canAccessDashboard(role: string): boolean {
  if (isSuperAdmin(role)) return true;
  return canManageEngagements(role);
}

export type NavItemConfig = {
  id: string;
  label: string;
  to: string;
  match: (path: string) => boolean;
  children?: { label: string; to: string }[];
  disabled?: boolean;
};

const ALL_NAV_ITEMS: NavItemConfig[] = [
  {
    id: "dashboard",
    label: "Tableau de bord",
    to: "/acceuil",
    match: (path) => path === "/acceuil" || path === "/acceuil/",
  },
  {
    id: "engagements",
    label: "Engagements",
    to: "/acceuil/engagements/viser",
    match: (path) => path.startsWith("/acceuil/engagements"),
    children: [
      {
        label: "Consulter et viser",
        to: "/acceuil/engagements/viser",
      },
      {
        label: "Autres consultations",
        to: "/acceuil/engagements/autres",
      },
      {
        label: "Créer un engagement",
        to: "/acceuil/engagements/creation",
      },
    ],
  },
  {
    id: "collectivites",
    label: "Collectivités",
    to: "/acceuil/collectivites",
    match: (path) => path.startsWith("/acceuil/collectivites"),
    disabled: true,
  },
  {
    id: "epp",
    label: "Gestion des EPP",
    to: "/acceuil/epp",
    match: (path) => path.startsWith("/acceuil/epp"),
    disabled: true,
  },
  {
    id: "reglement",
    label: "Règlement",
    to: "/acceuil/reglement",
    match: (path) => path.startsWith("/acceuil/reglement"),
  },
  {
    id: "budget",
    label: "Consultation budget",
    to: "/acceuil/budget",
    match: (path) => path.startsWith("/acceuil/budget"),
  },
  {
    id: "utilisateurs",
    label: "Gestion des utilisateurs",
    to: "/acceuil/utilisateurs",
    match: (path) => path.startsWith("/acceuil/utilisateurs"),
  },
];

export function getNavItemsForRole(role: string): NavItemConfig[] {
  if (isSuperAdmin(role)) {
    return ALL_NAV_ITEMS.map((item) => {
      if (item.id !== "engagements" || !item.children) return item;
      return {
        ...item,
        children: item.children.map((child) =>
          child.to === "/acceuil/engagements/viser"
            ? { ...child, label: "Consulter et viser" }
            : child
        ),
      };
    });
  }

  const appRole = normalizeAppRole(role);
  if (!appRole) return [];

  const all = ALL_NAV_ITEMS.map((item) => {
    if (item.id !== "engagements" || !item.children) return item;
    return {
      ...item,
      children: item.children.map((child) =>
        child.to === "/acceuil/engagements/viser"
          ? {
              ...child,
              label: canVisaEngagements(role)
                ? "Consulter et viser"
                : "Consulter les dossiers",
            }
          : child
      ),
    };
  });

  return all
    .map((item) => {
      if (!item.children) return item;
      const children = item.children.filter((child) =>
        canAccessPath(role, child.to)
      );
      if (children.length === 0) return null;
      return { ...item, children };
    })
    .filter((item): item is NavItemConfig => {
      if (!item) return false;
      if (item.disabled) return canManageEngagements(role);
      return canAccessPath(role, item.to);
    });
}

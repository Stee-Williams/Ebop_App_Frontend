import { normalizeAppRole } from "@/config/permissions";

// En dev, laisser vide pour passer par le proxy Vite (/api → localhost:8000)
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

/* ==========================================
LOGIN 
========================================== */

export type LoginPayload = {
  matricule: string;
  password: string;
};

export type LoginUser = {
  id: number;
  nom: string;
  matricule: string;
  role: string;
  province_id?: number | null;
  province_nom?: string | null;
};

export type LoginResponse = {
  success: boolean;
  message: string;
  token?: string;
  user?: LoginUser;
};

const AUTH_TOKEN_KEY = "authToken";

export function saveUserSession(user: LoginUser, token?: string): void {
  sessionStorage.setItem("isLoggedIn", "true");
  sessionStorage.setItem("userId", String(user.id));
  sessionStorage.setItem("userNom", user.nom);
  sessionStorage.setItem("userMatricule", user.matricule);
  sessionStorage.setItem("userRole", user.role);
  if (user.province_id != null) {
    sessionStorage.setItem("userProvinceId", String(user.province_id));
  } else {
    sessionStorage.removeItem("userProvinceId");
  }
  if (user.province_nom) {
    sessionStorage.setItem("userProvinceNom", user.province_nom);
  } else {
    sessionStorage.removeItem("userProvinceNom");
  }
  if (token) {
    sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

export function getAuthToken(): string | null {
  return sessionStorage.getItem(AUTH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getAuthToken() && sessionStorage.getItem("isLoggedIn"));
}

export function clearUserSession(): void {
  sessionStorage.clear();
}

export type UserSession = {
  id: number;
  nom: string;
  matricule: string;
  role: string;
  province_id: number | null;
  province_nom: string | null;
};

export function getUserSession(): UserSession | null {
  const id = sessionStorage.getItem("userId");
  const nom = sessionStorage.getItem("userNom");
  const matricule = sessionStorage.getItem("userMatricule");
  const role = sessionStorage.getItem("userRole");
  const provinceId = sessionStorage.getItem("userProvinceId");
  const provinceNom = sessionStorage.getItem("userProvinceNom");

  if (!id || !nom || !matricule || !role) {
    return null;
  }

  return {
    id: Number(id),
    nom,
    matricule,
    role,
    province_id: provinceId ? Number(provinceId) : null,
    province_nom: provinceNom,
  };
}

export {
  canAccessPath,
  canManageEngagements,
  canManageAdministrations,
  canManagePostesComptables,
  canManageLignesBudgetaires,
  canReadBudget,
  canManageReglements,
  canManageUsers,
  canVisaEngagements,
  getDefaultHomeRoute,
  getNavItemsForRole,
  isSuperAdmin,
  canAccessAllProvinces,
  normalizeAppRole,
} from "@/config/permissions";

export function isControleurBudgetaire(role: string): boolean {
  return normalizeAppRole(role) === "controleur_budgetaire";
}

export function canSelectAllProvinces(role: string): boolean {
  return canAccessAllProvinces(role);
}

export function getDefaultProvinceFilter(session: UserSession | null): string {
  if (!session) return "tous";
  if (canSelectAllProvinces(session.role)) return "tous";
  return session.province_id != null ? String(session.province_id) : "tous";
}

export function resolveProvinceScope(session: UserSession | null): {
  provinceId: number | null;
  provinceNom: string | null;
  canSelectAll: boolean;
  defaultFilter: string;
} {
  const canSelectAll = session ? canSelectAllProvinces(session.role) : false;

  return {
    provinceId: canSelectAll ? null : (session?.province_id ?? null),
    provinceNom: canSelectAll ? null : (session?.province_nom ?? null),
    canSelectAll,
    defaultFilter: getDefaultProvinceFilter(session),
  };
}

export function filterProvincesForUser(
  provinces: ProvinceItem[],
  session: UserSession | null
): ProvinceItem[] {
  if (!session || canSelectAllProvinces(session.role)) return provinces;
  if (session.province_id == null) return [];
  return provinces.filter((p) => p.id === session.province_id);
}

export function guardProvinceFilter(
  value: string,
  session: UserSession | null
): string {
  if (session && !canSelectAllProvinces(session.role) && session.province_id != null) {
    return String(session.province_id);
  }
  return value;
}

export function filterByUserProvince<T extends { province_id: number | null }>(
  items: T[],
  provinceId: number | null
): T[] {
  if (provinceId == null) return items;
  const id = Number(provinceId);
  return items.filter((item) => item.province_id != null && Number(item.province_id) === id);
}

/** Recharge province_id / province_nom depuis l'API si absents de la session. */
export async function ensureUserProvince(): Promise<UserSession | null> {
  const session = getUserSession();
  if (!session) return null;
  if (session.province_id != null) return session;

  try {
    const profile = await getUserById(session.id);
    if (profile.province_id != null) {
      sessionStorage.setItem("userProvinceId", String(profile.province_id));
      if (profile.province_nom) {
        sessionStorage.setItem("userProvinceNom", profile.province_nom);
      }
      return {
        ...session,
        province_id: profile.province_id,
        province_nom: profile.province_nom,
      };
    }
  } catch {
    // session inchangée si l'API échoue
  }

  return session;
}

export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      clearUserSession();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
      throw new Error("Session expirée. Veuillez vous reconnecter.");
    }

    return response;
  } catch (err) {
    if (err instanceof Error && err.message.includes("Session expirée")) {
      throw err;
    }
    throw new Error(
      "Impossible de contacter le serveur. Vérifiez que le backend est démarré."
    );
  }
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      matricule: payload.matricule.trim(),
      password: payload.password,
    }),
  });

  let data: LoginResponse;
  try {
    data = await response.json();
  } catch {
    throw new Error("Réponse invalide du serveur");
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Erreur de connexion");
  }

  return data;
}

export type ResetPasswordPayload = {
  matricule: string;
  new_password: string;
};

export type ResetPasswordResponse = {
  success: boolean;
  message: string;
};

export async function resetPassword(
  payload: ResetPasswordPayload
): Promise<ResetPasswordResponse> {
  const response = await fetch(`${API_BASE_URL}/api/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      matricule: payload.matricule.trim(),
      new_password: payload.new_password,
    }),
  });

  let data: ResetPasswordResponse;
  try {
    data = await response.json();
  } catch {
    throw new Error("Réponse invalide du serveur");
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Erreur lors de la réinitialisation");
  }

  return data;
}

/* ==========================================
CREATE USER
========================================== */

export type CreateUserPayload = {
  nom: string;
  matricule: string;
  password: string;
  role_id: number;
  province_id: number;
};

export type CreateUserResponse = {
  success: boolean;
  message: string;
  user?: UserListItem;
};

export const ROLE_OPTIONS = [
  { label: "Super administrateur", value: "Super administrateur", id: 6 },
  { label: "DBA", value: "DBA", id: 4 },
  { label: "Assistant gestionnaire", value: "Assistant gestionnaire", id: 5 },
  { label: "Contrôleur Budgétaire", value: "Controleur Budgétaire", id: 1 },
  {
    label: "Contrôleur budgétaire principale",
    value: "Controleur Budgétaire Principale",
    id: 7,
  },
  { label: "Trésorier", value: "Trésorier", id: 2 },
  { label: "Informaticien", value: "Informaticien", id: 3 },
] as const;

const ROLE_IDS: Record<string, number> = Object.fromEntries(
  ROLE_OPTIONS.map((role) => [role.value, role.id])
);

export function getRoleId(role: string): number | undefined {
  return ROLE_IDS[role];
}

const ROLE_DB_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super administrateur",
  CONTROLEUR_BUDGETAIRE: "Contrôleur Budgétaire",
  CONTROLEUR_BUDGETAIRE_PRINCIPALE: "Contrôleur budgétaire principale",
  TRESORIER: "Trésorier",
  INFORMATICIEN: "Informaticien",
  DBA: "DBA",
  ASSISTANT_GESTIONNAIRE: "Assistant gestionnaire",
};

export function getRoleLabel(roleName: string): string {
  const dbKey = roleName.toUpperCase().replace(/\s+/g, "_");
  if (ROLE_DB_LABELS[dbKey]) {
    return ROLE_DB_LABELS[dbKey];
  }

  const match = ROLE_OPTIONS.find(
    (role) =>
      role.value.toLowerCase() === roleName.toLowerCase() ||
      role.label.toLowerCase() === roleName.toLowerCase() ||
      roleName.toUpperCase().replace(/\s+/g, "_") ===
        role.value.toUpperCase().replace(/\s+/g, "_")
  );

  return match?.label ?? roleName;
}

export type RoleItem = {
  id: number;
  nom: string;
};

export const getRoles = () => fetchList<RoleItem>("/api/roles");

export type UserListItem = {
  id: number;
  nom: string;
  matricule: string;
  role: string | null;
  role_id: number | null;
  province_id: number | null;
  province_nom: string | null;
};

export const getUsers = () => fetchList<UserListItem>("/api/users");

export async function getUserById(id: number): Promise<UserListItem> {
  const response = await authFetch(`${API_BASE_URL}/api/users/${id}`);
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Utilisateur introuvable");
  }

  return {
    id: data.id,
    nom: data.nom,
    matricule: data.matricule,
    role: data.role ?? null,
    role_id: data.role_id ?? null,
    province_id: data.province_id ?? null,
    province_nom: data.province_nom ?? null,
  };
}

export type UpdateUserPayload = {
  nom?: string;
  role_id?: number;
  province_id?: number | null;
};

export async function updateUser(
  id: number,
  payload: UpdateUserPayload
): Promise<{ success: boolean; message?: string; user?: UserListItem }> {
  const response = await authFetch(`${API_BASE_URL}/api/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Erreur lors de la mise à jour");
  }

  return data;
}

export async function deleteUser(
  id: number
): Promise<{ success: boolean; message?: string }> {
  const response = await authFetch(`${API_BASE_URL}/api/users/${id}`, {
    method: "DELETE",
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Erreur lors de la suppression");
  }

  return data;
}

/* ==========================================
USER PROFILE
========================================== */

export type UserProfile = {
  id: number;
  nom: string;
  matricule: string;
  role: string;
  role_id: number;
};

export type UserProfileResponse = {
  success: boolean;
  message?: string;
  user?: UserProfile;
};

export async function getUserByMatricule(
  matricule: string
): Promise<UserProfileResponse> {
  const response = await authFetch(
    `${API_BASE_URL}/api/users/matricule/${encodeURIComponent(matricule.trim())}`
  );

  const data: UserProfileResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Utilisateur introuvable");
  }

  return data;
}

export async function updateUserRole(
  matricule: string,
  roleId: number
): Promise<UserProfileResponse> {
  const response = await authFetch(
    `${API_BASE_URL}/api/users/${encodeURIComponent(matricule.trim())}/role`,
    {
      method: "PUT",
      body: JSON.stringify({ role_id: roleId }),
    }
  );

  let data: UserProfileResponse;
  try {
    data = await response.json();
  } catch {
    throw new Error("Réponse invalide du serveur");
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Erreur lors de la mise à jour du rôle");
  }

  return data;
}

/* ==========================================
BUDGET CONSULTATION
========================================== */

export type BudgetItem = {
  id: number;
  annee: number;
  libelle: string;
  montant: number;
  unite_operationnelle_id?: number | null;
  unite_operationnelle: string | null;
  administration_id?: number | null;
  administration_nom?: string | null;
  province_id: number | null;
  province_nom: string | null;
  lignes_count: number;
};

export type LigneBudgetaireItem = {
  id: number;
  code: string | null;
  libelle: string;
  montant_alloue: number;
  montant_utilise: number;
  montant_decaisse: number;
  montant_disponible: number;
  taux_utilisation: number;
  budget_id: number | null;
  budget_libelle: string | null;
  budget_montant?: number | null;
  annee: number | null;
  province_id: number | null;
  province_nom: string | null;
  administration_id?: number | null;
  administration_nom?: string | null;
  unite_operationnelle_id?: number | null;
  unite_operationnelle_nom?: string | null;
};

export type BudgetConsultationResponse = {
  success: boolean;
  budgets: BudgetItem[];
  lignes: LigneBudgetaireItem[];
  stats: {
    total_alloue: number;
    total_utilise: number;
    total_disponible: number;
    total_decaisse: number;
    total_budget_global: number;
    taux_global: number;
    nombre_lignes: number;
    nombre_budgets: number;
  };
};

export async function getBudgetConsultation(): Promise<BudgetConsultationResponse> {
  const response = await authFetch(`${API_BASE_URL}/api/budgets/consultation`);

  const data: BudgetConsultationResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error("Impossible de charger les données budgétaires");
  }

  return data;
}

/* ==========================================
REFERENCE DATA (formulaires)
========================================== */

type ApiListResponse<T> = {
  success: boolean;
  data: T[];
  message?: string;
};

async function fetchList<T>(path: string): Promise<T[]> {
  const response = await authFetch(`${API_BASE_URL}${path}`);
  const data: ApiListResponse<T> = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Erreur de chargement des données");
  }

  return data.data;
}

export type ProvinceItem = {
  id: number;
  nom: string;
  code: string;
};

export type AdministrationLigneItem = {
  id: number;
  code: string | null;
  libelle: string;
  montant_alloue: number;
  montant_utilise?: number;
  montant_disponible?: number;
  budget_id?: number | null;
  budget_libelle?: string | null;
  annee?: number | null;
};

export type AdministrationUniteItem = {
  id: number;
  nom: string;
  code: string | null;
  budget_annee: number | null;
  lignes_budgetaires: AdministrationLigneItem[];
};

export type AdministrationItem = {
  id: number;
  nom: string;
  code: string;
  province_id: number | null;
  province_nom: string | null;
  unites_count?: number;
  unites_operationnelles?: AdministrationUniteItem[];
};

export type UniteOperationnelleItem = {
  id: number;
  nom: string;
  code: string | null;
  administration_id: number | null;
  administration_nom: string | null;
};

export type BudgetListItem = {
  id: number;
  annee: number;
  libelle: string;
  montant: number;
  unite_operationnelle_id: number | null;
  unite_operationnelle: string | null;
  province_id: number | null;
  province_nom: string | null;
  lignes_count: number;
};

export type LigneBudgetaireListItem = {
  id: number;
  code: string | null;
  libelle: string;
  montant_alloue: number;
  montant_utilise: number;
  montant_disponible: number;
  taux_utilisation: number;
  budget_id: number | null;
  budget_libelle: string | null;
  annee: number | null;
  province_id?: number | null;
  province_nom?: string | null;
  administration_id?: number | null;
  administration_nom?: string | null;
};

export type PosteComptableItem = {
  id: number;
  code: string | null;
  libelle: string;
  description: string | null;
  type: string | null;
  province_id: number | null;
  province_nom: string | null;
};

export type CreatePosteComptablePayload = {
  code?: string;
  libelle: string;
  description?: string;
  type?: string;
  province_id?: number | null;
};

export type FournisseurItem = {
  id: number;
  nom: string;
  adresse: string | null;
  telephone: string | null;
  nif: string | null;
};

export const getProvinces = () => fetchList<ProvinceItem>("/api/provinces");
export const getAdministrations = () =>
  fetchList<AdministrationItem>("/api/administrations");

export type CreateAdministrationLignePayload = {
  code?: string;
  libelle: string;
  montant_alloue: number;
};

export type CreateAdministrationUnitePayload = {
  nom: string;
  code?: string;
  budget_annee?: number;
  lignes_budgetaires?: CreateAdministrationLignePayload[];
};

export type CreateAdministrationPayload = {
  nom: string;
  code: string;
  province_id?: number | null;
  unites_operationnelles?: CreateAdministrationUnitePayload[];
};

export async function getAdministrationById(
  id: number
): Promise<AdministrationItem> {
  const response = await authFetch(`${API_BASE_URL}/api/administrations/${id}`);
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Administration introuvable");
  }

  const { success: _success, ...detail } = data as AdministrationItem & {
    success: boolean;
  };
  return detail;
}

export async function createAdministration(
  payload: CreateAdministrationPayload
): Promise<{ success: boolean; message?: string; data?: AdministrationItem }> {
  const response = await authFetch(`${API_BASE_URL}/api/administrations`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Erreur lors de la création");
  }

  return data;
}

export async function updateAdministration(
  id: number,
  payload: Partial<CreateAdministrationPayload>
): Promise<{ success: boolean; message?: string; data?: AdministrationItem }> {
  const response = await authFetch(`${API_BASE_URL}/api/administrations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Erreur lors de la mise à jour");
  }

  return data;
}

export async function deleteAdministration(
  id: number
): Promise<{ success: boolean; message?: string }> {
  const response = await authFetch(`${API_BASE_URL}/api/administrations/${id}`, {
    method: "DELETE",
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Erreur lors de la suppression");
  }

  return data;
}
export const getUnitesOperationnelles = () =>
  fetchList<UniteOperationnelleItem>("/api/unites-operationnelles");
export const getBudgets = () => fetchList<BudgetListItem>("/api/budgets");
export const getLignesBudgetaires = () =>
  fetchList<LigneBudgetaireListItem>("/api/lignes-budgetaires");

export type CreateLigneBudgetairePayload = {
  code?: string;
  libelle: string;
  montant_alloue: number;
  budget_id: number;
};

export async function createLigneBudgetaire(
  payload: CreateLigneBudgetairePayload
): Promise<{ success: boolean; message?: string; data?: LigneBudgetaireListItem }> {
  const response = await authFetch(`${API_BASE_URL}/api/lignes-budgetaires`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Erreur lors de la création de la ligne");
  }

  return data;
}

export async function deleteLigneBudgetaire(
  id: number
): Promise<{ success: boolean; message?: string }> {
  const response = await authFetch(`${API_BASE_URL}/api/lignes-budgetaires/${id}`, {
    method: "DELETE",
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Erreur lors de la suppression");
  }

  return data;
}
export const getPostesComptables = () =>
  fetchList<PosteComptableItem>("/api/postes-comptables");

export async function createPosteComptable(
  payload: CreatePosteComptablePayload
): Promise<{ success: boolean; message?: string; data?: PosteComptableItem }> {
  const response = await authFetch(`${API_BASE_URL}/api/postes-comptables`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Erreur lors de la création");
  }

  return data;
}

export async function updatePosteComptable(
  id: number,
  payload: Partial<CreatePosteComptablePayload>
): Promise<{ success: boolean; message?: string; data?: PosteComptableItem }> {
  const response = await authFetch(`${API_BASE_URL}/api/postes-comptables/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Erreur lors de la mise à jour");
  }

  return data;
}

export async function deletePosteComptable(
  id: number
): Promise<{ success: boolean; message?: string }> {
  const response = await authFetch(`${API_BASE_URL}/api/postes-comptables/${id}`, {
    method: "DELETE",
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Erreur lors de la suppression");
  }

  return data;
}
export const getFournisseurs = () =>
  fetchList<FournisseurItem>("/api/fournisseurs");

export async function createFournisseur(payload: {
  nom: string;
  adresse?: string;
  telephone?: string;
  nif?: string;
}): Promise<{ success: boolean; message?: string; data?: FournisseurItem }> {
  const response = await authFetch(`${API_BASE_URL}/api/fournisseurs`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Erreur lors de la création du fournisseur");
  }

  return data;
}

/* ==========================================
ENGAGEMENTS
========================================== */

export type EngagementItem = {
  id: number;
  numero: string;
  montant: number;
  date: string;
  statut: string;
  objet?: string | null;
  titre?: string | null;
  demandeur?: string | null;
  saisi_par?: string | null;
  user_id?: number | null;
  fournisseur?: string | null;
  province_id: number | null;
  province_nom: string | null;
  administration_id: number | null;
  administration_nom: string | null;
  unite_operationnelle_id: number | null;
  unite_operationnelle_nom: string | null;
  poste_comptable_libelle?: string | null;
  poste_comptable_id?: number | null;
  ligne_budgetaire_libelle?: string | null;
  vise_par?: string | null;
  date_visa?: string | null;
  motif_rejet?: string | null;
};

export const getEngagements = () =>
  fetchList<EngagementItem>("/api/engagements");

export const getEngagementsVises = () =>
  fetchList<EngagementItem>("/api/engagements/vises");

export type CreateEngagementPayload = {
  titre: string;
  numero?: string;
  montant: number;
  date: string;
  statut: string;
  ligne_budgetaire_id?: number;
  poste_comptable_id: number;
  fournisseur_id?: number;
  fournisseur_nom?: string;
  user_id?: number;
};

export async function getEngagementById(id: number): Promise<EngagementItem> {
  const response = await authFetch(`${API_BASE_URL}/api/engagements/${id}`);
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Engagement introuvable");
  }

  if (data.data && typeof data.data === "object") {
    return data.data as EngagementItem;
  }

  const { success: _success, message: _message, ...engagement } = data;
  return engagement as EngagementItem;
}

export async function getNextEngagementNumero(
  annee?: number
): Promise<string> {
  const query = annee ? `?annee=${annee}` : "";
  const response = await authFetch(
    `${API_BASE_URL}/api/engagements/next-numero${query}`
  );
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Impossible de générer le numéro");
  }

  return data.numero as string;
}

export type CreateEngagementResponse = {
  success: boolean;
  message?: string;
  data?: {
    id: number;
    numero: string;
    montant: number;
    date: string;
    statut: string;
  };
};

export type UpdateEngagementPayload = {
  statut?: string;
  motif_rejet?: string;
  poste_comptable_id?: number | null;
};

export async function updateEngagement(
  id: number,
  payload: UpdateEngagementPayload
): Promise<{ success: boolean; message?: string }> {
  const response = await authFetch(`${API_BASE_URL}/api/engagements/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Erreur lors de la mise à jour de l'engagement");
  }

  return data;
}

export async function createEngagement(
  payload: CreateEngagementPayload
): Promise<CreateEngagementResponse> {
  const response = await authFetch(`${API_BASE_URL}/api/engagements`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const raw = await response.text();
  let data: CreateEngagementResponse;
  try {
    data = JSON.parse(raw) as CreateEngagementResponse;
  } catch {
    throw new Error(
      response.ok
        ? "Réponse serveur invalide"
        : "Erreur serveur lors de la création de l'engagement. Vérifiez que les migrations sont à jour."
    );
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Erreur lors de la création de l'engagement");
  }

  return data;
}

/* ==========================================
REGLEMENTS
========================================== */

export type ReglementItem = {
  id: number;
  reference: string;
  montant: number;
  mode_paiement: string;
  numero_compte?: string | null;
  banque_fournisseur?: string | null;
  date_reglement: string;
  created_at?: string | null;
  cree_par?: string | null;
  engagement_id: number;
  engagement_numero: string;
  engagement_titre?: string | null;
  engagement_statut?: string;
  fournisseur?: string | null;
  demandeur?: string | null;
  saisi_par?: string | null;
  user_id?: number | null;
  province_id: number | null;
  province_nom: string | null;
  administration_id?: number | null;
  administration_nom?: string | null;
  unite_operationnelle_id?: number | null;
  unite_operationnelle_nom?: string | null;
  ligne_budgetaire_id?: number | null;
  ligne_budgetaire_libelle?: string | null;
  poste_comptable_libelle?: string | null;
};

export const getReglements = () => fetchList<ReglementItem>("/api/reglements");

export type CreateReglementPayload = {
  engagement_id: number;
  mode_paiement: string;
  date_reglement: string;
  numero_compte?: string;
  banque_fournisseur?: string;
};

export async function createReglement(
  payload: CreateReglementPayload
): Promise<{ success: boolean; message?: string; data?: ReglementItem }> {
  const response = await authFetch(`${API_BASE_URL}/api/reglements`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Erreur lors de l'enregistrement du règlement");
  }

  return data;
}

export async function createUser(
  payload: CreateUserPayload
): Promise<CreateUserResponse> {
  const response = await authFetch(`${API_BASE_URL}/api/users`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const raw = await response.text();
  let data: CreateUserResponse;
  try {
    data = JSON.parse(raw) as CreateUserResponse;
  } catch {
    throw new Error(
      response.status >= 500
        ? "Erreur serveur lors de la création. Vérifiez les logs Symfony."
        : "Réponse invalide du serveur. Vérifiez que le backend est démarré sur le port 8000."
    );
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Erreur lors de la création du compte");
  }

  return data;
}

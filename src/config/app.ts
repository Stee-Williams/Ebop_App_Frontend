const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

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
};

export function getUserSession(): UserSession | null {
  const id = sessionStorage.getItem("userId");
  const nom = sessionStorage.getItem("userNom");
  const matricule = sessionStorage.getItem("userMatricule");
  const role = sessionStorage.getItem("userRole");

  if (!id || !nom || !matricule || !role) {
    return null;
  }

  return { id: Number(id), nom, matricule, role };
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
    return await fetch(url, { ...options, headers });
  } catch {
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

/* ==========================================
CREATE USER
========================================== */

export type CreateUserPayload = {
nom: string;
matricule: string;
password: string;
role_id: number;
};

export type CreateUserResponse = {
success: boolean;
message: string;
user?: {
id: number;
nom: string;
matricule: string;
role_id: number;
};
};

export const ROLE_OPTIONS = [
  { label: "DBA", value: "DBA", id: 4 },
  { label: "Assistant gestionnaire", value: "Assistant gestionnaire", id: 5 },
  { label: "Contrôleur Budgétaire", value: "Controleur Budgétaire", id: 1 },
  { label: "Trésorier", value: "Trésorier", id: 2 },
  { label: "Informaticien", value: "Informaticien", id: 3 },
] as const;

const ROLE_IDS: Record<string, number> = Object.fromEntries(
  ROLE_OPTIONS.map((role) => [role.value, role.id])
);

export function getRoleId(role: string): number | undefined {
  return ROLE_IDS[role];
}

export function getRoleLabel(roleName: string): string {
  const match = ROLE_OPTIONS.find(
    (role) =>
      role.value.toLowerCase() === roleName.toLowerCase() ||
      role.label.toLowerCase() === roleName.toLowerCase() ||
      roleName.toUpperCase().replace(/\s+/g, "_") ===
        role.value.toUpperCase().replace(/\s+/g, "_")
  );

  return match?.label ?? roleName;
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
  unite_operationnelle: string | null;
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
  montant_disponible: number;
  taux_utilisation: number;
  budget_id: number | null;
  budget_libelle: string | null;
  annee: number | null;
  province_id: number | null;
  province_nom: string | null;
};

export type BudgetConsultationResponse = {
  success: boolean;
  budgets: BudgetItem[];
  lignes: LigneBudgetaireItem[];
  stats: {
    total_alloue: number;
    total_utilise: number;
    total_disponible: number;
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

export type AdministrationItem = {
  id: number;
  nom: string;
  code: string;
  province_id: number | null;
  province_nom: string | null;
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
};

export type PosteComptableItem = {
  id: number;
  code: string | null;
  libelle: string;
  description: string | null;
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
export const getUnitesOperationnelles = () =>
  fetchList<UniteOperationnelleItem>("/api/unites-operationnelles");
export const getBudgets = () => fetchList<BudgetListItem>("/api/budgets");
export const getLignesBudgetaires = () =>
  fetchList<LigneBudgetaireListItem>("/api/lignes-budgetaires");
export const getPostesComptables = () =>
  fetchList<PosteComptableItem>("/api/postes-comptables");
export const getFournisseurs = () =>
  fetchList<FournisseurItem>("/api/fournisseurs");

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
  fournisseur?: string | null;
  province_id: number | null;
  province_nom: string | null;
  administration_id: number | null;
  administration_nom: string | null;
  unite_operationnelle_id: number | null;
  unite_operationnelle_nom: string | null;
  poste_comptable_libelle?: string | null;
  ligne_budgetaire_libelle?: string | null;
};

export const getEngagements = () =>
  fetchList<EngagementItem>("/api/engagements");

export type CreateEngagementPayload = {
  numero: string;
  montant: number;
  date: string;
  statut: string;
  ligne_budgetaire_id?: number;
  poste_comptable_id?: number;
  fournisseur_id?: number;
  user_id?: number;
};

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

export async function createEngagement(
  payload: CreateEngagementPayload
): Promise<CreateEngagementResponse> {
  const response = await authFetch(`${API_BASE_URL}/api/engagements`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data: CreateEngagementResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Erreur lors de la création de l'engagement");
  }

  return data;
}

export async function createUser(
payload: CreateUserPayload
): Promise<CreateUserResponse> {
const response = await fetch(`${API_BASE_URL}/api/users`, {
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify(payload),
});

const data: CreateUserResponse = await response.json();

if (!response.ok) {
throw new Error(
data.message || "Erreur lors de la création du compte"
);
}

return data;
}

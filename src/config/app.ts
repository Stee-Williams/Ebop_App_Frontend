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

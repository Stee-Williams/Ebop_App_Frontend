import { useMemo } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Settings,
  UserCircle,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { clearUserSession, getUserSession } from "@/config/app";
import { cn } from "@/lib/utils";

type NavChild = { label: string; to: string };

type NavSection = {
  id: string;
  label: string;
  to: string;
  match: (path: string) => boolean;
  children?: NavChild[];
  disabled?: boolean;
};

const NAV_SECTIONS: NavSection[] = [
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
      { label: "Consulter et viser", to: "/acceuil/engagements/viser" },
      { label: "Autres consultations", to: "/acceuil/engagements/autres" },
      { label: "Créer un engagement", to: "/acceuil/engagements/creation" },
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
    id: "divers",
    label: "Divers",
    to: "/acceuil/divers/budget",
    match: (path) => path.startsWith("/acceuil/divers"),
    children: [
      { label: "Consulter le budget", to: "/acceuil/divers/budget" },
      { label: "Mise à jour des profils", to: "/acceuil/divers/profils" },
    ],
  },
];

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const tabClass = (isActive: boolean, disabled?: boolean) =>
  cn(
    "inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
    disabled
      ? "cursor-not-allowed text-gray-400 opacity-50"
      : isActive
        ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100"
        : "text-gray-600 hover:bg-gray-50 hover:text-indigo-600"
  );

function DisabledNavTab({ label }: { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={tabClass(false, true)}
          aria-disabled="true"
        >
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>Module bientôt disponible</p>
      </TooltipContent>
    </Tooltip>
  );
}

function NavTab({ section }: { section: NavSection }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = section.match(location.pathname);

  if (section.disabled) {
    return <DisabledNavTab label={section.label} />;
  }

  if (!section.children) {
    return (
      <NavLink
        to={section.to}
        end={section.id === "dashboard"}
        className={() => tabClass(isActive)}
      >
        {section.id === "dashboard" && (
          <LayoutDashboard className="h-4 w-4" />
        )}
        {section.label}
      </NavLink>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={tabClass(isActive)}>
          {section.label}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[220px]">
        {section.children.map((child) => (
          <DropdownMenuItem
            key={child.to}
            onClick={() => navigate(child.to)}
            className={cn(
              "cursor-pointer",
              location.pathname === child.to &&
                "bg-indigo-50 font-medium text-indigo-700"
            )}
          >
            {child.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getUserSession();

  const isProfileRoute = useMemo(
    () =>
      location.pathname.startsWith("/acceuil/profil") ||
      location.pathname.startsWith("/acceuil/parametres"),
    [location.pathname]
  );

  const handleLogout = () => {
    clearUserSession();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50 font-sans">
      <header className="z-50 border-b border-gray-200/80 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-5">
            <div className="shrink-0 bg-gradient-to-r from-indigo-700 to-teal-600 bg-clip-text text-lg font-bold tracking-tight text-transparent">
              EBOP
            </div>

            <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
              {NAV_SECTIONS.map((section) => (
                <NavTab key={section.id} section={section} />
              ))}
            </nav>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex shrink-0 items-center gap-2 rounded-full border border-gray-200/80 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
              >
                <Avatar className="h-8 w-8 ring-2 ring-indigo-100">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-teal-500 text-xs font-semibold text-white">
                    {user ? getInitials(user.nom) : "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-[140px] truncate sm:inline">
                  {user?.nom ?? "Utilisateur"}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => navigate("/acceuil/profil")}>
                <UserCircle className="mr-2 h-4 w-4" />
                Mon profil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/acceuil/parametres")}>
                <Settings className="mr-2 h-4 w-4" />
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main
        className={cn(
          "flex-1 overflow-auto",
          isProfileRoute ? "bg-white" : "bg-slate-50/50"
        )}
      >
        <Outlet />
      </main>

      <footer className="flex justify-between border-t border-gray-200 bg-white px-6 py-3 text-xs text-gray-400">
        <span>
          &copy; 2026 Direction Générale de la comptabilité et du Trésor
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          Système Opérationnel
        </span>
      </footer>
    </div>
  );
}

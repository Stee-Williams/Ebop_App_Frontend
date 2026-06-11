import { Navigate, useLocation } from "react-router-dom";
import { getUserSession } from "@/config/app";
import { canAccessPath, getDefaultHomeRoute } from "@/config/permissions";

type RoleGuardProps = {
  children: React.ReactNode;
};

/**
 * Redirige vers la page d'accueil du rôle si l'utilisateur n'a pas accès à la route courante.
 */
export default function RoleGuard({ children }: RoleGuardProps) {
  const location = useLocation();
  const user = getUserSession();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccessPath(user.role, location.pathname)) {
    return (
      <Navigate to={getDefaultHomeRoute(user.role)} replace state={{ from: location }} />
    );
  }

  return <>{children}</>;
}

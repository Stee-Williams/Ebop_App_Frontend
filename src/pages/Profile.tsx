import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Search,
  Shield,
  User,
  UserCog,
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
import { PageHeader, PageShell } from "@/components/layout/PageShell";
import InstitutionLogo from "@/components/InstitutionLogo";
import PCLLogo from "@/components/PCLLogo";
import {
  ROLE_OPTIONS,
  getRoleId,
  getRoleLabel,
  getUserByMatricule,
  updateUserRole,
  type UserProfile,
} from "@/config/app";
import { cn } from "@/lib/utils";

type MiseAJourProfilProps = {
  embedded?: boolean;
};

const ProfileForm = ({
  className,
}: {
  className?: string;
}) => {
  const [matricule, setMatricule] = useState("");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [nouveauRole, setNouveauRole] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isSearching, setIsSearching] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const isSuccess = message.type === "success";

  useEffect(() => {
    const trimmed = matricule.trim();
    if (!trimmed) {
      setUser(null);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true);
      setMessage({ text: "", type: "" });
      try {
        const data = await getUserByMatricule(trimmed);
        setUser(data.user ?? null);
      } catch {
        setUser(null);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [matricule]);

  const handleValider = async () => {
    if (!user || !nouveauRole) {
      setMessage({
        text: "Veuillez sélectionner un utilisateur et un rôle.",
        type: "error",
      });
      return;
    }

    const roleId = getRoleId(nouveauRole);
    if (!roleId) {
      setMessage({ text: "Rôle invalide.", type: "error" });
      return;
    }

    setIsUpdating(true);
    setMessage({ text: "", type: "" });

    try {
      const data = await updateUserRole(matricule.trim(), roleId);
      const updatedUser = data.user ?? user;
      setUser(updatedUser);
      setMessage({
        text: `Le rôle de ${updatedUser.nom} a été mis à jour avec succès.`,
        type: "success",
      });
      setNouveauRole("");
    } catch (error) {
      setMessage({
        text:
          error instanceof Error
            ? error.message
            : "Impossible de mettre à jour le rôle.",
        type: "error",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReset = () => {
    setMatricule("");
    setUser(null);
    setNouveauRole("");
    setMessage({ text: "", type: "" });
  };

  const userDisplay = isSearching
    ? "Recherche en cours..."
    : user
      ? user.nom
      : matricule.trim()
        ? "Aucun utilisateur trouvé"
        : "Saisissez un matricule";

  const userFieldClass = user
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : isSearching
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : matricule.trim()
        ? "border-red-200 bg-red-50 text-red-600"
        : "border-gray-200 bg-gray-50 text-muted-foreground";

  return (
    <Card
      className={cn(
        "overflow-hidden border-0 bg-white/90 shadow-lg backdrop-blur-sm",
        className
      )}
    >
      <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-emerald-500" />
      <CardContent className="p-6 lg:p-8">
        <div className="mb-8 text-center">
          <PCLLogo className="mx-auto mb-3" />
          <h2 className="text-lg font-bold text-primary">
            Mise à jour des profils
          </h2>
          <p className="mt-1 text-sm text-accent">
            Gestion des Crédits Administratifs
          </p>
        </div>

        <div className="mb-6 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-teal-50/50 to-indigo-50/80 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-indigo-100 p-2">
              <Search className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">Information</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Recherchez un utilisateur par matricule et modifiez son rôle
                d&apos;intervention au sein du système EBOP.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="matricule"
              className="text-xs font-semibold uppercase tracking-wide text-primary/80"
            >
              Matricule
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="matricule"
                value={matricule}
                onChange={(e) => setMatricule(e.target.value)}
                placeholder="Ex: MAT001"
                className="h-11 border-gray-200 bg-white pl-10 focus-visible:ring-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary/80">
                <User className="h-3.5 w-3.5 text-accent" />
                Utilisateur
              </Label>
              <div
                className={cn(
                  "flex h-11 items-center rounded-lg border px-3 text-sm font-medium transition-colors",
                  userFieldClass
                )}
              >
                {userDisplay}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary/80">
                <Shield className="h-3.5 w-3.5 text-accent" />
                Rôle actuel
              </Label>
              <div
                className={cn(
                  "flex h-11 items-center rounded-lg border px-3 text-sm font-medium",
                  user
                    ? "border-primary/20 bg-primary/5 text-primary"
                    : "border-gray-200 bg-gray-50 text-muted-foreground"
                )}
              >
                {user?.role ? getRoleLabel(user.role) : "—"}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="nouveauRole"
              className="text-xs font-semibold uppercase tracking-wide text-primary/80"
            >
              Nouveau rôle
            </Label>
            <Select
              value={nouveauRole}
              onValueChange={setNouveauRole}
              disabled={!user || isUpdating}
            >
              <SelectTrigger
                id="nouveauRole"
                className="h-11 border-gray-200 bg-white focus:ring-accent"
              >
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {message.text && (
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl border p-4 text-sm",
                isSuccess
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-600"
              )}
            >
              {isSuccess ? (
                <CheckCircle2 className="h-5 w-5 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0" />
              )}
              <span className="font-medium">{message.text}</span>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="h-11 flex-1 border-primary/20 text-primary hover:bg-primary/5"
            >
              Effacer
            </Button>
            <Button
              type="button"
              variant="institution"
              onClick={handleValider}
              disabled={!user || !nouveauRole || isUpdating}
              className="h-11 flex-[2] gap-2 shadow-md"
            >
              <RefreshCw
                className={cn("h-4 w-4", isUpdating && "animate-spin")}
              />
              {isUpdating ? "Mise à jour..." : "Mettre à jour"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MiseAJourProfil = ({ embedded = false }: MiseAJourProfilProps) => {
  const navigate = useNavigate();

  if (embedded) {
    return (
      <PageShell className="max-w-3xl">
        <PageHeader
          icon={<UserCog className="h-6 w-6 text-white" />}
          title="Mise à jour des profils"
          description="Recherchez un utilisateur par matricule et modifiez son rôle d'intervention."
          badge="Module Divers"
        />
        <ProfileForm />
      </PageShell>
    );
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="relative hidden flex-col items-center justify-center overflow-hidden p-10 lg:flex lg:w-[36%] xl:w-[34%] xl:p-14">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-[hsl(215,55%,28%)] to-accent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,white_0%,transparent_50%)] opacity-10" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-white/60 to-emerald-500" />

        <div className="relative z-10 max-w-xs text-center text-white xl:max-w-sm">
          <div className="mb-8 inline-block rounded-2xl bg-white/10 p-5 backdrop-blur-sm">
            <InstitutionLogo className="mx-auto h-20 w-20 xl:h-24 xl:w-24" />
          </div>
          <h1 className="mb-4 text-xl font-bold leading-tight drop-shadow-sm xl:text-2xl">
            Direction Générale de la
            <br />
            Comptabilité Publique et du Trésor
          </h1>
          <p className="mb-6 text-sm leading-relaxed text-white/80 xl:text-base">
            Recherchez un utilisateur par matricule et modifiez son rôle
            d&apos;intervention au sein du système EBOP.
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col bg-gradient-to-br from-slate-50 via-background to-accent/5">
        <header className="bg-primary px-4 py-4 text-primary-foreground shadow-md sm:px-8">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/acceuil")}
              className="gap-2 border border-white/20 text-primary-foreground hover:bg-white/15 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            <div className="flex items-center gap-2 text-sm font-semibold sm:text-base">
              <UserCog className="h-5 w-5" />
              <span>Gestion des Profils EBOP</span>
            </div>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-10">
          <ProfileForm className="w-full max-w-2xl animate-slide-in-right" />
        </main>
      </div>
    </div>
  );
};

export default MiseAJourProfil;

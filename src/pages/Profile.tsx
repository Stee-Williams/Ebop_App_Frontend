import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  UserCog,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Search,
  User,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
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

const MiseAJourProfil = () => {
  const navigate = useNavigate();
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
    ? "border-institution-green/40 bg-institution-green/5 text-institution-green"
    : isSearching
      ? "border-institution-gold/40 bg-institution-gold/10 text-amber-700"
      : matricule.trim()
        ? "border-destructive/30 bg-destructive/5 text-destructive"
        : "border-border bg-muted/30 text-muted-foreground";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Panneau gauche — dégradé institutionnel */}
      <div className="hidden lg:flex lg:w-[36%] xl:w-[34%] relative flex-col items-center justify-center p-10 xl:p-14 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-institution-blue to-accent" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_20%,white_0%,transparent_50%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-institution-gold via-white/60 to-institution-green" />

        <div className="relative z-10 max-w-xs xl:max-w-sm text-center text-white">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 mb-8 inline-block">
            <InstitutionLogo className="w-20 h-20 xl:w-24 xl:h-24 mx-auto" />
          </div>

          <h1 className="text-xl xl:text-2xl font-bold mb-4 leading-tight drop-shadow-sm">
            Direction Générale de la
            <br />
            Comptabilité Publique et du Trésor
          </h1>

          <p className="text-white/80 text-sm xl:text-base leading-relaxed mb-6">
            Recherchez un utilisateur par matricule et modifiez son rôle
            d&apos;intervention au sein du système EBOP.
          </p>

          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-1 rounded-full bg-institution-gold" />
            <div className="w-4 h-4 rounded-full bg-white/30" />
            <div className="w-10 h-1 rounded-full bg-institution-green" />
          </div>
        </div>
      </div>

      {/* Panneau droit — formulaire */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 via-background to-accent/5 min-h-screen">
        {/* Barre supérieure */}
        <header className="bg-primary text-primary-foreground px-4 sm:px-8 py-4 shadow-md">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/acceuil")}
              className="gap-2 text-primary-foreground hover:bg-white/15 hover:text-white border border-white/20"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Button>
            <div className="flex items-center gap-2 font-semibold text-sm sm:text-base">
              <UserCog className="w-5 h-5 text-accent-foreground/90" />
              <span>Gestion des Profils EBOP</span>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 pt-24 lg:pt-10">
          <Card className="w-full max-w-2xl border-0 shadow-card-hover rounded-2xl overflow-hidden animate-slide-in-right">
            {/* Bandeau coloré en tête de carte */}
            <div className="h-2 bg-gradient-to-r from-primary via-accent to-institution-green" />

            <CardContent className="p-6 sm:p-8 lg:p-10">
              <div className="text-center mb-8">
                <PCLLogo className="mb-3 mx-auto" />
                <h2 className="text-lg font-bold text-primary">
                  Mise à jour des profils
                </h2>
                <p className="text-accent text-sm mt-1">
                  Gestion des Crédits Administratifs
                </p>
              </div>

              <div className="rounded-xl p-4 mb-7 bg-gradient-to-r from-primary/5 via-accent/10 to-primary/5 border border-accent/20">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-accent/15 shrink-0">
                    <Search className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-primary">
                      Information
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Recherche d&apos;un utilisateur par matricule et
                      modification de son rôle.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="matricule"
                    className="font-semibold text-primary/80 text-xs uppercase tracking-wide"
                  >
                    Matricule
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="matricule"
                      value={matricule}
                      onChange={(e) => setMatricule(e.target.value)}
                      placeholder="Ex: 00000"
                      className="h-11 pl-10 border-accent/30 focus-visible:ring-accent focus-visible:border-accent bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-semibold text-primary/80 text-xs uppercase tracking-wide flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-accent" />
                      Utilisateur
                    </Label>
                    <div
                      className={`h-11 px-3 flex items-center rounded-lg border text-sm font-medium transition-colors ${userFieldClass}`}
                    >
                      {userDisplay}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold text-primary/80 text-xs uppercase tracking-wide flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-accent" />
                      Rôle actuel
                    </Label>
                    <div
                      className={`h-11 px-3 flex items-center rounded-lg border text-sm font-medium transition-colors ${
                        user
                          ? "border-primary/30 bg-primary/5 text-primary"
                          : "border-border bg-muted/30 text-muted-foreground"
                      }`}
                    >
                      {user?.role ? getRoleLabel(user.role) : "-"}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="nouveauRole"
                    className="font-semibold text-primary/80 text-xs uppercase tracking-wide"
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
                      className="h-11 border-accent/30 focus:ring-accent bg-white"
                    >
                      <SelectValue placeholder="-- Sélectionner --" />
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
                    className={`flex items-center gap-3 p-4 rounded-xl text-sm ${
                      isSuccess
                        ? "bg-institution-green/10 text-institution-green border border-institution-green/30"
                        : "bg-destructive/10 text-destructive border border-destructive/30"
                    }`}
                  >
                    {isSuccess ? (
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 shrink-0" />
                    )}
                    <span className="font-medium">{message.text}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    className="flex-1 h-11 border-primary/20 text-primary hover:bg-primary/5"
                  >
                    Effacer
                  </Button>
                  <Button
                    type="button"
                    variant="institution"
                    onClick={handleValider}
                    disabled={!user || !nouveauRole || isUpdating}
                    className="flex-[2] h-11 gap-2 shadow-md"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isUpdating ? "animate-spin" : ""}`}
                    />
                    {isUpdating ? "Mise à jour..." : "Mettre à jour"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* En-tête mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-gradient-to-r from-primary to-accent text-white p-4 shadow-lg">
        <div className="flex items-center justify-center gap-3">
          <InstitutionLogo className="w-9 h-9" />
          <span className="text-sm font-bold tracking-wide">DGCPT — EBOP</span>
        </div>
      </div>
    </div>
  );
};

export default MiseAJourProfil;

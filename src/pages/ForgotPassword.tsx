import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import InstitutionLogo from "@/components/InstitutionLogo";
import PCLLogo from "@/components/PCLLogo";
import { resetPassword } from "@/config/app";
import { useToast } from "@/hooks/use-toast";

const SAME_PASSWORD_ERROR =
  "Le nouveau mot de passe ne peut pas être identique à l'ancien";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [matricule, setMatricule] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!matricule.trim() || !newPassword || !confirmPassword) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    if (newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setIsLoading(true);

    try {
      const data = await resetPassword({
        matricule: matricule.trim(),
        new_password: newPassword,
      });

      toast({
        title: "Mot de passe mis à jour",
        description: data.message,
      });

      navigate("/login");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Une erreur est survenue";

      if (message.includes("identique")) {
        setError(SAME_PASSWORD_ERROR);
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 animate-fade-in">
        <div className="max-w-md text-center">
          <InstitutionLogo className="w-32 h-32 mx-auto mb-8" />
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-4 leading-tight">
            Réinitialisation du mot de passe
          </h1>
          <p className="text-muted-foreground text-lg mb-6">
            Saisissez votre numéro matricule et définissez un nouveau mot de
            passe pour retrouver l&apos;accès à votre compte.
          </p>
          <div className="w-16 h-1 bg-accent mx-auto rounded-full" />
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <Card className="w-full max-w-md shadow-card animate-slide-in-right border-0">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <PCLLogo className="mb-4" />
              <p className="text-accent text-sm mt-1">
                Mot de passe oublié
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="matricule" className="text-foreground font-medium">
                  Numéro Matricule
                </Label>
                <Input
                  id="matricule"
                  type="text"
                  placeholder="Votre numéro matricule"
                  value={matricule}
                  onChange={(e) => {
                    setMatricule(e.target.value);
                    setError("");
                  }}
                  className="h-11 border-border focus:border-accent focus:ring-accent"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="newPassword"
                  className="text-foreground font-medium"
                >
                  Nouveau mot de passe
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Nouveau mot de passe"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError("");
                  }}
                  className="h-11 border-border focus:border-accent focus:ring-accent"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-foreground font-medium"
                >
                  Confirmer le mot de passe
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirmer le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  className="h-11 border-border focus:border-accent focus:ring-accent"
                />
              </div>

              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="institution"
                className="w-full h-11 gap-2"
                disabled={isLoading}
              >
                <KeyRound className="h-4 w-4" />
                {isLoading ? "Mise à jour..." : "Définir le nouveau mot de passe"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour à la connexion
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:hidden fixed top-0 left-0 right-0 bg-card border-b border-border p-4">
        <div className="flex items-center justify-center gap-3">
          <InstitutionLogo className="w-10 h-10" />
          <span className="text-sm font-semibold text-primary">DGCPT</span>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

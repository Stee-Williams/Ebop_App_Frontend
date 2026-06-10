import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUser, getRoleId } from "@/config/app";
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
import { useToast } from "@/hooks/use-toast";

const Inscription = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [matricule, setMatricule] = useState("");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!matricule || !nom || !prenom || !password || !role) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    const roleId = getRoleId(role);
    if (!roleId) {
      toast({
        title: "Erreur",
        description: "Rôle invalide",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const data = await createUser({
        nom: `${nom.trim()} ${prenom.trim()}`,
        matricule: matricule.trim(),
        password,
        role_id: roleId,
      });

      toast({
        title: "Inscription réussie",
        description: data.message,
      });

      navigate("/login");
    } catch (error) {
      toast({
        title: "Erreur",
        description:
          error instanceof Error
            ? error.message
            : "Impossible de créer le compte",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-[42%] xl:w-[40%] flex-col items-center justify-center p-8 xl:p-12 animate-fade-in">
        <div className="max-w-sm xl:max-w-md text-center">
          <InstitutionLogo className="w-24 h-24 xl:w-28 xl:h-28 mx-auto mb-6" />

          <h1 className="text-xl xl:text-2xl font-bold text-primary mb-3 leading-tight">
            Direction Générale de la
            <br />
            Comptabilité Publique et du Trésor
          </h1>

          <p className="text-muted-foreground text-sm xl:text-base mb-5">
            Créez votre compte pour accéder au portail de gestion des crédits
            administratifs et rejoindre l&apos;équipe EBOP.
          </p>

          <div className="w-16 h-1 bg-accent mx-auto rounded-full" />
        </div>
      </div>

      <div className="flex-1 lg:w-[58%] xl:w-[60%] flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:p-10 pt-20 lg:pt-8 overflow-y-auto">
        <Card className="w-full max-w-lg xl:max-w-xl shadow-card animate-slide-in-right border-0">
          <CardContent className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <PCLLogo className="mb-3 mx-auto" />
              <p className="text-accent text-sm">
                Gestion des Crédits Administratifs
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="matricule" className="text-foreground font-medium">
                  Numéro Matricule
                </Label>
                <Input
                  id="matricule"
                  type="text"
                  placeholder="Votre numéro matricule"
                  value={matricule}
                  onChange={(e) => setMatricule(e.target.value)}
                  className="h-10 sm:h-11 border-border focus:border-accent focus:ring-accent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom" className="text-foreground font-medium">
                    Nom
                  </Label>
                  <Input
                    id="nom"
                    type="text"
                    placeholder="Votre nom"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="h-10 sm:h-11 border-border focus:border-accent focus:ring-accent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prenom" className="text-foreground font-medium">
                    Prénom
                  </Label>
                  <Input
                    id="prenom"
                    type="text"
                    placeholder="Votre prénom"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className="h-10 sm:h-11 border-border focus:border-accent focus:ring-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-medium">
                    Mot de passe
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 sm:h-11 border-border focus:border-accent focus:ring-accent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-foreground font-medium">
                    Intervenant
                  </Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="h-10 sm:h-11 border-border focus:border-accent focus:ring-accent">
                      <SelectValue placeholder="Sélectionnez votre rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DBA">DBA</SelectItem>
                      <SelectItem value="Assistant gestionnaire">
                        Assistant gestionnaire
                      </SelectItem>
                      <SelectItem value="Controleur Budgétaire">
                        Contrôleur Budgétaire
                      </SelectItem>
                      <SelectItem value="Trésorier">Trésorier</SelectItem>
                      <SelectItem value="Informaticien">Informaticien</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="submit"
                variant="institution"
                className="w-full h-10 sm:h-11 mt-2"
                disabled={isLoading}
              >
                {isLoading ? "Inscription en cours..." : "S'inscrire"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:hidden fixed top-0 left-0 right-0 bg-card border-b border-border p-4 z-10">
        <div className="flex items-center justify-center gap-3">
          <InstitutionLogo className="w-10 h-10" />
          <span className="text-sm font-semibold text-primary">DGCPT</span>
        </div>
      </div>
    </div>
  );
};

export default Inscription;

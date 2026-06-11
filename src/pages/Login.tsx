import { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDefaultHomeRoute, login, saveUserSession } from "@/config/app";
import { Card, CardContent } from "@/components/ui/card";
import InstitutionLogo from "@/components/InstitutionLogo";
import PCLLogo from "@/components/PCLLogo";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [matricule, setMatricule] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!matricule || !password ) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const data = await login({ matricule, password });

      if (data.user) {
        saveUserSession(data.user, data.token);
      }

      toast({
        title: "Connexion réussie",
        description: data.message,
      });

      navigate(data.user ? getDefaultHomeRoute(data.user.role) : "/acceuil");
    } catch (error) {
      toast({
        title: "Erreur",
        description:
          error instanceof Error
            ? error.message
            : "Impossible de se connecter. Veuillez réessayer.",
        variant: "destructive",
      });
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
            Direction Générale de la
            <br />
            Comptabilité Publique et du Trésor
          </h1>
          
          <p className="text-muted-foreground text-lg mb-6">
            Bienvenue sur le portail de gestion des crédits administratifs. Connectez-vous pour accéder à vos engagements, consulter les règlements et gérer vos profils.
          </p>
          
          <div className="w-16 h-1 bg-accent mx-auto rounded-full" />
        </div>
      </div>

      
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <Card className="w-full max-w-md shadow-card animate-slide-in-right border-0">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <PCLLogo className="mb-4" />
              <p className="text-accent text-sm mt-1">Gestion des Crédits Administratifs</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="h-11 border-border focus:border-accent focus:ring-accent"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium">
                  Mot de passe
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 border-border focus:border-accent focus:ring-accent"
                />
              </div>

              <Button
                type="submit"
                variant="institution"
                className="w-full h-11"
                disabled={isLoading}
              >
                {isLoading ? "Connexion en cours..." : "Se connecter"}
              </Button>

              <div className="text-center">
                <Link
                  to="/mot-de-passe-oublie"
                  className="text-sm font-medium text-accent hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
            </form>
            
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

export default Login;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, User, CheckCircle, LogInIcon } from "lucide-react";
import { clearUserSession } from "@/config/app";


const Dashboard = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState("");
  const [userMatricule, setUserMatricule] = useState("");

  useEffect(() => {
    setUserRole(sessionStorage.getItem("userRole") || "");
    setUserMatricule(sessionStorage.getItem("userMatricule") || "");
  }, []);

  const handleLogout = () => {
    clearUserSession();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">Ebop</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-primary">Tableau de bord</h1>
              <p className="text-xs text-muted-foreground">Gestion des Crédits administratifs</p>
            </div>
          </div>
          {/* lien vers le menu */}
          <Button variant="outline" onClick={() => navigate("/acceuil")} className="gap-2">
            <LogInIcon className="w-4 h-4" />
            Continuer
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Message */}
        <Card className="mb-8 shadow-card animate-fade-in border-0 bg-gradient-to-r from-accent/10 to-primary/5">
          <CardContent className="p-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-accent" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-primary mb-2">
                  Vous êtes connecté
                </h2>
                <p className="text-muted-foreground">
                  Bienvenue, {userRole ? userRole.toLowerCase() : "utilisateur"}.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Info Card */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-card animate-fade-in border-0" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                Informations utilisateur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Numéro Matricule</p>
                  <p className="text-lg font-semibold text-foreground">{userMatricule || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rôle</p>
                  <p className="text-lg font-semibold text-foreground capitalize">{userRole || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card animate-fade-in border-0" style={{ animationDelay: "0.2s" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Statut de connexion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-institution-green animate-pulse" />
                <span className="text-lg font-semibold text-foreground">Actif</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Session en cours
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card animate-fade-in border-0" style={{ animationDelay: "0.3s" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Système
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-foreground">Version actuelle</p>
              <p className="text-xs text-muted-foreground mt-2">
                Direction Générale de la Comptabilité Publique et du Trésor
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-card border-t border-border mt-auto py-6">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            © 2026 DGCPT - Système de Gestion des Crédits
          </div>
          
          <div className="flex items-center gap-4">
            {/* Logout Button */}
            <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Déconnexion
          </Button>
              
            <div className="h-4 w-[1px] bg-border hidden md:block" />

            <p className="text-xs text-muted-foreground">
              Utilisateur : <span className="font-medium text-foreground">{userMatricule}</span>
            </p>
          </div>
        </div>
      </footer>
    </div> // Fin du div principal min-h-screen
  );
};

export default Dashboard;

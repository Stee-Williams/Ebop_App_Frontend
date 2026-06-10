import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Inscription from "./pages/Inscription";
import Login from "./pages/Login";
import HomeContent from "./pages/HomeContent";
import Profile from "./pages/Profile";
import Autres from "./pages/Autres";
import Creation from "./pages/Creation";
import VisaEngagements from "./pages/Viser";
import Reglements from "./pages/Reglement";
import MonProfil from "./pages/MonProfil";
import Parametres from "./pages/Parametres";
import PlaceholderPage from "./pages/PlaceholderPage";
import BudgetConsultation from "./pages/BudgetConsultation";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/inscription" element={<Inscription />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/acceuil"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomeContent />} />
            <Route path="engagements/viser" element={<VisaEngagements />} />
            <Route path="engagements/autres" element={<Autres />} />
            <Route path="engagements/creation" element={<Creation />} />
            <Route
              path="collectivites"
              element={
                <PlaceholderPage
                  title="Collectivités"
                  description="Module de gestion des collectivités territoriales — bientôt disponible."
                />
              }
            />
            <Route
              path="epp"
              element={
                <PlaceholderPage
                  title="Gestion des EPP"
                  description="Module de gestion des établissements publics — bientôt disponible."
                />
              }
            />
            <Route path="reglement" element={<Reglements />} />
            <Route path="divers/budget" element={<BudgetConsultation />} />
            <Route path="divers/profils" element={<Profile embedded />} />
            <Route path="profil" element={<MonProfil />} />
            <Route path="parametres" element={<Parametres />} />
          </Route>

          {/* Redirections des anciennes routes */}
          <Route path="/profile" element={<Navigate to="/acceuil/divers/profils" replace />} />
          <Route path="/autres" element={<Navigate to="/acceuil/engagements/autres" replace />} />
          <Route path="/creation" element={<Navigate to="/acceuil/engagements/creation" replace />} />
          <Route path="/viser" element={<Navigate to="/acceuil/engagements/viser" replace />} />
          <Route path="/reglement" element={<Navigate to="/acceuil/reglement" replace />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

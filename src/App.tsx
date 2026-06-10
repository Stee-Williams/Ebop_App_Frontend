import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Inscription from "./pages/Inscription";
import Login from "./pages/Login";
import Accueil from "./pages/Accueil";
import Profile from "./pages/Profile"; 
import Autres from "./pages/Autres";     
import Creation from "./pages/Creation";
import Viser from "./pages/Viser";
import VisaEngagements from "./pages/Viser";
import Reglements from "./pages/Reglement";
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
                <Accueil />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/autres"
            element={
              <ProtectedRoute>
                <Autres />
              </ProtectedRoute>
            }
          />
          <Route
            path="/creation"
            element={
              <ProtectedRoute>
                <Creation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/viser"
            element={
              <ProtectedRoute>
                <VisaEngagements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reglement"
            element={
              <ProtectedRoute>
                <Reglements />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createUser,
  getProvinces,
  getRoleLabel,
  getRoles,
  type ProvinceItem,
  type RoleItem,
} from "@/config/app";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, PageShell } from "@/components/layout/PageShell";
import InstitutionLogo from "@/components/InstitutionLogo";
import PCLLogo from "@/components/PCLLogo";
import { useToast } from "@/hooks/use-toast";

type InscriptionProps = {
  embedded?: boolean;
};

const InscriptionForm = ({
  onSuccess,
}: {
  onSuccess: () => void;
}) => {
  const { toast } = useToast();
  const [matricule, setMatricule] = useState("");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [province, setProvince] = useState("");
  const [provinces, setProvinces] = useState<ProvinceItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [provincesData, rolesData] = await Promise.all([
          getProvinces(),
          getRoles(),
        ]);
        setProvinces(provincesData);
        setRoles(rolesData);
      } catch {
        toast({
          title: "Erreur",
          description: "Impossible de charger les données de référence.",
          variant: "destructive",
        });
      } finally {
        setLoadingProvinces(false);
        setLoadingRoles(false);
      }
    };
    load();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!matricule || !nom || !prenom || !password || !role || !province) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    const roleId = Number(role);
    if (!roleId || !roles.some((r) => r.id === roleId)) {
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
        province_id: Number(province),
      });

      toast({
        title: "Inscription réussie",
        description: data.message,
      });

      setMatricule("");
      setNom("");
      setPrenom("");
      setPassword("");
      setRole("");
      setProvince("");
      onSuccess();
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <Select
            value={role}
            onValueChange={setRole}
            disabled={loadingRoles}
          >
            <SelectTrigger className="h-10 sm:h-11 border-border focus:border-accent focus:ring-accent">
              <SelectValue
                placeholder={
                  loadingRoles ? "Chargement..." : "Sélectionnez votre rôle"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {getRoleLabel(r.nom)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="province" className="text-foreground font-medium">
          Province
        </Label>
        <Select
          value={province}
          onValueChange={setProvince}
          disabled={loadingProvinces}
        >
          <SelectTrigger
            id="province"
            className="h-10 sm:h-11 border-border focus:border-accent focus:ring-accent"
          >
            <SelectValue
              placeholder={
                loadingProvinces
                  ? "Chargement..."
                  : "Sélectionnez une province"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {provinces.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        variant="institution"
        className="mt-2 h-10 w-full sm:h-11"
        disabled={isLoading || loadingProvinces}
      >
        {isLoading ? "Inscription en cours..." : "S'inscrire"}
      </Button>
    </form>
  );
};

const Inscription = ({ embedded = false }: InscriptionProps) => {
  const navigate = useNavigate();

  if (embedded) {
    return (
      <PageShell className="max-w-2xl">
        <PageHeader
          icon={<UserPlus className="h-6 w-6 text-white" />}
          title="Inscription d'un utilisateur"
          description="Créez un nouveau compte pour accéder au portail EBOP."
          badge="Administration"
        />
        <Card className="border-0 bg-white/90 shadow-lg backdrop-blur-sm">
          <CardContent className="p-6 lg:p-8">
            <InscriptionForm
              onSuccess={() => navigate("/acceuil/utilisateurs")}
            />
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <div className="hidden animate-fade-in flex-col items-center justify-center p-8 lg:flex lg:w-[42%] xl:w-[40%] xl:p-12">
        <div className="max-w-sm text-center xl:max-w-md">
          <InstitutionLogo className="mx-auto mb-6 h-24 w-24 xl:h-28 xl:w-28" />
          <h1 className="mb-3 text-xl font-bold leading-tight text-primary xl:text-2xl">
            Direction Générale de la
            <br />
            Comptabilité Publique et du Trésor
          </h1>
          <p className="mb-5 text-sm text-muted-foreground xl:text-base">
            Créez votre compte pour accéder au portail de gestion des crédits
            administratifs et rejoindre l&apos;équipe EBOP.
          </p>
          <div className="mx-auto h-1 w-16 rounded-full bg-accent" />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-y-auto p-4 pt-20 sm:p-6 lg:w-[58%] lg:p-8 lg:pt-8 xl:w-[60%] xl:p-10">
        <Card className="w-full max-w-lg animate-slide-in-right border-0 shadow-card xl:max-w-xl">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-6 text-center">
              <PCLLogo className="mx-auto mb-3" />
              <p className="text-sm text-accent">
                Gestion des Crédits Administratifs
              </p>
            </div>
            <InscriptionForm onSuccess={() => navigate("/login")} />
          </CardContent>
        </Card>
      </div>

      <div className="fixed left-0 right-0 top-0 z-10 border-b border-border bg-card p-4 lg:hidden">
        <div className="flex items-center justify-center gap-3">
          <InstitutionLogo className="h-10 w-10" />
          <span className="text-sm font-semibold text-primary">DGCPT</span>
        </div>
      </div>
    </div>
  );
};

export default Inscription;

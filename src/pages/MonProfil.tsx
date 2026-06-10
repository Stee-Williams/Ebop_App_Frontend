import { User, Shield, Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRoleLabel, getUserSession } from "@/config/app";

const MonProfil = () => {
  const user = getUserSession();

  if (!user) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Session utilisateur introuvable.
      </div>
    );
  }

  const fields = [
    { icon: User, label: "Nom complet", value: user.nom },
    { icon: Hash, label: "Matricule", value: user.matricule },
    { icon: Shield, label: "Rôle", value: getRoleLabel(user.role) },
  ];

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Mon profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 p-4"
            >
              <div className="rounded-lg bg-primary/10 p-2">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
                <p className="font-semibold text-foreground">{value}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default MonProfil;

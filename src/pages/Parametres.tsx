import { Bell, Globe, Moon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const Parametres = () => (
  <div className="mx-auto max-w-2xl p-6">
    <Card>
      <CardHeader>
        <CardTitle className="text-primary">Paramètres</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label>Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir les alertes système
              </p>
            </div>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <Moon className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label>Mode sombre</Label>
              <p className="text-sm text-muted-foreground">
                Interface en thème sombre
              </p>
            </div>
          </div>
          <Switch />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label>Langue</Label>
              <p className="text-sm text-muted-foreground">Français</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default Parametres;

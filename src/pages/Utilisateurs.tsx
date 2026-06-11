import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader, PageShell } from "@/components/layout/PageShell";
import {
  ROLE_OPTIONS,
  deleteUser,
  getProvinces,
  getRoleId,
  getRoleLabel,
  getUsers,
  updateUser,
  type ProvinceItem,
  type UserListItem,
} from "@/config/app";
import { useToast } from "@/hooks/use-toast";

export default function Utilisateurs() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [provinces, setProvinces] = useState<ProvinceItem[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<UserListItem | null>(null);
  const [editing, setEditing] = useState<UserListItem | null>(null);
  const [editNom, setEditNom] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editProvince, setEditProvince] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste des utilisateurs.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await loadUsers();
      try {
        setProvinces(await getProvinces());
      } catch {
        /* provinces optionnelles pour l'édition */
      }
    };
    load();
  }, [toast]);

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const haystack = [
          user.nom,
          user.matricule,
          user.role,
          user.province_nom,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return !search.trim() || haystack.includes(search.toLowerCase());
      }),
    [users, search]
  );

  const openEdit = (user: UserListItem) => {
    setEditing(user);
    setEditNom(user.nom);
    const roleMatch = ROLE_OPTIONS.find(
      (r) =>
        r.id === user.role_id ||
        r.value.toUpperCase().replace(/\s+/g, "_") ===
          (user.role ?? "").toUpperCase().replace(/\s+/g, "_")
    );
    setEditRole(roleMatch?.value ?? "");
    setEditProvince(user.province_id ? String(user.province_id) : "");
  };

  const handleSaveEdit = async () => {
    if (!editing) return;

    const roleId = getRoleId(editRole);
    if (!editNom.trim() || !roleId) {
      toast({
        title: "Erreur",
        description: "Nom et rôle sont obligatoires.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const result = await updateUser(editing.id, {
        nom: editNom.trim(),
        role_id: roleId,
        province_id: editProvince ? Number(editProvince) : null,
      });

      if (result.user) {
        setUsers((prev) =>
          prev.map((u) => (u.id === editing.id ? result.user! : u))
        );
      } else {
        await loadUsers();
      }

      toast({
        title: "Utilisateur mis à jour",
        description: result.message,
      });
      setEditing(null);
    } catch (err) {
      toast({
        title: "Erreur",
        description:
          err instanceof Error ? err.message : "Mise à jour impossible.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: UserListItem) => {
    if (
      !window.confirm(
        `Supprimer l'utilisateur ${user.nom} (${user.matricule}) ?`
      )
    ) {
      return;
    }

    setDeletingId(user.id);
    try {
      await deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      toast({
        title: "Utilisateur supprimé",
        description: "Le compte a été retiré de la base.",
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description:
          err instanceof Error ? err.message : "Suppression impossible.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <PageShell>
      <PageHeader
        icon={<Users className="h-6 w-6 text-white" />}
        title="Gestion des utilisateurs"
        description="Consultez l'ensemble des comptes enregistrés sur le portail EBOP."
        badge="Administration"
        action={
          <Button
            variant="institution"
            className="gap-2 shadow-md"
            onClick={() => navigate("/acceuil/utilisateurs/inscription")}
          >
            <Plus className="h-4 w-4" />
            Créer utilisateur
          </Button>
        }
      />

      <Card className="border-0 bg-white/80 shadow-sm backdrop-blur-sm">
        <CardContent className="p-5">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, matricule, rôle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 border-gray-200 bg-white pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-0 bg-white/90 shadow-sm backdrop-blur-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Liste des utilisateurs</h2>
          <p className="text-sm text-muted-foreground">
            {loading
              ? "Chargement..."
              : `${filteredUsers.length} utilisateur${filteredUsers.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                {["Matricule", "Nom", "Rôle", "Province", "Actions"].map(
                  (h) => (
                    <TableHead
                      key={h}
                      className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {h}
                    </TableHead>
                  )
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Aucun utilisateur trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    className="transition-colors hover:bg-indigo-50/30"
                  >
                    <TableCell className="font-medium text-indigo-600">
                      {user.matricule}
                    </TableCell>
                    <TableCell>{user.nom}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-indigo-600">
                        {user.role ? getRoleLabel(user.role) : "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.province_nom ? (
                        <Badge variant="outline" className="text-teal-700">
                          {user.province_nom}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                          title="Consulter"
                          onClick={() => setSelected(user)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100"
                          title="Modifier"
                          onClick={() => openEdit(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                          title="Supprimer"
                          disabled={deletingId === user.id}
                          onClick={() => handleDelete(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {!loading && users.length === 0 && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate("/acceuil/utilisateurs/inscription")}
          >
            <UserPlus className="h-4 w-4" />
            Créer le premier utilisateur
          </Button>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Détails de l&apos;utilisateur</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Matricule", value: selected.matricule },
                { label: "Nom", value: selected.nom },
                {
                  label: "Rôle",
                  value: selected.role ? getRoleLabel(selected.role) : "—",
                },
                { label: "Province", value: selected.province_nom ?? "—" },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-xl border border-gray-100 bg-slate-50 p-3"
                >
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 font-semibold text-gray-900">{value}</p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l&apos;utilisateur</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nom">Nom complet</Label>
                <Input
                  id="edit-nom"
                  value={editNom}
                  onChange={(e) => setEditNom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Matricule</Label>
                <Input value={editing.matricule} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Rôle</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger id="edit-role">
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((r) => (
                      <SelectItem key={r.id} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-province">Province</Label>
                <Select value={editProvince} onValueChange={setEditProvince}>
                  <SelectTrigger id="edit-province">
                    <SelectValue placeholder="Sélectionner une province" />
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
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Annuler
            </Button>
            <Button
              variant="institution"
              onClick={handleSaveEdit}
              disabled={saving}
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

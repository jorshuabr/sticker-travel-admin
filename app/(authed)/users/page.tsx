import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RestrictedUserRow } from "@/lib/types";
import { UserActions } from "./UserActions";

async function loadUsers(): Promise<{
  rows: RestrictedUserRow[];
  error: string | null;
}> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("restricted_users")
    .select("*")
    .order("restricted_at", { ascending: false, nullsFirst: false })
    .order("trust_score", { ascending: true });
  if (error) return { rows: [], error: error.message };
  return { rows: (data ?? []) as RestrictedUserRow[], error: null };
}

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const { rows, error } = await loadUsers();
  const restrictedCount = rows.filter((r) => r.restricted_at).length;
  const alertCount = rows.length - restrictedCount;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Usuarios actualmente <strong>restringidos</strong> ({restrictedCount}) +
          usuarios en zona de <strong>alerta</strong> ({alertCount},{" "}
          <code className="text-xs">trust_score &lt; 0.5</code>). Lista
          definida por la vista <code className="text-xs">restricted_users</code>.
        </p>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error al cargar</CardTitle>
            <CardDescription className="text-destructive/80">
              {error}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!error && rows.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sin usuarios en la lista</CardTitle>
            <CardDescription>
              Nadie restringido ni en zona de alerta. Todos los usuarios tienen
              trust_score ≥ 0.5.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {rows.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Trust</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Veredictos</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((u) => {
                  const restricted = u.restricted_at != null;
                  return (
                    <TableRow key={u.user_id}>
                      <TableCell>
                        <div className="font-medium">
                          {u.display_name ?? u.handle ?? "(sin nombre)"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <code>{u.user_id}</code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            (u.trust_score ?? 0) < 0.3 ? "destructive" : "secondary"
                          }
                        >
                          {u.trust_score?.toFixed(2) ?? "?"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {restricted ? (
                          <div className="space-y-1">
                            <Badge variant="destructive">Restringido</Badge>
                            {u.restricted_reason && (
                              <div className="text-xs text-muted-foreground">
                                {u.restricted_reason}
                              </div>
                            )}
                            <div className="text-[10px] text-muted-foreground">
                              desde {new Date(u.restricted_at!).toLocaleDateString("es")}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline">En alerta</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        <div>{u.verified_count} verified</div>
                        <div>{u.rejected_count} rejected</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <UserActions
                          userId={u.user_id}
                          restricted={restricted}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

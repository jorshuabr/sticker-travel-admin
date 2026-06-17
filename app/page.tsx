import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b bg-background">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="font-semibold">Sticker Travel — Admin</div>
          <form action="/logout" method="post">
            <Button variant="outline" size="sm" type="submit">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </header>

      <section className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Bienvenido</CardTitle>
            <CardDescription>
              Sesión iniciada como {user?.email ?? "(sin email)"} ·{" "}
              <code className="text-xs">{user?.id}</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Próximamente: cola de moderación, gestión de usuarios
              restringidos y estadísticas básicas.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Sticker Travel — Admin</CardTitle>
          <CardDescription>
            Panel de administración del proyecto sticker-travel-app.
            En construcción.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Próximamente: cola de moderación, gestión de usuarios restringidos
            y estadísticas básicas.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

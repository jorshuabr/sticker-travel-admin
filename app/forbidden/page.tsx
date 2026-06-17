import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForbiddenPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-muted/30">
      <Card className="max-w-sm w-full">
        <CardHeader>
          <CardTitle>403 · Acceso denegado</CardTitle>
          <CardDescription>
            Tu sesión no tiene permisos de moderador en este panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/login"
            className={buttonVariants({ variant: "outline", className: "w-full" })}
          >
            Volver al login
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}

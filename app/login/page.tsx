"use client";

import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "./actions";

type State = { error?: string } | null;

async function loginAction(_prev: State, formData: FormData): Promise<State> {
  return await signIn(formData) ?? null;
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    loginAction,
    null,
  );
  // searchParams es promesa en App Router 15+; lo leemos via use()
  // (alternativa: hacer la page async, pero entonces no podemos usar
  // useActionState aqui). Para mantenerlo simple usamos un hidden input
  // que el server action lee.
  const next = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("next") ?? "/"
    : "/";

  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-muted/30">
      <Card className="max-w-sm w-full">
        <CardHeader>
          <CardTitle>Sticker Travel — Admin</CardTitle>
          <CardDescription>
            Inicia sesión con tu cuenta de moderador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="tu-email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            {state?.error && (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Entrando…" : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

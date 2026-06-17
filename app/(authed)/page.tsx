import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bienvenido</CardTitle>
          <CardDescription>
            Sesión iniciada como {user?.email ?? "(sin email)"} ·{" "}
            <code className="text-xs">{user?.id}</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Panel de administración del proyecto sticker-travel-app.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/moderation"
              className={buttonVariants({ variant: "default" })}
            >
              Cola de moderación →
            </Link>
            <Link
              href="/users"
              className={buttonVariants({ variant: "outline" })}
            >
              Usuarios →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

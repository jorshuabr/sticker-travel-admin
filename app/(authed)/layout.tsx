// Layout compartido para todas las rutas autenticadas (las que estan tras
// el middleware: home, moderation, users, stats…). El gate de moderador ya
// lo hace middleware.ts; aqui solo pintamos header + nav.

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="font-semibold hover:underline">
            Sticker Travel — Admin
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <NavLink href="/moderation">Moderación</NavLink>
            <NavLink href="/users">Usuarios</NavLink>
            <form action="/logout" method="post" className="ml-2">
              <button
                type="submit"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Cerrar sesión
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        {children}
      </main>
    </div>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={buttonVariants({ variant: "ghost", size: "sm" })}
    >
      {children}
    </Link>
  );
}

// Middleware Next.js: corre antes de cada request. Refresca la sesion
// Supabase + bloquea rutas protegidas si no eres moderador.
//
// Pattern: /login es publico; cualquier otra ruta requiere sesion +
// moderador. Si la sesion falta -> redirect a /login. Si la sesion existe
// pero el user.id no esta en MODERATOR_USER_IDS -> /forbidden.

import { NextResponse, type NextRequest } from "next/server";
import { isModerator } from "@/lib/auth";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = ["/login", "/forbidden"];

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const path = request.nextUrl.pathname;

  if (PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) {
    // Logged in users que entran a /login -> mandar al home
    if (user && isModerator(user.id) && path === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (!isModerator(user.id)) {
    const url = request.nextUrl.clone();
    url.pathname = "/forbidden";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Excluimos assets staticos y _next internos.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

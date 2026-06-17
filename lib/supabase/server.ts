// Cliente Supabase para uso server-side (Server Components, Route Handlers,
// Server Actions). Lee la sesion de las cookies via @supabase/ssr.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(toSet) {
          try {
            for (const { name, value, options } of toSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Llamado desde un Server Component (cookies son read-only ahi).
            // El refresh real ocurre en el middleware; aqui es no-op.
          }
        },
      },
    },
  );
}

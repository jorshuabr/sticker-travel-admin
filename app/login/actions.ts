"use server";

import { redirect } from "next/navigation";
import { isModerator } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  if (!email || !password) {
    return { error: "Email y contraseña son obligatorios." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) {
    return { error: error?.message ?? "No se pudo iniciar sesión." };
  }

  if (!isModerator(data.user.id)) {
    // Cierra la sesion para no dejar al user logueado pero rechazado:
    // mejor que se vea como un 'acceso denegado' limpio.
    await supabase.auth.signOut();
    return {
      error: "Tu cuenta no tiene permisos de moderación en este panel.",
    };
  }

  redirect(next || "/");
}

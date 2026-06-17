"use server";

import { revalidatePath } from "next/cache";
import { isModerator } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function requireModerator(): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "not_authenticated" };
  if (!isModerator(user.id)) return { error: "not_moderator" };
  return { ok: true };
}

export async function restrictUser(userId: string, reason: string | null) {
  const auth = await requireModerator();
  if ("error" in auth) return auth;

  const admin = createAdminClient();
  const cleaned = reason && reason.trim().length > 0 ? reason.trim() : null;
  const { error } = await admin.rpc("restrict_user", {
    p_user_id: userId,
    p_reason: cleaned,
  });
  if (error) return { error: error.message };

  revalidatePath("/users");
  return { ok: true };
}

export async function unrestrictUser(userId: string) {
  const auth = await requireModerator();
  if ("error" in auth) return auth;

  const admin = createAdminClient();
  const { error } = await admin.rpc("unrestrict_user", { p_user_id: userId });
  if (error) return { error: error.message };

  revalidatePath("/users");
  return { ok: true };
}

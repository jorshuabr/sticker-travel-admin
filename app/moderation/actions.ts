"use server";

import { revalidatePath } from "next/cache";
import { isModerator } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { RejectionReason } from "@/lib/types";

async function requireModerator(): Promise<{ userId: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "not_authenticated" };
  if (!isModerator(user.id)) return { error: "not_moderator" };
  return { userId: user.id };
}

export async function approveMemory(memoryId: string) {
  const auth = await requireModerator();
  if ("error" in auth) return auth;

  const admin = createAdminClient();
  const { error } = await admin.rpc("resolve_memory", {
    p_memory_id: memoryId,
    p_decision: "verified",
    p_moderator: auth.userId,
  });
  if (error) return { error: error.message };

  revalidatePath("/moderation");
  return { ok: true };
}

export async function rejectMemory(
  memoryId: string,
  reason: RejectionReason,
  reasonText: string | null,
) {
  const auth = await requireModerator();
  if ("error" in auth) return auth;

  const admin = createAdminClient();
  const { error } = await admin.rpc("resolve_memory", {
    p_memory_id: memoryId,
    p_decision: "rejected",
    p_moderator: auth.userId,
    p_reason: reason,
    p_reason_text: reasonText,
  });
  if (error) return { error: error.message };

  revalidatePath("/moderation");
  return { ok: true };
}

export async function delegateToAI(memoryId: string) {
  const auth = await requireModerator();
  if ("error" in auth) return auth;

  // Llamar a la Edge Function verify-memory con service_role.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const res = await fetch(`${url}/functions/v1/verify-memory`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ memory_id: memoryId }),
  });
  if (!res.ok) {
    return { error: `verify-memory HTTP ${res.status}` };
  }

  revalidatePath("/moderation");
  return { ok: true };
}

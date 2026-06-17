// Politica de autorizacion del admin: la lista de moderadores autorizados
// se mantiene en la env var MODERATOR_USER_IDS (CSV de UUIDs). Server-only
// para no leakear la lista al navegador.

export function isModerator(userId: string | null | undefined): boolean {
  if (!userId) return false;
  const raw = process.env.MODERATOR_USER_IDS ?? "";
  const ids = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return ids.includes(userId.toLowerCase());
}

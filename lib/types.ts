// Tipos compartidos. Refleja el schema de la BD (mantener sincronizado con
// las migraciones de sticker-travel-app).

/** Filas de la view moderation_queue (PLAN §15). */
export interface ModerationQueueRow {
  memory_id: string;
  placed_by: string;
  owner_handle: string | null;
  owner_name: string | null;
  owner_trust: number | null;
  sticker_design_id: string;
  design_title: string | null;
  design_image_path: string;
  photo_path: string;
  lng: number;
  lat: number;
  location_accuracy_m: number | null;
  captured_at: string;
  received_at: string;
  country_code: string | null;
  verification_status: "pending" | "verified" | "rejected" | "flagged";
  verification_detail: Record<string, unknown> | null;
  open_reports: number;
  created_at: string;
}

/** Motivos de rechazo (enum rejection_reason en BD, migración 0015). */
export const REJECTION_REASONS = [
  { value: "pegatina_ajena", label: "Pegatina ajena" },
  { value: "no_pegada", label: "No está pegada en superficie real" },
  { value: "foto_pantalla", label: "Foto de pantalla" },
  { value: "mala_calidad", label: "Mala calidad" },
  { value: "other", label: "Otro motivo" },
] as const;

export type RejectionReason = typeof REJECTION_REASONS[number]["value"];

/** Filas de la view restricted_users (PLAN §15). Incluye usuarios con
 *  restricted_at fijado Y los que estan en zona de alerta (trust_score < 0.5). */
export interface RestrictedUserRow {
  user_id: string;
  handle: string | null;
  display_name: string | null;
  trust_score: number | null;
  restricted_at: string | null;
  restricted_reason: string | null;
  rejected_count: number;
  verified_count: number;
}

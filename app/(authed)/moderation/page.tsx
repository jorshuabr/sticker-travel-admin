import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ModerationQueueRow } from "@/lib/types";
import { ModerationActions } from "./ModerationActions";

const SIGNED_URL_TTL = 60 * 10; // 10 min

async function loadQueue(): Promise<{
  rows: (ModerationQueueRow & { photoUrl: string | null; designUrl: string | null })[];
  error: string | null;
}> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("moderation_queue")
    .select("*")
    .order("received_at", { ascending: true })
    .limit(50);
  if (error) return { rows: [], error: error.message };

  // Generamos signed URLs en server-side para que solo el moderador con
  // sesion valida pueda acceder a las fotos (el bucket es privado).
  const rows = await Promise.all(
    (data as ModerationQueueRow[]).map(async (r) => {
      const [photo, design] = await Promise.all([
        admin.storage
          .from("memories-raw")
          .createSignedUrl(r.photo_path, SIGNED_URL_TTL),
        admin.storage
          .from("designs")
          .createSignedUrl(r.design_image_path, SIGNED_URL_TTL),
      ]);
      return {
        ...r,
        photoUrl: photo.data?.signedUrl ?? null,
        designUrl: design.data?.signedUrl ?? null,
      };
    }),
  );

  return { rows, error: null };
}

export const dynamic = "force-dynamic";

export default async function ModerationPage() {
  const { rows, error } = await loadQueue();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Cola de moderación</h1>
          <p className="text-sm text-muted-foreground">
            Recuerdos en estado <code className="text-xs">flagged</code> (≥3 reports o
            escalados manualmente). Ordenados FIFO por <code className="text-xs">received_at</code>.
          </p>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Error al cargar</CardTitle>
              <CardDescription className="text-destructive/80">
                {error}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {!error && rows.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Sin pendientes</CardTitle>
              <CardDescription>
                Cero recuerdos en estado flagged ahora mismo.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className="grid gap-4">
          {rows.map((r) => (
            <Card key={r.memory_id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">
                      {r.design_title ?? "(sin título)"}
                    </CardTitle>
                    <CardDescription className="space-x-2">
                      <span>{r.owner_name ?? r.owner_handle ?? r.placed_by}</span>
                      <Badge variant="secondary">
                        trust {r.owner_trust?.toFixed(2) ?? "?"}
                      </Badge>
                      <Badge variant="outline">
                        {r.open_reports} reports
                      </Badge>
                      {r.country_code && (
                        <Badge variant="outline">{r.country_code}</Badge>
                      )}
                    </CardDescription>
                  </div>
                  <ModerationActions memoryId={r.memory_id} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Thumb url={r.photoUrl} label="Foto del usuario" />
                  <Thumb url={r.designUrl} label="Diseño original" />
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>
                    📍 {r.lat.toFixed(5)}, {r.lng.toFixed(5)}
                    {r.location_accuracy_m
                      ? ` (±${Math.round(r.location_accuracy_m)} m)`
                      : ""}
                  </div>
                  <div>📅 captured {new Date(r.captured_at).toISOString()}</div>
                  {r.verification_detail &&
                    Object.keys(r.verification_detail).length > 0 && (
                      <details className="cursor-pointer">
                        <summary>verification_detail</summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-x-auto">
                          {JSON.stringify(r.verification_detail, null, 2)}
                        </pre>
                      </details>
                    )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
    </div>
  );
}

function Thumb({ url, label }: { url: string | null; label: string }) {
  if (!url) {
    return (
      <div className="aspect-square bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
        {label} no disponible
      </div>
    );
  }
  return (
    <div className="relative aspect-square bg-muted rounded overflow-hidden">
      {/* Image de Next + unoptimized porque la URL firmada caduca a los 10 min */}
      <Image
        src={url}
        alt={label}
        fill
        sizes="(max-width: 640px) 100vw, 50vw"
        unoptimized
        className="object-cover"
      />
      <div className="absolute bottom-1 left-1 text-[10px] text-white bg-black/60 px-1.5 py-0.5 rounded">
        {label}
      </div>
    </div>
  );
}

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createAdminClient } from "@/lib/supabase/admin";

interface Stats {
  users: { total: number; last30d: number };
  memories: { total: number; last30d: number };
  byStatus: Record<string, number>;
  topCountries: Array<{ country_code: string | null; count: number }>;
  totalPoints: number;
  decisions: Record<string, number>;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500",
  verified: "bg-emerald-500",
  rejected: "bg-rose-500",
  flagged: "bg-orange-600",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  verified: "Verified",
  rejected: "Rejected",
  flagged: "Flagged",
};

const DECISION_LABELS: Record<string, string> = {
  approved: "Aprobado (admin)",
  rejected: "Rechazado (admin)",
  delegated_ai: "Delegado a IA",
  timeout_ai: "Timeout → IA",
};

async function loadStats(): Promise<{ stats: Stats | null; error: string | null }> {
  const admin = createAdminClient();
  const since30d = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  // PostgREST count requiere head:true + count:exact para que devuelva count
  // en headers sin payload. Usamos varias queries en paralelo.
  const [
    usersTotal,
    users30d,
    memoriesTotal,
    memories30d,
    byStatusRows,
    topCountriesRows,
    pointsAgg,
    decisionsRows,
  ] = await Promise.all([
    admin.from("profiles").select("id", { head: true, count: "exact" }),
    admin
      .from("profiles")
      .select("id", { head: true, count: "exact" })
      .gte("created_at", since30d),
    admin
      .from("memories")
      .select("id", { head: true, count: "exact" })
      .is("deleted_at", null),
    admin
      .from("memories")
      .select("id", { head: true, count: "exact" })
      .is("deleted_at", null)
      .gte("received_at", since30d),
    // Sin la sintaxis de GROUP BY de PostgREST agrupamos en cliente.
    admin
      .from("memories")
      .select("verification_status")
      .is("deleted_at", null),
    admin
      .from("memories")
      .select("country_code")
      .is("deleted_at", null)
      .eq("verification_status", "verified")
      .not("country_code", "is", null),
    // Suma de puntos: la hacemos via RPC o agregamos en cliente. Para
    // simplicidad, leemos todas las rows (10k max realistas en MVP).
    admin.from("points_ledger").select("points"),
    admin
      .from("telegram_reviews")
      .select("decision")
      .not("decided_at", "is", null),
  ]);

  const firstErr = [
    usersTotal.error,
    users30d.error,
    memoriesTotal.error,
    memories30d.error,
    byStatusRows.error,
    topCountriesRows.error,
    pointsAgg.error,
    decisionsRows.error,
  ].find((e) => e);
  if (firstErr) return { stats: null, error: firstErr.message };

  // ---- agregaciones en cliente ----
  const byStatus: Record<string, number> = {};
  for (const r of byStatusRows.data ?? []) {
    const s = (r as { verification_status: string }).verification_status;
    byStatus[s] = (byStatus[s] ?? 0) + 1;
  }

  const countryMap: Record<string, number> = {};
  for (const r of topCountriesRows.data ?? []) {
    const c = (r as { country_code: string | null }).country_code;
    if (!c) continue;
    countryMap[c] = (countryMap[c] ?? 0) + 1;
  }
  const topCountries = Object.entries(countryMap)
    .map(([country_code, count]) => ({ country_code, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const totalPoints = (pointsAgg.data ?? []).reduce(
    (acc, r) => acc + ((r as { points: number }).points ?? 0),
    0,
  );

  const decisions: Record<string, number> = {};
  for (const r of decisionsRows.data ?? []) {
    const d = (r as { decision: string | null }).decision;
    if (!d) continue;
    decisions[d] = (decisions[d] ?? 0) + 1;
  }

  return {
    stats: {
      users: { total: usersTotal.count ?? 0, last30d: users30d.count ?? 0 },
      memories: {
        total: memoriesTotal.count ?? 0,
        last30d: memories30d.count ?? 0,
      },
      byStatus,
      topCountries,
      totalPoints,
      decisions,
    },
    error: null,
  };
}

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const { stats, error } = await loadStats();

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Stats</h1>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              Error al cargar estadísticas
            </CardTitle>
            <CardDescription className="text-destructive/80">
              {error ?? "unknown"}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const statusTotal = Object.values(stats.byStatus).reduce((a, b) => a + b, 0);
  const decisionsTotal = Object.values(stats.decisions).reduce(
    (a, b) => a + b,
    0,
  );
  const maxCountry = stats.topCountries[0]?.count ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Stats</h1>
        <p className="text-sm text-muted-foreground">
          Snapshot del proyecto. Datos consultados al cargar la página.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Usuarios" value={stats.users.total} delta30d={stats.users.last30d} />
        <Kpi
          label="Memorias"
          value={stats.memories.total}
          delta30d={stats.memories.last30d}
        />
        <Kpi
          label="Puntos otorgados"
          value={stats.totalPoints.toLocaleString("es")}
        />
        <Kpi
          label="Decisiones moderación"
          value={decisionsTotal}
        />
      </div>

      {/* Memorias por estado */}
      <Card>
        <CardHeader>
          <CardTitle>Memorias por estado</CardTitle>
          <CardDescription>
            {statusTotal} memorias totales (excluye soft-deleted).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {statusTotal === 0 ? (
            <p className="text-sm text-muted-foreground">Sin memorias.</p>
          ) : (
            <>
              <div className="flex w-full h-3 rounded overflow-hidden">
                {Object.entries(stats.byStatus).map(([status, count]) => (
                  <div
                    key={status}
                    className={STATUS_COLORS[status] ?? "bg-gray-400"}
                    style={{ width: `${(count / statusTotal) * 100}%` }}
                    title={`${STATUS_LABELS[status] ?? status}: ${count}`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                {Object.entries(stats.byStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-1.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-sm ${
                        STATUS_COLORS[status] ?? "bg-gray-400"
                      }`}
                    />
                    <span className="font-medium">
                      {STATUS_LABELS[status] ?? status}
                    </span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top países */}
        <Card>
          <CardHeader>
            <CardTitle>Top países (verified)</CardTitle>
            <CardDescription>
              Memorias verificadas por country_code. Top 10.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topCountries.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos.</p>
            ) : (
              <ul className="space-y-2">
                {stats.topCountries.map((c) => (
                  <li key={c.country_code ?? "?"} className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="font-mono">{c.country_code}</span>
                      <span className="text-muted-foreground">{c.count}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded overflow-hidden">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${(c.count / maxCountry) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Decisiones de moderación */}
        <Card>
          <CardHeader>
            <CardTitle>Decisiones de moderación</CardTitle>
            <CardDescription>
              Tras revisión Telegram (manual o IA por timeout).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {decisionsTotal === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos.</p>
            ) : (
              <ul className="space-y-3">
                {Object.entries(stats.decisions).map(([d, count]) => (
                  <li key={d} className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span>{DECISION_LABELS[d] ?? d}</span>
                      <span className="text-muted-foreground">
                        {count} · {((count / decisionsTotal) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${(count / decisionsTotal) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  delta30d,
}: {
  label: string;
  value: number | string;
  delta30d?: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl font-bold tabular-nums">
          {value}
        </CardTitle>
      </CardHeader>
      {delta30d !== undefined && (
        <CardContent>
          <Badge variant={delta30d > 0 ? "default" : "secondary"}>
            +{delta30d} últimos 30 días
          </Badge>
        </CardContent>
      )}
    </Card>
  );
}

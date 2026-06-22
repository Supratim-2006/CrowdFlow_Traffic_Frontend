import { motion } from "framer-motion";
import { Route, Navigation, Gauge, Timer, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RoutingResponse } from "@/lib/traffic-api";
import { SectionHeader } from "./SectionHeader";

interface Props {
  routing: RoutingResponse | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function RoutingDiversions({ routing, loading, error, onRetry }: Props) {
  return (
    <section className="glass-panel rounded-2xl p-6 lg:p-8">
      <SectionHeader
        index="07"
        title="Routing & Diversions"
        subtitle="Auto-computed bypass around blocked road."
        action={
          <Button variant="outline" size="sm" onClick={onRetry} disabled={loading} className="gap-1.5">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Route className="h-3.5 w-3.5" />} Recompute
          </Button>
        }
      />

      {loading && (
        <div className="grid h-40 place-items-center text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Computing safest local bypass…</div>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center justify-between rounded-xl border border-status-critical/40 bg-status-critical/10 p-4 text-sm">
          <span className="inline-flex items-center gap-2 text-status-critical"><AlertTriangle className="h-4 w-4" /> {error}</span>
          <Button size="sm" variant="outline" onClick={onRetry}>Retry</Button>
        </div>
      )}

      {routing && !loading && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Tile icon={<Route className="h-4 w-4" />} label="Blocked Road" value={routing.data.blocked_road} accent="critical" />
            <Tile icon={<Navigation className="h-4 w-4" />} label="Target Main Road" value={routing.data.target_main_road} accent="primary" />
            <Tile icon={<Gauge className="h-4 w-4" />} label="Distance" value={`${(routing.data.distance_meters / 1000).toFixed(2)} km`} />
            <Tile icon={<Timer className="h-4 w-4" />} label="Est. Travel Time" value={`${Math.max(0, Math.round(routing.data.estimated_travel_time_s / 60))} min`} />
          </div>

          <div className="mt-6 rounded-xl border border-border/60 bg-secondary/30 p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Turn-by-Turn Directions</p>
              <span className="text-[11px] text-muted-foreground">{routing.data.directions.length} steps · {routing.data.active_closures_on_path} closures on path</span>
            </div>
            <ol className="relative space-y-3 pl-6">
              <span className="absolute left-[11px] top-2 bottom-2 w-px bg-border" aria-hidden />
              {routing.data.directions.map((d, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative rounded-lg border border-border/60 bg-background/40 p-3"
                >
                  <span className="absolute -left-6 top-3 grid h-5 w-5 place-items-center rounded-full bg-[image:var(--gradient-primary)] text-[10px] font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <ArrowRight className="h-3.5 w-3.5 text-primary" /> {d.instruction}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                    <span>{d.street}</span>
                    <span>·</span>
                    <span>{(d.distance_meters / 1000).toFixed(2)} km</span>
                    {d.event_alert && d.event_alert !== "none" && (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1 text-status-high"><AlertTriangle className="h-3 w-3" /> {d.event_alert}</span>
                      </>
                    )}
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
        </>
      )}
    </section>
  );
}

function Tile({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: "primary" | "critical" }) {
  const ring = accent === "critical" ? "ring-status-critical/30" : accent === "primary" ? "ring-primary/30" : "ring-border/60";
  return (
    <div className={`rounded-xl border border-border/60 bg-secondary/30 p-4 ring-1 ${ring}`}>
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <p className="mt-2 truncate text-base font-semibold" title={value}>{value || "—"}</p>
    </div>
  );
}
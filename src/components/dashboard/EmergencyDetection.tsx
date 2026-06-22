import { AlertOctagon, Siren } from "lucide-react";
import { motion } from "framer-motion";
import type { AnalyzeResponse } from "@/lib/traffic-api";
import { severityClass } from "@/lib/traffic-api";
import { SectionHeader } from "./SectionHeader";

const LEVEL_BG: Record<string, string> = {
  low: "from-status-low/30 to-status-low/5 border-status-low/40",
  medium: "from-status-medium/30 to-status-medium/5 border-status-medium/40",
  high: "from-status-high/30 to-status-high/5 border-status-high/40",
  critical: "from-status-critical/40 to-status-critical/5 border-status-critical/50",
};

const LEVEL_TEXT: Record<string, string> = {
  low: "text-status-low",
  medium: "text-status-medium",
  high: "text-status-high",
  critical: "text-status-critical",
};

export function EmergencyDetection({ data }: { data: AnalyzeResponse }) {
  const c = data.congestion;
  const sev = severityClass(c.emergency_level);

  return (
    <section className="glass-panel rounded-2xl p-6 lg:p-8">
      <SectionHeader index="04" title="Emergency Detection" subtitle="Scene classification and threat indicators." />

      <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 ${LEVEL_BG[sev]}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-background/60 ${LEVEL_TEXT[sev]}`}>
              <Siren className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Emergency Level</p>
              <p className={`text-3xl font-bold tracking-tight ${LEVEL_TEXT[sev]}`}>{c.emergency_level}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/40 px-4 py-2 text-sm">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Scene Type</p>
            <p className="mt-0.5 font-semibold capitalize">{c.scene_type}</p>
          </div>
        </div>
        {sev === "critical" && <div className="pointer-events-none absolute inset-0 animate-pulse bg-status-critical/5" />}
      </div>

      {/* Emergency Detail Stats */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="Crash Pairs (IoU)" value={c.crash_pairs_iou} color="text-orange-400" />
        <StatCard label="Crash Pairs (Proximity)" value={c.crash_pairs_proximity} color="text-yellow-400" />
        <StatCard label="People Near Vehicles" value={c.people_near_vehicles} color="text-blue-400" />
        <StatCard label="Debris Objects" value={c.debris_objects} color="text-red-400" />
      </div>

      {(data.incident.event_cause || data.incident.event_type || data.incident.road_block_reason) && (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {data.incident.event_cause && (
            <Meta label="Event Cause" value={data.incident.event_cause} />
          )}
          {data.incident.event_type && (
            <Meta label="Event Type" value={data.incident.event_type} />
          )}
          {data.incident.road_block_reason && (
            <Meta label="Road Block Reason" value={data.incident.road_block_reason} />
          )}
        </div>
      )}

      <div className="mt-5">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Emergency Reasons</p>
        <ul className="space-y-2">
          {c.emergency_reasons.map((reason, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-start gap-3 rounded-lg border border-border/60 bg-secondary/30 p-3"
            >
              <AlertOctagon className={`mt-0.5 h-4 w-4 shrink-0 ${LEVEL_TEXT[sev]}`} />
              <span className="text-sm">{reason}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-secondary/30 p-3 text-center">
      <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-secondary/30 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold capitalize">{value.replace(/_/g, " ")}</p>
    </div>
  );
}
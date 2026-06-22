import { motion } from "framer-motion";
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";
import type { AnalyzeResponse } from "@/lib/traffic-api";
import { severityClass } from "@/lib/traffic-api";
import { SectionHeader } from "./SectionHeader";
import { cn } from "@/lib/utils";

const COLOR_BY_SEV: Record<string, string> = {
  low: "oklch(0.75 0.18 150)",
  medium: "oklch(0.82 0.17 90)",
  high: "oklch(0.75 0.19 50)",
  critical: "oklch(0.65 0.25 25)",
};

export function CongestionAnalysis({ data }: { data: AnalyzeResponse }) {
  const c = data.congestion;
  const sev = severityClass(c.level);
  const color = COLOR_BY_SEV[sev];
  // Guard against NaN/undefined — use lane_occupancy_pct from raw data if available
  const rawPct = (data._raw as { analysis?: { lane_occupancy_pct?: number; lane_occupancy?: number } } | undefined)?.analysis?.lane_occupancy_pct
    ?? ((data._raw as { analysis?: { lane_occupancy?: number } } | undefined)?.analysis?.lane_occupancy ?? 0) * 100;
  const safePct = Number.isFinite(c.percentage) ? c.percentage : Number.isFinite(rawPct) ? rawPct : 0;
  const pct = Math.max(0, Math.min(100, Math.round(safePct * 10) / 10));
  const safeScore = Number.isFinite(c.score) ? c.score : 0;

  return (
    <section className="glass-panel rounded-2xl p-6 lg:p-8">
      <SectionHeader index="03" title="Congestion Analysis" subtitle="Density model and severity classification." />
      <div className="grid items-center gap-6 md:grid-cols-[260px_1fr]">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative mx-auto h-[220px] w-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart innerRadius="72%" outerRadius="100%" data={[{ value: pct, fill: color }]} startAngle={90} endAngle={-270}>
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar background={{ fill: "oklch(0.26 0.03 250)" }} dataKey="value" cornerRadius={20} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Congestion</p>
              <p className="text-4xl font-bold tabular-nums tracking-tight" style={{ color }}>{pct}%</p>
              <p className="mt-1 text-xs text-muted-foreground">Score {safeScore.toFixed(2)} / 10</p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="pulse-ring-dot h-3 w-3 rounded-full" style={{ background: color, boxShadow: `0 0 12px ${color}` }} />
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Severity Level</p>
          </div>
          <p className="text-4xl font-bold tracking-tight" style={{ color }}>{c.level}</p>

          <div className="grid grid-cols-4 gap-2">
            {(["Clear", "Moderate", "Heavy", "Critical"] as const).map((label) => {
              const lvl = severityClass(label);
              const active = lvl === sev;
              return (
                <div
                  key={label}
                  className={cn(
                    "rounded-lg border p-2 text-center text-[11px] transition-all",
                    active ? "border-transparent" : "border-border bg-secondary/30 text-muted-foreground",
                  )}
                  style={active ? { background: COLOR_BY_SEV[lvl], color: "oklch(0.14 0.03 250)", boxShadow: `0 0 24px ${COLOR_BY_SEV[lvl]}` } : undefined}
                >
                  <span className="font-semibold">{label}</span>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Stat label="Raw Score" value={`${safeScore.toFixed(2)} / 10`} />
            <Stat label="Lane Occupancy" value={`${pct}%`} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
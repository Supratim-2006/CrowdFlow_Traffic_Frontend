import { Ban, Clock, ShieldAlert, CheckCircle2, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import type { AnalyzeResponse } from "@/lib/traffic-api";
import { severityClass } from "@/lib/traffic-api";
import { SectionHeader } from "./SectionHeader";

export function Predictions({ data }: { data: AnalyzeResponse }) {
  const p = data.predictions;
  const closureSev = severityClass(p.closure_risk_level);
  const closurePct = Math.round(p.closure_confidence * 100);
  const disruptionPct = parseFloat(p.disruption_confidence) || 0;
  const sevText: Record<string, string> = {
    low: "text-status-low bg-status-low/15",
    medium: "text-status-medium bg-status-medium/15",
    high: "text-status-high bg-status-high/15",
    critical: "text-status-critical bg-status-critical/15",
  };

  return (
    <section className="glass-panel rounded-2xl p-6 lg:p-8">
      <SectionHeader index="05" title="Predictions" subtitle="Model-driven closure and disruption forecasts." />
      <div className="grid gap-4 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl border border-border/60 bg-secondary/30 p-5">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-status-high/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Ban className="h-3.5 w-3.5" /> Road Closure
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${sevText[closureSev]}`}>
                {p.closure_risk_level} Risk
              </span>
            </div>
            <div className="mt-4 flex items-center gap-3">
              {p.road_closure_required ? (
                <ShieldAlert className="h-7 w-7 text-status-critical" />
              ) : (
                <CheckCircle2 className="h-7 w-7 text-status-low" />
              )}
              <p className="text-2xl font-bold">{p.road_closure_required ? "Closure Required" : "Closure Not Required"}</p>
            </div>
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Model Confidence</span>
                <span className="font-semibold tabular-nums">{closurePct}%</span>
              </div>
              <Progress value={closurePct} className="h-2" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="relative overflow-hidden rounded-2xl border border-border/60 bg-secondary/30 p-5">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> Disruption
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                <TrendingUp className="h-3 w-3" /> {p.disruption_confidence}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Expected Delay</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-gradient-primary">{p.expected_delay}</p>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Duration class: <span className="font-medium text-foreground">{p.disruption_severity}</span></p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Confidence</span>
                <span className="font-semibold tabular-nums">{disruptionPct.toFixed(1)}%</span>
              </div>
              <Progress value={disruptionPct} className="h-2" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
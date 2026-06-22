import { motion } from "framer-motion";
import { Loader2, ScanLine } from "lucide-react";

const STAGES = [
  "Decoding incident image",
  "Running object detection",
  "Scoring congestion density",
  "Evaluating emergency signals",
  "Forecasting disruption window",
  "Computing bypass routes",
];

export function LoadingOverlay({ progress }: { progress: number }) {
  const stageIdx = Math.min(STAGES.length - 1, Math.floor((progress / 100) * STAGES.length));
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel relative overflow-hidden rounded-2xl p-6">
      <div className="flex items-center gap-3">
        <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-[image:var(--gradient-primary)] shadow-[var(--glow-primary)]">
          <Loader2 className="h-5 w-5 animate-spin text-primary-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Analyzing traffic scene…</p>
          <p className="truncate text-xs text-muted-foreground">{STAGES[stageIdx]}</p>
        </div>
        <span className="text-xs font-semibold tabular-nums text-primary">{Math.round(progress)}%</span>
      </div>
      <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-secondary/60">
        <motion.div
          className="absolute inset-y-0 left-0 bg-[image:var(--gradient-primary)]"
          animate={{ width: `${progress}%` }}
          transition={{ ease: "easeOut", duration: 0.4 }}
        />
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary/40" />
        ))}
      </div>
      <ScanLine className="pointer-events-none absolute right-4 top-4 h-4 w-4 text-primary/40" />
    </motion.div>
  );
}
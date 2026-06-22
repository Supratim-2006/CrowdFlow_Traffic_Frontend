import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import type { AnalyzeResponse } from "@/lib/traffic-api";
import { SectionHeader } from "./SectionHeader";

export function Recommendations({ data }: { data: AnalyzeResponse }) {
  return (
    <section className="glass-panel rounded-2xl p-6 lg:p-8">
      <SectionHeader index="08" title="Operational Recommendations" subtitle="AI-generated dispatch actions." />
      <div className="grid gap-3 md:grid-cols-2">
        {data.recommendations.map((rec, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group flex items-start gap-3 rounded-xl border border-border/60 bg-secondary/30 p-4 transition-colors hover:border-primary/40"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Action {String(i + 1).padStart(2, "0")}</p>
              <p className="mt-0.5 text-sm font-medium leading-snug">{rec}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
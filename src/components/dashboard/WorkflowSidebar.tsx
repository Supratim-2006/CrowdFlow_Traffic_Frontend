import { motion } from "framer-motion";
import { Check, Loader2, Upload, ScanSearch, Activity, Ban, Clock, Lightbulb, Route, Radio, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SectionHeader } from "./SectionHeader";

export type WorkflowStep =
  | "upload"
  | "detect"
  | "congestion"
  | "closure"
  | "disruption"
  | "recommend"
  | "route";

const STEPS: { id: WorkflowStep; label: string; icon: typeof Upload }[] = [
  { id: "upload", label: "Upload Incident Image", icon: Upload },
  { id: "detect", label: "Detect Objects", icon: ScanSearch },
  { id: "congestion", label: "Analyze Congestion", icon: Activity },
  { id: "closure", label: "Predict Closures", icon: Ban },
  { id: "disruption", label: "Predict Disruption", icon: Clock },
  { id: "recommend", label: "Generate Recommendations", icon: Lightbulb },
  { id: "route", label: "Route Diversions", icon: Route },
];

interface Props {
  completed: Set<WorkflowStep>;
  active: WorkflowStep | null;
  onReset: () => void;
}

export function WorkflowSidebar({ completed, active, onReset }: Props) {
  return (
    <section className="glass-panel-strong rounded-2xl p-6 lg:p-8">
      <SectionHeader
        index="01"
        title="Operational Pipeline"
        subtitle="AI workflow stages — tracked live across the incident lifecycle."
        action={
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground sm:inline-flex">
              <span className="pulse-ring-dot h-1.5 w-1.5 rounded-full bg-status-low" /> Live · v2.4 AI Core
            </span>
            <Button onClick={onReset} variant="outline" size="sm" className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" /> New Incident
            </Button>
          </div>
        }
      />

      <ol className="relative grid grid-cols-2 gap-y-5 sm:grid-cols-4 lg:grid-cols-7">
        <span
          className="pointer-events-none absolute left-5 right-5 top-5 hidden h-px bg-border/60 lg:block"
          aria-hidden
        />
        {STEPS.map((step, idx) => {
          const done = completed.has(step.id);
          const isActive = active === step.id;
          const Icon = step.icon;
          return (
            <motion.li
              key={step.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="relative flex flex-col items-center gap-2 text-center"
            >
              <span
                className={cn(
                  "relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-all",
                  done
                    ? "border-transparent bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--glow-primary)]"
                    : isActive
                      ? "border-primary/60 bg-primary/10 text-primary"
                      : "border-border bg-secondary/40 text-muted-foreground",
                )}
              >
                {done ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : isActive ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                {isActive && (
                  <span className="pulse-ring-dot absolute -inset-1 rounded-full border border-primary/40" />
                )}
              </span>
              <span
                className={cn(
                  "px-1 text-[11px] font-medium leading-tight",
                  done ? "text-foreground" : isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground/70">
                Step {String(idx + 1).padStart(2, "0")}
              </span>
            </motion.li>
          );
        })}
      </ol>
      {/* hidden import sentinel for Radio icon (kept for design parity) */}
      <Radio className="hidden" />
    </section>
  );
}
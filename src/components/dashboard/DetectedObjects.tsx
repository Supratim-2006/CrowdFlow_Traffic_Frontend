import { motion } from "framer-motion";
import { Car, Users, Construction, ParkingCircle, Boxes, Bus, Bike, Truck } from "lucide-react";
import type { AnalyzeResponse } from "@/lib/traffic-api";
import { SectionHeader } from "./SectionHeader";
import { AnimatedCounter } from "./AnimatedCounter";

const VEHICLE_ICONS: Record<string, typeof Car> = {
  car: Car, bus: Bus, truck: Truck, motorcycle: Bike, bicycle: Bike,
};

export function DetectedObjects({ data }: { data: AnalyzeResponse }) {
  const o = data.detected_objects;
  const cards = [
    { label: "Vehicles", value: o.vehicles, icon: Car, accent: "from-sky-500/30 to-blue-500/10" },
    { label: "People", value: o.people, icon: Users, accent: "from-emerald-500/30 to-teal-500/10" },
    { label: "Road Blocks", value: o.road_blocks, icon: Construction, accent: "from-amber-500/30 to-orange-500/10" },
    { label: "Illegal Parking", value: o.illegal_parking, icon: ParkingCircle, accent: "from-rose-500/30 to-pink-500/10" },
    { label: "Total Objects", value: o.total, icon: Boxes, accent: "from-violet-500/30 to-fuchsia-500/10" },
  ];

  return (
    <section className="glass-panel rounded-2xl p-6 lg:p-8">
      <SectionHeader index="02" title="Detected Objects" subtitle="Computer-vision pass over uploaded scene." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="group relative overflow-hidden rounded-xl border border-border/60 bg-secondary/40 p-4"
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${c.accent} opacity-60 transition group-hover:opacity-100`} />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <Icon className="h-4 w-4 text-foreground/80" />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Live</span>
                </div>
                <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight">
                  <AnimatedCounter value={c.value} />
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{c.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {Object.keys(o.vehicle_types || {}).length > 0 && (
        <div className="mt-5 rounded-xl border border-border/60 bg-secondary/30 p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Vehicle Breakdown</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(o.vehicle_types).map(([type, count]) => {
              const Icon = VEHICLE_ICONS[type.toLowerCase()] ?? Car;
              return (
                <span key={type} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/40 px-3 py-1 text-xs">
                  <Icon className="h-3 w-3 text-primary" />
                  <span className="capitalize">{type}</span>
                  <span className="font-semibold tabular-nums">{count}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
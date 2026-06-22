import { Activity, Globe2 } from "lucide-react";

export function TopBar() {
  return (
    <header className="glass-panel-strong sticky top-0 z-20 mb-6 flex items-center justify-between gap-4 rounded-2xl px-4 py-3 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[image:var(--gradient-primary)] shadow-[var(--glow-primary)]">
          <Activity className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Operations Console</p>
          <h1 className="truncate text-sm font-bold sm:text-base">Smart Traffic Incident Management System</h1>
        </div>
      </div>
      <div className="hidden items-center gap-3 text-[11px] text-muted-foreground md:flex">
        <span className="inline-flex items-center gap-1.5"><Globe2 className="h-3.5 w-3.5" /> Region · IN-KA</span>
        <span className="inline-flex items-center gap-1.5"><span className="pulse-ring-dot h-1.5 w-1.5 rounded-full bg-status-low" /> All systems online</span>
      </div>
    </header>
  );
}
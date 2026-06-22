import { useEffect, useRef } from "react";
import type { AnalyzeResponse } from "@/lib/traffic-api";
import { SectionHeader } from "./SectionHeader";

export function TrafficHeatmap({ data }: { data: AnalyzeResponse }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    let cancelled = false;
    let map: any;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet.heat");
      if (cancelled || !containerRef.current) return;
      const { latitude, longitude } = data.incident;
      map = L.map(containerRef.current).setView([latitude, longitude], 13);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap, © CARTO",
        maxZoom: 19,
      }).addTo(map);

      const pts = (data.map?.heatmap_points ?? []).map(([lat, lng, w]) => [lat, lng, Math.min(1, w / 10)] as [number, number, number]);
      if (pts.length) {
        // @ts-expect-error leaflet.heat augments L
        L.heatLayer(pts, { radius: 35, blur: 25, maxZoom: 17, gradient: { 0.2: "#22d3ee", 0.4: "#22c55e", 0.6: "#f59e0b", 0.8: "#ef4444", 1: "#dc2626" } }).addTo(map);
      }

      const icon = L.divIcon({
        className: "",
        html: `<div style="position:relative"><div style="position:absolute;inset:-12px;border-radius:9999px;background:rgba(239,68,68,0.25);animation:pulse-ring 2s infinite"></div><div style="width:18px;height:18px;border-radius:9999px;background:#ef4444;border:3px solid #fff;box-shadow:0 0 14px #ef4444"></div></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      L.marker([latitude, longitude], { icon }).addTo(map).bindPopup(`<b>${data.incident.junction}</b><br/>${data.incident.zone}`);

      setTimeout(() => map.invalidateSize(), 100);
    })();
    return () => {
      cancelled = true;
      if (map) map.remove();
    };
  }, [data]);

  return (
    <section className="glass-panel rounded-2xl p-6 lg:p-8">
      <SectionHeader
        index="06"
        title="Traffic Heatmap"
        subtitle="Live congestion intensity around incident."
        action={
          <span className="hidden items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground sm:inline-flex">
            <span className="pulse-ring-dot h-1.5 w-1.5 rounded-full bg-status-critical" /> Live Feed
          </span>
        }
      />
      <div ref={containerRef} className="h-[420px] w-full overflow-hidden rounded-xl border border-border/60" />
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-4 rounded bg-cyan-400" /> Low</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-4 rounded bg-emerald-500" /> Moderate</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-4 rounded bg-amber-500" /> High</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-4 rounded bg-red-600" /> Critical</span>
      </div>
    </section>
  );
}
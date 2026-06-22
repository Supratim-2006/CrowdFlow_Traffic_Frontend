import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertTriangle, Route as RouteIcon, ShieldCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "./SectionHeader";

interface Props {
  latitude: number;
  longitude: number;
  /** Danger / closure radius around the accident point, in metres. */
  dangerRadiusM?: number;
  /** Maximum distance any point on a candidate bypass may be from the accident, in metres. */
  maxCorridorM?: number;
}

interface RouteFeature {
  coords: [number, number][]; // [lat, lon]
  distanceM: number;
  durationS: number;
  intersectsDanger: boolean;
  maxFromAccidentM: number;
}

const PALETTE = {
  recommended: "#22d3a5",
  alternate: "#38bdf8",
  blocked: "#ef4444",
};

function haversine(a: [number, number], b: [number, number]) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Pick origin/destination ~`offsetM` metres on either side of the accident. */
function endpoints(lat: number, lon: number, offsetM = 380) {
  // 1 deg lat ≈ 111_320 m. Adjust lon by cos(lat).
  const dLat = offsetM / 111_320;
  const dLon = offsetM / (111_320 * Math.cos((lat * Math.PI) / 180));
  return {
    origin: [lat + dLat * 0.25, lon - dLon] as [number, number],
    destination: [lat - dLat * 0.25, lon + dLon] as [number, number],
  };
}

async function fetchAlternatives(
  origin: [number, number],
  destination: [number, number],
): Promise<{ coords: [number, number][]; distance: number; duration: number }[]> {
  const url = `https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${destination[1]},${destination[0]}?alternatives=3&overview=full&geometries=geojson`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`OSRM ${r.status}`);
  const j = await r.json();
  if (!j?.routes?.length) throw new Error("No routes returned");
  return j.routes.map((rt: any) => ({
    coords: rt.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]),
    distance: rt.distance as number,
    duration: rt.duration as number,
  }));
}

export function DiversionRouteMap({
  latitude,
  longitude,
  dangerRadiusM = 120,
  maxCorridorM = 1500,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layersRef = useRef<any[]>([]);
  const [routes, setRoutes] = useState<RouteFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // init map once
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;
      const map = L.map(containerRef.current, { zoomControl: true }).setView([latitude, longitude], 14);
      mapRef.current = map;
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap, © CARTO",
        maxZoom: 19,
      }).addTo(map);
      setTimeout(() => map.invalidateSize(), 100);
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const compute = async () => {
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return;
    setLoading(true);
    setError(null);
    try {
      const { origin, destination } = endpoints(latitude, longitude);
      const raw = await fetchAlternatives(origin, destination);
      const annotated: RouteFeature[] = raw
        .map((r) => {
          const maxDist = r.coords.reduce(
            (m, c) => Math.max(m, haversine(c, [latitude, longitude])),
            0,
          );
          const hits = r.coords.some((c) => haversine(c, [latitude, longitude]) < dangerRadiusM);
          return {
            coords: r.coords,
            distanceM: r.distance,
            durationS: r.duration,
            intersectsDanger: hits,
            maxFromAccidentM: maxDist,
          };
        })
        // Keep only routes that stay inside the local corridor around the accident.
        .filter((r) => r.maxFromAccidentM <= maxCorridorM);
      // sort: safe first (by shortest), blocked last
      annotated.sort((a, b) => {
        if (a.intersectsDanger !== b.intersectsDanger) return a.intersectsDanger ? 1 : -1;
        return a.durationS - b.durationS;
      });
      setRoutes(annotated);
      if (!annotated.length) {
        setError(`No bypass routes found within ${maxCorridorM} m of the accident.`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch routes");
    } finally {
      setLoading(false);
    }
  };

  // recompute on coordinate change
  useEffect(() => {
    void compute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude]);

  // draw layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;
      // clear
      layersRef.current.forEach((l) => map.removeLayer(l));
      layersRef.current = [];

      // accident marker + danger circle
      const danger = L.circle([latitude, longitude], {
        radius: dangerRadiusM,
        color: PALETTE.blocked,
        weight: 1.5,
        fillColor: PALETTE.blocked,
        fillOpacity: 0.12,
        dashArray: "5 5",
      }).addTo(map);
      layersRef.current.push(danger);

      // outer corridor boundary (max allowed bypass distance)
      const corridor = L.circle([latitude, longitude], {
        radius: maxCorridorM,
        color: "#38bdf8",
        weight: 1,
        fillOpacity: 0,
        dashArray: "3 6",
        opacity: 0.5,
      }).addTo(map);
      layersRef.current.push(corridor);

      const accidentIcon = L.divIcon({
        className: "",
        html: `<div style="position:relative"><div style="position:absolute;inset:-14px;border-radius:9999px;background:rgba(239,68,68,0.25);animation:pulse-ring 1.8s infinite"></div><div style="width:20px;height:20px;border-radius:9999px;background:#ef4444;border:3px solid #fff;box-shadow:0 0 14px #ef4444"></div></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      const marker = L.marker([latitude, longitude], { icon: accidentIcon })
        .addTo(map)
        .bindTooltip("Accident zone — closed", { direction: "top", offset: [0, -10] });
      layersRef.current.push(marker);

      // route polylines
      const safeIdx = routes.findIndex((r) => !r.intersectsDanger);
      routes.forEach((r, i) => {
        const isRecommended = i === safeIdx;
        const color = r.intersectsDanger
          ? PALETTE.blocked
          : isRecommended
            ? PALETTE.recommended
            : PALETTE.alternate;
        const halo = L.polyline(r.coords, {
          color,
          weight: isRecommended ? 10 : 7,
          opacity: 0.18,
        }).addTo(map);
        const line = L.polyline(r.coords, {
          color,
          weight: isRecommended ? 5 : 3.5,
          opacity: r.intersectsDanger ? 0.55 : 0.95,
          dashArray: r.intersectsDanger ? "8 6" : undefined,
        }).addTo(map);
        line.bindTooltip(
          `${r.intersectsDanger ? "Blocked" : isRecommended ? "Recommended bypass" : "Alternate"} · ${(r.distanceM / 1000).toFixed(2)} km · ${Math.round(r.durationS / 60)} min`,
          { sticky: true },
        );
        layersRef.current.push(halo, line);
      });

      // Always fit the corridor so the map shows the local 500 m area around the accident.
      const corridorBounds = corridor.getBounds();
      if (routes.length) {
        const all = routes.flatMap((r) => r.coords);
        const bounds = L.latLngBounds(all);
        bounds.extend(corridorBounds);
        map.fitBounds(bounds, { padding: [30, 30] });
      } else {
        map.fitBounds(corridorBounds, { padding: [30, 30] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [routes, latitude, longitude, dangerRadiusM]);

  const safeCount = routes.filter((r) => !r.intersectsDanger).length;
  const blockedCount = routes.length - safeCount;

  return (
    <section className="glass-panel rounded-2xl p-6 lg:p-8">
      <SectionHeader
        index="08"
        title="Bypass Route Map"
        subtitle="Live alternates around the accident zone — green is the safest bypass, dashed red routes pass through the closure."
        action={
          <Button size="sm" variant="outline" onClick={compute} disabled={loading} className="gap-1.5">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Recompute
          </Button>
        }
      />

      <div className="relative">
        <div
          ref={containerRef}
          className="h-[460px] w-full overflow-hidden rounded-xl border border-border/60"
        />
        {loading && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-xl bg-background/40 backdrop-blur-[2px]">
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Calculating bypass routes…
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-status-critical/40 bg-status-critical/10 p-3 text-xs">
          <span className="inline-flex items-center gap-2 text-status-critical">
            <AlertTriangle className="h-3.5 w-3.5" /> {error}
          </span>
          <Button size="sm" variant="outline" onClick={compute}>Retry</Button>
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Legend color={PALETTE.recommended} icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Recommended bypass" value={safeCount > 0 ? "1 route" : "—"} />
        <Legend color={PALETTE.alternate} icon={<RouteIcon className="h-3.5 w-3.5" />} label="Alternate clear route" value={`${Math.max(0, safeCount - 1)} routes`} />
        <Legend color={PALETTE.blocked} icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Passes through closure" value={`${blockedCount} routes`} />
      </div>

      {routes.length > 0 && (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {routes.map((r, i) => {
            const safe = !r.intersectsDanger;
            const recommended = safe && i === routes.findIndex((x) => !x.intersectsDanger);
            return (
              <motion.li
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-6 rounded-full"
                    style={{ background: r.intersectsDanger ? PALETTE.blocked : recommended ? PALETTE.recommended : PALETTE.alternate }}
                  />
                  <span className="font-medium">
                    {recommended ? "Recommended" : r.intersectsDanger ? "Blocked" : `Alt ${i + 1}`}
                  </span>
                </div>
                <span className="tabular-nums text-muted-foreground">
                  {(r.distanceM / 1000).toFixed(2)} km · {Math.round(r.durationS / 60)} min
                </span>
              </motion.li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Legend({ color, icon, label, value }: { color: string; icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/30 px-3 py-2.5 text-xs">
      <div className="flex items-center gap-2">
        <span className="inline-block h-2.5 w-6 rounded-full" style={{ background: color }} />
        <span className="inline-flex items-center gap-1.5 text-foreground/90">{icon} {label}</span>
      </div>
      <span className="tabular-nums text-muted-foreground">{value}</span>
    </div>
  );
}
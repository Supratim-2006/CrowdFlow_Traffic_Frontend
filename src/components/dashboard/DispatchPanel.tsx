import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Building2,
  Activity,
  CheckCircle2,
  Navigation,
  Phone,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import type { AnalyzeResponse } from "@/lib/traffic-api";
import { SectionHeader } from "./SectionHeader";
import { AnimatedCounter } from "./AnimatedCounter";

interface NearbyStation {
  name: string;
  distance_km: number;
  latitude: number;
  longitude: number;
  address?: string;
  phone?: string;
}

function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function fetchNearestStation(lat: number, lon: number): Promise<NearbyStation | null> {
  const query = `[out:json][timeout:20];nwr["amenity"="police"](around:8000,${lat},${lon});out center 15;`;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Overpass ${res.status}`);
  const json = (await res.json()) as {
    elements: Array<{
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: Record<string, string>;
    }>;
  };
  const stations = (json.elements || [])
    .map((el) => {
      const la = el.lat ?? el.center?.lat;
      const lo = el.lon ?? el.center?.lon;
      if (typeof la !== "number" || typeof lo !== "number") return null;
      const tags = el.tags || {};
      return {
        latitude: la,
        longitude: lo,
        name: tags.name || tags["name:en"] || "Police Station",
        address: [tags["addr:street"], tags["addr:suburb"], tags["addr:city"]]
          .filter(Boolean)
          .join(", "),
        phone: tags.phone || tags["contact:phone"],
        distance_km: haversineKm([lat, lon], [la, lo]),
      } as NearbyStation;
    })
    .filter((s): s is NearbyStation => !!s)
    .sort((a, b) => a.distance_km - b.distance_km);
  return stations[0] ?? null;
}

const BREAKDOWN_META = [
  {
    key: "congestion_base",
    label: "Base Force",
    desc: "Standard officers required for the measured congestion level.",
  },
  {
    key: "emergency_bonus",
    label: "Emergency Add-on",
    desc: "Extra officers for emergency severity (medical, hazard, blockage).",
  },
  {
    key: "event_type_bonus",
    label: "Event Add-on",
    desc: "Extra officers based on event cause (e.g. accident, VIP, protest).",
  },
  {
    key: "scale_bonus",
    label: "Crowd / Scale Add-on",
    desc: "Extra officers if vehicles + people on scene exceed normal scale.",
  },
] as const;

export function DispatchPanel({ data }: { data: AnalyzeResponse }) {
  const d = data.dispatch;
  const lat = data.incident.latitude;
  const lon = data.incident.longitude;

  const apiStation = d?.nearest_police_station ?? null;
  const [station, setStation] = useState<NearbyStation | null>(
    apiStation && apiStation.latitude && apiStation.longitude
      ? {
          name: apiStation.name || "Police Station",
          latitude: apiStation.latitude,
          longitude: apiStation.longitude,
          distance_km: apiStation.distance_km ?? haversineKm([lat, lon], [apiStation.latitude, apiStation.longitude]),
          address: apiStation.address,
        }
      : null,
  );
  const [loadingStation, setLoadingStation] = useState(false);
  const [stationError, setStationError] = useState<string | null>(null);

  useEffect(() => {
    if (station) return;
    let cancelled = false;
    setLoadingStation(true);
    setStationError(null);
    fetchNearestStation(lat, lon)
      .then((s) => {
        if (cancelled) return;
        if (!s) setStationError("No police station found within 8 km.");
        else setStation(s);
      })
      .catch((e) => {
        if (!cancelled) setStationError(e instanceof Error ? e.message : "Lookup failed");
      })
      .finally(() => !cancelled && setLoadingStation(false));
    return () => {
      cancelled = true;
    };
  }, [lat, lon, station]);

  if (!d) return null;
  const bd = d.personnel_breakdown;
  const total = d.police_personnel_required;

  return (
    <section className="glass-panel rounded-2xl p-6 lg:p-8">
      <SectionHeader
        index="07"
        title="Police Dispatch"
        subtitle="How many officers are needed and where the alert was sent."
      />

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent p-6"
        >
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-background/60 text-primary">
              <Shield className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Officers To Dispatch
              </p>
              <p className="text-4xl font-bold tracking-tight">
                <AnimatedCounter value={total} />
                <span className="ml-2 text-base font-medium text-muted-foreground">
                  personnel
                </span>
              </p>
              <p className="mt-1 text-xs font-medium text-primary">
                Tier: {d.personnel_bracket}
              </p>
            </div>
          </div>

          <p className="mt-5 mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            How this number is calculated
          </p>
          <div className="space-y-2">
            {BREAKDOWN_META.map((m) => {
              const value = (bd as unknown as Record<string, number>)[m.key] ?? 0;
              const pct = total > 0 ? Math.round((value / total) * 100) : 0;
              return (
                <div
                  key={m.key}
                  className="rounded-xl border border-border/60 bg-background/40 p-3"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{m.label}</p>
                      <p className="text-[11px] leading-snug text-muted-foreground">
                        {m.desc}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold tabular-nums">
                        +{value}
                        <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                          officer{value === 1 ? "" : "s"}
                        </span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">{pct}% of total</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-status-low/50 bg-status-low/10 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-status-low" />
              <div>
                <p className="text-sm font-semibold text-status-low">
                  Alert dispatched to nearest police station
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Incident details, coordinates, and recommended personnel count have been
                  forwarded to the unit shown below.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-secondary/30 p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Building2 className="h-4 w-4 text-primary" /> Nearest Police Station
            </div>

            {loadingStation && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Locating nearest unit via
                OpenStreetMap…
              </div>
            )}

            {!loadingStation && station && (
              <div className="space-y-3">
                <div>
                  <p className="text-base font-semibold">{station.name}</p>
                  {station.address && (
                    <p className="text-xs text-muted-foreground">{station.address}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-border/60 bg-background/40 p-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Distance
                    </p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-sm font-semibold tabular-nums">
                      <Activity className="h-3 w-3 text-primary" />
                      {station.distance_km.toFixed(2)} km
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background/40 p-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Coordinates
                    </p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums">
                      {station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                  >
                    <Navigation className="h-3 w-3" /> Directions
                  </a>
                  {station.phone && (
                    <a
                      href={`tel:${station.phone}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/40 px-3 py-1.5 text-xs font-medium hover:bg-background/60"
                    >
                      <Phone className="h-3 w-3" /> {station.phone}
                    </a>
                  )}
                </div>
              </div>
            )}

            {!loadingStation && !station && stationError && (
              <div className="flex items-start gap-2 rounded-lg border border-dashed border-border/60 bg-background/40 p-3 text-xs text-muted-foreground">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-medium" />
                <p>{stationError}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
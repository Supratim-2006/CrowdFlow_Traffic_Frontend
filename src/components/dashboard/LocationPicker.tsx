import { useEffect, useRef, useState } from "react";
import { MapPin, Crosshair, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "./SectionHeader";

const BENGALURU: [number, number] = [12.9716, 77.5946];

interface Props {
  latitude: string;
  longitude: string;
  onPick: (lat: number, lon: number, label?: string, zone?: string) => void;
}

export function LocationPicker({ latitude, longitude, onPick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Array<{ lat: number; lon: number; label: string }>>([]);
  const placeRef = useRef<((lat: number, lon: number) => Promise<void>) | null>(null);

  // init map once
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;
      LRef.current = L;

      const start: [number, number] = [
        Number(latitude) || BENGALURU[0],
        Number(longitude) || BENGALURU[1],
      ];
      const map = L.map(containerRef.current, { zoomControl: true }).setView(start, 12);
      mapRef.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap, © CARTO",
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: `<div style="position:relative"><div style="position:absolute;inset:-12px;border-radius:9999px;background:rgba(56,189,248,0.25);animation:pulse-ring 2s infinite"></div><div style="width:18px;height:18px;border-radius:9999px;background:#38bdf8;border:3px solid #fff;box-shadow:0 0 14px #38bdf8"></div></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      const marker = L.marker(start, { icon, draggable: true }).addTo(map);
      markerRef.current = marker;

      const placeMarker = async (lat: number, lon: number) => {
        marker.setLatLng([lat, lon]);
        let label: string | undefined;
        let zone: string | undefined;

        if (lat > 13.03) zone = "North Zone";
        else if (lat < 12.92) zone = "South Zone";
        else if (lon > 77.64) zone = "East Zone";
        else if (lon < 77.54) zone = "West Zone";
        else zone = "Central Zone";

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=17`,
            { headers: { Accept: "application/json" } },
          );
          if (res.ok) {
            const j = await res.json();
            label = j?.display_name?.split(",").slice(0, 2).join(", ").trim();
          }
        } catch {
          // best-effort
        }
        onPick(lat, lon, label, zone);
      };
      placeRef.current = placeMarker;

      map.on("click", (e: any) => {
        placeMarker(e.latlng.lat, e.latlng.lng);
      });
      marker.on("dragend", () => {
        const ll = marker.getLatLng();
        placeMarker(ll.lat, ll.lng);
      });

      // City limits highlight (loose box)
      L.rectangle(
        [
          [12.83, 77.46],
          [13.14, 77.78],
        ],
        { color: "#38bdf8", weight: 1, dashArray: "4 4", fillOpacity: 0.04 },
      ).addTo(map);

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

  // sync marker when external lat/lon change (e.g. reset)
  useEffect(() => {
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (!mapRef.current || !markerRef.current || Number.isNaN(lat) || Number.isNaN(lon)) return;
    const cur = markerRef.current.getLatLng();
    if (Math.abs(cur.lat - lat) > 1e-6 || Math.abs(cur.lng - lon) > 1e-6) {
      markerRef.current.setLatLng([lat, lon]);
      mapRef.current.setView([lat, lon], mapRef.current.getZoom());
    }
  }, [latitude, longitude]);

  const recenter = () => {
    if (!mapRef.current) return;
    mapRef.current.setView(BENGALURU, 12);
  };

  const runSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setResults([]);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&viewbox=77.40,13.20,77.85,12.78&bounded=1&q=${encodeURIComponent(q + ", Bengaluru")}`;
      const r = await fetch(url, { headers: { Accept: "application/json" } });
      const arr = (await r.json()) as Array<{ lat: string; lon: string; display_name: string }>;
      const mapped = arr.map((a) => ({ lat: parseFloat(a.lat), lon: parseFloat(a.lon), label: a.display_name }));
      setResults(mapped);
      if (mapped[0] && mapRef.current) {
        mapRef.current.setView([mapped[0].lat, mapped[0].lon], 15);
        await placeRef.current?.(mapped[0].lat, mapped[0].lon);
      }
    } catch {
      // noop
    } finally {
      setSearching(false);
    }
  };

  const pickResult = async (r: { lat: number; lon: number }) => {
    if (mapRef.current) mapRef.current.setView([r.lat, r.lon], 16);
    await placeRef.current?.(r.lat, r.lon);
    setResults([]);
  };

  return (
    <section className="glass-panel rounded-2xl p-6 lg:p-8">
      <SectionHeader
        index="00"
        title="Pin Accident Location"
        subtitle="Click the map or drag the pin to mark the incident in Bengaluru."
        action={
          <Button size="sm" variant="outline" onClick={recenter} className="gap-1.5">
            <Crosshair className="h-3.5 w-3.5" /> Recenter
          </Button>
        }
      />

      <form onSubmit={runSearch} className="relative mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a junction, road or landmark in Bengaluru…"
            className="pl-9"
          />
          {results.length > 0 && (
            <ul className="absolute left-0 right-0 top-full z-[1000] mt-1 max-h-64 overflow-auto rounded-lg border border-border/60 bg-popover/95 shadow-xl backdrop-blur">
              {results.map((r, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => pickResult(r)}
                    className="flex w-full items-start gap-2 px-3 py-2 text-left text-xs hover:bg-primary/10"
                  >
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="line-clamp-2">{r.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Button type="submit" size="sm" disabled={searching} className="gap-1.5">
          {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          Search
        </Button>
      </form>

      <div ref={containerRef} className="h-[360px] w-full overflow-hidden rounded-xl border border-border/60" />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          Pinned: <span className="font-semibold text-foreground tabular-nums">{Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}</span>
        </span>
        <span>Tip: drag the pin for precise placement</span>
      </div>
    </section>
  );
}
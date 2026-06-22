export interface AnalyzeResponse {
  success: boolean;
  timestamp: string;
  incident: {
    latitude: number;
    longitude: number;
    zone: string;
    corridor: string;
    junction: string;
    road_block_reason?: string;
    event_cause?: string;
    event_type?: string;
  };
  detected_objects: {
    total: number;
    vehicles: number;
    people: number;
    road_blocks: number;
    illegal_parking: number;
    vehicle_types: Record<string, number>;
  };
  congestion: {
    level: string;
    score: number;
    percentage: number;
    emergency_level: string;
    scene_type: string;
    emergency_reasons: string[];
    crash_pairs_iou: number;
    crash_pairs_proximity: number;
    people_near_vehicles: number;
    emergency_vehicles_proxy: number;
    debris_objects: number;
  };
  predictions: {
    road_closure_required: boolean;
    closure_confidence: number;
    closure_risk_level: string;
    disruption_severity: string;
    disruption_confidence: string;
    expected_delay: string;
  };
  map: {
    heatmap_points: Array<[number, number, number]>;
  };
  dispatch?: {
    police_personnel_required: number;
    personnel_bracket: string;
    personnel_breakdown: {
      congestion_base: number;
      emergency_bonus: number;
      event_type_bonus: number;
      scale_bonus: number;
    };
    station_lookup_threshold: number;
    nearest_police_station: null | {
      name?: string;
      distance_km?: number;
      latitude?: number;
      longitude?: number;
      address?: string;
    };
  };
  recommendations: string[];
  _raw?: unknown;
}

export interface RoutingDirection {
  instruction: string;
  street: string;
  distance_meters: number;
  event_alert: string;
  event_weight: number;
}

export interface RoutingResponse {
  status: string;
  data: {
    blocked_road: string;
    edges_removed: number;
    target_main_road: string;
    distance_meters: number;
    estimated_travel_time_s: number;
    active_closures_on_path: number;
    directions: RoutingDirection[];
  };
}

export interface AnalyzeInput {
  file: File;
  latitude: number;
  longitude: number;
  zone: string;
  corridor: string;
  junction: string;
  event_cause: string;
}

const BASE_URL = "http://localhost:8000";
const ANALYZE_URL = `${BASE_URL}/analyze`;
const ROUTING_BASE = `${BASE_URL}/routing`;
const LOCAL_BYPASS_URL = `${ROUTING_BASE}/local-bypass`;
const EVENT_AWARE_URL = `${ROUTING_BASE}/event-aware-route`;
const NEAREST_ROAD_URL = `${ROUTING_BASE}/nearest-main-road`;

async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}, timeoutMs = 90_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

interface NewBackendResponse {
  success: boolean;
  analysis: {
    image_path: string;
    image_size: [number, number];
    inference_ms: number;
    total_objects: number;
    vehicles: number;
    people: number;
    road_blocks: number;
    illegal_parking: number;
    vehicle_types: Record<string, number>;
    congestion_level: string;
    lane_occupancy: number;
    emergency: {
      level: string;
      scene_type: string;
      reasons: string[];
      crash_pairs_iou?: number;
      crash_pairs_proximity?: number;
      people_near_vehicles?: number;
      emergency_vehicles_proxy?: number;
      debris_objects?: number;
    };
    congestion_score: number;
    lane_occupancy_pct: number;
  };
}

export async function analyzeIncident(input: AnalyzeInput): Promise<AnalyzeResponse> {
  const form = new FormData();
  form.append("file", input.file);
  form.append("road_block_reason", input.event_cause || "others");
  form.append("latitude", input.latitude.toString());
  form.append("longitude", input.longitude.toString());
  if (input.zone) form.append("zone", input.zone);
  if (input.corridor) form.append("corridor", input.corridor);
  if (input.junction) form.append("junction", input.junction);

  const res = await fetchWithTimeout(ANALYZE_URL, { method: "POST", body: form }, 120_000);
  if (!res.ok) {
    throw new Error(`Analyze API failed (${res.status})`);
  }

  const rawData = await res.json();

  if (!rawData.success) {
    throw new Error("API returned success: false");
  }

  return rawData as AnalyzeResponse;
}

// ── Routing API response types for alternative endpoints ─────────────────────
interface EventAwareRouteResponse {
  status: string;
  data: {
    origin_road?: string;
    destination_road?: string;
    distance_meters: number;
    estimated_travel_time_s: number;
    free_flow_travel_time_s?: number;
    delay_due_to_events_s?: number;
    active_closures_avoided?: number;
    active_closures_on_path: number;
    incident_edges?: unknown[];
    directions: RoutingDirection[];
  };
}

interface NearestRoadResult {
  target_main_road: string;
  distance_meters: number;
  estimated_travel_time_s: number;
  directions: RoutingDirection[];
  active_closures_on_path?: number;
}

interface NearestRoadResponse {
  status: string;
  data: {
    currently_on?: string;
    nearest_roads: NearestRoadResult[];
  };
}

function isUsableBypassRoute(data: RoutingResponse["data"] | undefined): data is RoutingResponse["data"] {
  if (!data) return false;
  const hasDistance = data.distance_meters > 0;
  const hasSteps = data.directions.some(
    (d) => d.distance_meters > 0 && !d.instruction.toLowerCase().startsWith("arrive at"),
  );
  return hasDistance && hasSteps;
}

// ── Adapt event-aware-route response → RoutingResponse ───────────────────────
function adaptEventAwareRoute(raw: EventAwareRouteResponse): RoutingResponse {
  return {
    status: raw.status ?? "ok",
    data: {
      blocked_road: raw.data.origin_road ?? "Incident location",
      edges_removed: raw.data.active_closures_avoided ?? 0,
      target_main_road: raw.data.destination_road ?? "Destination",
      distance_meters: raw.data.distance_meters ?? 0,
      estimated_travel_time_s: raw.data.estimated_travel_time_s ?? 0,
      active_closures_on_path: raw.data.active_closures_on_path ?? 0,
      directions: raw.data.directions ?? [],
    },
  };
}

// ── Adapt nearest-main-road response → RoutingResponse ───────────────────────
function adaptNearestRoad(raw: NearestRoadResponse): RoutingResponse {
  const top = raw.data?.nearest_roads?.find((r) => r.distance_meters > 0) ?? raw.data?.nearest_roads?.[0];
  if (!top) throw new Error("No nearby roads found");
  return {
    status: raw.status ?? "ok",
    data: {
      blocked_road: raw.data.currently_on ?? "Incident location",
      edges_removed: 0,
      target_main_road: top.target_main_road ?? "Nearest main road",
      distance_meters: top.distance_meters ?? 0,
      estimated_travel_time_s: top.estimated_travel_time_s ?? 0,
      active_closures_on_path: top.active_closures_on_path ?? 0,
      directions: top.directions ?? [],
    },
  };
}

/**
 * Fetch routing data with a 3-tier fallback:
 *   1. /api/routes/local-bypass           (primary — blocks accident road)
 *   2. /api/routes/nearest-main-road      (fallback — nearest safe main road)
 *   3. /api/routes/event-aware-route      (last resort — routed corridor)
 */
export async function fetchRouting(lat: number, lon: number): Promise<RoutingResponse> {
  const TIMEOUT = 60_000;
  const headers = { "Content-Type": "application/json" };

  // ── Attempt 1: local-bypass ──────────────────────────────────────────────
  try {
    const res = await fetchWithTimeout(
      LOCAL_BYPASS_URL,
      { method: "POST", headers, body: JSON.stringify({ accident_lat: lat, accident_lon: lon }) },
      TIMEOUT,
    );
    if (res.ok) {
      const payload = (await res.json()) as RoutingResponse;
      if (isUsableBypassRoute(payload.data)) {
        return payload;
      }
      console.warn("[routing] local-bypass returned zero-length route, trying nearest-main-road…");
    } else {
      // 4xx/5xx — fall through to next strategy
      console.warn(`[routing] local-bypass returned ${res.status}, trying nearest-main-road…`);
    }
  } catch (err) {
    console.warn("[routing] local-bypass failed:", err);
  }

  // ── Attempt 2: nearest-main-road (best bypass-style fallback) ───────────
  try {
    const res = await fetchWithTimeout(
      NEAREST_ROAD_URL,
      { method: "POST", headers, body: JSON.stringify({ current_lat: lat, current_lon: lon }) },
      TIMEOUT,
    );
    if (res.ok) {
      const raw = (await res.json()) as NearestRoadResponse;
      const adapted = adaptNearestRoad(raw);
      if (isUsableBypassRoute(adapted.data)) {
        return adapted;
      }
    } else {
      console.warn(`[routing] nearest-main-road returned ${res.status}, trying event-aware-route…`);
    }
  } catch (err) {
    console.warn("[routing] nearest-main-road failed:", err);
  }

  // ── Attempt 3: event-aware-route (offset destination as last resort) ───
  const destLat = lat + 0.012; // ~1.3 km north-east — a nearby main corridor
  const destLon = lon + 0.012;
  const res = await fetchWithTimeout(
    EVENT_AWARE_URL,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        origin_lat: lat,
        origin_lon: lon,
        destination_lat: destLat,
        destination_lon: destLon,
        avoid_active_closures: true,
      }),
    },
    TIMEOUT,
  );
  if (!res.ok) {
    throw new Error(`Routing API unavailable (all endpoints failed, last status: ${res.status})`);
  }
  const raw = (await res.json()) as EventAwareRouteResponse;
  return adaptEventAwareRoute(raw);
}

export function severityClass(level: string): "low" | "medium" | "high" | "critical" {
  const v = (level || "").toLowerCase();
  if (v.includes("crit")) return "critical";
  if (v.includes("high") || v.includes("heavy")) return "high";
  if (v.includes("med") || v.includes("mod")) return "medium";
  return "low";
}
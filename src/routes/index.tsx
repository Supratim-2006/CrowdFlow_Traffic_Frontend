import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import jsPDF from "jspdf";

import { DashboardLayout, type DashboardTab } from "@/components/dashboard/DashboardLayout";
import { TabContent } from "@/components/dashboard/TabContent";
import { type IncidentFormState } from "@/components/dashboard/IncidentInput";
import {
  analyzeIncident,
  fetchRouting,
  type AnalyzeResponse,
  type RoutingResponse,
} from "@/lib/traffic-api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Traffic Incident Management System" },
      {
        name: "description",
        content:
          "AI-powered traffic incident command center: detect vehicles, score congestion, predict closures, and compute diversion routes in real time.",
      },
      { property: "og:title", content: "Smart Traffic Incident Management System" },
      {
        property: "og:description",
        content: "Operational dashboard for AI-driven traffic incident response and routing.",
      },
    ],
  }),
  component: Dashboard,
});

const INITIAL_FORM: IncidentFormState = {
  latitude: "12.9716",
  longitude: "77.5946",
  zone: "East Zone 1",
  corridor: "Non-corridor",
  junction: "MG Road Junction",
  event_cause: "accident",
};

function Dashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("input");
  const [form, setForm] = useState<IncidentFormState>(INITIAL_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [routing, setRouting] = useState<RoutingResponse | null>(null);
  const [routingError, setRoutingError] = useState<string | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [routingLoading, setRoutingLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState<Set<WorkflowStep>>(new Set());
  const [active, setActive] = useState<WorkflowStep | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setCompleted((c) => new Set(c).add("upload"));
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFile = useCallback((f: File | null) => {
    setFile(f);
    if (!f) {
      setCompleted((c) => {
        const next = new Set(c);
        next.delete("upload");
        return next;
      });
    }
  }, []);

  const startProgress = useCallback(() => {
    setProgress(0);
    progressTimer.current = setInterval(() => {
      setProgress((p) => (p >= 92 ? p : p + Math.random() * 6));
    }, 350);
  }, []);

  const stopProgress = useCallback((final = 100) => {
    if (progressTimer.current) clearInterval(progressTimer.current);
    progressTimer.current = null;
    setProgress(final);
  }, []);

  const runAnalyze = useCallback(async () => {
    if (!file) {
      toast.error("Upload an incident image first.");
      return;
    }
    const lat = parseFloat(form.latitude);
    const lon = parseFloat(form.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      toast.error("Latitude and longitude must be valid numbers.");
      return;
    }
    setAnalyzing(true);
    setAnalysis(null);
    setRouting(null);
    setRoutingError(null);
    setCompleted(new Set<WorkflowStep>(["upload"]));
    setActive("detect");
    startProgress();

    try {
      const res = await analyzeIncident({
        file,
        latitude: lat,
        longitude: lon,
        zone: form.zone,
        corridor: form.corridor,
        junction: form.junction,
        event_cause: form.event_cause,
      });
      setAnalysis(res);
      stopProgress(100);
      setCompleted(
        new Set<WorkflowStep>(["upload", "detect", "congestion", "closure", "disruption", "recommend"]),
      );
      setActive("route");
      toast.success("Analysis complete", {
        description: `${res.congestion.level} congestion · ${res.predictions.expected_delay} delay`,
      });
      void runRouting(lat, lon);
    } catch (err) {
      stopProgress(0);
      setActive(null);
      const msg = err instanceof Error ? err.message : "Analysis failed";
      toast.error("Analysis failed", { description: msg });
    } finally {
      setAnalyzing(false);
    }
  }, [file, form, startProgress, stopProgress]);

  const runRouting = useCallback(async (lat?: number, lon?: number) => {
    const useLat = lat ?? parseFloat(form.latitude);
    const useLon = lon ?? parseFloat(form.longitude);
    if (Number.isNaN(useLat) || Number.isNaN(useLon)) return;
    setRoutingLoading(true);
    setRoutingError(null);
    try {
      const r = await fetchRouting(useLat, useLon);
      setRouting(r);
      setCompleted((c) => new Set(c).add("route"));
      setActive(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Routing failed";
      setRoutingError(msg);
      toast.error("Routing failed", { description: msg });
    } finally {
      setRoutingLoading(false);
    }
  }, [form.latitude, form.longitude]);

  const resetAll = useCallback(() => {
    setFile(null);
    setAnalysis(null);
    setRouting(null);
    setRoutingError(null);
    setCompleted(new Set());
    setActive(null);
    setProgress(0);
    setForm(INITIAL_FORM);
    setActiveTab("input");
    toast("Ready for a new incident");
  }, []);

  const downloadJson = useCallback(() => {
    if (!analysis) return;
    const payload = { analysis, routing };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `incident-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [analysis, routing]);

  const exportPdf = useCallback(() => {
    if (!analysis) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    let y = margin;
    const line = (txt: string, size = 11, bold = false) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(size);
      const wrapped = doc.splitTextToSize(txt, 515);
      doc.text(wrapped, margin, y);
      y += wrapped.length * (size + 3);
    };
    line("Smart Traffic Incident Report", 18, true);
    line(new Date(analysis.timestamp).toLocaleString(), 9);
    y += 8;
    line("Incident Location", 13, true);
    line(`Zone: ${analysis.incident.zone}`);
    line(`Corridor: ${analysis.incident.corridor}`);
    line(`Junction: ${analysis.incident.junction}`);
    line(`Coordinates: ${analysis.incident.latitude}, ${analysis.incident.longitude}`);
    y += 8;
    line("Detected Objects", 13, true);
    line(
      `Total: ${analysis.detected_objects.total} · Vehicles: ${analysis.detected_objects.vehicles} · People: ${analysis.detected_objects.people} · Road Blocks: ${analysis.detected_objects.road_blocks} · Illegal Parking: ${analysis.detected_objects.illegal_parking}`,
    );
    y += 6;
    line("Congestion & Emergency", 13, true);
    line(`Level: ${analysis.congestion.level} (${analysis.congestion.percentage}%)`);
    line(`Emergency: ${analysis.congestion.emergency_level} · Scene: ${analysis.congestion.scene_type}`);
    analysis.congestion.emergency_reasons.forEach((r) => line(`• ${r}`));
    y += 6;
    line("Predictions", 13, true);
    line(`Closure required: ${analysis.predictions.road_closure_required ? "Yes" : "No"} (${analysis.predictions.closure_risk_level} risk)`);
    line(`Expected delay: ${analysis.predictions.expected_delay} (${analysis.predictions.disruption_severity})`);
    y += 6;
    line("Recommendations", 13, true);
    analysis.recommendations.forEach((r) => line(`• ${r}`));
    if (analysis.dispatch) {
      y += 6;
      line("Police Dispatch", 13, true);
      line(
        `Personnel: ${analysis.dispatch.police_personnel_required} (${analysis.dispatch.personnel_bracket})`,
      );
      if (analysis.dispatch.nearest_police_station?.name) {
        line(`Nearest station: ${analysis.dispatch.nearest_police_station.name}`);
      }
    }
    if (analysis.incident.event_cause) {
      line(`Event cause: ${analysis.incident.event_cause} · Type: ${analysis.incident.event_type ?? "—"}`);
    }
    if (routing) {
      y += 6;
      line("Diversion Routing", 13, true);
      line(`Blocked: ${routing.data.blocked_road} → Target: ${routing.data.target_main_road}`);
      line(`Distance: ${(routing.data.distance_meters / 1000).toFixed(2)} km · Time: ${Math.round(routing.data.estimated_travel_time_s / 60)} min`);
      routing.data.directions.forEach((d, i) => line(`${i + 1}. ${d.instruction} (${d.street})`));
    }
    doc.save(`incident-report-${Date.now()}.pdf`);
  }, [analysis, routing]);

  const showResults = useMemo(() => !!analysis, [analysis]);

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      hasAnalysis={showResults}
      onReset={resetAll}
    >
      <TabContent
        activeTab={activeTab}
        form={form}
        setForm={setForm}
        file={file}
        previewUrl={previewUrl}
        onFile={handleFile}
        onAnalyze={runAnalyze}
        analyzing={analyzing}
        progress={progress}
        analysis={analysis}
        routing={routing}
        routingLoading={routingLoading}
        routingError={routingError}
        onRetryRouting={() => runRouting()}
        onExportPdf={exportPdf}
        onDownloadJson={downloadJson}
        onReset={resetAll}
      />
    </DashboardLayout>
  );
}

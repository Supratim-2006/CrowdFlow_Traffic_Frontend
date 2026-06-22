import { Suspense, lazy, memo, type ReactNode } from "react";
import { motion } from "framer-motion";
import type { DashboardTab } from "./DashboardLayout";
import type { AnalyzeResponse, RoutingResponse } from "@/lib/traffic-api";
import { LoadingOverlay } from "./LoadingOverlay";

// Lazy load heavy map components
const LocationPickerLazy = lazy(() => import("./LocationPicker").then((m) => ({ default: m.LocationPicker })));
const TrafficHeatmapLazy = lazy(() => import("./TrafficHeatmap").then((m) => ({ default: m.TrafficHeatmap })));
const DiversionRouteMapLazy = lazy(() => import("./DiversionRouteMap").then((m) => ({ default: m.DiversionRouteMap })));

// Direct imports for lighter components
import { IncidentInput, type IncidentFormState } from "./IncidentInput";
import { DetectedObjects } from "./DetectedObjects";
import { CongestionAnalysis } from "./CongestionAnalysis";
import { EmergencyDetection } from "./EmergencyDetection";
import { Predictions } from "./Predictions";
import { DispatchPanel } from "./DispatchPanel";
import { RoutingDiversions } from "./RoutingDiversions";
import { Recommendations } from "./Recommendations";
import { RawInsights } from "./RawInsights";
import { SuccessBanner } from "./SuccessBanner";

interface Props {
  activeTab: DashboardTab;
  form: IncidentFormState;
  setForm: (f: IncidentFormState) => void;
  file: File | null;
  previewUrl: string | null;
  onFile: (file: File | null) => void;
  onAnalyze: () => void;
  analyzing: boolean;
  progress: number;
  analysis: AnalyzeResponse | null;
  routing: RoutingResponse | null;
  routingLoading: boolean;
  routingError: string | null;
  onRetryRouting: () => void;
  onExportPdf: () => void;
  onDownloadJson: () => void;
  onReset: () => void;
}

function TabWrapper({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="h-full overflow-y-auto p-6"
    >
      <div className="mx-auto max-w-[1100px] space-y-6">
        {children}
      </div>
    </motion.div>
  );
}

function MapFallback() {
  return (
    <div className="flex h-[400px] items-center justify-center rounded-xl border border-border/60 bg-secondary/30">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Loading map…
      </div>
    </div>
  );
}

function TabContentRaw(props: Props) {
  const {
    activeTab,
    form,
    setForm,
    file,
    previewUrl,
    onFile,
    onAnalyze,
    analyzing,
    progress,
    analysis,
    routing,
    routingLoading,
    routingError,
    onRetryRouting,
    onExportPdf,
    onDownloadJson,
  } = props;

  const hasAnalysis = !!analysis;

  switch (activeTab) {
    case "input":
      return (
        <TabWrapper>
          {hasAnalysis && analysis && (
            <SuccessBanner
              data={analysis}
              onExportPdf={onExportPdf}
              onDownloadJson={onDownloadJson}
            />
          )}
          <Suspense fallback={<MapFallback />}>
            <LocationPickerLazy
              latitude={form.latitude}
              longitude={form.longitude}
              onPick={(lat, lon, label, zone) =>
                setForm({
                  ...form,
                  latitude: lat.toFixed(6),
                  longitude: lon.toFixed(6),
                  junction: label || form.junction,
                  zone: zone || form.zone,
                })
              }
            />
          </Suspense>
          <IncidentInput
            form={form}
            setForm={setForm}
            file={file}
            previewUrl={previewUrl}
            onFile={onFile}
            onAnalyze={onAnalyze}
            loading={analyzing}
          />
          {analyzing && <LoadingOverlay progress={progress} />}
        </TabWrapper>
      );

    case "objects":
      if (!analysis) return null;
      return (
        <TabWrapper>
          <DetectedObjects data={analysis} />
        </TabWrapper>
      );

    case "congestion":
      if (!analysis) return null;
      return (
        <TabWrapper>
          <CongestionAnalysis data={analysis} />
        </TabWrapper>
      );

    case "emergency":
      if (!analysis) return null;
      return (
        <TabWrapper>
          <EmergencyDetection data={analysis} />
        </TabWrapper>
      );

    case "predictions":
      if (!analysis) return null;
      return (
        <TabWrapper>
          <Predictions data={analysis} />
        </TabWrapper>
      );

    case "dispatch":
      if (!analysis) return null;
      return (
        <TabWrapper>
          <DispatchPanel data={analysis} />
        </TabWrapper>
      );

    case "heatmap":
      if (!analysis) return null;
      return (
        <TabWrapper>
          <Suspense fallback={<MapFallback />}>
            <TrafficHeatmapLazy data={analysis} />
          </Suspense>
        </TabWrapper>
      );

    case "routing":
      return (
        <TabWrapper>
          <RoutingDiversions
            routing={routing}
            loading={routingLoading}
            error={routingError}
            onRetry={onRetryRouting}
          />
          {analysis && (
            <Suspense fallback={<MapFallback />}>
              <DiversionRouteMapLazy
                latitude={parseFloat(form.latitude)}
                longitude={parseFloat(form.longitude)}
              />
            </Suspense>
          )}
        </TabWrapper>
      );

    case "recommendations":
      if (!analysis) return null;
      return (
        <TabWrapper>
          <Recommendations data={analysis} />
        </TabWrapper>
      );

    case "insights":
      return (
        <TabWrapper>
          <RawInsights analysis={analysis!} routing={routing} />
        </TabWrapper>
      );

    default:
      return null;
  }
}

export const TabContent = memo(TabContentRaw);

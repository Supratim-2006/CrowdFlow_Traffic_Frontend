import { motion } from "framer-motion";
import { CheckCircle2, Download, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnalyzeResponse } from "@/lib/traffic-api";

interface Props {
  data: AnalyzeResponse;
  onExportPdf: () => void;
  onDownloadJson: () => void;
}

export function SuccessBanner({ data, onExportPdf, onDownloadJson }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-status-low/40 bg-gradient-to-r from-status-low/20 via-emerald-500/10 to-transparent p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-status-low/20 text-status-low">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-status-low">Analysis Complete</p>
            <p className="mt-0.5 text-sm text-foreground/80">
              Congestion <b>{data.congestion.level}</b> · Emergency <b>{data.congestion.emergency_level}</b> · Expected Delay <b>{data.predictions.expected_delay}</b>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onDownloadJson} className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> JSON
          </Button>
          <Button size="sm" onClick={onExportPdf} className="gap-1.5 bg-[image:var(--gradient-primary)] text-primary-foreground">
            <FileDown className="h-3.5 w-3.5" /> Export PDF
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
import { useRef, useState, type DragEvent } from "react";
import { motion } from "framer-motion";
import { Upload, ImageIcon, Play, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface IncidentFormState {
  latitude: string;
  longitude: string;
  zone: string;
  corridor: string;
  junction: string;
  event_cause: string;
}

export const EVENT_CAUSES = [
  { value: "accident", label: "Accident" },
  { value: "vehicle_breakdown", label: "Vehicle Breakdown" },
  { value: "road_construction", label: "Road Construction" },
  { value: "waterlogging", label: "Waterlogging / Flooding" },
  { value: "fire", label: "Fire" },
  { value: "protest", label: "Protest / Rally" },
  { value: "vip_movement", label: "VIP Movement" },
  { value: "fallen_tree", label: "Fallen Tree / Debris" },
  { value: "signal_failure", label: "Signal Failure" },
  { value: "other", label: "Other" },
] as const;

interface Props {
  form: IncidentFormState;
  setForm: (f: IncidentFormState) => void;
  file: File | null;
  previewUrl: string | null;
  onFile: (file: File | null) => void;
  onAnalyze: () => void;
  loading: boolean;
}

export function IncidentInput({ form, setForm, file, previewUrl, onFile, onAnalyze, loading }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("image/")) onFile(f);
  };

  return (
    <section className="glass-panel relative overflow-hidden rounded-2xl p-6 lg:p-8">
      <div className="absolute inset-x-0 top-0 h-px bg-[image:var(--gradient-primary)]" />
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Section 01</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Incident Input</h2>
          <p className="mt-1 text-sm text-muted-foreground">Upload scene imagery and confirm dispatch coordinates.</p>
        </div>
        <span className="hidden rounded-full border border-border bg-secondary/40 px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground sm:inline-flex">
          Multipart / form-data
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "group relative grid min-h-[280px] cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed transition-all",
            dragging
              ? "border-primary bg-primary/10"
              : "border-border bg-secondary/30 hover:border-primary/60 hover:bg-secondary/50",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
          {previewUrl ? (
            <>
              <img src={previewUrl} alt="Incident preview" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-4">
                <div className="min-w-0 text-xs">
                  <p className="truncate font-medium text-foreground">{file?.name}</p>
                  <p className="text-muted-foreground">{file ? `${(file.size / 1024).toFixed(0)} KB` : ""}</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFile(null);
                  }}
                  className="gap-1.5"
                >
                  <X className="h-3.5 w-3.5" /> Remove
                </Button>
              </div>
              <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-60">
                <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" style={{ animation: "scan-line 3s linear infinite" }} />
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative z-10 flex flex-col items-center gap-3 px-6 text-center"
            >
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] shadow-[var(--glow-primary)]">
                <Upload className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-base font-semibold">Drop incident image here</p>
                <p className="mt-1 text-xs text-muted-foreground">PNG, JPG up to 20MB — or click to browse</p>
              </div>
              <Button variant="outline" size="sm" className="mt-1 gap-2">
                <ImageIcon className="h-3.5 w-3.5" /> Browse Files
              </Button>
            </motion.div>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <ReadonlyField label="Latitude" value={Number(form.latitude).toFixed(5)} icon={<MapPin className="h-3 w-3" />} />
            <ReadonlyField label="Longitude" value={Number(form.longitude).toFixed(5)} icon={<MapPin className="h-3 w-3" />} />
          </div>
          <p className="-mt-2 text-[11px] text-muted-foreground">
            Coordinates auto-fill from the map pin above.
          </p>
          <Field id="zone" label="Zone" value={form.zone} onChange={(v) => setForm({ ...form, zone: v })} />
          <Field id="corridor" label="Corridor" value={form.corridor} onChange={(v) => setForm({ ...form, corridor: v })} />
          <Field id="junction" label="Junction" value={form.junction} onChange={(v) => setForm({ ...form, junction: v })} />

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
              Event Cause <span className="text-status-critical">*</span>
            </Label>
            <Select
              value={form.event_cause}
              onValueChange={(v) => setForm({ ...form, event_cause: v })}
            >
              <SelectTrigger className="bg-secondary/40">
                <SelectValue placeholder="Select incident cause" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_CAUSES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={onAnalyze}
            disabled={loading || !file || !form.event_cause}
            className="h-12 w-full gap-2 bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--glow-primary)] hover:opacity-95"
          >
            <Play className="h-4 w-4" /> {loading ? "Analyzing…" : "Analyze Incident"}
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">
            Engages AI pipeline · object detection · congestion · diversion routing
          </p>
        </div>
      </div>
    </section>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  icon,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} className="bg-secondary/40" />
    </div>
  );
}

function ReadonlyField({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </Label>
      <div className="flex h-9 items-center rounded-md border border-border/60 bg-secondary/30 px-3 text-sm font-semibold tabular-nums">
        {value}
      </div>
    </div>
  );
}
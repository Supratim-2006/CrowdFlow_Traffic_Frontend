import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Braces } from "lucide-react";
import type { AnalyzeResponse, RoutingResponse } from "@/lib/traffic-api";
import { SectionHeader } from "./SectionHeader";

export function RawInsights({ analysis, routing }: { analysis: AnalyzeResponse; routing: RoutingResponse | null }) {
  const sections = [
    { key: "objects", label: "Object Detection", payload: analysis.detected_objects },
    { key: "congestion", label: "Congestion + Emergency", payload: analysis.congestion },
    { key: "predictions", label: "Prediction Probabilities", payload: analysis.predictions },
    { key: "routing", label: "Routing", payload: routing ?? { status: "unavailable" } },
  ];

  return (
    <section className="glass-panel rounded-2xl p-6 lg:p-8">
      <SectionHeader index="09" title="Raw AI Insights" subtitle="Inspect underlying model outputs." />
      <Accordion type="multiple" className="space-y-2">
        {sections.map((s) => (
          <AccordionItem key={s.key} value={s.key} className="rounded-xl border border-border/60 bg-secondary/30 px-4">
            <AccordionTrigger className="text-sm hover:no-underline">
              <span className="flex items-center gap-2"><Braces className="h-3.5 w-3.5 text-primary" /> {s.label}</span>
            </AccordionTrigger>
            <AccordionContent>
              <pre className="max-h-[320px] overflow-auto rounded-lg bg-background/60 p-3 text-[11px] leading-relaxed text-foreground/80">
                {JSON.stringify(s.payload, null, 2)}
              </pre>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
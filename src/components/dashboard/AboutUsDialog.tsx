import { Github, Linkedin, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const TEAM = [
  {
    name: "Supratim Kukri",
    role: "Electronics & Communication Engineering",
    institute: "National Institute of Technology Durgapur",
    batch: "Class of 2029",
    affiliation: "IEEE Student Branch, NIT Durgapur",
    linkedin: "https://www.linkedin.com/in/supratim-kukri-33871a29a/",
    github: "https://github.com/Supratim-2006",
    email: "supratimkukri19@gmail.com",
    initials: "SK",
  },
  {
    name: "Mahim Ali Sekh",
    role: "Computer Science & Engineering",
    institute: "National Institute of Technology Durgapur",
    batch: "Class of 2028",
    affiliation: "IEEE Student Branch, NIT Durgapur",
    linkedin: "https://www.linkedin.com/in/mahim-ali-sekh-6194b334a/",
    github: "https://github.com/MahimSekh-11",
    email: null,
    initials: "MAS",
  },
] as const;

interface AboutUsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutUsModal({ open, onOpenChange }: AboutUsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-teal-500/20 bg-[#06181a] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">About Us</DialogTitle>
          <DialogDescription className="text-slate-400">
            CrowdFlow is built by students at NIT Durgapur, combining computer vision, traffic
            analytics, and smart-city routing to improve urban incident response.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          {TEAM.map((member) => (
            <article
              key={member.name}
              className="rounded-xl border border-teal-500/15 bg-teal-500/5 p-4"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 text-xs font-bold text-white">
                  {member.initials}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{member.name}</h3>
                  <p className="text-[11px] text-teal-400">{member.role}</p>
                </div>
              </div>

              <dl className="space-y-1.5 text-xs text-slate-300">
                <div>
                  <dt className="sr-only">Institute</dt>
                  <dd>{member.institute}</dd>
                </div>
                <div>
                  <dt className="sr-only">Batch</dt>
                  <dd className="text-slate-400">{member.batch}</dd>
                </div>
                <div>
                  <dt className="sr-only">Affiliation</dt>
                  <dd className="text-teal-300/90">{member.affiliation}</dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/20 bg-[#041618] px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 transition-colors hover:border-teal-500/40 hover:text-teal-300"
                >
                  <Linkedin className="h-3.5 w-3.5" />
                  LinkedIn
                </a>
                <a
                  href={member.github}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/20 bg-[#041618] px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 transition-colors hover:border-teal-500/40 hover:text-teal-300"
                >
                  <Github className="h-3.5 w-3.5" />
                  GitHub
                </a>
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/20 bg-[#041618] px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 transition-colors hover:border-teal-500/40 hover:text-teal-300"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

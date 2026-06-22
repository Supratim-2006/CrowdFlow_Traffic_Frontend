import { useState, type ReactNode, useEffect, useRef } from "react";
import {
  Activity,
  ChevronDown,
  Instagram,
  Linkedin,
  Twitter,
  Github,
  Send,
  Globe2,
  Menu,
  X,
  RotateCcw,
  ShieldCheck,
  Upload,
  Eye,
  Gauge,
  Siren,
  Compass,
  Map,
  Brain,
  ShieldAlert,
  Lightbulb,
  FileJson,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AboutUsModal } from "@/components/dashboard/AboutUsDialog";
import { cn } from "@/lib/utils";

export type DashboardTab =
  | "input"
  | "objects"
  | "congestion"
  | "emergency"
  | "predictions"
  | "dispatch"
  | "heatmap"
  | "routing"
  | "recommendations"
  | "insights";

interface Props {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  hasAnalysis: boolean;
  onReset: () => void;
  children: ReactNode;
}

export function DashboardLayout({
  activeTab,
  onTabChange,
  hasAnalysis,
  onReset,
  children,
}: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const primaryTabs: { id: DashboardTab; label: string; icon: typeof Upload }[] = [
    { id: "input", label: "Control Center", icon: Upload },
    { id: "objects", label: "Detected Objects", icon: Eye },
    { id: "congestion", label: "Congestion", icon: Gauge },
    { id: "emergency", label: "Emergency", icon: Siren },
    { id: "routing", label: "Routing", icon: Compass },
  ];

  const dropdownTabs: { id: DashboardTab; label: string; icon: typeof Brain }[] = [
    { id: "heatmap", label: "Traffic Heatmap", icon: Map },
    { id: "predictions", label: "Predictions", icon: Brain },
    { id: "dispatch", label: "Dispatch Panel", icon: ShieldAlert },
    { id: "recommendations", label: "Recommendations", icon: Lightbulb },
    { id: "insights", label: "Raw Insights", icon: FileJson },
  ];

  const isDropdownActive = dropdownTabs.some((t) => t.id === activeTab);

  const openAbout = () => {
    setAboutOpen(true);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-all duration-300">
      {/* Modern Pill-Shaped Navbar */}
      <header className="sticky top-0 z-50 w-full py-4 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-full border border-teal-500/30 bg-gradient-to-r from-[#031314]/50 via-[#082022]/50 to-[#031314]/50 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex items-center justify-between gap-4">
               
              {/* Logo with Tagline */}
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 shadow-[0_0_12px_rgba(20,184,166,0.3)]">
                    <Activity className="h-4.5 w-4.5 text-white animate-pulse" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-white">CrowdFlow</div>
                    <div className="text-xs font-bold text-teal-400">Traffic</div>
                  </div>
                </div>
                <div className="w-px h-6 bg-slate-700/50"></div>
              </div>

              {/* Center Navigation - Desktop Only */}
              <nav className="hidden lg:flex items-center justify-center gap-4 sm:gap-6 flex-1">
                {primaryTabs.map((tab) => {
                  const disabled = tab.id !== "input" && !hasAnalysis;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => !disabled && onTabChange(tab.id)}
                      disabled={disabled}
                      className={cn(
                        "text-sm sm:text-base font-semibold transition-colors whitespace-nowrap px-2",
                        isActive
                          ? "text-teal-300"
                          : "text-slate-400 hover:text-slate-300",
                        disabled && "opacity-40 cursor-not-allowed hover:text-slate-400"
                      )}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </nav>

              {/* Right Side Actions */}
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {/* Dropdown */}
                <div className="hidden lg:block relative" ref={dropdownRef}>
                  <button
                    disabled={!hasAnalysis}
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={cn(
                      "flex items-center gap-1 text-sm sm:text-base font-semibold transition-colors px-2",
                      isDropdownActive
                        ? "text-teal-300"
                        : "text-slate-400 hover:text-slate-300",
                      !hasAnalysis && "opacity-40 cursor-not-allowed hover:text-slate-400"
                    )}
                  >
                    <span>More</span>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", dropdownOpen && "rotate-180")} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-44 origin-top-right rounded-lg border border-teal-500/20 bg-[#06181a] p-2 shadow-2xl backdrop-blur-2xl">
                      {dropdownTabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => {
                              onTabChange(tab.id);
                              setDropdownOpen(false);
                            }}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors",
                              isActive
                                ? "bg-teal-500/20 text-teal-300"
                                : "text-slate-400 hover:bg-teal-500/10 hover:text-white"
                            )}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* About Us Button */}
                <button
                  onClick={openAbout}
                  className="hidden sm:inline-flex items-center text-sm sm:text-base font-semibold text-slate-400 hover:text-slate-300 transition-colors whitespace-nowrap px-2"
                >
                  About
                </button>

                {/* Divider */}
                <div className="hidden sm:block w-px h-5 bg-slate-700/50"></div>

                {/* Status or Reset */}
                {hasAnalysis ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReset}
                    className="h-8 px-2 sm:px-3 text-sm sm:text-base font-semibold text-teal-400 hover:bg-teal-500/10 hover:text-teal-300"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-teal-400 whitespace-nowrap">
                    <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                    Live
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 lg:hidden text-slate-400 hover:text-white"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>

            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="mx-auto max-w-6xl mt-2">
            <div className="rounded-lg border border-teal-500/20 bg-[#06181a] backdrop-blur-xl p-2 space-y-1 animate-in slide-in-from-top">
              {[...primaryTabs, ...dropdownTabs].map((tab) => {
                const disabled = tab.id !== "input" && !hasAnalysis;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    disabled={disabled}
                    onClick={() => {
                      onTabChange(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                      isActive
                        ? "bg-teal-500/20 text-teal-300"
                        : "text-slate-400 hover:bg-teal-500/10 hover:text-white",
                      disabled && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      <AboutUsModal open={aboutOpen} onOpenChange={setAboutOpen} />

      {/* Main content */}
      <main className="flex-1">
        {/* Content area */}
        <div className="py-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/30 bg-[#030d0e] text-slate-400 py-12">
        <div className="mx-auto max-w-[1280px] px-6 sm:px-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">

            {/* Column 1: Logo and Pitch */}
            <div className="space-y-4 lg:col-span-2">
              <div className="flex items-center gap-3">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-teal-400 to-emerald-600 shadow-[0_0_12px_rgba(20,184,166,0.25)]">
                  <Activity className="h-4.5 w-4.5 text-white" />
                </div>
                <span className="text-base font-extrabold tracking-tight text-white">
                  CrowdFlow
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                AI-powered real-time traffic incident command center. We process live video streams to count vehicles, evaluate congestion metrics, detect road obstructions, and formulate optimized diversion routes instantly.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-teal-400 font-semibold">
                <ShieldCheck className="h-4 w-4" />
                SECURE SSL API DEPLOYMENT
              </div>
            </div>

            {/* Column 2: Dashboard Sections */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
                CrowdFlow
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <button onClick={() => onTabChange("input")} className="hover:text-teal-400 transition-colors">
                    Control Center
                  </button>
                </li>
                <li>
                  <button onClick={() => hasAnalysis && onTabChange("heatmap")} disabled={!hasAnalysis} className="hover:text-teal-400 transition-colors text-left disabled:opacity-50 disabled:hover:text-slate-400">
                    Traffic Heatmap
                  </button>
                </li>
                <li>
                  <button onClick={() => hasAnalysis && onTabChange("routing")} disabled={!hasAnalysis} className="hover:text-teal-400 transition-colors text-left disabled:opacity-50 disabled:hover:text-slate-400">
                    Diversion Routing
                  </button>
                </li>
                <li>
                  <a href="#status" className="hover:text-teal-400 transition-colors flex items-center gap-1.5">
                    System Status
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-status-low animate-pulse" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: About Us */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
                About Us
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Built by Supratim Kukri (ECE, 2029) and Mahim Ali Sekh (CSE, 2028) at NIT Durgapur,
                members of the IEEE Student Branch.
              </p>
              <button
                type="button"
                onClick={openAbout}
                className="text-xs font-semibold text-teal-400 transition-colors hover:text-teal-300"
              >
                Meet the team →
              </button>
            </div>

          </div>

          {/* Social Links & Copyright */}
          <div className="mt-12 pt-8 border-t border-teal-950/50 flex flex-col sm:flex-row items-center justify-between gap-4">

            <p className="text-[11px] text-slate-500 text-center sm:text-left">
              &copy; 2026 CrowdFlow. All rights reserved. Powered by Hugging Face Spaces & FastAPI.
            </p>

            <div className="flex items-center gap-4">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-teal-400 transition-colors" title="GitHub">
                <Github className="h-4.5 w-4.5" />
              </a>
            </div>

          </div>
        </div>
      </footer>
    </div>
  );
}

import React from "react";
import { 
  FileText, Upload, Cpu, GitCompare, AlertCircle, Sliders, Layers, 
  ArrowRight, CheckCircle2, Shield, Zap, RefreshCw, Sparkles, ChevronRight 
} from "lucide-react";
import { Page } from "./Sidebar";

interface HomePageProps {
  onNavigate: (page: Page) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const tools = [
    {
      id: "routing-generator",
      title: "Routing Generator",
      description: "Instantly parse .snap files and generate professional PDF routing documentation and Excel spreadsheets.",
      icon: FileText,
      color: "from-blue-500 to-indigo-600",
      badge: "Popular",
      features: ["PDF Routing Tables", "Excel Export", "Stagebox Labels"],
      actionPage: "uploader" as Page,
    },
    {
      id: "signal-flow",
      title: "Signal Flow Diagram",
      description: "Interactive visualization showing how audio flows through inputs, channels, buses, matrices, and outputs.",
      icon: Cpu,
      color: "from-indigo-500 to-violet-600",
      badge: "Interactive",
      features: ["Color-coded nodes", "Expandable routing", "Hover inspection"],
      actionPage: "uploader" as Page,
    },
    {
      id: "routing-diff",
      title: "Routing Diff Tool",
      description: "Compare two WING snapshots side-by-side to instantly identify routing, source, and level modifications.",
      icon: GitCompare,
      color: "from-violet-500 to-purple-600",
      badge: "Diff",
      features: ["Side-by-side comparison", "Added/Removed detection", "Level change highlighting"],
      actionPage: "routing-diff" as Page,
    },
    {
      id: "snapshot-linter",
      title: "Snapshot Linter",
      description: "Rule-based analysis engine that detects configuration errors such as unpatched channels and muted routed buses.",
      icon: AlertCircle,
      color: "from-amber-500 to-orange-600",
      badge: "New",
      features: ["8 diagnostic rules", "Severity levels", "Best practice warnings"],
      actionPage: "uploader" as Page,
    },
    {
      id: "source-management",
      title: "Source Management",
      description: "Remap input gain, phantom power, and stereo modes across I/O groups and download modified .snap files.",
      icon: Sliders,
      color: "from-emerald-500 to-teal-600",
      badge: "",
      features: ["Gain remapping", "Stereo mode config", "Valid .snap export"],
      actionPage: "uploader" as Page,
    },
    {
      id: "multi-mixer",
      title: "Multi-Mixer Routing",
      description: "Coordinate routing across multiple WING consoles in networked stage and broadcast environments.",
      icon: Layers,
      color: "from-rose-500 to-pink-600",
      badge: "Pro",
      features: ["Console linking", "Stagebox mapping", "Network redundancy"],
      actionPage: "multi-mixer" as Page,
    },
  ];

  const quickStartSteps = [
    {
      step: "01",
      title: "Export .snap File",
      description: "Save a snapshot directly from your Behringer WING console or WING-Edit software.",
    },
    {
      step: "02",
      title: "Upload & Parse",
      description: "Drag and drop your snapshot into Wing Tools for instant parsing and structural validation.",
    },
    {
      step: "03",
      title: "Analyze & Visualize",
      description: "Examine signal flow, inspect routing tables, run the linter, or compare snapshot differences.",
    },
    {
      step: "04",
      title: "Export Documentation",
      description: "Download professional PDF routing reports, Excel workbooks, or modified console snapshots.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white py-24 px-6 lg:px-12">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-5xl mx-auto relative z-10 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-sm font-medium text-indigo-300">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Professional Behringer WING Routing Suite</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Master Your WING Routing <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-purple-400 bg-clip-text text-transparent">
              Before You're On-Site
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Upload your WING snapshot files to instantly generate professional documentation, interactive signal flow diagrams, linting analysis, and routing diffs.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => onNavigate("uploader")}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:scale-105 transition-all flex items-center justify-center gap-3 group"
            >
              <Upload className="w-5 h-5" />
              Upload Snapshot
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate("manual")}
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-white font-semibold backdrop-blur-sm transition-all"
            >
              Read User Manual
            </button>
          </div>

          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Supports WING snapshot.9 format</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant PDF & XLSX export</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Secure client-side parsing</span>
          </div>
        </div>
      </section>

      {/* Tools Grid Section */}
      <section className="py-20 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Powerful Tools for Audio Engineers
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Everything you need to document, analyze, and optimize your Behringer WING console configurations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                onClick={() => onNavigate(tool.actionPage)}
                className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-white shadow-md`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    {tool.badge && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                        {tool.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {tool.title}
                  </h3>

                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                    {tool.description}
                  </p>
                </div>

                <div>
                  <ul className="space-y-2 mb-6 border-t border-slate-100 dark:border-slate-800 pt-4">
                    {tool.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                    <span>Open Tool</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Start Section */}
      <section className="bg-slate-100 dark:bg-slate-900/50 py-20 px-6 lg:px-12 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              How It Works
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Get started with your WING snapshots in four simple steps.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {quickStartSteps.map((item, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
                <span className="text-4xl font-extrabold text-indigo-600/20 dark:text-indigo-400/20 absolute top-4 right-6">
                  {item.step}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 pt-4">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 lg:px-12 text-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <p>© {new Date().getFullYear()} Wing Tools. Built for professional Behringer WING sound engineers.</p>
      </footer>
    </div>
  );
}

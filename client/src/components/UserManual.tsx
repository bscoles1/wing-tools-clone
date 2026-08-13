import React, { useEffect, useRef } from "react";
import { 
  BookOpen, FolderOpen, Layers, FileText, Cpu, GitCompare, Settings, 
  AlertCircle, Sliders, Sparkles, UserCheck, MessageSquare, CheckSquare, 
  ChevronRight, ArrowRight, ExternalLink 
} from "lucide-react";
import { Page } from "./Sidebar";

interface UserManualProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export function UserManual({ currentPage, onNavigate }: UserManualProps) {
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const sectionIdMap: Record<string, string> = {
    "getting-started": "getting-started-section",
    "my-files": "my-files-section",
    "projects": "projects-section",
    "routing-generator": "routing-generator-section",
    "signal-flow": "signal-flow-section",
    "routing-diff": "routing-diff-section",
    "account-management": "account-management-section",
    "snapshot-linter": "snapshot-linter-section",
    "source-tags": "source-tags-section",
    "multi-mixer": "multi-mixer-section",
    "source-management": "source-management-section",
    "snapshot-generator": "snapshot-generator-section",
    "referrals": "referrals-section",
    "wingpt": "wingpt-section",
    "documenting-routing": "documenting-routing-section",
    "pre-show-checklist": "pre-show-checklist-section",
  };

  const sectionLabels: Record<string, string> = {
    manual: "User Manual Overview",
    "getting-started": "Getting Started",
    "my-files": "My Files & Snapshots",
    "projects": "Projects & Workspaces",
    "routing-generator": "Routing Generator",
    "signal-flow": "Signal Flow Diagram",
    "routing-diff": "Routing Diff",
    "account-management": "Account Management",
    "snapshot-linter": "Snapshot Linter",
    "source-tags": "Source & Tag System",
    "multi-mixer": "Multi-Mixer Routing",
    "source-management": "Source Management",
    "snapshot-generator": "Snapshot Generator",
    "referrals": "Referral Program",
    "wingpt": "WinGPT Assistant",
    "documenting-routing": "Documenting Routing Guide",
    "pre-show-checklist": "Pre-Show Checklist Guide",
  };

  useEffect(() => {
    const domId = sectionIdMap[currentPage];
    if (domId && sectionRefs.current[domId]) {
      sectionRefs.current[domId]?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage]);

  const docCards = [
    { id: "getting-started", title: "Getting Started", description: "Learn how to export snapshots from your Behringer WING console and upload them.", icon: BookOpen },
    { id: "my-files", title: "My Files & Snapshots", description: "Organize, view, and manage your uploaded .snap files securely in your dashboard.", icon: FolderOpen },
    { id: "projects", title: "Projects & Workspaces", description: "Group snapshots by venue, tour, or client for streamlined audio engineering workflows.", icon: Layers },
    { id: "routing-generator", title: "Routing Generator", description: "Generate comprehensive PDF routing tables and Excel workbooks automatically.", icon: FileText },
    { id: "signal-flow", title: "Signal Flow Diagram", description: "Visualize audio routing paths across inputs, channels, buses, matrices, and outputs.", icon: Cpu },
    { id: "routing-diff", title: "Routing Diff", description: "Compare two snapshots side-by-side to highlight routing and level modifications.", icon: GitCompare },
    { id: "account-management", title: "Account Management", description: "Manage your profile, preferences, and subscription tier settings.", icon: Settings },
    { id: "snapshot-linter", title: "Snapshot Linter", description: "Run rule-based diagnostics to catch unpatched channels and routing errors.", icon: AlertCircle },
    { id: "source-tags", title: "Source & Tag System", description: "Tag and categorize input sources for fast identification during live mixing.", icon: Sliders },
    { id: "multi-mixer", title: "Multi-Mixer Routing", description: "Coordinate routing across multiple networked WING consoles.", icon: Layers },
    { id: "source-management", title: "Source Management", description: "Remap input gains, phantom power, and stereo modes with modified .snap export.", icon: Settings },
    { id: "snapshot-generator", title: "Snapshot Generator", description: "Build clean baseline snapshots with standardized channel naming conventions.", icon: Sparkles },
    { id: "referrals", title: "Referral Program", description: "Invite fellow audio engineers and earn credits for professional features.", icon: UserCheck },
    { id: "wingpt", title: "WinGPT Assistant", description: "Ask routing questions and get instant AI-powered guidance on WING configurations.", icon: MessageSquare },
  ];

  const guideCards = [
    { id: "documenting-routing", title: "Documenting Routing Best Practices", description: "A comprehensive guide to keeping clean, professional routing documentation for touring engineers.", icon: FileText },
    { id: "pre-show-checklist", title: "Pre-Show Routing Checklist", description: "Essential verification steps before soundcheck to prevent patch and stagebox errors.", icon: CheckSquare },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
        <button onClick={() => onNavigate("home")} className="hover:text-indigo-600 transition-colors">Home</button>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-900 dark:text-white font-semibold">{sectionLabels[currentPage] || "User Manual"}</span>
      </div>

      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Wing Tools User Manual
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
          Comprehensive documentation, guides, and feature references for the Behringer WING digital mixing console routing suite.
        </p>
      </div>

      {/* Overview Cards Grid */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Documentation Sections</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {docCards.map((card) => {
            const Icon = card.icon;
            const isHighlighted = currentPage === card.id;
            return (
              <div
                key={card.id}
                ref={(el) => { sectionRefs.current[sectionIdMap[card.id] || ""] = el; }}
                id={sectionIdMap[card.id]}
                onClick={() => onNavigate(card.id as Page)}
                className={`p-6 rounded-2xl border bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-start gap-4 ${
                  isHighlighted
                    ? "border-indigo-500 ring-2 ring-indigo-100 dark:ring-indigo-950"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{card.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{card.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Guides Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Professional Guides</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {guideCards.map((guide) => {
            const Icon = guide.icon;
            const isHighlighted = currentPage === guide.id;
            return (
              <div
                key={guide.id}
                ref={(el) => { sectionRefs.current[sectionIdMap[guide.id] || ""] = el; }}
                id={sectionIdMap[guide.id]}
                onClick={() => onNavigate(guide.id as Page)}
                className={`p-6 rounded-2xl border bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-start gap-4 ${
                  isHighlighted
                    ? "border-indigo-500 ring-2 ring-indigo-100 dark:ring-indigo-950"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{guide.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{guide.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Call to Action Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white p-8 md:p-12 text-center space-y-6 shadow-xl shadow-indigo-500/20">
        <h2 className="text-3xl font-bold">Ready to analyze your WING snapshot?</h2>
        <p className="text-indigo-100 max-w-xl mx-auto">
          Upload your .snap file now to test our routing generator, signal flow visualizer, and snapshot linter.
        </p>
        <div>
          <button
            onClick={() => onNavigate("uploader")}
            className="px-8 py-4 rounded-xl bg-white text-indigo-700 font-bold hover:bg-indigo-50 shadow-lg transition-all inline-flex items-center gap-2"
          >
            Open Uploader & App Tools
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

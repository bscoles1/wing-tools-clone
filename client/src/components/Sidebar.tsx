import React from "react";
import { 
  FileText, Home, Upload, GitCompare, AlertCircle, Sliders,
  BookOpen, Cpu, Mail, FolderOpen,
  Settings, CheckSquare, Sparkles, Network
} from "lucide-react";

export type Page =
  | "home"
  | "uploader"
  | "manual"
  | "getting-started"
  | "my-files"
  | "projects"
  | "routing-generator"
  | "signal-flow"
  | "routing-diff"
  | "account-management"
  | "audio-engineer-guide"
  | "reference"
  | "snapshot-linter"
  | "source-tags"
  | "multi-mixer"
  | "source-management"
  | "snapshot-generator"
  | "referrals"
  | "wingpt"
  | "protocol-explorer"
  | "documenting-routing"
  | "pre-show-checklist";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ currentPage, onNavigate, isOpen, onClose }: SidebarProps) {
  const docSections = [
    { id: "getting-started", label: "Getting Started", icon: BookOpen },
    { id: "my-files", label: "My Files & Snapshots", icon: FolderOpen },
    { id: "routing-generator", label: "Routing Generator", icon: FileText },
    { id: "signal-flow", label: "Signal Flow Diagram", icon: Cpu },
    { id: "routing-diff", label: "Routing Diff", icon: GitCompare },
    { id: "account-management", label: "Account Management", icon: Settings },
    { id: "snapshot-linter", label: "Snapshot Linter", icon: AlertCircle },
    { id: "source-tags", label: "Source & Tag System", icon: Sliders },
    { id: "source-management", label: "Source Management", icon: Settings },
    { id: "snapshot-generator", label: "Snapshot Generator", icon: Sparkles },
    { id: "protocol-explorer", label: "Remote Protocol Explorer", icon: Network },
  ];

  const guides = [
    { id: "documenting-routing", label: "Documenting Routing", icon: FileText },
    { id: "pre-show-checklist", label: "Pre-Show Checklist", icon: CheckSquare },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800
        flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Logo / Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button 
            onClick={() => { onNavigate("home"); onClose(); }}
            className="flex items-center gap-3 text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">Wing Tools</h1>
              <p className="text-xs text-slate-500 font-medium">WING Routing Suite</p>
            </div>
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {/* Main Navigation */}
          <div className="space-y-1">
            <button
              onClick={() => { onNavigate("home"); onClose(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                currentPage === "home"
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Home className="w-4 h-4" />
              Home
            </button>

            <button
              onClick={() => { onNavigate("uploader"); onClose(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                currentPage === "uploader"
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload & App Tools
            </button>

            <button
              onClick={() => { onNavigate("manual"); onClose(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                currentPage === "manual"
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              User Manual
            </button>
          </div>

          {/* Documentation Sections */}
          <div>
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Documentation Sections
            </p>
            <div className="space-y-1">
              {docSections.map((section) => {
                const Icon = section.icon;
                const isActive = currentPage === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => { onNavigate(section.id as Page); onClose(); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{section.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Guides */}
          <div>
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Guides
            </p>
            <div className="space-y-1">
              {guides.map((guide) => {
                const Icon = guide.icon;
                const isActive = currentPage === guide.id;
                return (
                  <button
                    key={guide.id}
                    onClick={() => { onNavigate(guide.id as Page); onClose(); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{guide.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Support Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <Mail className="w-4 h-4 text-slate-400" />
            <span>Support: support@wingtools.dev</span>
          </div>
        </div>
      </aside>
    </>
  );
}

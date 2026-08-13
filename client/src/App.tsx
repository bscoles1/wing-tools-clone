import React, { useState } from "react";
import { Sidebar, Page } from "@/components/Sidebar";
import { HomePage } from "@/components/HomePage";
import { UserManual } from "@/components/UserManual";
import Uploader from "@/pages/Uploader";
import Pricing from "@/pages/Pricing";
import SnapshotDetail from "@/pages/SnapshotDetail";
import SignalFlowDiagram from "@/pages/SignalFlowDiagram";
import RoutingDiff from "@/pages/RoutingDiff";
import SnapshotLinter from "@/pages/SnapshotLinter";
import SourceManagement from "@/pages/SourceManagement";
import ProtocolExplorer from "@/pages/ProtocolExplorer";
import SnapshotGenerator from "@/pages/SnapshotGenerator";
import NotFound from "@/pages/NotFound";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { Menu, X } from "lucide-react";
import { Route, Switch, useLocation } from "wouter";

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [location, setLocation] = useLocation();

  // Sync wouter path with sidebar page state if needed
  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    if (page === "home") {
      setLocation("/");
    } else if (page === "uploader") {
      setLocation("/uploader");
    } else if (page === "routing-diff") {
      setLocation("/routing-diff");
    } else if (page === "protocol-explorer") {
      setLocation("/protocol-explorer");
    } else if (page === "snapshot-generator") {
      setLocation("/snapshot-generator");
    } else {
      setLocation("/manual");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Mobile Header */}
      <header className="lg:hidden h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 flex items-center justify-between sticky top-0 z-40">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <span className="font-bold text-slate-900 dark:text-white">Wing Tools</span>
        <div className="w-10" />
      </header>

      <div className="flex-1 flex">
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 lg:pl-72 flex flex-col min-w-0">
          <Switch>
            <Route path={"/"}>
              {() => <HomePage onNavigate={handleNavigate} />}
            </Route>
            <Route path={"/uploader"} component={Uploader} />
            <Route path={"/pricing"} component={Pricing} />
            <Route path={"/snapshot/:id"} component={SnapshotDetail} />
            <Route path={"/snapshot/:id/signal-flow"} component={SignalFlowDiagram} />
            <Route path={"/routing-diff"} component={RoutingDiff} />
            <Route path={"/protocol-explorer"} component={ProtocolExplorer} />
            <Route path={"/snapshot-generator"} component={SnapshotGenerator} />
            <Route path={"/snapshot/:id/linter"} component={SnapshotLinter} />
            <Route path={"/snapshot/:id/source-management"} component={SourceManagement} />
            <Route path={"/manual"}>
              {() => <UserManual currentPage={currentPage} onNavigate={handleNavigate} />}
            </Route>
            <Route path={"/404"} component={NotFound} />
            <Route>
              {() => {
                // If route matches a documentation section, render UserManual
                if (
                  [
                    "getting-started", "my-files", "projects", "routing-generator",
                    "signal-flow", "routing-diff", "account-management", "snapshot-linter",
                    "source-tags", "multi-mixer", "source-management", "snapshot-generator",
                    "referrals", "wingpt", "protocol-explorer", "documenting-routing", "pre-show-checklist"
                  ].includes(location.replace("/", ""))
                ) {
                  return <UserManual currentPage={location.replace("/", "") as Page} onNavigate={handleNavigate} />;
                }
                return <NotFound />;
              }}
            </Route>
          </Switch>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

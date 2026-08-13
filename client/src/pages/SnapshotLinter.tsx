import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AffectedSignalList } from "@/components/AffectedSignalList";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { LintIssue, lintSnapshot } from "@/lib/snapshotLinter";
import { getLintRemediation } from "@/lib/linterRemediation";
import { Loader2, AlertTriangle, AlertCircle, CheckCircle, Info, Wrench } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function SnapshotLinter() {
  const { isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: true, redirectPath: "/" });
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const snapshotId = parseInt(params.id, 10);

  const [issues, setIssues] = useState<LintIssue[]>([]);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { data: snapshot, isLoading: isSnapshotLoading, error: snapshotError } = trpc.snapshot.getSnapshot.useQuery(
    { snapshotId },
    { enabled: isAuthenticated && !isNaN(snapshotId) }
  );

  useEffect(() => {
    if (isNaN(snapshotId)) setLocation("/404");
  }, [snapshotId, setLocation]);

  useEffect(() => {
    if (snapshotError) {
      toast.error(snapshotError.message);
      setLocation("/uploader");
    }
  }, [snapshotError, setLocation]);

  const runAnalysis = useCallback((parsedSnapshot: unknown, announce = true) => {
    setIsAnalyzing(true);
    try {
      const foundIssues = lintSnapshot(parsedSnapshot);
      setIssues(foundIssues);
      setHasAnalyzed(true);
      requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));

      if (announce && foundIssues.length === 0) {
        toast.success("No issues found! Your configuration looks good.");
      } else if (announce) {
        const errorCount = foundIssues.filter((issue) => issue.severity === "error").length;
        const warningCount = foundIssues.filter((issue) => issue.severity === "warning").length;
        toast.success(`Analysis complete: ${errorCount} error(s), ${warningCount} warning(s)`);
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      toast.error("Failed to analyze snapshot");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  useEffect(() => {
    if (!snapshot?.parsed || hasAnalyzed) return;
    runAnalysis(snapshot.parsed, false);
  }, [snapshot?.id, snapshot?.parsed, hasAnalyzed, runAnalysis]);

  if (loading || !isAuthenticated || isNaN(snapshotId)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" aria-label="Loading snapshot" />
      </div>
    );
  }

  if (isSnapshotLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-slate-700 dark:text-slate-300">Loading snapshot...</span>
      </div>
    );
  }

  if (snapshotError || !snapshot || !snapshot.parsed) {
    return null;
  }

  const handleAnalyze = () => runAnalysis(snapshot.parsed);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "error":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
      case "info":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
      default:
        return "bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800";
    }
  };

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const infoCount = issues.filter((i) => i.severity === "info").length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Snapshot Linter</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Analyze your snapshot for configuration errors and best practices
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Analysis Button */}
        <Card ref={resultsRef} className="p-6 mb-8 border-slate-200 dark:border-slate-800">
          <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full">
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 mr-2" /> Run Analysis
              </>
            )}
          </Button>
        </Card>

        {/* Results Summary */}
        {issues.length > 0 && (
          <Card className="p-6 mb-8 border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Analysis Summary</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">Errors</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">{errorCount}</p>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">Warnings</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{warningCount}</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-600 dark:text-blue-400">Info</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{infoCount}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Issues List */}
        {issues.length > 0 && (
          <Card className="p-6 border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Issues Found</h2>

            <div className="space-y-4">
              {issues.map((issue, idx) => {
                return (
                <div key={idx} className={`p-4 rounded-lg border-2 ${getSeverityColor(issue.severity)}`}>
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(issue.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">{issue.rule}</span>
                        <span className="text-xs px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 uppercase">
                          {issue.severity}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 mt-1">{issue.message}</p>
                      <div className="mt-3 flex gap-2 rounded-md border border-slate-200/80 bg-white/60 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-200">
                        <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                        <div><span className="font-semibold">Recommended next step:</span> {getLintRemediation(issue.rule)}</div>
                      </div>
                      <AffectedSignalList items={issue.affectedItems} />
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </Card>
        )}

        {!hasAnalyzed && !isAnalyzing && (
          <Card className="p-6 border-slate-200 dark:border-slate-800 text-center">
            <Info className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <p className="text-lg font-semibold text-slate-900 dark:text-white">Ready to Analyze</p>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Click "Run Analysis" to check this snapshot for routing and configuration issues.
            </p>
          </Card>
        )}

        {hasAnalyzed && issues.length === 0 && !isAnalyzing && (
          <Card className="p-6 border-slate-200 dark:border-slate-800 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <p className="text-lg font-semibold text-slate-900 dark:text-white">No Issues Found</p>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Your snapshot configuration passed all current linting rules.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

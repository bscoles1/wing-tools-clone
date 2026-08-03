import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, AlertTriangle, AlertCircle, CheckCircle, Info } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface LintIssue {
  severity: "error" | "warning" | "info";
  rule: string;
  message: string;
  affectedItems: string[];
}

export default function SnapshotLinter() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const snapshotId = parseInt(params.id, 10);

  const [issues, setIssues] = useState<LintIssue[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: snapshot, isLoading: isSnapshotLoading, error: snapshotError } = trpc.snapshot.getSnapshot.useQuery(
    { snapshotId },
    { enabled: isAuthenticated && !isNaN(snapshotId) }
  );

  // Redirect if not authenticated
  if (!loading && !isAuthenticated) {
    setLocation("/");
    return null;
  }

  if (isNaN(snapshotId)) {
    setLocation("/404");
    return null;
  }

  if (isSnapshotLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-slate-700 dark:text-slate-300">Loading snapshot...</span>
      </div>
    );
  }

  if (snapshotError) {
    toast.error(snapshotError.message);
    setLocation("/uploader");
    return null;
  }

  if (!snapshot || !snapshot.parsed) {
    setLocation("/404");
    return null;
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const parsed = snapshot.parsed;
    const foundIssues: LintIssue[] = [];

    try {
      // Rule 1: Check for unpatched channels (channels with no input source)
      const unpatchedChannels = parsed.channels.filter((ch: any) => !ch.inputSource);
      if (unpatchedChannels.length > 0) {
        foundIssues.push({
          severity: "warning",
          rule: "Unpatched Channels",
          message: `${unpatchedChannels.length} channel(s) have no input source assigned`,
          affectedItems: unpatchedChannels.map((ch: any) => ch.name),
        });
      }

      // Rule 2: Check for channels with no routes
      const unroutedChannels = parsed.channels.filter((ch: any) => ch.routes.length === 0);
      if (unroutedChannels.length > 0) {
        foundIssues.push({
          severity: "warning",
          rule: "Unrouted Channels",
          message: `${unroutedChannels.length} channel(s) have no output routes`,
          affectedItems: unroutedChannels.map((ch: any) => ch.name),
        });
      }

      // Rule 3: Check for muted channels that have routes
      const mutedRoutedChannels = parsed.channels.filter((ch: any) => ch.mute && ch.routes.length > 0);
      if (mutedRoutedChannels.length > 0) {
        foundIssues.push({
          severity: "info",
          rule: "Muted Routed Channels",
          message: `${mutedRoutedChannels.length} channel(s) are muted but have active routes`,
          affectedItems: mutedRoutedChannels.map((ch: any) => ch.name),
        });
      }

      // Rule 4: Check for buses with no routes
      const unroutedBuses = parsed.buses.filter((b: any) => b.routes.length === 0);
      if (unroutedBuses.length > 0) {
        foundIssues.push({
          severity: "warning",
          rule: "Unrouted Buses",
          message: `${unroutedBuses.length} bus(es) have no output routes`,
          affectedItems: unroutedBuses.map((b: any) => b.name),
        });
      }

      // Rule 5: Check for matrices with no routes
      const unroutedMatrices = parsed.matrices.filter((m: any) => m.routes.length === 0);
      if (unroutedMatrices.length > 0) {
        foundIssues.push({
          severity: "warning",
          rule: "Unrouted Matrices",
          message: `${unroutedMatrices.length} matrix(ces) have no output routes`,
          affectedItems: unroutedMatrices.map((m: any) => m.name),
        });
      }

      // Rule 6: Check for unused inputs (inputs not connected to any channel)
      const usedInputs = new Set<string>();
      for (const ch of parsed.channels as any[]) {
        if (ch.inputSource) {
          usedInputs.add(`${ch.inputSource.group}${ch.inputSource.index}`);
        }
      }

      const unusedInputs = parsed.inputs.filter((inp: any) => !usedInputs.has(`${inp.group}${inp.index}`));
      if (unusedInputs.length > 0) {
        foundIssues.push({
          severity: "info",
          rule: "Unused Inputs",
          message: `${unusedInputs.length} input(s) are not connected to any channel`,
          affectedItems: unusedInputs.map((inp: any) => `${inp.group} #${inp.index} - ${inp.name}`),
        });
      }

      // Rule 7: Check for high gain values (potential clipping)
      const highGainChannels = parsed.channels.filter((ch: any) => (ch.gain || 0) > 6);
      if (highGainChannels.length > 0) {
        foundIssues.push({
          severity: "warning",
          rule: "High Gain Levels",
          message: `${highGainChannels.length} channel(s) have gain > 6dB (potential clipping)`,
          affectedItems: highGainChannels.map((ch: any) => `${ch.name} (${ch.gain?.toFixed(1)}dB)`),
        });
      }

      // Rule 8: Check for solo enabled on multiple channels
      const soloChannels = parsed.channels.filter((ch: any) => ch.solo);
      if (soloChannels.length > 1) {
        foundIssues.push({
          severity: "info",
          rule: "Multiple Solo Channels",
          message: `${soloChannels.length} channel(s) have solo enabled`,
          affectedItems: soloChannels.map((ch: any) => ch.name),
        });
      }

      setIssues(foundIssues);

      if (foundIssues.length === 0) {
        toast.success("No issues found! Your configuration looks good.");
      } else {
        const errorCount = foundIssues.filter((i) => i.severity === "error").length;
        const warningCount = foundIssues.filter((i) => i.severity === "warning").length;
        toast.success(`Analysis complete: ${errorCount} error(s), ${warningCount} warning(s)`);
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      toast.error("Failed to analyze snapshot");
    } finally {
      setIsAnalyzing(false);
    }
  };

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
        <Card className="p-6 mb-8 border-slate-200 dark:border-slate-800">
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
              {issues.map((issue, idx) => (
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
                      {issue.affectedItems.length > 0 && (
                        <div className="mt-3 text-sm">
                          <p className="font-medium text-slate-600 dark:text-slate-400 mb-2">Affected items:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {issue.affectedItems.slice(0, 5).map((item, i) => (
                              <li key={i} className="text-slate-600 dark:text-slate-400">
                                {item}
                              </li>
                            ))}
                            {issue.affectedItems.length > 5 && (
                              <li className="text-slate-600 dark:text-slate-400">
                                ...and {issue.affectedItems.length - 5} more
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {issues.length === 0 && !isAnalyzing && (
          <Card className="p-6 border-slate-200 dark:border-slate-800 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <p className="text-lg font-semibold text-slate-900 dark:text-white">No Issues Found</p>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Your snapshot configuration looks good! Click "Run Analysis" to check for issues.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

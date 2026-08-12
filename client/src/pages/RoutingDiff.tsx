import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, Upload, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface DiffItem {
  type: "added" | "removed" | "modified";
  category: string;
  name: string;
  oldValue?: string;
  newValue?: string;
}

export default function RoutingDiff() {
  const { isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: true, redirectPath: "/" });
  const [, setLocation] = useLocation();

  const [file1Id, setFile1Id] = useState<number | null>(null);
  const [file2Id, setFile2Id] = useState<number | null>(null);
  const [diffs, setDiffs] = useState<DiffItem[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  const { data: snapshots } = trpc.snapshot.listSnapshots.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: firstSnapshot, isLoading: isFirstSnapshotLoading } = trpc.snapshot.getSnapshot.useQuery(
    { snapshotId: file1Id ?? 0 },
    { enabled: Boolean(isAuthenticated && file1Id) }
  );
  const { data: secondSnapshot, isLoading: isSecondSnapshotLoading } = trpc.snapshot.getSnapshot.useQuery(
    { snapshotId: file2Id ?? 0 },
    { enabled: Boolean(isAuthenticated && file2Id) }
  );

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" aria-label="Loading routing diff" />
      </div>
    );
  }

  const handleCompare = async () => {
    if (!file1Id || !file2Id) {
      toast.error("Please select two snapshots to compare");
      return;
    }

    if (file1Id === file2Id) {
      toast.error("Please select two different snapshots");
      return;
    }

    setIsComparing(true);

    try {
      // Load the complete normalized models through getSnapshot rather than shipping parsedData in list results.
      const snap1 = firstSnapshot;
      const snap2 = secondSnapshot;

      if (!snap1?.parsed || !snap2?.parsed) {
        toast.error("The selected snapshots are still loading or do not contain parsed data.");
        return;
      }

      const parsed1 = snap1.parsed as any;
      const parsed2 = snap2.parsed as any;

      const differences: DiffItem[] = [];

      // Compare channels
      const channels1 = new Map(parsed1.channels.map((c: any) => [c.index, c]));
      const channels2 = new Map(parsed2.channels.map((c: any) => [c.index, c]));

      // Check for added/removed channels
      for (const [idx, ch] of Array.from(channels1)) {
        if (!channels2.has(idx)) {
          differences.push({
            type: "removed",
            category: "Channel",
            name: (ch as any).name,
          });
        }
      }

      for (const [idx, ch] of Array.from(channels2)) {
        if (!channels1.has(idx)) {
          differences.push({
            type: "added",
            category: "Channel",
            name: (ch as any).name,
          });
        }
      }

      // Check for modified channels
      for (const [idx, ch2] of Array.from(channels2)) {
        const ch1 = channels1.get(idx);
        if (ch1) {
          const ch1Any = ch1 as any;
          const ch2Any = ch2 as any;
          const changes: string[] = [];

          if (ch1Any.inputSource?.group !== ch2Any.inputSource?.group || ch1Any.inputSource?.index !== ch2Any.inputSource?.index) {
            changes.push(
              `Input: ${ch1Any.inputSource ? `${ch1Any.inputSource.group}${ch1Any.inputSource.index}` : "None"} → ${ch2Any.inputSource ? `${ch2Any.inputSource.group}${ch2Any.inputSource.index}` : "None"}`
            );
          }

          if ((ch1Any.gain || 0) !== (ch2Any.gain || 0)) {
            changes.push(`Gain: ${(ch1Any.gain || 0).toFixed(1)}dB → ${(ch2Any.gain || 0).toFixed(1)}dB`);
          }

          if (ch1Any.mute !== ch2Any.mute) {
            changes.push(`Mute: ${ch1Any.mute ? "Yes" : "No"} → ${ch2Any.mute ? "Yes" : "No"}`);
          }

          if (ch1Any.solo !== ch2Any.solo) {
            changes.push(`Solo: ${ch1Any.solo ? "Yes" : "No"} → ${ch2Any.solo ? "Yes" : "No"}`);
          }

          // Compare routes
          const routes1 = ch1Any.routes.map((r: any) => `${r.group}${r.index}`).sort().join(",");
          const routes2 = ch2Any.routes.map((r: any) => `${r.group}${r.index}`).sort().join(",");

          if (routes1 !== routes2) {
            changes.push(`Routes: ${routes1 || "None"} → ${routes2 || "None"}`);
          }

          if (changes.length > 0) {
            differences.push({
            type: "modified",
            category: "Channel",
            name: ch1Any.name,
              oldValue: changes[0],
              newValue: changes.join("; "),
            });
          }
        }
      }

      // Compare buses
      const buses1 = new Map(parsed1.buses.map((b: any) => [b.index, b]));
      const buses2 = new Map(parsed2.buses.map((b: any) => [b.index, b]));

      for (const [idx, bus] of Array.from(buses1)) {
        if (!buses2.has(idx)) {
          differences.push({
            type: "removed",
            category: "Bus",
            name: (bus as any).name,
          });
        }
      }

      for (const [idx, bus] of Array.from(buses2)) {
        if (!buses1.has(idx)) {
          differences.push({
            type: "added",
            category: "Bus",
            name: (bus as any).name,
          });
        }
      }

      // Compare matrices
      const matrices1 = new Map(parsed1.matrices.map((m: any) => [m.index, m]));
      const matrices2 = new Map(parsed2.matrices.map((m: any) => [m.index, m]));

      for (const [idx, mtx] of Array.from(matrices1)) {
        if (!matrices2.has(idx)) {
          differences.push({
            type: "removed",
            category: "Matrix",
            name: (mtx as any).name,
          });
        }
      }

      for (const [idx, mtx] of Array.from(matrices2)) {
        if (!matrices1.has(idx)) {
          differences.push({
            type: "added",
            category: "Matrix",
            name: (mtx as any).name,
          });
        }
      }

      setDiffs(differences);
      toast.success(`Found ${differences.length} differences`);
    } catch (error) {
      console.error("Comparison failed:", error);
      toast.error("Failed to compare snapshots");
    } finally {
      setIsComparing(false);
    }
  };

  const getDiffIcon = (type: string) => {
    switch (type) {
      case "added":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "removed":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "modified":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getDiffColor = (type: string) => {
    switch (type) {
      case "added":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "removed":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      case "modified":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
      default:
        return "bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Routing Diff</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Compare two snapshot files to identify routing, source, and level changes
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Comparison Setup */}
        <Card className="p-6 mb-8 border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Select Snapshots to Compare</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* File 1 Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                First Snapshot
              </label>
              <select
                value={file1Id || ""}
                onChange={(e) => setFile1Id(e.target.value ? parseInt(e.target.value, 10) : null)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">Select a snapshot...</option>
                {snapshots?.map((snap) => (
                  <option key={snap.id} value={snap.id}>
                    {snap.filename}
                  </option>
                ))}
              </select>
            </div>

            {/* File 2 Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Second Snapshot
              </label>
              <select
                value={file2Id || ""}
                onChange={(e) => setFile2Id(e.target.value ? parseInt(e.target.value, 10) : null)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">Select a snapshot...</option>
                {snapshots?.map((snap) => (
                  <option key={snap.id} value={snap.id}>
                    {snap.filename}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button onClick={handleCompare} disabled={isComparing || !file1Id || !file2Id} className="w-full">
            {isComparing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Comparing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" /> Compare Snapshots
              </>
            )}
          </Button>
        </Card>

        {/* Comparison Results */}
        {(isFirstSnapshotLoading || isSecondSnapshotLoading) && (file1Id || file2Id) && (
          <Card className="p-6 mb-8 border-slate-200 dark:border-slate-800 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-slate-600 dark:text-slate-400">Loading selected snapshots…</p>
          </Card>
        )}

        {diffs.length > 0 && (
          <Card className="p-6 border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
              Differences Found: {diffs.length}
            </h2>

            <div className="space-y-3">
              {diffs.map((diff, idx) => (
                <div key={idx} className={`p-4 rounded-lg border-2 ${getDiffColor(diff.type)}`}>
                  <div className="flex items-start gap-3">
                    {getDiffIcon(diff.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">{diff.category}</span>
                        <span className="text-sm px-2 py-1 rounded bg-slate-200 dark:bg-slate-700">
                          {diff.type.charAt(0).toUpperCase() + diff.type.slice(1)}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 mt-1">{diff.name}</p>
                      {diff.newValue && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{diff.newValue}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {diffs.length === 0 && file1Id && file2Id && !isComparing && (
          <Card className="p-6 border-slate-200 dark:border-slate-800 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <p className="text-lg font-semibold text-slate-900 dark:text-white">No Differences Found</p>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              The selected snapshots have identical routing configurations
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

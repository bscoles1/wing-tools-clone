import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft, Download, Sliders, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SourceManagement() {
  const { isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: true, redirectPath: "/" });
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const snapshotId = parseInt(params.id, 10);

  const [inputGains, setInputGains] = useState<Record<string, number>>({});
  const [isExporting, setIsExporting] = useState(false);

  const { data: snapshot, isLoading: isSnapshotLoading, error: snapshotError } = trpc.snapshot.getSnapshot.useQuery(
    { snapshotId },
    { enabled: isAuthenticated && !isNaN(snapshotId) }
  );

  const exportMutation = trpc.snapshot.exportSnapshot.useMutation({
    onSuccess: (data) => {
      const jsonString = JSON.stringify(data.data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Modified .snap file downloaded successfully!");
      setIsExporting(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to export snapshot");
      setIsExporting(false);
    },
  });

  useEffect(() => {
    if (isNaN(snapshotId)) setLocation("/404");
  }, [snapshotId, setLocation]);

  useEffect(() => {
    if (snapshotError) {
      toast.error(snapshotError.message);
      setLocation("/uploader");
    }
  }, [snapshotError, setLocation]);

  useEffect(() => {
    if (snapshot?.parsed?.inputs) {
      const initialGains: Record<string, number> = {};
      for (const input of snapshot.parsed.inputs as any[]) {
        initialGains[input.id] = input.gain ?? 0;
      }
      setInputGains(initialGains);
    }
  }, [snapshot]);

  if (loading || !isAuthenticated || isNaN(snapshotId)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" aria-label="Loading source management" />
      </div>
    );
  }

  if (isSnapshotLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-slate-700 dark:text-slate-300">Loading snapshot inputs...</span>
      </div>
    );
  }

  if (snapshotError || !snapshot || !snapshot.parsed) {
    return null;
  }

  const parsed = snapshot.parsed as any;

  const handleGainChange = (inputId: string, value: number) => {
    setInputGains((prev) => ({ ...prev, [inputId]: value }));
  };

  const handleExport = () => {
    setIsExporting(true);
    // Apply modifications to the parsed model or pass them to exportSnapshot
    exportMutation.mutate({
      snapshotId,
      modifications: {
        inputGains,
      } as any,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setLocation(`/snapshot/${snapshotId}`)}>
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Snapshot
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Source Management</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Remap input gains and download modified .snap files</p>
          </div>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Export .snap File
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="p-6 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <Sliders className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Physical Input Sources ({parsed.inputs.length})</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parsed.inputs.map((input: any) => (
              <div key={input.id} className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{input.name}</h3>
                    <p className="text-xs text-slate-500">{input.group} #{input.index}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 uppercase">
                    {input.stereoMode || "mono"}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 dark:text-slate-400">Gain (dB)</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {(inputGains[input.id] ?? input.gain ?? 0).toFixed(1)} dB
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-12"
                    max="60"
                    step="0.5"
                    value={inputGains[input.id] ?? input.gain ?? 0}
                    onChange={(e) => handleGainChange(input.id, parseFloat(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

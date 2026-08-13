import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, Trash2, Download, ClipboardCopy, ArrowLeft, FileJson, BarChart3, GitCompare, AlertCircle, Settings, FileSpreadsheet, Tags, ShieldCheck, Network } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

export default function SnapshotDetail() {
  const { isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: true, redirectPath: "/" });
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const snapshotId = parseInt(params.id, 10);

  const { data: snapshot, isLoading: isSnapshotLoading, error: snapshotError } = trpc.snapshot.getSnapshot.useQuery(
    { snapshotId },
    { enabled: isAuthenticated && !isNaN(snapshotId) }
  );

  const generatePDFMutation = trpc.snapshot.generatePDF.useMutation({
    onSuccess: (data) => {
      // Create a blob and download the PDF
      const binaryString = atob(data.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("PDF downloaded successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate PDF");
    },
  });

  const generateExcelMutation = trpc.snapshot.generateExcel.useMutation({
    onSuccess: (data) => {
      // Create a blob and download the Excel file
      const binaryString = atob(data.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Excel file downloaded successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate Excel");
    },
  });

  const deleteSnapshotMutation = trpc.snapshot.deleteSnapshot.useMutation({
    onSuccess: () => {
      toast.success("Snapshot deleted successfully!");
      setLocation("/uploader"); // Redirect back to uploader after deletion
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete snapshot");
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

  if (snapshotError || !snapshot) {
    return null;
  }

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this snapshot and all associated data?")) {
      deleteSnapshotMutation.mutate({ snapshotId });
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Snapshot link copied to clipboard.");
    } catch {
      toast.error("Could not copy the snapshot link. Please copy the address from your browser.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setLocation("/uploader")}>
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Uploads
          </Button>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{snapshot.filename}</h1>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteSnapshotMutation.isPending}>
            {deleteSnapshotMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Trash2 className="w-5 h-5" />
            )}
            <span className="ml-2">Delete</span>
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Snapshot Details */}
          <Card className="md:col-span-2 p-6 border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Snapshot Overview</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-600 dark:text-slate-400">Mixer Name</p>
                <p className="font-medium text-slate-900 dark:text-white">{snapshot.mixerName || "N/A"}</p>
              </div>
              <div>
                <p className="text-slate-600 dark:text-slate-400">Mixer Model</p>
                <p className="font-medium text-slate-900 dark:text-white">{snapshot.mixerModel || "N/A"}</p>
              </div>
              <div>
                <p className="text-slate-600 dark:text-slate-400">Snapshot Schema</p>
                <p className="font-medium text-slate-900 dark:text-white">{snapshot.snapshotSchema || "N/A"}</p>
              </div>
              <div>
                <p className="text-slate-600 dark:text-slate-400">Uploaded On</p>
                <p className="font-medium text-slate-900 dark:text-white">{new Date(snapshot.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-slate-600 dark:text-slate-400">Total Inputs</p>
                <p className="font-medium text-slate-900 dark:text-white">{snapshot.totalInputs || 0}</p>
              </div>
              <div>
                <p className="text-slate-600 dark:text-slate-400">Total Outputs</p>
                <p className="font-medium text-slate-900 dark:text-white">{snapshot.totalOutputs || 0}</p>
              </div>
              <div>
                <p className="text-slate-600 dark:text-slate-400">Total Channels</p>
                <p className="font-medium text-slate-900 dark:text-white">{snapshot.totalChannels || 0}</p>
              </div>
              <div>
                <p className="text-slate-600 dark:text-slate-400">Active Routes</p>
                <p className="font-medium text-slate-900 dark:text-white">{snapshot.activeRoutes || 0}</p>
              </div>
            </div>

            {/* Documentation actions */}
            <div id="exports" className="mt-8 rounded-xl border border-indigo-200 bg-indigo-50/70 p-5 dark:border-indigo-800 dark:bg-indigo-950/30">
              <div className="flex items-start gap-3">
                <FileJson className="mt-0.5 h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Documentation Deliverables</h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Create a routing report for your crew or a filterable workbook for engineering handoff. The PDF includes routing tables, cross-references, and stagebox-label information.</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  onClick={() => generatePDFMutation.mutate({ snapshotId })}
                  disabled={generatePDFMutation.isPending}
                >
                  {generatePDFMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Routing PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => generateExcelMutation.mutate({ snapshotId })}
                  disabled={generateExcelMutation.isPending}
                >
                  {generateExcelMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Excel Workbook
                </Button>
                <span className="flex items-center gap-1.5 self-center text-xs font-medium text-slate-600 dark:text-slate-300"><Tags className="h-3.5 w-3.5" /> Stagebox labels are included in the PDF report</span>
              </div>
              <Button className="mt-3" variant="ghost" size="sm" onClick={handleCopyLink}><ClipboardCopy className="mr-2 h-4 w-4" /> Copy snapshot link</Button>
            </div>
          </Card>

          {/* Tools Section */}
          <Card className="p-6 border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Available Tools</h2>
            <div className="space-y-4">
              <Button className="w-full justify-start" variant="ghost" onClick={() => document.getElementById("exports")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
                <FileJson className="w-5 h-5 mr-2" /> Routing Table Generator
              </Button>
              <Button
                className="w-full justify-start"
                variant="ghost"
                onClick={() => setLocation(`/snapshot/${snapshotId}/signal-flow`)}
              >
                <BarChart3 className="w-5 h-5 mr-2" /> Signal Flow Diagram
              </Button>
              <Button
                className="w-full justify-start"
                variant="ghost"
                onClick={() => setLocation("/routing-diff")}
              >
                <GitCompare className="w-5 h-5 mr-2" /> Routing Diff
              </Button>
              <Button
                className="w-full justify-start"
                variant="ghost"
                onClick={() => setLocation(`/snapshot/${snapshotId}/linter`)}
              >
                <AlertCircle className="w-5 h-5 mr-2" /> Snapshot Linter
              </Button>
              <Button
                className="w-full justify-start"
                variant="ghost"
                onClick={() => setLocation(`/snapshot/${snapshotId}/source-management`)}
              >
                <Settings className="w-5 h-5 mr-2" /> Source Management
              </Button>
              <Button className="w-full justify-start" variant="ghost" onClick={() => setLocation("/protocol-explorer")}>
                <Network className="w-5 h-5 mr-2" /> Remote Protocol Explorer
              </Button>
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Recommended pre-show sequence</div>
                <p className="mt-1">Run the linter, trace critical paths in Signal Flow, then download the routing report and Excel workbook.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

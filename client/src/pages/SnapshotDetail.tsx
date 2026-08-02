import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, Trash2, Download, Share2, ArrowLeft, FileJson, BarChart3, GitCompare, AlertCircle, Settings } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function SnapshotDetail() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const snapshotId = parseInt(params.id, 10);

  const { data: snapshot, isLoading: isSnapshotLoading, error: snapshotError } = trpc.snapshot.getSnapshot.useQuery(
    { snapshotId },
    { enabled: isAuthenticated && !isNaN(snapshotId) }
  );

  const deleteSnapshotMutation = trpc.snapshot.deleteSnapshot.useMutation({
    onSuccess: () => {
      toast.success("Snapshot deleted successfully!");
      setLocation("/uploader"); // Redirect back to uploader after deletion
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete snapshot");
    },
  });

  // Redirect if not authenticated or invalid snapshotId
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

  if (!snapshot) {
    setLocation("/404");
    return null;
  }

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this snapshot and all associated data?")) {
      deleteSnapshotMutation.mutate({ snapshotId });
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

            {/* Actions */}
            <div className="mt-8 flex gap-4">
              <Button>
                <Download className="w-4 h-4 mr-2" /> Download Original
              </Button>
              <Button variant="outline">
                <Share2 className="w-4 h-4 mr-2" /> Share
              </Button>
            </div>
          </Card>

          {/* Tools Section */}
          <Card className="p-6 border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Available Tools</h2>
            <div className="space-y-4">
              <Button className="w-full justify-start" variant="ghost">
                <FileJson className="w-5 h-5 mr-2" /> Routing Table Generator
              </Button>
              <Button className="w-full justify-start" variant="ghost">
                <BarChart3 className="w-5 h-5 mr-2" /> Signal Flow Diagram
              </Button>
              <Button className="w-full justify-start" variant="ghost">
                <GitCompare className="w-5 h-5 mr-2" /> Routing Diff
              </Button>
              <Button className="w-full justify-start" variant="ghost">
                <AlertCircle className="w-5 h-5 mr-2" /> Snapshot Linter
              </Button>
              <Button className="w-full justify-start" variant="ghost">
                <Settings className="w-5 h-5 mr-2" /> Source Management
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

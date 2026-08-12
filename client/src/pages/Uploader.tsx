import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Upload, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

export default function Uploader() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedSnapshots, setUploadedSnapshots] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const listSnapshotsQuery = trpc.snapshot.listSnapshots.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const uploadSnapshotMutation = trpc.snapshot.uploadSnapshot.useMutation({
    onSuccess: (data) => {
      toast.success(`Snapshot uploaded successfully! (${data.summary.totalChannels} channels)`);
      void listSnapshotsQuery.refetch();
      setUploadedSnapshots([]);
    },
  });

  // The auth hook performs redirects after loading settles. Do not navigate during render.
  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" aria-label="Loading uploader" />
      </div>
    );
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  const processFiles = async (files: File[]) => {
    const snapFiles = files.filter((f) => f.name.toLowerCase().endsWith(".snap") || f.type === "application/json");

    if (snapFiles.length === 0) {
      toast.error("Please select a .snap file");
      return;
    }

    setIsProcessing(true);

    try {
      for (const file of snapFiles) {
        try {
          // WING exports are UTF-8 JSON; remove a possible BOM before parsing.
          const text = (await file.text()).replace(/^\uFEFF/, "").trim();
          if (!text) throw new Error("The selected file is empty.");

          let rawJson: unknown;
          try {
            rawJson = JSON.parse(text);
          } catch {
            throw new Error("The selected file is not valid JSON. Export the snapshot again from WING.");
          }

          if (!rawJson || typeof rawJson !== "object") {
            throw new Error("The snapshot JSON must contain an object with an ae_data root.");
          }

          const fileKey = `snapshots/${Date.now()}-${file.name}`;
          await uploadSnapshotMutation.mutateAsync({
            filename: file.name,
            fileKey,
            rawJson,
          });
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          toast.error(error instanceof Error ? error.message : `Failed to process ${file.name}`);
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Upload Snapshot</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Drag and drop your .snap file or click to browse
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Upload Area */}
        <Card
          className={`border-2 border-dashed p-12 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
              : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600"
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".snap,.json"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Drop your snapshot files here
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            or click to select files from your computer
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500">
            Supported formats: .snap, .json
          </p>
        </Card>

        {/* Processing State */}
        {isProcessing && (
          <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-4">
            <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              Processing your snapshot file...
            </div>
          </div>
        )}

        {/* Recent Snapshots */}
        {listSnapshotsQuery.data && listSnapshotsQuery.data.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              Your Snapshots
            </h2>
            <div className="space-y-4">
              {listSnapshotsQuery.data.map((snapshot) => (
                <Card key={snapshot.id} className="p-6 border-slate-200 dark:border-slate-800">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {snapshot.filename}
                        </h3>
                      </div>
                      <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">Mixer</p>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {snapshot.mixerName || "Unknown"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">Channels</p>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {snapshot.totalChannels || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">Inputs</p>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {snapshot.totalInputs || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">Outputs</p>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {snapshot.totalOutputs || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => setLocation(`/snapshot/${snapshot.id}`)}
                      className="ml-4"
                    >
                      View
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {listSnapshotsQuery.data && listSnapshotsQuery.data.length === 0 && !isProcessing && (
          <div className="mt-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No snapshots yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Upload your first WING snapshot file to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

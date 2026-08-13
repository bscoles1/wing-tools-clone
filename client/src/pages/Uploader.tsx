import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { AlertCircle, ArrowRight, CheckCircle, FileSpreadsheet, FileText, Loader2, Route, ScanSearch, Tags, Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { toast } from "sonner";

const outputOptions = [
  {
    title: "Routing Documentation",
    description: "Channel lists, I/O tables, routing matrices, and signal cross-references.",
    icon: FileText,
    accent: "border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/40",
    iconAccent: "text-indigo-600 dark:text-indigo-300",
  },
  {
    title: "Stagebox Labels",
    description: "Print-ready device and XLR labels built from physical I/O assignments.",
    icon: Tags,
    accent: "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40",
    iconAccent: "text-emerald-600 dark:text-emerald-300",
  },
  {
    title: "Excel Workbook",
    description: "Filterable inputs, channels, outputs, buses, matrices, and routing sheets.",
    icon: FileSpreadsheet,
    accent: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40",
    iconAccent: "text-amber-600 dark:text-amber-300",
  },
];

export default function Uploader() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentSnapshotId, setRecentSnapshotId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const listSnapshotsQuery = trpc.snapshot.listSnapshots.useQuery(undefined, { enabled: isAuthenticated });
  const uploadSnapshotMutation = trpc.snapshot.uploadSnapshot.useMutation({
    onSuccess: (data) => {
      toast.success(`Snapshot uploaded successfully! (${data.summary.totalChannels} channels)`);
      void listSnapshotsQuery.refetch();
      setRecentSnapshotId(data.snapshotId);
    },
  });

  const processFiles = async (files: File[]) => {
    const snapFiles = files.filter((file) => file.name.toLowerCase().endsWith(".snap") || file.type === "application/json");
    if (snapFiles.length === 0) {
      toast.error("Please select a .snap file");
      return;
    }

    setIsProcessing(true);
    try {
      for (const file of snapFiles) {
        try {
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

          await uploadSnapshotMutation.mutateAsync({
            filename: file.name,
            fileKey: `snapshots/${Date.now()}-${file.name}`,
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

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    void processFiles(Array.from(event.dataTransfer.files));
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    void processFiles(Array.from(event.target.files || []));
    event.target.value = "";
  };

  if (loading || !isAuthenticated) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" aria-label="Loading uploader" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">WING snapshot workspace</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">Upload & Document a Snapshot</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Parse once, then inspect signal paths, lint configuration, and create documentation for your crew.</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">Documentation outputs</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Know what you can create before you upload</h2>
            </div>
            <p className="max-w-md text-sm text-slate-600 dark:text-slate-400">The snapshot remains in your workspace after validation, ready for exports and diagnostic tools.</p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {outputOptions.map((option) => {
              const Icon = option.icon;
              return <Card key={option.title} className={`border p-5 shadow-sm ${option.accent}`}><Icon className={`h-6 w-6 ${option.iconAccent}`} /><h3 className="mt-3 font-bold text-slate-900 dark:text-white">{option.title}</h3><p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{option.description}</p></Card>;
            })}
          </div>
        </section>

        <section className="mt-8">
          <Card
            className={`cursor-pointer border-2 border-dashed p-12 text-center transition-colors ${isDragging ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950" : "border-slate-300 hover:border-indigo-400 dark:border-slate-700 dark:hover:border-indigo-700"}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <input ref={fileInputRef} type="file" accept=".snap,.json" multiple onChange={handleFileSelect} className="hidden" />
            <Upload className="mx-auto mb-4 h-12 w-12 text-slate-400" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Drop WING snapshot files here</h2>
            <p className="mb-4 mt-2 text-slate-600 dark:text-slate-400">or click to select files from your computer</p>
            <p className="text-sm text-slate-500">Supported: `.snap` files and compatible JSON exports with an `ae_data` root.</p>
          </Card>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { number: "1", title: "Upload & validate", copy: "We check WING snapshot structure before saving it.", icon: Upload },
              { number: "2", title: "Inspect & lint", copy: "Trace routes and identify missing patches or signals.", icon: ScanSearch },
              { number: "3", title: "Export & share", copy: "Create routing documents and crew-friendly references.", icon: Route },
            ].map((step) => {
              const Icon = step.icon;
              return <div key={step.number} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">{step.number}</span><Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /></div><p className="mt-3 font-semibold text-slate-900 dark:text-white">{step.title}</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{step.copy}</p></div>;
            })}
          </div>
        </section>

        {isProcessing && <div className="mt-8 flex items-center gap-4 rounded-lg border border-indigo-200 bg-indigo-50 p-6 dark:border-indigo-800 dark:bg-indigo-950"><Loader2 className="h-5 w-5 animate-spin text-indigo-600 dark:text-indigo-400" /><div className="text-sm text-indigo-900 dark:text-indigo-100">Processing and validating your WING snapshot…</div></div>}

        {recentSnapshotId && !isProcessing && (
          <Card className="mt-8 border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-800 dark:bg-emerald-950/30">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /><h2 className="font-bold text-emerald-950 dark:text-emerald-100">Snapshot ready for review</h2></div><p className="mt-1 text-sm text-emerald-800 dark:text-emerald-200">Inspect routing, run quality checks, or create documentation using the next steps below.</p></div><div className="flex flex-wrap gap-2"><Button onClick={() => setLocation(`/snapshot/${recentSnapshotId}`)}>Open Snapshot <ArrowRight className="ml-2 h-4 w-4" /></Button><Button variant="outline" onClick={() => setLocation(`/snapshot/${recentSnapshotId}/linter`)}>Run Linter</Button><Button variant="outline" onClick={() => setLocation(`/snapshot/${recentSnapshotId}/signal-flow`)}>Signal Flow</Button></div></div>
          </Card>
        )}

        {listSnapshotsQuery.data && listSnapshotsQuery.data.length > 0 && (
          <section className="mt-12"><h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">Your Snapshots</h2><div className="space-y-4">{listSnapshotsQuery.data.map((snapshot) => (
            <Card key={snapshot.id} className="p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0 flex-1"><div className="mb-2 flex items-center gap-3"><CheckCircle className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" /><h3 className="truncate font-semibold text-slate-900 dark:text-white">{snapshot.filename}</h3></div><div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4"><Metric label="Mixer" value={snapshot.mixerName || "Unknown"} /><Metric label="Channels" value={String(snapshot.totalChannels || 0)} /><Metric label="Inputs" value={String(snapshot.totalInputs || 0)} /><Metric label="Outputs" value={String(snapshot.totalOutputs || 0)} /></div></div><div className="flex flex-wrap gap-2 lg:justify-end"><Button onClick={() => setLocation(`/snapshot/${snapshot.id}`)}>View <ArrowRight className="ml-2 h-4 w-4" /></Button><Button size="sm" variant="outline" onClick={() => setLocation(`/snapshot/${snapshot.id}/linter`)}>Linter</Button><Button size="sm" variant="outline" onClick={() => setLocation(`/snapshot/${snapshot.id}/signal-flow`)}>Signal Flow</Button></div></div></Card>
          ))}</div></section>
        )}

        {listSnapshotsQuery.data && listSnapshotsQuery.data.length === 0 && !isProcessing && <div className="mt-12 text-center"><AlertCircle className="mx-auto mb-4 h-12 w-12 text-slate-400" /><h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">No snapshots yet</h3><p className="text-slate-600 dark:text-slate-400">Upload your first WING snapshot file to start validating and documenting your routing.</p></div>}
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><p className="text-slate-600 dark:text-slate-400">{label}</p><p className="font-medium text-slate-900 dark:text-white">{value}</p></div>;
}

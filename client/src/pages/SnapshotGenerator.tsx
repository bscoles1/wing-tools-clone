import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createStarterSnapshot, getStarterSnapshotFilename } from "@/lib/snapshotGenerator";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle2, Download, FilePlus2, Loader2, Save, Sparkles } from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type GeneratedSnapshot = ReturnType<typeof createStarterSnapshot>;

export function SnapshotGeneratorForm({
  name,
  channelCount,
  busCount,
  channelPrefix,
  generatedSnapshot,
  filename,
  isSaving,
  onNameChange,
  onChannelCountChange,
  onBusCountChange,
  onChannelPrefixChange,
  onDownload,
  onSave,
}: {
  name: string;
  channelCount: number;
  busCount: number;
  channelPrefix: string;
  generatedSnapshot: GeneratedSnapshot;
  filename: string;
  isSaving: boolean;
  onNameChange: (value: string) => void;
  onChannelCountChange: (value: number) => void;
  onBusCountChange: (value: number) => void;
  onChannelPrefixChange: (value: string) => void;
  onDownload: () => void;
  onSave: () => void;
}) {
  const channelLabels = Object.values(generatedSnapshot.ae_data.ch).map((channel) => channel.name);
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="border-slate-200 p-6 dark:border-slate-800">
        <div className="flex items-start gap-3"><div className="rounded-xl bg-violet-100 p-3 text-violet-700 dark:bg-violet-950 dark:text-violet-300"><FilePlus2 className="h-6 w-6" /></div><div><h2 className="font-bold text-slate-950 dark:text-white">Starter snapshot configuration</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Set the inventory and standardized labels for a fresh show baseline.</p></div></div>
        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className="text-sm font-semibold text-slate-900 dark:text-white">Snapshot name</span><input value={name} onChange={(event) => onNameChange(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none ring-violet-500 transition focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
          <label><span className="text-sm font-semibold text-slate-900 dark:text-white">Channel count</span><input type="number" min="0" max="48" value={channelCount} onChange={(event) => onChannelCountChange(Number(event.target.value))} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none ring-violet-500 transition focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
          <label><span className="text-sm font-semibold text-slate-900 dark:text-white">Bus count</span><input type="number" min="0" max="28" value={busCount} onChange={(event) => onBusCountChange(Number(event.target.value))} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none ring-violet-500 transition focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
          <label className="sm:col-span-2"><span className="text-sm font-semibold text-slate-900 dark:text-white">Channel label prefix</span><input value={channelPrefix} maxLength={16} onChange={(event) => onChannelPrefixChange(event.target.value)} placeholder="CH" className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none ring-violet-500 transition focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
        </div>
        <div className="mt-7 flex flex-wrap gap-3"><Button onClick={onDownload}><Download className="mr-2 h-4 w-4" /> Download .snap</Button><Button variant="outline" onClick={onSave} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save to Workspace</Button></div>
      </Card>

      <div className="space-y-6"><Card className="border-violet-200 bg-violet-50/70 p-6 dark:border-violet-900 dark:bg-violet-950/30"><div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-300" /><h2 className="font-bold text-slate-950 dark:text-white">Generated baseline</h2></div><div className="mt-5 grid grid-cols-2 gap-3 text-sm"><Metric label="Channels" value={String(channelLabels.length)} /><Metric label="Buses" value={String(Object.keys(generatedSnapshot.ae_data.bus).length)} /><Metric label="Schema" value="snapshot.9" /><Metric label="File" value={filename} /></div><div className="mt-5 rounded-lg border border-violet-100 bg-white/70 p-3 text-xs text-slate-600 dark:border-violet-900 dark:bg-slate-950/50 dark:text-slate-300"><div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Workspace-valid WING structure</div><p className="mt-1">The generated file includes the required <code>ae_data</code>, <code>io</code>, <code>ch</code>, <code>bus</code>, <code>mtx</code>, and <code>main</code> sections. Open and re-save it on the target WING console to populate firmware-specific defaults before production use.</p></div></Card><Card className="border-slate-200 p-6 dark:border-slate-800"><h2 className="font-bold text-slate-950 dark:text-white">Label preview</h2><div className="mt-4 flex flex-wrap gap-2">{channelLabels.slice(0, 12).map((channelName) => <span key={channelName} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">{channelName}</span>)}</div>{channelLabels.length > 12 && <p className="mt-3 text-xs text-slate-500">+ {channelLabels.length - 12} additional channel labels</p>}</Card></div>
    </div>
  );
}

export default function SnapshotGenerator() {
  const { isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: true, redirectPath: "/" });
  const [, setLocation] = useLocation();
  const [name, setName] = useState("WING Starter Snapshot");
  const [channelCount, setChannelCount] = useState(32);
  const [busCount, setBusCount] = useState(8);
  const [channelPrefix, setChannelPrefix] = useState("CH");

  const generatedSnapshot = useMemo(() => createStarterSnapshot({ name, channelCount, busCount, channelPrefix }), [name, channelCount, busCount, channelPrefix]);
  const filename = getStarterSnapshotFilename(name);
  const saveMutation = trpc.snapshot.uploadSnapshot.useMutation({
    onSuccess: (result) => {
      toast.success("Starter snapshot saved to your workspace.");
      setLocation(`/snapshot/${result.snapshotId}`);
    },
    onError: (error) => toast.error(error.message || "Could not save the starter snapshot."),
  });

  const downloadSnapshot = () => {
    const blob = new Blob([JSON.stringify(generatedSnapshot, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
    toast.success("Starter .snap file downloaded.");
  };

  if (loading || !isAuthenticated) return <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-violet-50/60 pb-12 dark:from-slate-950 dark:to-slate-950">
      <header className="border-b border-slate-200 bg-white/90 dark:border-slate-800 dark:bg-slate-950/90"><div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-6 sm:px-6 lg:px-8"><Button variant="ghost" size="icon" onClick={() => setLocation("/uploader")} aria-label="Back to uploads"><ArrowLeft className="h-5 w-5" /></Button><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-400">WING snapshot workspace</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Snapshot Generator</h1><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Create a clean, named routing baseline, then download it or continue editing it in your workspace.</p></div></div></header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8"><SnapshotGeneratorForm name={name} channelCount={channelCount} busCount={busCount} channelPrefix={channelPrefix} generatedSnapshot={generatedSnapshot} filename={filename} isSaving={saveMutation.isPending} onNameChange={setName} onChannelCountChange={setChannelCount} onBusCountChange={setBusCount} onChannelPrefixChange={setChannelPrefix} onDownload={downloadSnapshot} onSave={() => saveMutation.mutate({ filename, fileKey: `generated/${Date.now()}-${filename}`, rawJson: generatedSnapshot })} /></main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-violet-100 bg-white/70 p-3 dark:border-violet-900 dark:bg-slate-950/50"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 truncate font-semibold text-slate-950 dark:text-white">{value}</p></div>;
}

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { compareRoutingSnapshots, type DiffItem } from "@/lib/routingDiff";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle, Loader2, Upload } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

type SnapshotOption = { id: number; filename: string };

export function RoutingDiffControls({ firstId, secondId, snapshots, onFirstChange, onSecondChange, onCompare, isLoading }: {
  firstId: number | null;
  secondId: number | null;
  snapshots: SnapshotOption[];
  onFirstChange: (id: number | null) => void;
  onSecondChange: (id: number | null) => void;
  onCompare: () => void;
  isLoading: boolean;
}) {
  return <Card className="border-slate-200 p-6 dark:border-slate-800">
    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Select snapshots to compare</h2>
    <div className="mt-6 grid gap-6 md:grid-cols-2">
      <SnapshotSelect label="First Snapshot" value={firstId} snapshots={snapshots} onChange={onFirstChange} />
      <SnapshotSelect label="Second Snapshot" value={secondId} snapshots={snapshots} onChange={onSecondChange} />
    </div>
    <Button className="mt-6 w-full" onClick={onCompare} disabled={!firstId || !secondId || isLoading}>
      <Upload className="mr-2 h-4 w-4" /> {isLoading ? "Loading snapshots…" : "Compare snapshots"}
    </Button>
  </Card>;
}

function SnapshotSelect({ label, value, snapshots, onChange }: { label: string; value: number | null; snapshots: SnapshotOption[]; onChange: (value: number | null) => void }) {
  return <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
    {label}
    <select value={value ?? ""} onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
      <option value="">Select a snapshot…</option>
      {snapshots.map((snapshot) => <option key={snapshot.id} value={snapshot.id}>{snapshot.filename}</option>)}
    </select>
  </label>;
}

export default function RoutingDiff() {
  const { isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: true, redirectPath: "/" });
  const [file1Id, setFile1Id] = useState<number | null>(null);
  const [file2Id, setFile2Id] = useState<number | null>(null);
  const [diffs, setDiffs] = useState<DiffItem[]>([]);
  const [hasCompared, setHasCompared] = useState(false);
  const snapshotsQuery = trpc.snapshot.listSnapshots.useQuery(undefined, { enabled: isAuthenticated });
  const firstSnapshotQuery = trpc.snapshot.getSnapshot.useQuery({ snapshotId: file1Id ?? 0 }, { enabled: Boolean(isAuthenticated && file1Id) });
  const secondSnapshotQuery = trpc.snapshot.getSnapshot.useQuery({ snapshotId: file2Id ?? 0 }, { enabled: Boolean(isAuthenticated && file2Id) });

  const resetComparison = () => { setHasCompared(false); setDiffs([]); };
  const compare = () => {
    if (!file1Id || !file2Id) return toast.error("Please select two snapshots to compare.");
    if (file1Id === file2Id) return toast.error("Please select two different snapshots.");
    if (!firstSnapshotQuery.data?.parsed || !secondSnapshotQuery.data?.parsed) return toast.error("The selected snapshots are still loading or do not contain parsed data.");
    const differences = compareRoutingSnapshots(firstSnapshotQuery.data.parsed as any, secondSnapshotQuery.data.parsed as any);
    setDiffs(differences);
    setHasCompared(true);
    toast.success(`Found ${differences.length} differences.`);
  };

  if (loading || !isAuthenticated) return <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;
  const loadingSnapshots = firstSnapshotQuery.isLoading || secondSnapshotQuery.isLoading;
  return <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-12 dark:from-slate-950 dark:to-slate-900">
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"><div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"><h1 className="text-3xl font-bold text-slate-900 dark:text-white">Routing Diff</h1><p className="mt-2 text-slate-600 dark:text-slate-400">Compare two uploaded snapshots to identify routing, source, and level changes.</p></div></header>
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <RoutingDiffControls firstId={file1Id} secondId={file2Id} snapshots={snapshotsQuery.data ?? []} onFirstChange={(value) => { setFile1Id(value); resetComparison(); }} onSecondChange={(value) => { setFile2Id(value); resetComparison(); }} onCompare={compare} isLoading={loadingSnapshots} />
      {hasCompared && <DiffResults diffs={diffs} />}
    </main>
  </div>;
}

function DiffResults({ diffs }: { diffs: DiffItem[] }) {
  return <Card className="mt-8 border-slate-200 p-6 dark:border-slate-800">
    {diffs.length ? <><h2 className="text-lg font-semibold text-slate-900 dark:text-white">Differences found: {diffs.length}</h2><div className="mt-5 space-y-3">{diffs.map((diff, index) => <div key={`${diff.category}-${diff.name}-${index}`} className={`rounded-lg border p-4 ${diff.type === "added" ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30" : diff.type === "removed" ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30" : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"}`}><div className="flex items-start gap-3">{diff.type === "added" ? <CheckCircle className="h-5 w-5 text-emerald-600" /> : <AlertCircle className="h-5 w-5 text-amber-600" />}<div><p className="font-semibold text-slate-900 dark:text-white">{diff.category} · {diff.name}</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{diff.type.charAt(0).toUpperCase() + diff.type.slice(1)}{diff.newValue ? ` — ${diff.newValue}` : ""}</p></div></div></div>)}</div></> : <div className="py-4 text-center"><CheckCircle className="mx-auto h-10 w-10 text-emerald-600" /><p className="mt-3 font-semibold text-slate-900 dark:text-white">No differences found</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">The selected snapshots have identical routing configurations.</p></div>}
  </Card>;
}

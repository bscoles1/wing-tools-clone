import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buildSourceTagManifest, filterSourceIds, suggestedSourceTags, toggleSourceTag, type SourceTagMap } from "@/lib/sourceTags";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Download, Filter, Loader2, Search, Tag, Tags, X } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type SnapshotInput = { id: string; name?: string; group?: string; index?: number; gain?: number };

export function SourceTagWorkspace({
  snapshotId,
  snapshotName,
  inputs,
  tags,
  onToggleTag,
  onExport,
}: {
  snapshotId: number;
  snapshotName: string;
  inputs: SnapshotInput[];
  tags: SourceTagMap;
  onToggleTag: (inputId: string, tag: string) => void;
  onExport: () => void;
}) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const visibleInputs = useMemo(() => filterSourceIds(inputs, tags, query, activeTag), [inputs, tags, query, activeTag]);
  const usedTags = Array.from(new Set(Object.values(tags).flat()));

  return <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
    <Card className="h-fit border-slate-200 p-5 dark:border-slate-800"><div className="flex items-center gap-2"><Filter className="h-5 w-5 text-teal-600 dark:text-teal-400" /><h2 className="font-bold text-slate-950 dark:text-white">Filter sources</h2></div><div className="relative mt-4"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, group, or tag" className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none ring-teal-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></div><p className="mt-5 text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">Applied tags</p><div className="mt-2 flex flex-wrap gap-2">{usedTags.length ? usedTags.map((tag) => <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)} className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${activeTag === tag ? "border-teal-600 bg-teal-600 text-white" : "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-200"}`}>{tag}</button>) : <p className="text-sm text-slate-500">Assign tags to begin filtering.</p>}</div>{activeTag && <Button className="mt-4" variant="ghost" size="sm" onClick={() => setActiveTag(null)}><X className="mr-1.5 h-3.5 w-3.5" /> Clear tag filter</Button>}<Button className="mt-6 w-full" variant="outline" onClick={onExport}><Download className="mr-2 h-4 w-4" /> Export tag manifest</Button></Card>
    <Card className="border-slate-200 p-6 dark:border-slate-800"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600 dark:text-teal-400">{snapshotName}</p><h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">Input source tags</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Tag physical sources for quick patch, stage, and crew filtering. Tags are stored locally for this snapshot in this browser.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">{visibleInputs.length} of {inputs.length} sources</span></div><div className="mt-6 space-y-3">{visibleInputs.map((input) => <div key={input.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><p className="font-semibold text-slate-950 dark:text-white">{input.name || input.id}</p><p className="mt-1 text-xs text-slate-500">{input.group || "I/O"} {input.index ?? ""} · {input.gain === undefined ? "No gain data" : `${input.gain.toFixed(1)} dB`}</p></div><div className="flex flex-wrap gap-1.5">{(tags[input.id] ?? []).map((tag) => <span key={tag} className="rounded-full bg-teal-100 px-2 py-1 text-xs font-semibold text-teal-800 dark:bg-teal-950 dark:text-teal-200">{tag}</span>)}</div></div><div className="mt-4 flex flex-wrap gap-2">{suggestedSourceTags.map((tag) => { const selected = (tags[input.id] ?? []).includes(tag); return <button key={tag} onClick={() => onToggleTag(input.id, tag)} className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${selected ? "border-teal-600 bg-teal-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-teal-700 dark:hover:text-teal-300"}`}>{selected ? "✓ " : "+ "}{tag}</button>; })}</div></div>)}</div>{visibleInputs.length === 0 && <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">No sources match this filter. Clear the search or assign tags to available inputs.</div>}</Card>
  </div>;
}

export default function SourceTags() {
  const { isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: true, redirectPath: "/" });
  const [, setLocation] = useLocation();
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<number | null>(null);
  const [tagStore, setTagStore] = useState<Record<number, SourceTagMap>>({});
  const listSnapshotsQuery = trpc.snapshot.listSnapshots.useQuery(undefined, { enabled: isAuthenticated });
  const snapshotQuery = trpc.snapshot.getSnapshot.useQuery({ snapshotId: selectedSnapshotId ?? 0 }, { enabled: isAuthenticated && selectedSnapshotId !== null });

  useEffect(() => { if (selectedSnapshotId === null && listSnapshotsQuery.data?.[0]) setSelectedSnapshotId(listSnapshotsQuery.data[0].id); }, [listSnapshotsQuery.data, selectedSnapshotId]);
  useEffect(() => { if (selectedSnapshotId === null || tagStore[selectedSnapshotId] !== undefined) return; try { const saved = window.localStorage.getItem(`wingtools-source-tags:${selectedSnapshotId}`); setTagStore((current) => ({ ...current, [selectedSnapshotId]: saved ? JSON.parse(saved) : {} })); } catch { setTagStore((current) => ({ ...current, [selectedSnapshotId]: {} })); } }, [selectedSnapshotId, tagStore]);
  useEffect(() => { if (selectedSnapshotId === null || tagStore[selectedSnapshotId] === undefined) return; window.localStorage.setItem(`wingtools-source-tags:${selectedSnapshotId}`, JSON.stringify(tagStore[selectedSnapshotId])); }, [selectedSnapshotId, tagStore]);

  const parsed = snapshotQuery.data?.parsed as { inputs?: SnapshotInput[] } | undefined;
  const inputs = Array.isArray(parsed?.inputs) ? parsed.inputs : [];
  const tags = selectedSnapshotId === null ? {} : tagStore[selectedSnapshotId] ?? {};
  const updateTag = (inputId: string, tag: string) => { if (selectedSnapshotId === null) return; setTagStore((current) => ({ ...current, [selectedSnapshotId]: toggleSourceTag(current[selectedSnapshotId] ?? {}, inputId, tag) })); };
  const exportManifest = () => { if (selectedSnapshotId === null || !snapshotQuery.data) return; const manifest = buildSourceTagManifest(selectedSnapshotId, snapshotQuery.data.filename, inputs, tags); const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" }); const url = window.URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `${snapshotQuery.data.filename.replace(/\.snap$/i, "")}-source-tags.json`; link.click(); window.URL.revokeObjectURL(url); toast.success("Source tag manifest downloaded."); };

  if (loading || !isAuthenticated) return <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div>;

  return <div className="min-h-screen bg-gradient-to-b from-slate-50 to-teal-50/50 pb-12 dark:from-slate-950 dark:to-slate-950"><header className="border-b border-slate-200 bg-white/90 dark:border-slate-800 dark:bg-slate-950/90"><div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-6 sm:px-6 lg:px-8"><Button variant="ghost" size="icon" onClick={() => setLocation("/uploader")} aria-label="Back to uploads"><ArrowLeft className="h-5 w-5" /></Button><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600 dark:text-teal-400">WING snapshot workspace</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Source & Tag System</h1><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Keep physical input sources searchable and crew-ready with snapshot-specific tags.</p></div></div></header><main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><Card className="mb-6 border-slate-200 p-5 dark:border-slate-800"><div className="flex items-center gap-3"><Tags className="h-5 w-5 text-teal-600 dark:text-teal-400" /><div><h2 className="font-bold text-slate-950 dark:text-white">Select a snapshot</h2><p className="text-sm text-slate-600 dark:text-slate-400">Tags are scoped to the selected uploaded snapshot.</p></div></div>{listSnapshotsQuery.isLoading ? <div className="mt-4 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading snapshots…</div> : listSnapshotsQuery.data?.length ? <div className="mt-4 flex flex-wrap gap-2">{listSnapshotsQuery.data.map((snapshot) => <button key={snapshot.id} onClick={() => setSelectedSnapshotId(snapshot.id)} className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${selectedSnapshotId === snapshot.id ? "border-teal-600 bg-teal-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"}`}>{snapshot.filename}</button>)}</div> : <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Upload a snapshot to start tagging its input sources.</p>}</Card>{snapshotQuery.isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div> : selectedSnapshotId !== null && snapshotQuery.data ? <SourceTagWorkspace snapshotId={selectedSnapshotId} snapshotName={snapshotQuery.data.filename} inputs={inputs} tags={tags} onToggleTag={updateTag} onExport={exportManifest} /> : <Card className="border-dashed border-slate-300 p-10 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400"><Tag className="mx-auto h-8 w-8 text-teal-500" /><p className="mt-3 font-semibold text-slate-900 dark:text-white">Choose a snapshot to begin</p><p className="mt-1">Source tags will remain local to this browser and can be exported as a JSON manifest for the crew.</p></Card>}</main></div>;
}

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getOscChannelReference, wingRemoteFacts } from "@/lib/oscReference";
import { trpc } from "@/lib/trpc";
import { Activity, ArrowLeft, Copy, Database, Info, Layers3, Loader2, Network, Radio, ShieldCheck, TerminalSquare } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export type SnapshotChannel = {
  index: number;
  name?: string;
  inputSource?: { group?: string; index?: number };
  routes?: unknown[];
};

const treeImageUrl = "/manus-storage/wing-protocol-data-tree_3cfbd916.png";

export function OscCommandPreview({ channel, onCopy }: { channel: SnapshotChannel; onCopy: (command: string) => void }) {
  const reference = getOscChannelReference(channel.index);
  const channelName = channel.name || `Channel ${channel.index}`;
  const source = channel.inputSource ? `${channel.inputSource.group || "I/O"} ${channel.inputSource.index ?? ""}` : "No source is assigned to this channel in the snapshot.";

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">OSC command reference</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">{channelName} · CH {channel.index}</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{channel.inputSource ? `Patched source: ${source}` : source}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">{channel.routes?.length || 0} active routes</span>
      </div>
      <div className="mt-6 space-y-3">
        {reference.commands.map((item) => (
          <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex items-start justify-between gap-3">
              <div><p className="font-semibold text-slate-950 dark:text-white">{item.label}</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.description}</p></div>
              <Button variant="ghost" size="icon" onClick={() => onCopy(item.command)} aria-label={`Copy ${item.label} OSC example`}><Copy className="h-4 w-4" /></Button>
            </div>
            <code className="mt-3 block overflow-x-auto rounded bg-slate-950 px-3 py-2 text-xs text-emerald-300">{item.command}</code>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProtocolExplorer() {
  const { isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: true, redirectPath: "/" });
  const [, setLocation] = useLocation();
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<number | null>(null);
  const [selectedChannelIndex, setSelectedChannelIndex] = useState<number | null>(null);
  const listSnapshotsQuery = trpc.snapshot.listSnapshots.useQuery(undefined, { enabled: isAuthenticated });
  const selectedSnapshotQuery = trpc.snapshot.getSnapshot.useQuery(
    { snapshotId: selectedSnapshotId ?? 0 },
    { enabled: isAuthenticated && selectedSnapshotId !== null },
  );

  useEffect(() => {
    if (selectedSnapshotId === null && listSnapshotsQuery.data?.[0]) setSelectedSnapshotId(listSnapshotsQuery.data[0].id);
  }, [listSnapshotsQuery.data, selectedSnapshotId]);

  const channels = useMemo(() => {
    const parsed = selectedSnapshotQuery.data?.parsed as { channels?: SnapshotChannel[] } | undefined;
    return Array.isArray(parsed?.channels) ? parsed.channels : [];
  }, [selectedSnapshotQuery.data?.parsed]);

  useEffect(() => {
    if (!channels.some((channel) => channel.index === selectedChannelIndex)) setSelectedChannelIndex(channels[0]?.index ?? null);
  }, [channels, selectedChannelIndex]);

  const selectedChannel = channels.find((channel) => channel.index === selectedChannelIndex) ?? null;

  const copyCommand = async (command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      toast.success("OSC example copied to clipboard.");
    } catch {
      toast.error("Could not copy the OSC example. Please copy the text manually.");
    }
  };

  if (loading || !isAuthenticated) return <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-indigo-50/60 pb-12 dark:from-slate-950 dark:to-slate-950">
      <header className="border-b border-slate-200 bg-white/90 dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/uploader")} aria-label="Back to uploads"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">Protocol-informed workspace</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">WING Remote Protocol Explorer</h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-400">Use the snapshot model to understand WING’s data tree and create safe, documented OSC command examples. This page is a reference tool; it does not connect to or control a console.</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {wingRemoteFacts.map((fact, index) => {
            const Icon = [Network, Activity, Layers3, Radio][index];
            return <Card key={fact.label} className="border-slate-200 p-5 shadow-sm dark:border-slate-800"><Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /><p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{fact.label}</p><p className="mt-1 text-xl font-bold text-slate-950 dark:text-white">{fact.value}</p><p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{fact.detail}</p></Card>;
          })}
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
          <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-900/60"><div className="flex items-center gap-3"><Database className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /><div><h2 className="font-bold text-slate-950 dark:text-white">WING’s internal data tree</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Remote paths address leaves in a hierarchy, from the root through the audio engine and channel subtree.</p></div></div></div>
            <div className="p-5"><img src={treeImageUrl} alt="WING internal data tree showing root, audio engine, channels, channel one, and parameter leaves" className="w-full rounded-lg border border-slate-200 bg-white dark:border-slate-800" /><p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">Adapted from the user-provided <em>WING Remote Protocols</em> guide, p. 14. The diagram explains why a command path targets a precise parameter rather than a broad mixer category.</p></div>
          </Card>

          <Card className="border-indigo-200 bg-indigo-50/60 p-6 dark:border-indigo-900 dark:bg-indigo-950/30"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-300" /><div><h2 className="font-bold text-slate-950 dark:text-white">Source vs. input channel</h2><p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">A <strong>source</strong> identifies the signal origin before mixing. An <strong>input channel</strong> is the processing strip that receives a patched source. Keep both labels visible when checking a patch, which is why Signal Flow now presents source and group context on each node.</p></div></div><div className="mt-5 rounded-lg border border-indigo-100 bg-white/70 p-4 text-sm text-slate-700 dark:border-indigo-900 dark:bg-slate-950/50 dark:text-slate-200"><div className="flex items-center gap-2 font-semibold"><Info className="h-4 w-4 text-indigo-500" /> Protocol-safe workflow</div><p className="mt-2">Use a snapshot to review addressing and routing first. Validate command examples against the actual console firmware and show requirements before sending any remote write.</p></div></Card>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <Card className="h-fit border-slate-200 p-5 dark:border-slate-800"><div className="flex items-center gap-3"><TerminalSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /><div><h2 className="font-bold text-slate-950 dark:text-white">Snapshot context</h2><p className="text-sm text-slate-600 dark:text-slate-400">Choose an uploaded snapshot and channel.</p></div></div>
            {listSnapshotsQuery.isLoading ? <div className="mt-5 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading snapshots…</div> : listSnapshotsQuery.data?.length ? <div className="mt-5 space-y-2">{listSnapshotsQuery.data.map((snapshot) => <button key={snapshot.id} onClick={() => setSelectedSnapshotId(snapshot.id)} className={`w-full rounded-lg border p-3 text-left transition ${selectedSnapshotId === snapshot.id ? "border-indigo-400 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/50" : "border-slate-200 hover:border-indigo-300 dark:border-slate-800 dark:hover:border-indigo-700"}`}><p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{snapshot.filename}</p><p className="mt-1 text-xs text-slate-500">{snapshot.totalChannels || 0} channels · {snapshot.mixerName || "WING"}</p></button>)}</div> : <p className="mt-5 text-sm text-slate-600 dark:text-slate-400">Upload a WING snapshot to generate command examples from its channel inventory.</p>}
          </Card>

          <Card className="border-slate-200 p-6 dark:border-slate-800">
            {selectedSnapshotQuery.isLoading ? <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Reading snapshot context…</div> : channels.length > 0 && selectedChannel ? <><div className="flex flex-wrap gap-2">{channels.slice(0, 24).map((channel) => <button key={channel.index} onClick={() => setSelectedChannelIndex(channel.index)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${channel.index === selectedChannelIndex ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 text-slate-700 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-200 dark:hover:border-indigo-700"}`}>CH {channel.index}</button>)}</div>{channels.length > 24 && <p className="mt-3 text-xs text-slate-500">Showing the first 24 channels in this quick reference.</p>}<OscCommandPreview channel={selectedChannel} onCopy={(command) => void copyCommand(command)} /></> : <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">Select a saved snapshot with normalized channels to produce its OSC command examples.</div>}
          </Card>
        </section>
      </main>
    </div>
  );
}

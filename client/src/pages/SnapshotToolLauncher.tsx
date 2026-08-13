import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { snapshotToolConfig, type SnapshotTool } from "@/lib/toolLaunchers";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowRight, FilePlus2, Loader2, Route } from "lucide-react";
import React from "react";
import { useLocation } from "wouter";

export function SnapshotToolLaunchList({ tool, snapshots, onLaunch }: { tool: SnapshotTool; snapshots: Array<{ id: number; filename: string; mixerName?: string | null; totalChannels?: number | null; totalInputs?: number | null }>; onLaunch: (snapshotId: number) => void }) {
  const config = snapshotToolConfig[tool];
  return <div className="space-y-3">{snapshots.map((snapshot) => <Card key={snapshot.id} className="flex flex-col gap-4 border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800"><div><p className="font-semibold text-slate-950 dark:text-white">{snapshot.filename}</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{snapshot.mixerName || "WING"} · {snapshot.totalChannels || 0} channels · {snapshot.totalInputs || 0} inputs</p></div><Button onClick={() => onLaunch(snapshot.id)}>{config.action}<ArrowRight className="ml-2 h-4 w-4" /></Button></Card>)}</div>;
}

export default function SnapshotToolLauncher({ tool }: { tool: SnapshotTool }) {
  const { isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: true, redirectPath: "/" });
  const [, setLocation] = useLocation();
  const config = snapshotToolConfig[tool];
  const snapshotsQuery = trpc.snapshot.listSnapshots.useQuery(undefined, { enabled: isAuthenticated });

  if (loading || !isAuthenticated) return <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>;
  return <div className="min-h-screen bg-gradient-to-b from-slate-50 to-indigo-50/50 pb-12 dark:from-slate-950 dark:to-slate-950"><header className="border-b border-slate-200 bg-white/90 dark:border-slate-800 dark:bg-slate-950/90"><div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-6 sm:px-6 lg:px-8"><Button variant="ghost" size="icon" onClick={() => setLocation("/uploader")} aria-label="Back to uploads"><ArrowLeft className="h-5 w-5" /></Button><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">Snapshot tool launcher</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{config.title}</h1><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{config.description}</p></div></div></header><main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{snapshotsQuery.isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div> : snapshotsQuery.data?.length ? <SnapshotToolLaunchList tool={tool} snapshots={snapshotsQuery.data} onLaunch={(snapshotId) => setLocation(config.path(snapshotId))} /> : <Card className="border-dashed border-slate-300 p-10 text-center dark:border-slate-700"><Route className="mx-auto h-8 w-8 text-indigo-500" /><h2 className="mt-4 font-bold text-slate-950 dark:text-white">Upload a snapshot first</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{config.title} works from an uploaded WING snapshot.</p><Button className="mt-5" onClick={() => setLocation("/uploader")}><FilePlus2 className="mr-2 h-4 w-4" /> Upload snapshot</Button></Card>}</main></div>;
}

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, FolderOpen, LockKeyholeOpen, Wrench } from "lucide-react";
import React from "react";
import { useLocation } from "wouter";

const includedTools = [
  "Unlimited snapshot uploads",
  "PDF routing documentation and Excel workbooks",
  "Signal Flow, Routing Diff, and Snapshot Linter",
  "Source Management, Source Tags, and Snapshot Generator",
  "Remote Protocol Explorer and OSC command reference",
];

export default function Pricing() {
  const [, setLocation] = useLocation();
  return <div className="min-h-screen bg-gradient-to-b from-slate-50 to-emerald-50/60 dark:from-slate-950 dark:to-slate-950"><header className="border-b border-slate-200 bg-white/90 dark:border-slate-800 dark:bg-slate-950/90"><div className="mx-auto max-w-5xl px-4 py-12 text-center sm:px-6"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><LockKeyholeOpen className="h-6 w-6" /></div><p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">Open workspace access</p><h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950 dark:text-white">All WingTools features are available</h1><p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-400">No payment, checkout, or subscription upgrade is required. Upload a WING snapshot and use the complete documentation and analysis workspace.</p></div></header><main className="mx-auto max-w-5xl px-4 py-12 sm:px-6"><Card className="border-emerald-200 bg-white p-8 shadow-sm dark:border-emerald-900 dark:bg-slate-900"><div className="grid gap-8 md:grid-cols-[1fr_auto]"><div><div className="flex items-center gap-2"><Wrench className="h-5 w-5 text-emerald-600" /><h2 className="text-2xl font-bold text-slate-950 dark:text-white">Included workspace tools</h2></div><ul className="mt-6 space-y-4">{includedTools.map((tool) => <li key={tool} className="flex gap-3 text-slate-700 dark:text-slate-200"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><span>{tool}</span></li>)}</ul></div><div className="flex items-center"><Button size="lg" onClick={() => setLocation("/uploader")}><FolderOpen className="mr-2 h-5 w-5" /> Open workspace</Button></div></div></Card><p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">Account Management now provides this access overview; it does not collect payment information.</p></main></div>;
}

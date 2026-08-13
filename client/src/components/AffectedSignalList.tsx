import { Button } from "@/components/ui/button";
import { getVisibleAffectedItems } from "@/lib/snapshotLinter";
import React, { useState } from "react";

export function AffectedSignalList({ items, initialVisibleCount = 5 }: { items: string[]; initialVisibleCount?: number }) {
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);
  const visibleItems = getVisibleAffectedItems(items, visibleCount);
  const remainingItems = items.length - visibleItems.length;

  if (items.length === 0) return null;

  return (
    <div className="mt-3 text-sm">
      <p className="mb-2 font-medium text-slate-600 dark:text-slate-400">Affected signals:</p>
      <ul className="list-disc list-inside space-y-1" aria-label="Affected signals">
        {visibleItems.map((item, index) => (
          <li key={`${item}-${index}`} className="text-slate-600 dark:text-slate-400">{item}</li>
        ))}
      </ul>

      {remainingItems > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setVisibleCount((current) => Math.min(items.length, current + 10))}
          >
            Show {Math.min(10, remainingItems)} more
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setVisibleCount(items.length)}>
            Show all {remainingItems}
          </Button>
          <span className="text-xs text-slate-500 dark:text-slate-400">Showing {visibleItems.length} of {items.length}</span>
        </div>
      )}
    </div>
  );
}

# Snapshot Generator Verification

## Responsive review — 2026-08-13

| Viewport | Verified outcome |
|---|---|
| Desktop, 1440 × 900 | The generator presents the name, channel count, bus count, and label prefix controls alongside a summary card, label preview, and both generation actions. The full action set is visible without layout overlap. |
| Mobile, 390 × 844 | The configuration controls stack into a single, touch-friendly column. The page retains its clear title, explanatory copy, and readable inputs; the action buttons and generated summary remain available in the natural scroll order. |

The generated document is verified by the same WING parser used by the workspace upload flow. It deliberately discloses that the target console should open and re-save the file to populate firmware-specific defaults before it is used in production.

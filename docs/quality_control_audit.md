# WingTools Quality-Control Audit

## Scope and outcome — 2026-08-13

The audit covered all primary workspace routes, direct tool URLs, navigation fallbacks, and the snapshot-dependent workflows used by the application. It found that several primary sidebar entries visually described a tool but opened only the User Manual, which made them appear non-functional.

| Area | Quality-control outcome |
|---|---|
| Uploads and snapshot workspace | Verified as the working entry point for file selection, saved snapshots, and downstream tools. |
| Snapshot Generator | Verified as a functional generator with download and workspace-save actions. |
| Source & Tag System | Verified as a functional snapshot-specific tagging workspace with filter and manifest export actions. |
| Routing, Signal Flow, Linter, Source Management | Repaired primary navigation with snapshot-selection launchers that lead to their existing functional per-snapshot tools. |
| My Files and Account Management | Repaired direct routes to open the working uploader workspace and pricing/account page. |
| Unavailable features | Removed Projects, Multi-Mixer Routing, Referral Program, and WinGPT from primary navigation so the app no longer presents documentation-only items as working tools. |

## Verification method

Desktop route checks used an authenticated saved snapshot. Snapshot tool launcher buttons, tag actions, tag-manifest export wiring, generated inventory previews, and generator action wiring are covered by component or helper tests. The full project regression suite and production build are run before the final checkpoint.

## Responsive route verification

| Route or workflow | Desktop verification | Mobile verification |
|---|---|---|
| `/routing-generator` | Displays the saved-snapshot launcher with a direct documentation action. | Snapshot cards and direct action remain readable and tap-sized. |
| `/signal-flow` | Displays the saved-snapshot launcher with a direct Signal Flow action. | Snapshot cards stack without horizontal overflow. |
| `/snapshot-linter` | Displays the saved-snapshot launcher with a direct linter action. | Snapshot cards stack without horizontal overflow. |
| `/source-management` | Displays the saved-snapshot launcher with a direct source-management action. | Snapshot cards stack without horizontal overflow. |
| `/source-tags` | Displays snapshot selection, source filtering, tags, and tag-manifest export. | Controls preserve a single-column, touch-friendly order. |
| `/snapshot-generator` | Displays configuration inputs, generated inventory preview, download, and workspace-save actions. | Inputs and actions remain readable in scroll order. |
| `/protocol-explorer` | Displays protocol facts, supplied visual, safety guidance, and command reference. | Facts and visual stack without horizontal overflow. |
| `/my-files` | Opens the functional upload and snapshots workspace. | The upload workspace remains readable on mobile. |
| `/account-management` | Opens the functional pricing and account page. | Pricing cards remain visible in the responsive layout. |

## Workflow-level interaction coverage

The quality-control suite now includes direct page-level checks for the Routing PDF and Excel Workbook actions, including successful blob-download execution, and for the modified `.snap` export action, including its successful download execution. It also checks Routing Diff results rendered after two loaded snapshots are selected. Exporter checks verify a valid PDF header and the complete seven-sheet Excel workbook. The mobile Source Management header was also corrected after review so its export action spans the available width rather than clipping off screen.

## Access status

The workspace now uses **payment-free access**. Upload limits and subscription-tier feature checks have been disabled, the checkout endpoint has been removed from the application router, and the former pricing page is now an access overview that directs users to the workspace. Regression tests confirm that every documented feature returns access and that no upload limit is enforced for historical Free, Basic, or Premium subscription records.

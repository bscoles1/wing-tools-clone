# Live WingTools Reference Review

The public live site was reviewed on 2026-08-13 for workflow and interface patterns that can strengthen this functional clone. The reviewed pages were the home page and the Routing Table Generator.

## Observed workflows

| Reference pattern | Live behavior | Candidate improvement for this project |
|---|---|---|
| Clear outcome selection | The Routing Generator presents Routing Details, Stagebox Labels, and Excel (XLSX) as selectable output cards before upload. | Add a pre-upload output-selector panel with explicit generated deliverables and a persistent summary after upload. |
| Upload expectation setting | The upload screen states the accepted `.snap` type and explains that upload creates routing documentation. | Add visible parser support, accepted file requirements, and a concise post-upload next-step checklist. |
| Example-driven onboarding | The live site links to example PDF, stagebox-label, and XLSX outputs. | Add accessible example-output links from the uploader and snapshot-detail screens. |
| Problem-oriented linter framing | The home page names common pre-show routing errors: stagebox patches, missing bus signals, and recording setup. | Add linter category filters and short remediation guidance linked to each finding. |
| Multi-device signal flow | The home page promotes expandable stageboxes and monitor stations with real source/output labels. | Extend the existing organization chart with source/group labels and a focused path trace for selected nodes. |

## Implementation decision

The first improvement was an upload workflow enhancement: a pre-upload **Documentation Outputs** panel that explains the three generated deliverables, sets expectations before parsing, and links users to the existing Snapshot Linter, Signal Flow, and PDF/XLSX flows after upload.

## Adopted patterns

| Reference pattern | Clone implementation | Verification |
|---|---|---|
| Outcome selection before upload | The uploader now introduces Routing Documentation, Stagebox Labels, and Excel Workbook deliverables before a user selects a file. | Desktop and mobile visual review of `/uploader`. |
| Upload expectation setting | The drop zone explains `.snap` / compatible JSON support and the `ae_data` requirement; a three-step Upload → Inspect → Export flow explains what happens next. | Desktop and mobile visual review of `/uploader`. |
| Post-upload documentation flow | The snapshot detail screen groups the Routing PDF and Excel Workbook actions, explains stagebox-label coverage, and provides a one-click copy-link action. | Desktop visual review of a saved snapshot. |
| Pre-show problem framing | Every linter finding now displays a concise, rule-specific “Recommended next step,” including safe fallback guidance for future rules. | Unit coverage in `linterRemediation.test.ts` plus the full application test suite. |

## Intentionally deferred patterns

The live site’s downloadable example artifacts are not embedded in this clone. Instead, the snapshot detail screen offers documentation generated from the user’s own WING data, avoiding the risk of confusing generic example files with a show-specific routing report. Category filtering remains deferred because the current linter results are intentionally compact and all affected signals can already be progressively revealed without hiding any findings. Richer source/group labels and selected-node path tracing in the organization-chart signal flow are also deferred; the existing chart already supports progressive branch expansion and route inspection, and those enhancements should be designed against a broader set of real-world snapshots before implementation.

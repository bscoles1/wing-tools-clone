# Project TODO

## Phase 1: Document WING Snapshot Format, Data Model, and Architecture
- [x] Document the WING snapshot format in detail, including `ae_data`, `io`, `ch`, `bus`, `mtx`, and `main` keys.
- [x] Design the internal data model for representing WING mixer configurations.
- [x] Plan the overall application architecture (frontend, backend, database interactions).

## Phase 2: Database Setup and Stripe Integration
- [x] Set up database schema for users, subscriptions, and uploaded snapshots.
- [x] Implement Stripe integration for payment processing.
- [x] Ensure tier names in database schema match 'Free', 'Basic', 'Premium'.

## Phase 3: Core .snap File Parser
- [x] Implement the core .snap file parser.
- [x] Normalize parsed data into the internal data model.
- [x] Fully implement parsing of `ae_data`, `io`, `ch`, `bus`, `mtx`, and `main` sections.
- [x] Extract routing relationships for channels, buses, and matrices.

## Phase 4: Landing Page Development
- [x] Develop the landing page with a hero section.
- [x] Create feature overview cards.
- [x] Implement a file upload call-to-action.

## Phase 5: File Uploader and Management UI
- [x] Implement drag-and-drop .snap file uploader.
- [x] Develop UI for managing uploaded files.
- [x] Implement SnapshotDetail page for viewing and managing individual snapshots.

## Phase 6: Routing Table Generator (PDF) and Excel Export
- [x] Implement Routing Table Generator for PDF output (channel lists, I/O tables, routing matrices, stagebox labels).
- [x] Implement Excel (XLSX) export for physical inputs, mixer channels, physical outputs, and routing cross-reference matrices.
- [x] Add download buttons to snapshot detail page for PDF and Excel exports.
- [x] Integrate PDF and Excel generation with tRPC procedures and feature access control.

## Phase 7: Signal Flow Diagram
- [x] Build an interactive Signal Flow Diagram visualization with collapsible groups and hover details.
- [x] Implement color-coded node visualization for inputs, channels, buses, matrices, and outputs.
- [x] Add expandable nodes to show routing connections.

## Phase 8: Routing Diff Tool
- [x] Implement the Routing Diff tool for side-by-side comparison of two .snap files.
- [x] Detect added, removed, and modified channels, buses, and matrices.
- [x] Display detailed change information for routing, sources, and levels.

## Phase 9: Snapshot Linter
- [x] Develop a rule-based Snapshot Linter for detecting configuration errors.
- [x] Implement 8 linting rules: unpatched channels, unrouted channels, muted routed channels, unrouted buses, unrouted matrices, unused inputs, high gain levels, and multiple solo channels.
- [x] Display severity levels (error, warning, info) with affected items.

## Phase 10: Source Management tool
- [x] Implement the Source Management tool for remapping source properties.
- [x] Enable downloading of modified .snap files.

## Phase 11: User Authentication and Tiered Access
- [x] Implement user authentication.
- [x] Set up tiered access levels (Free, Basic, Premium) for features.

## Phase 12: Pricing Page with Stripe Checkout
- [x] Create the pricing page with a tier comparison table.
- [x] Integrate Stripe-based payment flow for subscriptions.

## Phase 13: Integration, Testing, and Deployment
- [x] Integrate all developed features.
- [x] Conduct end-to-end testing.
- [x] Prepare for deployment and deliver the functional application to the user.

## Repair Pass
- [x] Audit and repair all reported parser, database, API, frontend, and runtime errors; add regression coverage and verify the repaired flows.

### Repair Notes
- [x] Confirm valid Behringer WING `.snap` parsing for uploaded files.
- [x] Confirm `parsedData` storage and retrieval for large normalized snapshots.
- [x] Confirm all feature pages use the current snapshot API shape.
- [x] Verify browser upload, snapshot detail, exports, visualization, diff, and linter flows.
- [x] Run TypeScript checks, Vitest tests, production build, and inspect runtime logs.
- [x] Save a repair checkpoint after all checks pass.

### Handoff
- [x] Create project handoff documentation in `HANDOFF.md`.
- [x] Update `HANDOFF.md` with final repair results and any remaining limitations.

### Scope Gaps Found During Review
- [x] Complete Source Management, Stripe integration, and remaining tier/access-control work before final project completion.
- [x] Resolve the known Signal Flow, Routing Diff, and Snapshot Linter completeness gaps recorded in `HANDOFF.md`.
- [x] Update `todo.md` and checkpoint only after verification.

## Repair Pass Log
- [x] Investigate the `parsedData` database error and snapshot upload failure.
- [x] Inspect and repair parser validation for the `ae_data` WING snapshot format.
- [x] Verify all API/UI data-shape assumptions and error handling.
- [x] Add or update Vitest regression tests for parser and upload behavior.
- [x] Verify build, tests, server logs, and browser flows.
- [x] Save the repaired project checkpoint.

## Final Repair Status
- [x] All currently reported errors repaired and verified.
- [x] Handoff documentation updated with the final status.

## Reference ZIP Alignment
- [x] Download and extract the user-provided reference ZIP from the provided URL.
- [x] Inspect files inside the ZIP to identify specific design, UI, or functional requirements.
- [x] Align the WingTools clone implementation with any unique specifications from the ZIP.
- [x] Verify build, tests, and deliver the final checkpoint.

## Signal Flow Mind Map Redesign
- [x] Replace the staged signal flow grid with a centered, branch-based mind map layout.
- [x] Preserve click-to-expand routing details, node status, and snapshot-driven signal relationships.
- [x] Verify the redesigned visualization on desktop and mobile viewports.

## Signal Flow Expansion Correction
- [x] Add controls that progressively reveal every remaining node in an expanded mind map branch.
- [x] Verify expanded branch pagination or reveal behavior for large I/O groups.

## Signal Flow Organization Chart Redesign
- [x] Replace the horizontal mind map with a top-down routing organization chart.
- [x] Preserve expandable grouped branches, progressive reveal, and the route inspector.
- [x] Verify the vertical diagram is readable on desktop and mobile layouts.

## Snapshot Linter Repair
- [x] Diagnose why Snapshot Linter analysis is not running or rendering results.
- [x] Repair linter rule execution and result display against uploaded snapshots.
- [x] Add regression coverage and verify the linter workflow.

## Snapshot Linter Full Signal Results
- [x] Replace the five-item affected-signal preview with progressive controls that reveal all affected signals.
- [x] Verify large linter findings remain readable and every signal can be viewed.

## Snapshot Linter Interactive Verification
- [x] Add and run an interactive UI test proving Show more and Show all reveal every affected signal.

## Live Reference Site Improvements
- [x] Explore the live WingTools site and document its public workflows and interaction patterns.
- [x] Compare the live reference with the current clone and select practical improvements.
- [x] Implement and verify selected improvements inspired by the reference workflows.

## Extended Live Reference Workflow Improvements
- [x] Add post-upload documentation deliverable actions and guidance beyond the upload workflow.
- [x] Add linter remediation guidance for common production issues.
- [x] Document which live-reference patterns were adopted and which are intentionally deferred.

## Signal Flow Context and Path Tracing
- [x] Review the organization-chart data model to define source, group, and selected-path relationships.
- [x] Add source and group labels to the Signal Flow visualization.
- [x] Add selected-path tracing with clear focused and muted states.
- [x] Add regression coverage and verify the enhanced diagram on desktop and mobile.

## Signal Flow UI-Level Verification
- [x] Add a component-level regression test for source/group labels and selected-path visual states.
- [x] Record the responsive verification outcome for the desktop and mobile Signal Flow controls.

## WING Remote Protocols Augmentation
- [x] Review the attached WING Remote Protocols document and catalog reusable protocol concepts and visual assets.
- [x] Select protocol-driven improvements that complement the current snapshot and routing tools.
- [x] Add a protocol explorer with remote-channel reference, connection lifecycle guidance, and the supplied data-tree visual.
- [x] Add snapshot-driven OSC channel command previews with copy support and regression coverage.
- [x] Add application navigation to the protocol explorer and protocol-aware entry points.
- [x] Implement, test, and visually verify the selected protocol-informed capabilities.

## Protocol Explorer UI-Level Verification
- [x] Add a component-level regression test for snapshot-derived OSC previews and copy behavior.
- [x] Record desktop and mobile verification outcomes for the protocol explorer’s facts, visual, and command layout.

## Snapshot Generator Repair
- [x] Inspect and reproduce the reported Snapshot Generator failure.
- [x] Implement a working Snapshot Generator route and generation workflow.
- [x] Add regression coverage and verify the repaired Snapshot Generator on desktop and mobile.

## Snapshot Generator UI-Level Verification
- [x] Add a component-level regression test for generated inventory previews and generation action wiring.
- [x] Record desktop and mobile verification outcomes for the repaired Snapshot Generator.

## Source & Tag System Repair
- [x] Inspect and reproduce the reported Source & Tag System failure.
- [x] Implement a working Source & Tag System route and tagging workflow.
- [x] Add regression coverage and verify the repaired Source & Tag System on desktop and mobile.

## Comprehensive Quality-Control Audit
- [x] Inventory every navigation route and functional workflow for audit coverage.
- [x] Validate route rendering, authenticated data loading, and primary actions across all implemented tools.
- [x] Repair confirmed non-functional routes, navigation fallbacks, and primary workflows.
- [x] Add regression coverage for repaired audit findings and record desktop/mobile verification results.
- [x] Replace documentation fallbacks for routing documents, Signal Flow, Snapshot Linter, and Source Management with functional snapshot-selection launchers.
- [x] Route sidebar entries for available tools to their functional pages rather than documentation-only pages.
- [x] Redirect direct My Files and Account Management routes to working workspace and pricing pages.
- [x] Remove unavailable product entries from the primary navigation to prevent documentation-only dead ends.
- [x] Exercise and cover pricing access entry, routing-diff comparison, snapshot export, and source-management export actions.
- [x] Record desktop/mobile verification outcomes for each repaired quality-control route.

## Payment-Free Access Conversion
- [x] Inventory subscription-tier gates and payment-dependent entry points.
- [x] Remove payment and tier restrictions from feature access, uploads, exports, and tool navigation.
- [x] Replace pricing/checkout messaging with an all-tools-available access message.
- [x] Add regression coverage and verify unrestricted feature access on desktop and mobile.

## Workflow-Level Quality-Control Coverage
- [x] Add user-facing Snapshot Detail export-action coverage for PDF and Excel workflows.
- [x] Add user-facing Source Management export-action coverage.
- [x] Add a Routing Diff UI-level comparison regression test.
- [x] Verify former tier-gated tools remain reachable and unrestricted on desktop and mobile.
- [x] Fix the Source Management mobile header so its export action remains fully visible and tappable.

## Page-Level Export and Comparison Verification
- [x] Add a page-level Routing Diff test that renders comparison results from two loaded snapshots.
- [x] Add a page-level Snapshot Detail test that runs the PDF and Excel mutation handlers and triggers downloads.
- [x] Add a page-level Source Management test that runs the modified snapshot export handler and triggers download.

## Source Information Coverage
- [x] Review the parsed data model and current routing views for source fields on inputs, channels, buses, matrices, and outputs.
- [x] Define a consistent source-label format with meaningful fallbacks for every routing entity.
- [x] Show source information for inputs, channels, buses, matrices, and outputs in the routing-focused views.
- [x] Add regression coverage and verify the source-aware layouts on desktop and mobile.

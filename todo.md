# Project TODO

## Phase 1: Document WING Snapshot Format, Data Model, and Architecture
- [x] Document the WING snapshot format in detail, including `ae_data`, `io`, `ch`, `bus`, `mtx`, and `main` keys.
- [x] Design the internal data model for representing WING mixer configurations.
- [x] Plan the overall application architecture (frontend, backend, database interactions).

## Phase 2: Database Setup and Stripe Integration
- [x] Set up database schema for users, subscriptions, and uploaded snapshots.
- [ ] Implement Stripe integration for payment processing.
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
- [ ] Implement the Source Management tool for remapping source properties.
- [ ] Enable downloading of modified .snap files.

## Phase 11: User Authentication and Tiered Access
- [ ] Implement user authentication.
- [ ] Set up tiered access levels (Free, Basic, Premium) for features.

## Phase 12: Pricing Page with Stripe Checkout
- [ ] Create the pricing page with a tier comparison table.
- [ ] Integrate Stripe-based payment flow for subscriptions.

## Phase 13: Integration, Testing, and Deployment
- [ ] Integrate all developed features.
- [ ] Conduct end-to-end testing.
- [ ] Prepare for deployment and deliver the functional application to the user.

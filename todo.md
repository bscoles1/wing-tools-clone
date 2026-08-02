# Project TODO

## Phase 1: Document WING Snapshot Format, Data Model, and Architecture
- [ ] Document the WING snapshot format in detail, including `ae_data`, `io`, `ch`, `bus`, `mtx`, and `main` keys.
- [ ] Design the internal data model for representing WING mixer configurations.
- [ ] Plan the overall application architecture (frontend, backend, database interactions).

## Phase 2: Database Setup and Stripe Integration
- [ ] Set up database schema for users, subscriptions, and uploaded snapshots.
- [ ] Implement Stripe integration for payment processing.

## Phase 3: Core .snap File Parser
- [ ] Implement the core .snap file parser.
- [ ] Normalize parsed data into the internal data model.

## Phase 4: Landing Page Development
- [ ] Develop the landing page with a hero section.
- [ ] Create feature overview cards.
- [ ] Implement a file upload call-to-action.

## Phase 5: File Uploader and Management UI
- [ ] Implement drag-and-drop .snap file uploader.
- [ ] Develop UI for managing uploaded files.

## Phase 6: Routing Table Generator (PDF) and Excel Export
- [ ] Implement Routing Table Generator for PDF output (channel lists, I/O tables, routing matrices, stagebox labels).
- [ ] Implement Excel (XLSX) export for physical inputs, mixer channels, physical outputs, and routing cross-reference matrices.

## Phase 7: Signal Flow Diagram
- [ ] Build an interactive Signal Flow Diagram visualization with collapsible groups and hover details.

## Phase 8: Routing Diff Tool
- [ ] Implement the Routing Diff tool for side-by-side comparison of two .snap files.

## Phase 9: Snapshot Linter
- [ ] Develop a rule-based Snapshot Linter for detecting configuration errors.

## Phase 10: Source Management Tool
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
- [ ] Prepare for deployment and deliver the application to the user.

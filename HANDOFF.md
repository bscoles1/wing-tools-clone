# WingTools Clone - Project Handoff Document

**Project Name:** wing-tools-clone  
**Repository:** `/home/ubuntu/wing-tools-clone`  
**Latest Checkpoint:** `e902a3f3`  
**Status:** In Development (Phases 1-9 Complete, Phases 10-13 Pending)  
**Last Updated:** August 4, 2026

---

## Executive Summary

WingTools Clone is a comprehensive web application for parsing, visualizing, and managing Behringer WING mixer snapshot files. The project provides professional documentation generation, interactive signal flow visualization, routing analysis, and configuration linting tools. The application features tiered access control (Free, Basic, Premium) with Stripe payment integration.

**Current Progress:**
- ✅ Core backend infrastructure (parser, database, API)
- ✅ Landing page and pricing page
- ✅ File upload and snapshot management
- ✅ PDF and Excel export pipelines
- ✅ Signal Flow Diagram visualization
- ✅ Routing Diff comparison tool
- ✅ Snapshot Linter with 8 detection rules
- ⏳ Source Management tool (in progress)
- ⏳ Stripe payment integration (in progress)
- ⏳ Complete authentication and tiered access (in progress)

---

## Architecture Overview

### Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React 19 + Tailwind 4 + shadcn/ui | Latest |
| **Backend** | Express 4 + tRPC 11 + Node.js | Latest |
| **Database** | MySQL 8 with Drizzle ORM | 0.44.5 |
| **Authentication** | Manus OAuth 2.0 | Built-in |
| **File Storage** | AWS S3 (via Manus) | Built-in |
| **Export** | pdfkit + xlsx | Latest |
| **Payments** | Stripe | (To be integrated) |

### Project Structure

```
wing-tools-clone/
├── client/                          # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx            # Landing page
│   │   │   ├── Pricing.tsx         # Pricing page
│   │   │   ├── Uploader.tsx        # File upload interface
│   │   │   ├── SnapshotDetail.tsx  # Snapshot management
│   │   │   ├── SignalFlowDiagram.tsx # Signal visualization
│   │   │   ├── RoutingDiff.tsx     # Comparison tool
│   │   │   ├── SnapshotLinter.tsx  # Error detection
│   │   │   └── SourceManagement.tsx # (TODO)
│   │   ├── components/             # Reusable UI components
│   │   ├── lib/trpc.ts            # tRPC client binding
│   │   └── App.tsx                # Route definitions
│   └── index.html
├── server/                          # Express backend
│   ├── parsers/
│   │   └── wingParser.ts          # WING snapshot parser
│   ├── exporters/
│   │   ├── pdfExporter.ts         # PDF generation
│   │   └── excelExporter.ts       # Excel generation
│   ├── snapshot-router.ts         # Snapshot API endpoints
│   ├── snapshots.ts               # Database query helpers
│   ├── routers.ts                 # tRPC procedure definitions
│   ├── db.ts                      # Database initialization
│   └── _core/                     # Framework infrastructure
├── drizzle/                         # Database schema
│   ├── schema.ts                  # Table definitions
│   └── migrations/                # Migration files
├── shared/                          # Shared types and constants
├── docs/
│   └── architecture.md            # Architecture documentation
├── todo.md                         # Feature tracking
└── HANDOFF.md                      # This file

```

---

## Database Schema

### Core Tables

#### `users`
- Manus OAuth integration with role-based access (admin/user)
- Tracks login history and profile information

#### `subscriptions`
- User subscription tier: Free, Basic, Premium
- Tracks subscription dates and feature access
- Enum values: `'Free'`, `'Basic'`, `'Premium'`

#### `snapshots`
- Stores uploaded WING snapshot files
- Parsed data cached as JSON in `parsedData` column
- Metadata: mixer name, model, schema version, route counts

#### `generated_documents`
- Tracks PDF and Excel exports
- Links to snapshots and users
- Stores file keys for S3 retrieval

### Key Relationships

```
users (1) ──→ (many) subscriptions
users (1) ──→ (many) snapshots
snapshots (1) ──→ (many) generated_documents
```

---

## WING Snapshot Format

### File Structure

The `.snap` file is a JSON document with the following root structure:

```json
{
  "ae_data": {
    "io": { /* Physical inputs/outputs */ },
    "ch": { /* Mixer channels */ },
    "bus": { /* Mix buses */ },
    "mtx": { /* Matrices */ },
    "main": { /* Main output */ }
  }
}
```

### Key Sections

| Section | Purpose | Parser Extracts |
|---------|---------|-----------------|
| `io` | Physical I/O configuration | Input/output groups, gain, phantom power |
| `ch` | Mixer channels | Channel names, routing, mute/solo, gain |
| `bus` | Mix buses | Bus names, routing, gain, mute |
| `mtx` | Matrix mixes | Matrix names, routing, gain, mute |
| `main` | Main output | Master fader level |

### Parsed Data Model

The parser normalizes the snapshot into:

```typescript
interface WingMixerSnapshot {
  metadata: {
    mixerName?: string;
    mixerModel?: string;
    snapshotSchema?: string;
  };
  inputs: WingInput[];
  outputs: WingOutput[];
  channels: WingChannel[];
  buses: WingBus[];
  matrices: WingMatrix[];
  summary: {
    totalInputs: number;
    totalOutputs: number;
    totalChannels: number;
    activeRoutes: number;
  };
}
```

---

## Feature Access Control

### Tier Comparison

| Feature | Free | Basic | Premium |
|---------|------|-------|---------|
| File uploads | 3/month | 20/month | Unlimited |
| Routing Table PDF | ✓ | ✓ | ✓ |
| Excel export | ✗ | ✓ | ✓ |
| Signal Flow Diagram | ✗ | ✓ | ✓ |
| Routing Diff | ✗ | ✓ | ✓ |
| Snapshot Linter | ✗ | ✓ | ✓ |
| Source Management | ✗ | ✗ | ✓ |

### Implementation

Feature access is controlled via:

1. **Database:** `subscriptions.tier` column
2. **Backend:** `hasFeatureAccess(userId, feature)` function in `server/snapshots.ts`
3. **Frontend:** Conditional rendering based on `useAuth()` hook
4. **API:** Protected procedures with tier checks

---

## Current Implementation Status

### ✅ Completed Features

#### Phase 1-3: Foundation
- WING snapshot parser with full `ae_data` extraction
- Database schema with users, subscriptions, snapshots, documents
- tRPC procedures for file upload and management

#### Phase 4-5: Frontend Core
- Landing page with hero section and feature cards
- Pricing page with tier comparison
- Drag-and-drop file uploader
- Snapshot detail page with metadata display

#### Phase 6: Export Pipelines
- PDF Routing Table Generator
  - Channel lists with gain/mute/solo status
  - I/O tables with group information
  - Routing matrices showing connections
  - Stagebox device labels
- Excel Workbook Export (7 sheets)
  - Physical Inputs
  - Mixer Channels
  - Physical Outputs
  - Mix Buses
  - Matrices
  - Cross-reference matrix
  - Summary statistics

#### Phase 7: Signal Flow Diagram
- Interactive visualization with color-coded nodes
- Input (green), Channel (blue), Bus (purple), Matrix (orange), Output (red)
- Expandable nodes showing routing connections
- Hover details and status indicators

#### Phase 8: Routing Diff Tool
- Side-by-side comparison of two snapshots
- Detects added, removed, and modified channels/buses/matrices
- Shows detailed changes: input source, gain, mute, solo, routes

#### Phase 9: Snapshot Linter
- 8 rule-based detection rules:
  1. Unpatched channels (no input source)
  2. Unrouted channels (no output routes)
  3. Muted routed channels (muted but has active routes)
  4. Unrouted buses
  5. Unrouted matrices
  6. Unused inputs
  7. High gain levels (>6dB)
  8. Multiple solo channels
- Severity levels: error, warning, info
- Affected items list for each issue

### ⏳ In Progress / Pending

#### Phase 10: Source Management Tool
- **Status:** Not started
- **Requirements:**
  - Allow remapping of source properties (gain, phantom power, stereo mode)
  - Between I/O groups
  - Download modified .snap file
  - Maintain valid JSON structure

#### Phase 11: Stripe Integration
- **Status:** Not started
- **Requirements:**
  - Payment processing for Basic and Premium tiers
  - Webhook handling for subscription events
  - Subscription management UI
  - Billing history

#### Phase 12: Authentication & Tiered Access
- **Status:** Partially complete
- **Requirements:**
  - Complete role-based access control
  - Feature gating for all tools
  - Subscription status display
  - Upgrade prompts for locked features

#### Phase 13: Testing & Deployment
- **Status:** Not started
- **Requirements:**
  - End-to-end testing
  - Performance optimization
  - Security audit
  - Production deployment

---

## Known Issues & Bugs

### Critical Issues

#### 1. Snapshot File Parsing Error
**Severity:** High  
**Status:** Reported by user  
**Description:** File upload fails with "Failed to parse snapshot file" error  
**Root Cause:** Parser validation or JSON structure mismatch  
**Affected:** `/uploader` page  
**Fix Required:** 
- Debug parser validation logic
- Check if sample files match expected structure
- Add detailed error logging

#### 2. Parsed Data Property Access
**Severity:** Medium  
**Status:** Identified during development  
**Description:** RoutingDiff and SnapshotLinter access `snapshot.parsed` but database stores `snapshot.parsedData`  
**Root Cause:** Type mismatch between database schema and component expectations  
**Fix Required:**
- Verify all components use `parsedData` (JSON string)
- Parse JSON before accessing properties
- Add type safety checks

### Minor Issues

#### 3. Signal Flow Diagram Input Connections
**Severity:** Low  
**Status:** Design limitation  
**Description:** Input nodes show empty connections array; doesn't display input→channel flow  
**Fix Required:**
- Build reverse lookup from channels to inputs
- Display end-to-end signal paths

#### 4. Routing Diff UI
**Severity:** Low  
**Status:** UX improvement needed  
**Description:** Flat diff list instead of true side-by-side comparison  
**Fix Required:**
- Implement side-by-side layout
- Add visual diff highlighting

---

## API Endpoints (tRPC Procedures)

### Snapshot Management

```typescript
// Upload and parse a snapshot
snapshot.uploadSnapshot({
  filename: string;
  fileKey: string;
  fileUrl?: string;
  rawJson: any; // Parsed JSON from .snap file
})

// Get snapshot by ID
snapshot.getSnapshot({ snapshotId: number })

// List user's snapshots
snapshot.listSnapshots()

// Delete snapshot
snapshot.deleteSnapshot({ snapshotId: number })

// Export to PDF
snapshot.exportPdf({ snapshotId: number })

// Export to Excel
snapshot.exportExcel({ snapshotId: number })
```

### Subscription Management

```typescript
// Get user's subscription
subscription.getUserSubscription()

// Upgrade subscription
subscription.upgradeSubscription({ tier: 'Basic' | 'Premium' })

// Check feature access
subscription.hasFeatureAccess({ feature: string })
```

---

## Environment Variables

### Required Secrets

All secrets are automatically injected by Manus:

```
DATABASE_URL              # MySQL connection string
JWT_SECRET               # Session signing key
VITE_APP_ID              # OAuth application ID
OAUTH_SERVER_URL         # OAuth server base URL
VITE_OAUTH_PORTAL_URL    # OAuth login portal
OWNER_OPEN_ID            # Owner's OAuth ID
OWNER_NAME               # Owner's display name
BUILT_IN_FORGE_API_URL   # Manus API endpoint
BUILT_IN_FORGE_API_KEY   # Manus API key (server-side)
VITE_FRONTEND_FORGE_API_KEY  # Manus API key (client-side)
VITE_FRONTEND_FORGE_API_URL  # Manus API endpoint (client-side)
```

### To Add (For Stripe Integration)

```
STRIPE_SECRET_KEY        # Stripe API secret key
STRIPE_PUBLISHABLE_KEY   # Stripe publishable key
STRIPE_WEBHOOK_SECRET    # Webhook signing secret
```

---

## Development Workflow

### Running Locally

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run TypeScript check
pnpm check

# Run tests
pnpm test

# Build for production
pnpm build

# Start production server
pnpm start
```

### Database Migrations

```bash
# Generate migration from schema changes
pnpm drizzle-kit generate

# Apply migrations
pnpm drizzle-kit migrate

# Or use combined command
pnpm db:push
```

### File Structure Best Practices

- **Frontend:** Keep pages under `client/src/pages/`, components under `client/src/components/`
- **Backend:** Keep routers under `server/`, database helpers under `server/db.ts`
- **Shared:** Types and constants in `shared/`
- **Assets:** Upload via `manus-upload-file` and reference URLs directly

---

## Testing Checklist

Before deploying, verify:

- [ ] File upload works with valid .snap files
- [ ] Parser correctly extracts all sections (io, ch, bus, mtx, main)
- [ ] PDF export generates valid documents
- [ ] Excel export creates 7-sheet workbook
- [ ] Signal Flow Diagram renders all node types
- [ ] Routing Diff detects all change types
- [ ] Snapshot Linter runs all 8 rules
- [ ] Tier access control enforces feature gates
- [ ] Stripe webhooks process subscription events
- [ ] Session persistence works across page reloads
- [ ] Responsive design works on mobile/tablet

---

## Next Steps for Developer

### Immediate (Critical)

1. **Fix File Parsing Error**
   - Debug `parseWingSnapshot()` function
   - Add detailed error logging
   - Test with provided sample files
   - Verify JSON structure matches parser expectations

2. **Fix Type Mismatches**
   - Audit all components accessing `snapshot.parsed` vs `snapshot.parsedData`
   - Ensure JSON parsing happens before property access
   - Add TypeScript type safety

### Short Term (This Sprint)

3. **Complete Source Management Tool**
   - Create `SourceManagement.tsx` component
   - Implement property remapping UI
   - Generate modified .snap file with `serializeWingSnapshot()`
   - Add download functionality

4. **Integrate Stripe**
   - Set up Stripe API keys in environment
   - Create subscription checkout flow
   - Implement webhook handlers
   - Add subscription management UI

5. **Complete Authentication**
   - Verify all protected procedures enforce tier checks
   - Add feature unlock prompts
   - Display subscription status in UI
   - Implement upgrade flow

### Medium Term (Next Sprint)

6. **Enhance Visualizations**
   - Improve Signal Flow Diagram with end-to-end paths
   - Implement true side-by-side Routing Diff
   - Add hover tooltips and details

7. **Expand Linter Rules**
   - Add detection for missing bus sends
   - Add detection for OFF routes
   - Implement custom rule definitions

8. **Performance Optimization**
   - Profile large snapshot files (100+ channels)
   - Optimize parser for large datasets
   - Implement pagination for snapshot lists

### Long Term (Future)

9. **Advanced Features**
   - Real-time collaboration on snapshots
   - Snapshot versioning and history
   - Custom templates and presets
   - API for third-party integrations

10. **Deployment & Monitoring**
    - Set up production monitoring
    - Implement error tracking (Sentry)
    - Create admin dashboard
    - Set up automated backups

---

## Deployment Instructions

### Prerequisites

- Node.js 22.13.0+
- pnpm 10.4.1+
- MySQL 8.0+
- Stripe account (for payments)

### Production Deployment

1. **Create checkpoint:**
   ```bash
   # Via Manus UI: Click "Publish" button after creating checkpoint
   ```

2. **Environment setup:**
   - Add Stripe keys to secrets
   - Verify all environment variables set

3. **Database:**
   - Run migrations: `pnpm db:push`
   - Verify schema: Check database UI

4. **Build:**
   ```bash
   pnpm build
   ```

5. **Deploy:**
   - Use Manus "Publish" button in Management UI
   - Monitor logs in `.manus-logs/`

---

## Support & Documentation

### Key Files

- **Architecture:** `/docs/architecture.md`
- **Parser Reference:** `/server/parsers/wingParser.ts`
- **Database Schema:** `/drizzle/schema.ts`
- **API Routes:** `/server/snapshot-router.ts`
- **Feature Tracking:** `/todo.md`

### External Resources

- [Behringer WING Manual](https://www.behringer.com/product.html?modelCode=P0D1H)
- [tRPC Documentation](https://trpc.io/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Stripe API Docs](https://stripe.com/docs/api)

---

## Contact & Questions

For questions about this project:

1. Check `/docs/architecture.md` for design decisions
2. Review `/todo.md` for feature status
3. Check `.manus-logs/` for runtime errors
4. Review git history for recent changes

---

**Document Version:** 1.0  
**Last Updated:** August 4, 2026  
**Maintained By:** Manus AI Agent

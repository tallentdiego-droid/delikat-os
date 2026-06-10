# Delikat OS — Codex Project Instructions

## 0. Read This First

You are working on Delikat OS.

This repository is not a generic demo app. It is an operating system for Delikat Restaurante HQ.

The user is not a programmer. Do not ask the user to choose between technical options unless absolutely necessary. Make the best technical decision, implement it, and explain what was changed in plain language.

The current priority is not to build more random features. The current priority is to stabilize the core HQ knowledge system.

## 1. Repository Context

GitHub repository:
- tallentdiego-droid/delikat-os

Project root inside the repo:
- project 2/

Main app stack:
- React
- TypeScript
- Vite
- TailwindCSS
- lucide-react
- Supabase JavaScript client

Important commands:

```bash
cd "project 2"
npm install
npm run dev
npm run build
npm run typecheck
```

Always work inside `project 2/`.

Do not assume the repo root itself is the app root.

## 2. Supabase Context

Supabase project:
- Project name: delikat-os
- Project ref: zjlvoxihqhqwnpdrkhqr
- Region: us-west-2

Main table:

```txt
public.delikat_documents
```

Known columns:

```txt
id bigint primary key
content text
metadata jsonb
embedding vector
created_at timestamptz
```

Known row count as of setup:

```txt
delikat_documents: 227 rows
```

Other tables exist but should not be the main source of truth:

```txt
documents_import: imported source documents
documents: old/empty upload table
delikat_embeddings: old/empty table
```

## 3. Edge Functions

Current main edge functions:

```txt
ask-delikat
sop-builder
```

Rules:
- Do not break ask-delikat.
- Chat depends on ask-delikat.
- sop-builder handles SOP generation, saving, updating, listing, and status updates.
- If frontend needs to read delikat_documents, prefer routing through sop-builder list action because the edge function uses service role and avoids RLS problems.
- Do not create random new edge functions unless there is a strong reason.

## 4. Product Vision

Delikat OS is the internal knowledge operating system for Delikat Restaurante HQ.

The long-term vision:

```txt
Delikat HQ Knowledge System
→ SOP completion engine
→ Role-based training system
→ Franchise operating portal
→ AI supervisor / audit system
```

The immediate priority:

```txt
Knowledge Architecture
```

This means the system must show:
- What SOPs already exist.
- What SOPs are missing.
- Which position needs which SOPs.
- Coverage percentage by department.
- Coverage percentage by role.
- Which SOPs need review.
- Which missing SOPs should be created next.

This is the roadmap Maricela and Delikat HQ will use to complete the manuals.

## 5. Current Business Direction

Do not focus on franchisees first.

Do not focus on training first.

Do not focus on emergency procedures first.

Do not build mobile apps.

Do not build upload pipelines unless explicitly requested.

The right order is:

1. HQ Knowledge Architecture
2. SOP Library cleanup
3. Missing SOP detection by role and department
4. SOP Builder improvements
5. Review / approval workflow
6. Role-based training paths
7. Franchise portal
8. Audits and AI supervisor

## 6. Current Modules

The app currently has these modules:
- Chat
- Knowledge Library
- SOP Builder
- Missing Processes
- Review Queue
- Franchise Preview

The module called Missing Processes is currently too broad. It should evolve into or be replaced by:

```txt
Knowledge Architecture
```

The old generic missing-process logic should not remain as the main workflow.

## 7. Source of Truth Rules

Use this table as the single source of truth for manuals, SOPs, and operational documents:

```txt
delikat_documents
```

Do not create a new documents table.

Do not use the old documents table for the core app.

Do not create duplicate knowledge systems.

Do not use fake data if real data is available.

Do not hardcode document counts.

Do not invent Supabase schema. Inspect it first.

## 8. Document Metadata Rules

Documents use metadata jsonb.

Expected metadata fields may include:

```txt
metadata.title
metadata.category
metadata.status
metadata.source_path
metadata.created_by
metadata.department
metadata.position
metadata.document_type
metadata.review_status
```

Not every document has every field. Code must handle missing metadata safely.

When creating new approved SOPs, use metadata like:

```json
{
  "title": "SOP title",
  "category": "Operations",
  "status": "approved",
  "created_by": "manual"
}
```

When creating drafts, use:

```json
{
  "title": "SOP title",
  "category": "Operations",
  "status": "draft",
  "created_by": "manual"
}
```

Do not assume all old imported documents are perfectly categorized.

## 9. Knowledge Architecture Goal

Build and stabilize the Knowledge Architecture module.

It should show role-by-role and department-by-department SOP coverage.

The point is to answer:

```txt
What does each position need to know?
Which of those processes already exist?
Which are missing?
Which are weak, too broad, outdated, or need review?
What should Maricela create next?
```

This is more useful than a generic list of missing emergency processes.

## 10. Core Departments

Use these departments as the main operating map:

```txt
Front of House
Cashier / POS
Kitchen
Bar / Café
Inventory & Purchasing
Cleaning & Maintenance
Management
HR
Emergency & Safety
Franchise Standards
```

Emergency & Safety is important but should be separate. It should not dominate the first roadmap.

## 11. Core Positions

Use these positions as the first role framework:

```txt
General Manager
Restaurant Manager
Supervisor
Cashier
Waiter
Hostess
Bartender
Barista
Line Cook
Prep Cook
Dishwasher
Purchasing
Maintenance
```

If simplifying, first version can group:

```txt
Bar / Café = Bartender + Barista
Kitchen = Line Cook + Prep Cook + Dishwasher
```

But the direction is role-based SOP coverage.

## 12. Required SOP Coverage Logic

For each position, the system should maintain a required SOP list.

Example for Waiter:

```txt
Waiter Opening Side Work
Waiter Closing Side Work
Guest Greeting Standard
Order Taking Standard
Menu Knowledge Standard
Allergy Handling Procedure
Complaint Handling for Waiters
POS Order Entry Procedure
Manual Order Taking When POS Fails
Table Maintenance During Service
Food Delivery to Table Standard
Guest Farewell Standard
Large Group Service for Waiters
Table Transfer Procedure
End-of-Meal Checkback and Payment Handoff
```

Example for Cashier:

```txt
Cashier Opening Procedure
Cashier Closing Procedure
Cash Drawer Count
Card Payment Procedure
Cash Payment Procedure
Invoice Creation Procedure
Split Check Procedure
Refund Procedure
Void or Cancel Item Procedure
Tip Handling Procedure
Cash Register Discrepancy Procedure
POS System Failure Manual Billing
Printer Failure at Cashier
End-of-Day Sales Packet
```

Example for Manager:

```txt
Daily Management Opening Review
Daily Management Closing Review
Shift Handover Between Managers
Customer Complaint Escalation
Incident Log Management
Staff No-Show Response
Cash Register Discrepancy Review
Supplier Delivery Rejection
Product Out of Stock Decision
Emergency Closure Decision
Food Safety Complaint Handling
Weekly Operations Review
Franchise Standards Compliance Check
Manager Communication With Ownership
Maintenance Issue Prioritization
POS System Failure Response
Power Outage Response
```

The exact lists can evolve, but the UI should be built around this idea:

```txt
Position → Required SOPs → Existing / Missing → Coverage %
```

## 13. Knowledge Architecture UI Requirements

The Knowledge Architecture page should include:

### Top Cards

- Documents loaded
- Required SOPs
- Missing SOPs
- Average coverage
- Positions below 80%

### Position Cards

One card per position.

Show:
- Position name
- Department
- Short description
- Coverage percentage
- Progress bar
- Existing / Required SOP count
- Missing SOP count

Coverage color rules:

```txt
0–49% = red
50–79% = yellow
80–100% = green
```

### Position Detail Drawer

When clicking a position card, open a detail panel.

Sections:

1. Existing SOPs
   - Required SOP name
   - Matched document title
   - Match confidence if available

2. Missing SOPs
   - SOP name
   - Category
   - Priority
   - Description
   - Button: Generate Draft

Generate Draft should open SOP Builder with:

```txt
Title = missing SOP title
Category = required SOP category
Description = generated explanation of what this SOP should contain
```

## 14. Matching Logic

First version can use deterministic matching:
- Normalize titles.
- Remove accents.
- Remove punctuation.
- Compare required SOP tokens against:
  - metadata.title
  - metadata.source_path
  - content preview

A document is considered a match when enough meaningful tokens overlap.

Do not make this perfect before shipping. This is a planning tool, not final audit logic.

Later version can use AI or embeddings to improve matching.

## 15. SOP Builder Rules

SOP Builder should create structured SOPs that can later support training.

Default SOP format:

```txt
PURPOSE
SCOPE
RESPONSIBILITIES
PROCEDURE
QUALITY STANDARDS
NOTES
```

Rules:
- No markdown unless the UI expects it.
- Instructions must be operational and specific.
- SOPs should be written for Delikat restaurant context.
- Generated SOPs should be editable before approval.
- Approved SOPs must be saved into delikat_documents.
- Approved SOPs must be searchable by Delikat OS chat.

## 16. Review Queue Rules

Review Queue should focus on documents with metadata.status:

```txt
draft
review
needs_update
```

Actions:
- Edit
- Approve
- Reject / mark rejected

Approving should update metadata.status to:

```txt
approved
```

Do not delete documents unless explicitly requested.

## 17. Knowledge Library Rules

Knowledge Library should read real documents from delikat_documents.

It should show:
- title
- category
- status
- created_by
- source_path
- created_at
- content preview
- full detail view

Filters:
- search
- category
- status

Do not use the old documents table for this.

## 18. Chat Rules

Chat is working and should be protected.

Do not modify ask-delikat unless explicitly asked.

If modifying chat UI, preserve:
- Sending question
- Showing answer
- Showing sources
- Chat history
- New Chat button

If chat errors, show useful error details in development, not just “Something went wrong.”

## 19. Franchise Preview Rules

Franchise Preview is not the priority now.

Keep it read-only.

Do not let franchisee preview see admin tools.

For now, it can remain a simulation.

Later it will become:
- Approved manuals only
- Role training
- Checklists
- Support request
- Ask Delikat AI

## 20. Training System Future Rules

Do not build training yet unless explicitly requested.

Training should come from Knowledge Architecture.

The training system should later be generated by role:

```txt
Role → Required SOPs → Training modules → Quizzes → Completion tracking
```

Examples:

```txt
Waiter Training Path
Cashier Training Path
Kitchen Training Path
Manager Training Path
```

But do not build this until Knowledge Architecture is stable.

## 21. Development Rules

Before making code changes:

1. Inspect existing files.
2. Identify the smallest correct change.
3. Preserve working modules.
4. Do not create duplicate systems.
5. Do not ask the user to choose technical paths when there is one best path.

After making code changes:

1. Run build.
2. Run typecheck if available.
3. Explain what changed in plain English.
4. Tell the user exactly what to test.

## 22. Communication Rules for Diego

Diego is not a programmer.

Do not say vague things like:

```txt
push to GitHub
update the dependency
change the state
wire the component
```

unless you explain exactly what action is needed.

Do not give multiple technical options.

Give the best next step only.

When code is needed, provide complete copy-paste-ready code or modify files directly if tools allow it.

Do not make Diego search for code fragments.

Do not make Diego assemble snippets.

## 23. Build Strategy

Preferred workflow now:

```txt
GitHub repo
→ Codespaces
→ Supabase real project
→ Vite browser preview
→ later Vercel deployment
```

Bolt should no longer be the main builder.

Use Bolt only for quick UI mockups if necessary.

Codex / GitHub tools should manage real code where possible.

## 24. Immediate Next Objective

Stabilize Knowledge Architecture.

Success criteria:
- Sidebar shows Knowledge Architecture.
- Page loads real document count from delikat_documents.
- Position cards show coverage.
- Position drawer shows existing and missing SOPs.
- Missing SOP can open SOP Builder prefilled.
- Chat still works.
- Knowledge Library still works.
- Build passes.

## 25. What Not To Do

Do not build upload documents.

Do not build full franchise app.

Do not build employee training yet.

Do not create a new database table for documents.

Do not delete old data.

Do not replace ask-delikat.

Do not over-focus on emergency processes.

Do not generate random SOPs without role/category context.

## 26. Current Product Decision

The right product direction is:

```txt
Delikat HQ first.
Maricela can use it to complete the internal operating system.
Then training.
Then franchisees.
```

The next useful product output is not a single SOP.

The next useful product output is a coverage dashboard showing what Delikat HQ still needs to document by role and department.

## 27. First Codex Task After Reading This File

If the user asks you to continue, first inspect:

```txt
src/App.tsx
src/api.ts
src/types.ts
src/KnowledgeLibrary.tsx
src/SOPBuilder.tsx
src/ReviewQueue.tsx
src/MissingProcesses.tsx
src/FranchisePreview.tsx
supabase/functions/sop-builder/index.ts
supabase/functions/ask-delikat/index.ts
```

Then report:

1. What is already working.
2. What is broken.
3. What duplicate or outdated module should be removed.
4. The smallest next change to stabilize Knowledge Architecture.

Do not start coding until you know the current state.

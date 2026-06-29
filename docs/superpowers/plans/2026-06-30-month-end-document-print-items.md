# Month-End Document Print Items Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add bottom selectable print-item lists to the month-end approval documents.

**Architecture:** Keep source-specific document metadata in `src/domain/documents.ts`. Render the selected metadata in `src/App.tsx` and keep styling in `src/styles.css`.

**Tech Stack:** Vite, React, TypeScript, Vitest, CSS print rules.

---

### Task 1: Domain Metadata

**Files:**
- Modify: `src/domain/documents.test.ts`
- Modify: `src/domain/documents.ts`

- [ ] **Step 1: Write the failing test**

Add tests that assert refrigerator print items, medical equipment rows, and compounding sheet items exist.

- [ ] **Step 2: Run test to verify it fails**

Run: `cmd /c npm test -- --run src/domain/documents.test.ts`

Expected: FAIL because `printItems` does not exist on month-end groups.

- [ ] **Step 3: Write minimal implementation**

Add `MonthEndPrintItem` and `DocumentEquipment` types, then attach `printItems` to each month-end group.

- [ ] **Step 4: Run test to verify it passes**

Run: `cmd /c npm test -- --run src/domain/documents.test.ts`

Expected: PASS.

### Task 2: Document UI

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Render selected print item**

Track the selected group and item IDs. Reset the item when the group changes.

- [ ] **Step 2: Add bottom list**

Render source sheet buttons and medical device buttons at the bottom of the document sheet.

- [ ] **Step 3: Connect print button**

Call the existing print helper with the selected item's orientation.

### Task 3: Docs And Verification

**Files:**
- Modify: `docs/system-map.md`

- [ ] **Step 1: Update system map**

Record that month-end documents now have source-sheet print items and medical equipment selectors.

- [ ] **Step 2: Verify**

Run: `cmd /c npm test -- --run`

Run: `cmd /c npm run build`

- [ ] **Step 3: Commit**

Run: `git add docs/superpowers/specs/2026-06-30-month-end-document-print-items-design.md docs/superpowers/plans/2026-06-30-month-end-document-print-items.md src/domain/documents.test.ts src/domain/documents.ts src/App.tsx src/styles.css docs/system-map.md`

Run: `git commit -m "feat: add month-end document print item selectors"`

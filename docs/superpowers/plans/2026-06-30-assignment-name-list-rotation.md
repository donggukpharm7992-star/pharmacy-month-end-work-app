# Assignment Name List Rotation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add editable assignment name lists and apply staff lunch and pharmacist task rotation rules.

**Architecture:** Keep assignment list defaults and rotation rules in domain modules. Bind editable lists through existing localStorage state in `src/App.tsx`.

**Tech Stack:** React, TypeScript, Vitest, Vite.

---

### Task 1: Staff Assignment Lists

**Files:**
- Modify: `src/domain/taskRotation.test.ts`
- Modify: `src/domain/taskRotation.ts`
- Modify: `src/App.tsx`

- [ ] Write tests for exported default staff time names, default 7:15 names, and lunch auto placement based on the 7:15 list.
- [ ] Run the focused test and confirm failure.
- [ ] Add options to `rotateStaffAssignments` so UI-supplied lists drive the `시 간` and `7:15~8:00` columns.
- [ ] Re-run the focused test.

### Task 2: Pharmacist Assignment Rotation

**Files:**
- Modify: `src/domain/pharmacistAssignment.test.ts`
- Modify: `src/domain/pharmacistAssignment.ts`
- Modify: `src/App.tsx`

- [ ] Write tests for fixed pharmacist names, rotating only task cells for rotating pharmacists, fixed group preservation, and merged note rows.
- [ ] Run the focused test and confirm failure.
- [ ] Add fixed/rotating pharmacist groups and rotate task payloads by month while leaving names in place.
- [ ] Render note rows as one-cell full-width rows.

### Task 3: UI And Verification

**Files:**
- Modify: `src/styles.css`
- Modify: `docs/system-map.md`

- [ ] Add editable bottom list editors for staff and pharmacist assignment tabs.
- [ ] Refresh the in-app browser preview.
- [ ] Run `cmd /c npm test -- --run`.
- [ ] Run `cmd /c npm run build`.
- [ ] Commit with `feat: add assignment name list rotation controls`.

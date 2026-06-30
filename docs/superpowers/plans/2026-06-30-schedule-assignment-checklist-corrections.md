# Schedule Assignment Checklist Corrections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct night-turn visibility, 2027 holiday marking, assignment editing/export, and monthly checklist layouts.

**Architecture:** Keep date and checklist generation in domain modules, then render those models in `src/App.tsx`. Persist assignment edits with existing localStorage helper and export selected assignment tables as Excel-readable `.xls` HTML.

**Tech Stack:** Vite, React, TypeScript, Vitest, CSS print rules, browser Blob downloads.

---

### Task 1: Date And Checklist Domain

**Files:**
- Modify: `src/domain/calendar.test.ts`
- Modify: `src/domain/schedule.test.ts`
- Modify: `src/domain/documents.test.ts`
- Modify: `src/domain/calendar.ts`
- Modify: `src/domain/schedule.ts`
- Modify: `src/domain/documents.ts`

- [ ] Add failing tests for `2027-01-01`, automatic 42-day night-turn events, and month-length checklist dates.
- [ ] Run `cmd /c npm test -- --run src/domain/calendar.test.ts src/domain/schedule.test.ts src/domain/documents.test.ts` and confirm failures.
- [ ] Add 2027 holidays, exported night-turn event builder, and checklist month helpers.
- [ ] Re-run the focused tests.

### Task 2: Assignment Editing And Excel Export

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/domain/taskRotation.ts`
- Modify: `src/domain/pharmacistAssignment.ts`
- Modify: `src/styles.css`

- [ ] Remove automatic lunch reassignment from staff rotation and default staff lunch to editable `12:30-13:30`.
- [ ] Make every staff and pharmacist assignment cell an input/textarea bound to localStorage.
- [ ] Add selected assignment Excel export button using an `.xls` HTML workbook Blob.

### Task 3: Monthly Checklist UI

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `docs/system-map.md`

- [ ] Render staff checklist sections with 1st-to-last-day columns and weekday rows.
- [ ] Render notebook checklist as a vertical month table for notebooks 1 to 4.
- [ ] Add notebook selector buttons and an all-notebooks print option.
- [ ] Update system map.

### Task 4: Verification And Preview

**Files:**
- Verify all changed files.

- [ ] Run `cmd /c npm test -- --run`.
- [ ] Run `cmd /c npm run build`.
- [ ] Refresh `http://127.0.0.1:5188/` in the in-app browser or report if browser automation times out.
- [ ] Commit with `feat: correct schedules assignments and checklist layouts`.

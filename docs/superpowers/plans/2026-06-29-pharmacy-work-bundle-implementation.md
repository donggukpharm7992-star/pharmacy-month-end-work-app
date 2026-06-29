# Pharmacy Work Bundle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a TypeScript pharmacy month-end work app with calendar, schedule, task assignment, approval documents, checklist printing, and agent documentation.

**Architecture:** Use Vite + React for the UI and pure TypeScript domain modules for scheduling, calendar, task rotation, and document grouping. Store user edits in localStorage and print with CSS page classes.

**Tech Stack:** React, TypeScript, Vite, Vitest, lucide-react, CSS.

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`

- [ ] Install dependencies with `cmd /c npm install`.
- [ ] Run tests once and confirm domain module imports fail before implementation.

### Task 2: Domain Rules

**Files:**
- Create: `src/domain/calendar.ts`
- Create: `src/domain/schedule.ts`
- Create: `src/domain/taskRotation.ts`
- Create: `src/domain/documents.ts`

- [ ] Implement calendar day generation and 2026 public holiday lookup.
- [ ] Implement night pharmacist rotation anchored on `2026-09-21`.
- [ ] Implement night staff 3-day alternating positions anchored from August schedule.
- [ ] Implement staff assignment rotation and checklist/document grouping.
- [ ] Run `cmd /c npm test -- --run` and confirm all domain tests pass.

### Task 3: React App

**Files:**
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `src/storage.ts`

- [ ] Build four main tabs and sub tabs.
- [ ] Render selected month calendar and schedule tables.
- [ ] Add editable list fields and localStorage persistence.
- [ ] Add print buttons that set print orientation classes.
- [ ] Run build and browser verification.

### Task 4: Documentation And Git

**Files:**
- Create: `AGENTS.md`
- Create: `docs/system-map.md`
- Create: `scripts/git-auto-push.ps1`

- [ ] Keep `AGENTS.md` under 100 lines.
- [ ] Document system mapping and future edit rules.
- [ ] Initialize git if needed, commit all generated files, and prepare GitHub push instructions or remote push when a remote is available.

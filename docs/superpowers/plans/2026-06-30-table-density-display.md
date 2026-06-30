# Table Density Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make checklist weekday cells shorter and keep three-name schedule cells on one line.

**Architecture:** Add a small tested schedule display helper in `src/domain/schedule.ts`, use it in `src/App.tsx`, and tune CSS in `src/styles.css`.

**Tech Stack:** TypeScript, React, Vitest, CSS.

---

### Task 1: Schedule Name Density

**Files:**
- Modify: `src/domain/schedule.test.ts`
- Modify: `src/domain/schedule.ts`
- Modify: `src/App.tsx`

- [ ] Add a failing test for `scheduleNameDensityClass`.
- [ ] Implement `scheduleNameDensityClass` so three names return `three-names`.
- [ ] Apply the class to populated schedule cells.

### Task 2: CSS Tightening

**Files:**
- Modify: `src/styles.css`

- [ ] Add nowrap and smaller font rules for `.three-names`.
- [ ] Reduce monthly checklist weekday row padding, height, and small text size.
- [ ] Verify with tests, build, and browser preview.

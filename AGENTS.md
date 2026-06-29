# AGENTS.md

## Mission

Build and maintain the pharmacy month-end work app without changing the source Excel files unless the user explicitly asks.

## Stack

- Vite + React + TypeScript
- Domain rules live in `src/domain`
- UI lives in `src/App.tsx` and `src/styles.css`
- User edits persist in browser localStorage

## Required Checks

- Run `cmd /c npm test -- --run` after domain rule changes.
- Run `cmd /c npm run build` before claiming the app builds.
- Keep this file under 100 lines.

## Important Rules

- Do not add a 비품관리 screen. That text was removed as unrelated.
- Keep the four main tabs: 근무표, 업무 분장, 월말 결재 서류, 체크리스트.
- Preserve source spreadsheets as reference data.
- Calendar public holidays are data-driven in `src/domain/calendar.ts`.
- Schedule automation belongs in `src/domain/schedule.ts`.
- Staff assignment rotation belongs in `src/domain/taskRotation.ts`.
- Print grouping belongs in `src/domain/documents.ts`.

## Editing Guidance

- Prefer adding tests before changing schedule logic.
- Keep generated UI dense and work-focused.
- Use the provided orange, blue-gray, taupe, and brown palette.
- Use `docs/system-map.md` before adding new features.


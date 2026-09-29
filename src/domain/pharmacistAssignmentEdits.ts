import {
  PharmacistAssignment,
  PharmacistAssignmentBaseline,
  PharmacistAssignmentColumnKey,
  PharmacistRotationAnchor,
  pharmacistAssignmentColumns
} from "./pharmacistAssignment";

function legacyPharmacistEditKey(rowId: string, columnKey: PharmacistAssignmentColumnKey) {
  return `${rowId}:${columnKey}`;
}

export function pharmacistMonthlyEditKey(
  year: number,
  month: number,
  rowId: string,
  columnKey: PharmacistAssignmentColumnKey
) {
  return `${year}-${String(month).padStart(2, "0")}:${legacyPharmacistEditKey(rowId, columnKey)}`;
}

export function pharmacistCellValue(
  year: number,
  month: number,
  edits: Record<string, string>,
  rowId: string,
  columnKey: PharmacistAssignmentColumnKey,
  fallback: string
) {
  const monthlyValue = edits[pharmacistMonthlyEditKey(year, month, rowId, columnKey)];
  if (monthlyValue !== undefined) return monthlyValue;
  const isOctoberOrEarlier = year < 2026 || (year === 2026 && month <= 10);
  const retainsLegacyDisplayScope = columnKey === "name" || columnKey === "code" || columnKey === "duty";
  return isOctoberOrEarlier || retainsLegacyDisplayScope
    ? edits[legacyPharmacistEditKey(rowId, columnKey)] ?? fallback
    : fallback;
}

export function capturePharmacistAssignmentSnapshot(
  year: number,
  month: number,
  assignment: PharmacistAssignment,
  edits: Record<string, string>
): PharmacistAssignmentBaseline {
  return assignment.rows.reduce<PharmacistAssignmentBaseline>((result, row) => {
    result[row.id] = Object.fromEntries(
      pharmacistAssignmentColumns.map((column) => [
        column.key,
        pharmacistCellValue(year, month, edits, row.id, column.key, row.cells[column.key].value)
      ])
    );
    return result;
  }, {});
}

export function latestPharmacistRotationAnchor(
  finalizedAssignments: Record<string, PharmacistAssignmentBaseline>,
  octoberFallback: PharmacistAssignmentBaseline,
  year: number,
  month: number
): PharmacistRotationAnchor | undefined {
  const serial = (anchorYear: number, anchorMonth: number) => anchorYear * 12 + anchorMonth;
  const target = serial(year, month);
  const finalized = Object.entries(finalizedAssignments)
    .map(([key, baseline]) => {
      const [anchorYear, anchorMonth] = key.split("-").map(Number);
      return { year: anchorYear, month: anchorMonth, baseline };
    })
    .filter((anchor) => serial(anchor.year, anchor.month) <= target)
    .sort((left, right) => serial(right.year, right.month) - serial(left.year, left.month))[0];
  if (finalized) return finalized;
  if (target < serial(2026, 10) || Object.keys(octoberFallback).length === 0) return undefined;
  return { year: 2026, month: 10, baseline: octoberFallback };
}

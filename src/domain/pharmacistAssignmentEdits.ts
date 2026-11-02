import {
  PharmacistAssignment,
  PharmacistAssignmentBaseline,
  PharmacistAssignmentColumnKey,
  PharmacistRotationAnchor,
  hasFixedPharmacistLunch,
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
  if (hasFixedPharmacistLunch(rowId) && columnKey === "lunchEarly") return "식사";
  const monthlyValue = edits[pharmacistMonthlyEditKey(year, month, rowId, columnKey)];
  if (monthlyValue !== undefined) return monthlyValue;
  const isOctoberOrEarlier = year < 2026 || (year === 2026 && month <= 10);
  const retainsLegacyDisplayScope = columnKey === "name" || columnKey === "code" || columnKey === "duty";
  return isOctoberOrEarlier || retainsLegacyDisplayScope
    ? edits[legacyPharmacistEditKey(rowId, columnKey)] ?? fallback
    : fallback;
}

export function pharmacistRowCellValue(
  year: number,
  month: number,
  edits: Record<string, string>,
  row: PharmacistAssignment["rows"][number],
  columnKey: PharmacistAssignmentColumnKey
) {
  let fallback = row.cells[columnKey].value;
  if (hasFixedPharmacistLunch(row.id) && columnKey === "lunchLate" && !fallback.trim()) {
    fallback = pharmacistCellValue(year, month, edits, row.id, "afternoonA", row.cells.afternoonA.value);
  }
  return pharmacistCellValue(year, month, edits, row.id, columnKey, fallback);
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
        pharmacistRowCellValue(year, month, edits, row, column.key)
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

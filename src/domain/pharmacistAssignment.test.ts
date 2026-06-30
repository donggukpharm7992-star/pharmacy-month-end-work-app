import { describe, expect, it } from "vitest";
import {
  buildPharmacistAssignment,
  pharmacistAssignmentColumns
} from "./pharmacistAssignment";

describe("pharmacist assignment template", () => {
  it("uses the pharmacy team assignment spreadsheet frame", () => {
    expect(pharmacistAssignmentColumns.map((column) => column.label)).toEqual([
      "이름",
      "7:15~",
      "8:00-10:00",
      "8:00-10:00 보조",
      "10:00-11:30",
      "11:30-12:30",
      "12:30-1:30",
      "1:30-3:00",
      "3:00-5:30",
      "담당업무"
    ]);

    const assignment = buildPharmacistAssignment(2026, 9);

    expect(assignment.title).toBe("** 09월 01일 ~ 09월 30일 약제팀 업무분장 **");
    expect(assignment.rows[0].cells.name.value).toBe("김옥선");
    expect(assignment.rows.some((row) => row.cells.name.value === "이지은")).toBe(true);
    expect(assignment.rows.some((row) => row.cells.name.value.startsWith("박주영"))).toBe(true);
  });

  it("makes every visible person cell manually editable", () => {
    const assignment = buildPharmacistAssignment(2026, 9);
    const personRows = assignment.rows.filter((row) => row.kind === "person");

    expect(personRows.length).toBeGreaterThan(0);
    personRows.forEach((row) => {
      pharmacistAssignmentColumns.forEach((column) => {
        expect(row.cells[column.key].editable).toBe(true);
      });
    });
  });
});

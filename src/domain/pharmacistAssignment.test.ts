import { describe, expect, it } from "vitest";
import {
  buildPharmacistAssignment,
  defaultFixedPharmacistNames,
  defaultPharmacistNameList,
  defaultRotatingPharmacistNames,
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
      "3:00-5:00",
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

  it("defines fixed and rotating pharmacist name groups for monthly task rotation", () => {
    expect(defaultPharmacistNameList).toContain("박현영");
    expect(defaultFixedPharmacistNames).toEqual([
      "김옥선",
      "송은호",
      "최윤영",
      "이정화",
      "이호연",
      "박윤선"
    ]);
    expect(defaultRotatingPharmacistNames).toEqual([
      "이지은",
      "오아라",
      "박현영",
      "박혜정",
      "김경원",
      "김수빈",
      "박주영 / (~5시 30분)"
    ]);
  });

  it("keeps pharmacist names in place while rotating only rotating-group task cells by month", () => {
    const september = buildPharmacistAssignment(2026, 9);
    const october = buildPharmacistAssignment(2026, 10);
    const septemberNames = september.rows.filter((row) => row.kind === "person").map((row) => row.cells.name.value);
    const octoberNames = october.rows.filter((row) => row.kind === "person").map((row) => row.cells.name.value);
    const fixedSeptember = september.rows.find((row) => row.cells.name.value === "김옥선");
    const fixedOctober = october.rows.find((row) => row.cells.name.value === "김옥선");
    const rotatingSeptember = september.rows.find((row) => row.cells.name.value === "이지은");
    const rotatingOctober = october.rows.find((row) => row.cells.name.value === "이지은");

    expect(octoberNames).toEqual(septemberNames);
    expect(fixedOctober?.cells.early.value).toBe(fixedSeptember?.cells.early.value);
    expect(rotatingOctober?.cells.early.value).not.toBe(rotatingSeptember?.cells.early.value);
  });

  it("uses an editable pharmacist name list without moving row positions", () => {
    const customNames = [...defaultPharmacistNameList];
    customNames[5] = "순환약사A";
    customNames[6] = "고정약사B";
    const assignment = buildPharmacistAssignment(2026, 9, {
      pharmacistNames: customNames
    });
    const personNames = assignment.rows.filter((row) => row.kind === "person").map((row) => row.cells.name.value);

    expect(personNames[5]).toBe("순환약사A");
    expect(personNames[6]).toBe("고정약사B");
    expect(personNames).toHaveLength(defaultPharmacistNameList.length);
  });

  it("keeps Park Hyunyoung afternoon cells fixed while her morning cells can rotate", () => {
    const september = buildPharmacistAssignment(2026, 9);
    const october = buildPharmacistAssignment(2026, 10);
    const septemberPark = september.rows.find((row) => row.cells.name.value === "박현영");
    const octoberPark = october.rows.find((row) => row.cells.name.value === "박현영");

    expect(septemberPark?.cells.early.value).not.toBe("외래약국");
    expect(octoberPark?.cells.early.value).not.toBe("외래약국");
    expect(octoberPark?.cells.afternoonA.value).toBe(septemberPark?.cells.afternoonA.value);
    expect(octoberPark?.cells.afternoonB.value).toBe(septemberPark?.cells.afternoonB.value);
  });

  it("assigns the anticancer sub work to Oh Ara through September without moving it to another rotating pharmacist", () => {
    const september = buildPharmacistAssignment(2026, 9);
    const ohAra = september.rows.find((row) => row.cells.name.value === "오아라");
    const kimSubin = september.rows.find((row) => row.cells.name.value === "김수빈");

    expect(ohAra?.cells.morningSupport.value).toContain("항암제실 준비 청소");
    expect(ohAra?.cells.morningMain.value).toBe("항암제 조제");
    expect(ohAra?.cells.afternoonA.value).toContain("항암제/원내제제");
    expect(ohAra?.cells.duty.value).toBe("항암제 서브(2607~)");
    expect(kimSubin?.cells.morningMain.value).not.toBe("항암제 조제");
  });

  it("keeps Shin Jinyoung on fixed ASP work without anticancer afternoon work", () => {
    const september = buildPharmacistAssignment(2026, 9);
    const october = buildPharmacistAssignment(2026, 10);

    [september, october].forEach((assignment) => {
      const shinJinyoung = assignment.rows.find((row) => row.cells.name.value === "신진영");
      expect(shinJinyoung?.cells.morningMain.value).toBe("ASP 임상업무");
      expect(shinJinyoung?.cells.afternoonA.value).toBe("ASP 임상업무");
      expect(shinJinyoung?.cells.afternoonB.value).toBe("");
    });
  });

  it("marks bottom note rows as merged full-width rows", () => {
    const assignment = buildPharmacistAssignment(2026, 9);
    const noteRows = assignment.rows.filter((row) => row.kind === "note");

    expect(noteRows).toHaveLength(2);
    expect(noteRows.every((row) => row.merged)).toBe(true);
    expect(noteRows[0].cells.name.value).toContain("항암제실 PRN 시");
    expect(noteRows[1].cells.name.value).toContain("night");
  });
});

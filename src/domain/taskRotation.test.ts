import { describe, expect, it } from "vitest";
import {
  rotateStaffAssignments,
  staffAssignmentColumns,
  staffAssignmentTemplate
} from "./taskRotation";

describe("staff task assignment rotation", () => {
  it("keeps the source spreadsheet columns for staff task assignment", () => {
    expect(staffAssignmentColumns.map((column) => column.label)).toEqual([
      "업무",
      "시 간",
      "7:15~8:00",
      "",
      "8:00-11:30",
      "11:45-12:30",
      "12:30-13:30",
      "13:30-17:00",
      "18:00:00",
      "대청고",
      "재고 조사/유효기간",
      "약 채우기"
    ]);
  });

  it("keeps the original morning and afternoon task text from the Excel sheet", () => {
    const emergency = staffAssignmentTemplate.find((row) => row.task === "추/긴");
    const prn = staffAssignmentTemplate.find((row) => row.task === "PRN1");

    expect(emergency?.morningTask).toBe(
      "추가/긴급 접수 / 라벨붙이고 챙기기 / 검수된 약 병동 불출"
    );
    expect(emergency?.afternoonTask).toBe(
      "추가/긴급/외래 약 챙기기 / 추긴 자리 봉투 채우기, 검수된 약 병동 불출"
    );
    expect(emergency?.deepCleanTask).toBe("추긴자리,마약금고 위, 슈터근처, 외래약국");
    expect(prn?.morningTask).toContain("*휴가자 있을 시 휴가자 포지션*");
    expect(prn?.afternoonTask).toContain("신규직원교육, 오후 온도 체크");
  });

  it("rotates B-column names by moving the bottom name to the top each month", () => {
    const rotated = rotateStaffAssignments(staffAssignmentTemplate, 1);

    expect(rotated.map((row) => row.primaryName)).toEqual([
      "김서훈",
      "박종연",
      "송현우",
      "강승원",
      "박지숙",
      "김동희",
      "지현",
      "예은"
    ]);
  });

  it("rotates white-cell helper names independently", () => {
    const rotated = rotateStaffAssignments(staffAssignmentTemplate, 1);

    expect(rotated[0].helperName).toBe("지숙");
    expect(rotated[1].helperName).toBe("지현");
  });

  it("keeps lunch at 11:45-12:30 when Donghee, Jisuk, or Jihyeon are in the time column", () => {
    const protectedNames = ["김동희", "박지숙", "지현"];

    for (let monthOffset = 0; monthOffset < staffAssignmentTemplate.length; monthOffset += 1) {
      const rotated = rotateStaffAssignments(staffAssignmentTemplate, monthOffset);
      const protectedRows = rotated.filter((row) => protectedNames.includes(row.primaryName));

      expect(protectedRows.length).toBeGreaterThan(0);
      protectedRows.forEach((row) => {
        expect(row.lunchSlot).toBe("11:45-12:30");
      });
    }
  });
});

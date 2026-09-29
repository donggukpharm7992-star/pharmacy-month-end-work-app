import { describe, expect, it } from "vitest";
import {
  defaultStaffEarlyNames,
  defaultStaffTimeNames,
  latestStaffAssignmentAnchor,
  resolveStaffAssignmentEdits,
  rotateFinalizedStaffAssignments,
  rotateStaffAssignments,
  staffAssignmentMonthOffset,
  staffAssignmentColumns,
  staffAssignmentTemplate
} from "./taskRotation";

describe("staff task assignment rotation", () => {
  it("keeps the source spreadsheet columns for staff task assignment", () => {
    expect(staffAssignmentColumns.map((column) => column.label)).toEqual([
      "업무",
      "시 간",
      "7:15~8:00",
      "8:00-11:30",
      "11:45-12:30",
      "12:30-13:30",
      "13:30-17:00",
      "18:00:00",
      "대청소",
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

  it("removes powder inventory text and swaps injection and PTP duty positions", () => {
    const powder = staffAssignmentTemplate.find((row) => row.task === "산제");
    const injection = staffAssignmentTemplate.find((row) => row.task === "주사");
    const ptpReturn = staffAssignmentTemplate.find((row) => row.task === "PTP반납1");

    expect(powder?.inventoryTask ?? "").toBe("");
    expect(injection).toMatchObject({
      deepCleanTask: "주사장 청소 / (앰플, 바이알 한달씩 / 번갈아 가며 하기)",
      inventoryTask: "주사",
      medicineRefillTask: "주사/수액"
    });
    expect(ptpReturn).toMatchObject({
      deepCleanTask: "PTP 약장 정리",
      inventoryTask: "PTP",
      medicineRefillTask: "PTP"
    });
    expect(staffAssignmentTemplate[4].task).toBe("PTP반납1");
    expect(staffAssignmentTemplate[5].task).toBe("주사");
  });

  it("uses August as the base month and moves each name down one task in September", () => {
    const august = rotateStaffAssignments(staffAssignmentTemplate, 0);
    const rotated = rotateStaffAssignments(staffAssignmentTemplate, 1);

    expect(august[0].primaryName).toBe("송현우");
    expect(august[1].primaryName).toBe("심관석");
    expect(rotated.map((row) => row.primaryName)).toEqual([
      "박종연",
      "송현우",
      "심관석",
      "김지은",
      "박지숙",
      "김서훈",
      "김동희",
      "김지현"
    ]);
  });

  it("rotates the three early-duty names across emergency, topical, and PTP return tasks", () => {
    const august = rotateStaffAssignments(staffAssignmentTemplate, 0);
    const rotated = rotateStaffAssignments(staffAssignmentTemplate, 1);

    expect([august[0].helperName, august[1].helperName, august[4].helperName]).toEqual([
      "박지숙",
      "김지현",
      "김동희"
    ]);
    expect([rotated[0].helperName, rotated[1].helperName, rotated[4].helperName]).toEqual([
      "김동희",
      "박지숙",
      "김지현"
    ]);
    expect(august[5].helperName).toBeUndefined();
    expect(rotated[5].helperName).toBeUndefined();
  });

  it("exposes editable staff name lists in assignment order", () => {
    expect(defaultStaffTimeNames).toEqual([
      "송현우",
      "심관석",
      "김지은",
      "박지숙",
      "김서훈",
      "김동희",
      "김지현",
      "박종연"
    ]);
    expect(defaultStaffEarlyNames).toEqual(["박지숙", "김지현", "김동희"]);
  });

  it("uses editable lists for staff rotation and automatic lunch placement", () => {
    const rotated = rotateStaffAssignments(staffAssignmentTemplate, 1, {
      timeNames: ["직원1", "직원2", "직원3", "직원4", "직원5", "직원6", "직원7", "직원8"],
      earlyNames: ["직원3", "직원6", "직원8"]
    });

    expect(rotated[0].primaryName).toBe("직원8");
    expect(rotated[1].primaryName).toBe("직원1");
    expect(rotated[0].helperName).toBe("직원8");
    expect(rotated[1].helperName).toBe("직원3");
    expect(rotated[4].helperName).toBe("직원6");
    expect(rotated[0].lunchEarly).toBe("식사");
    expect(rotated[0].lunchLate).toBe("");
    expect(rotated[1].lunchEarly ?? "").toBe("");
    expect(rotated[1].lunchLate).toBe("식사");
    expect(rotated[1].lunchSlot).toBe("12:30-13:30");
  });

  it("counts staff assignment months from August 2026", () => {
    expect(staffAssignmentMonthOffset(2026, 8)).toBe(0);
    expect(staffAssignmentMonthOffset(2026, 9)).toBe(1);
    expect(staffAssignmentMonthOffset(2027, 8)).toBe(12);
  });

  it("uses an exported staff final as the next month's name rotation while keeping edited task text fixed", () => {
    const novemberFinal = rotateStaffAssignments(staffAssignmentTemplate, 3).map((row) => ({ ...row }));
    novemberFinal[0].primaryName = "수기 직원A";
    novemberFinal[0].helperName = "수기 조기A";
    novemberFinal[0].morningTask = "수기 오전 업무";
    const anchor = latestStaffAssignmentAnchor({ "2026-11": JSON.parse(JSON.stringify(novemberFinal)) }, 2026, 12);
    const december = rotateFinalizedStaffAssignments(anchor!, 2026, 12);

    expect(december[1].primaryName).toBe("수기 직원A");
    expect(december[0].morningTask).toBe("수기 오전 업무");
    expect(december[1].helperName).toBe("수기 조기A");
  });

  it("does not use an unexported staff draft as a future anchor and recomputes lunch after name edits", () => {
    const november = rotateStaffAssignments(staffAssignmentTemplate, 3);
    const draft = {
      "2026-11:0:primaryName": "박지숙",
      "2026-11:0:lunchLate": "식사"
    };
    const resolved = resolveStaffAssignmentEdits(november, draft, 2026, 11, ["박지숙"]);
    const december = rotateStaffAssignments(staffAssignmentTemplate, 4);

    expect(resolved[0].lunchEarly).toBe("식사");
    expect(resolved[0].lunchLate).toBe("");
    expect(december[0].primaryName).not.toBe("박지숙");
  });

  it("uses the current early-name list for both lunch cells after a finalized anchor", () => {
    const anchor = latestStaffAssignmentAnchor({ "2026-12": staffAssignmentTemplate }, 2027, 1)!;
    const january = rotateFinalizedStaffAssignments(anchor, 2027, 1);
    const resolved = resolveStaffAssignmentEdits(january, {}, 2027, 1, [january[0].primaryName]);

    expect(resolved[0].lunchEarly).toBe("식사");
    expect(resolved[0].lunchLate).toBe("");
    expect(resolved[1].lunchEarly).toBe("");
    expect(resolved[1].lunchLate).toBe("식사");
  });
});

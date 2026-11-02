import { describe, expect, it } from "vitest";
import { buildMonthSchedule } from "./domain/schedule";
import { buildScheduleExcel, scheduleDutyRows } from "./scheduleExcel";

describe("schedule Excel export", () => {
  it("saves a formatted, editable snapshot without formulas or changing rotation data", async () => {
    const schedule = buildMonthSchedule(2026, 11);
    const edits = { "2026-11-07:dayPharmacists": "수기약사/이승현", "2026-11-08:lowerMorningStaff": "" };
    const before = JSON.stringify({ schedule, edits });
    const workbook = await buildScheduleExcel(schedule, "휴가자 연차 2명", edits);
    const buffer = await workbook.xlsx.writeBuffer();
    const { default: ExcelJS } = await import("exceljs");
    const reloaded = new ExcelJS.Workbook();
    await reloaded.xlsx.load(buffer);
    const sheet = reloaded.getWorksheet("약제팀 근무표")!;

    expect(sheet.getCell("A1").value).toBe("2026년 11월 근무표");
    expect(sheet.getCell("A2").value).toBe("(휴가자 연차 2명)");
    expect(sheet.getCell("A1").isMerged).toBe(true);
    expect(sheet.pageSetup).toMatchObject({ paperSize: 9, orientation: "landscape", fitToWidth: 1, fitToHeight: 1 });
    expect(sheet.pageSetup.printArea).toBe(`A1:H${sheet.rowCount}`);
    expect(sheet.getColumn(1).width).toBe(19);
    expect(sheet.getColumn(2).width).toBe(22);
    // November 7 is Saturday in the second screen week: date row 13, day-duty row 17.
    const edited = sheet.getCell("G17");
    expect(edited.value).toBe("수기약사/이승현");
    expect(edited.fill).toMatchObject({ fgColor: { argb: "FFD9DDE0" } });
    expect(edited.border.bottom?.style).toBe("thin");
    expect(sheet.getCell("H19").value).toBeNull();

    const unchanged = sheet.getCell("F17").value;
    edited.value = "게시용 수정 이름";
    expect(sheet.getCell("F17").value).toBe(unchanged);
    sheet.eachRow((row) => row.eachCell((cell) => expect(cell.type).not.toBe(ExcelJS.ValueType.Formula)));
    expect(JSON.stringify({ schedule, edits })).toBe(before);
  }, 30000);

  it("includes every date, duty and event exactly as displayed across four to six week months", async () => {
    for (const [year, month] of [[2027, 2], [2026, 9], [2026, 11]]) {
      const schedule = buildMonthSchedule(year, month);
      const sheet = (await buildScheduleExcel(schedule, "부제", {})).worksheets[0];
      for (const day of schedule.days) {
        const matches: Array<{ row: number; column: number }> = [];
        sheet.eachRow((row) => row.eachCell((cell, column) => {
          if (cell.value === `${month}월${day.day}일`) matches.push({ row: row.number, column });
        }));
        expect(matches).toHaveLength(1);
        const { row, column } = matches[0];
        scheduleDutyRows.forEach((duty, index) => expect(sheet.getCell(row + index + 1, column).value).toBe(duty.get(day) || null));
        expect(sheet.getCell(row + 7, column).value).toBe(
          [day.holidayName, ...day.events.map((event) => event.title)].filter(Boolean).join("\n") || null
        );
      }
    }
  });
});

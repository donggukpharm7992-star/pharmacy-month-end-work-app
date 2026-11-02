import { buildScheduleWeeks, MonthSchedule, ScheduleDay } from "./domain/schedule";

export const scheduleDutyRows = [
  { id: "nightPharmacists", label: "17:00-익일08:00", get: (day: ScheduleDay) => day.nightPharmacists.join("/") },
  { id: "nightStaff", label: "20:00-익일07:00", get: (day: ScheduleDay) => day.nightStaff.join("/") },
  { id: "morningStaff", label: "07:15-11:15", get: (day: ScheduleDay) => day.morningStaff.join("/") },
  { id: "dayPharmacists", label: "08:00-17:00", get: (day: ScheduleDay) => day.dayPharmacists.join("/") },
  { id: "upperMorningPharmacists", label: "08:00-12:00 약사", get: (day: ScheduleDay) => day.upperMorningPharmacists.join("/") },
  { id: "lowerMorningStaff", label: "08:00-12:00 직원", get: (day: ScheduleDay) => day.lowerMorningStaff.join("/") }
];

export async function buildScheduleExcel(
  schedule: MonthSchedule,
  subtitle: string,
  edits: Record<string, string>
) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("약제팀 근무표", {
    views: [{ showGridLines: false }],
    pageSetup: {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      horizontalCentered: true,
      margins: { left: 0.24, right: 0.24, top: 0.24, bottom: 0.24, header: 0, footer: 0 }
    }
  });
  sheet.columns = [{ width: 19 }, ...Array.from({ length: 7 }, () => ({ width: 22 }))];
  sheet.mergeCells("A1:H1");
  sheet.getCell("A1").value = `${schedule.year}년 ${String(schedule.month).padStart(2, "0")}월 근무표`;
  sheet.getCell("A1").font = { name: "맑은 고딕", size: 18, bold: true };
  sheet.getRow(1).height = 28;
  sheet.mergeCells("A2:H2");
  sheet.getCell("A2").value = `(${subtitle})`;
  sheet.getCell("A2").font = { name: "맑은 고딕", size: 11 };
  sheet.getRow(2).height = 20;
  ["A1", "A2"].forEach((address) => {
    sheet.getCell(address).alignment = { horizontal: "center", vertical: "middle" };
  });

  const weeks = buildScheduleWeeks(schedule);
  const blockHeight = 620 / weeks.length;
  for (const week of weeks) {
    const header = sheet.addRow(["근무시간", "월", "화", "수", "목", "금", "토", "일"]);
    const dates = sheet.addRow([
      `${schedule.month}월 ${week.index + 1}주`,
      ...week.days.map((day) => day ? `${schedule.month}월${day.day}일` : null)
    ]);
    const duties = scheduleDutyRows.map((duty) => sheet.addRow([
      duty.label,
      ...week.days.map((day) => (day ? edits[`${day.dateKey}:${duty.id}`] ?? duty.get(day) : "") || null)
    ]));
    const events = sheet.addRow([
      "일정",
      ...week.days.map((day) => [day?.holidayName, ...day?.events.map((event) => event.title) ?? []].filter(Boolean).join("\n") || null)
    ]);
    const eventLines = Math.max(1, ...week.days.map((day) => (day?.events.length ?? 0) + (day?.holidayName ? 1 : 0)));
    const eventHeight = Math.max(blockHeight * 0.18, eventLines * 11);
    const ordinaryHeight = (blockHeight - eventHeight) / 8;
    for (const row of [header, dates, ...duties, events]) {
      row.height = row === events ? eventHeight : ordinaryHeight;
      for (let index = 1; index <= 8; index += 1) {
        const cell = row.getCell(index);
        const day = week.days[index - 2];
        const offDay = day && (day.weekday === 0 || day.weekday === 6 || day.holiday);
        const background = row === header ? "EEF2F4" : index === 1 ? "FAFAFA" : !day ? "F5F6F6" : offDay ? "D9DDE0" : "FFFFFF";
        cell.font = { name: "맑은 고딕", size: 10, bold: row === header || row === dates || row === events || index === 1 };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: row === events, shrinkToFit: row !== events };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${background}` } };
        const edge = { style: "thin" as const, color: { argb: "FF66717A" } };
        cell.border = { top: edge, bottom: edge, left: edge, right: edge };
        cell.numFmt = "@";
      }
    }
  }
  sheet.pageSetup.printArea = `A1:H${sheet.rowCount}`;
  return workbook;
}

export async function downloadScheduleExcel(schedule: MonthSchedule, subtitle: string, edits: Record<string, string>) {
  const workbook = await buildScheduleExcel(schedule, subtitle, edits);
  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([new Uint8Array(buffer)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `약제팀_근무표_${schedule.year}-${String(schedule.month).padStart(2, "0")}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

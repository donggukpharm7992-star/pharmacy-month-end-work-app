import { describe, expect, it } from "vitest";
import {
  buildMonthDays,
  getHolidayName,
  isHoliday,
  isWeekend,
  toDateKey
} from "./calendar";

describe("calendar rules", () => {
  it("marks weekends and 2026 Korean public holidays for the selected month", () => {
    expect(toDateKey(2026, 9, 24)).toBe("2026-09-24");
    expect(isHoliday("2026-09-24")).toBe(true);
    expect(getHolidayName("2026-09-24")).toBe("추석 연휴");
    expect(isHoliday("2026-09-28")).toBe(false);
    expect(isWeekend(new Date(2026, 8, 26))).toBe(true);
  });

  it("builds a full month model with empty leading cells and event badges", () => {
    const days = buildMonthDays(2026, 9, [
      { date: "2026-09-21", title: "나이트 턴 변경", type: "turn" }
    ]);

    expect(days[0].kind).toBe("blank");
    expect(days.filter((day) => day.kind === "day")).toHaveLength(30);
    expect(days.find((day) => day.dateKey === "2026-09-21")?.events).toHaveLength(1);
    expect(days.find((day) => day.dateKey === "2026-09-24")?.holidayName).toBe("추석 연휴");
  });
});


import { describe, expect, it } from "vitest";
import {
  assignNightPharmacists,
  assignNightStaff,
  buildMonthSchedule,
  buildScheduleWeeks,
  rotateNightPharmacists
} from "./schedule";

describe("schedule rules", () => {
  it("moves the fourth night pharmacist to the end on 2026-09-21 and repeats every six weeks", () => {
    const base = ["윤주원", "정순미", "송유희", "이상훈", "장소희", "김동신"];

    expect(rotateNightPharmacists(base, "2026-09-20")).toEqual(base);
    expect(rotateNightPharmacists(base, "2026-09-21")).toEqual([
      "윤주원",
      "정순미",
      "송유희",
      "장소희",
      "김동신",
      "이상훈"
    ]);
  });

  it("pairs night pharmacists by positions 1+4, 2+5, and 3+6", () => {
    const names = ["윤주원", "정순미", "송유희", "이상훈", "장소희", "김동신"];

    expect(assignNightPharmacists("2026-09-01", names)).toEqual(["윤주원", "이상훈"]);
    expect(assignNightPharmacists("2026-09-02", names)).toEqual(["정순미", "장소희"]);
    expect(assignNightPharmacists("2026-09-03", names)).toEqual(["송유희", "김동신"]);
    expect(assignNightPharmacists("2026-09-04", names)).toEqual(["윤주원", "이상훈"]);
  });

  it("assigns night staff by staggered three-day position alternation from the August schedule", () => {
    const positions = [
      ["이율경", "고우리"],
      ["전다은", "신혜정"],
      ["이현주", "현경아"]
    ];

    expect(assignNightStaff("2026-09-01", positions)).toEqual(["고우리", "신혜정", "현경아"]);
    expect(assignNightStaff("2026-09-02", positions)).toEqual(["고우리", "전다은", "현경아"]);
    expect(assignNightStaff("2026-09-03", positions)).toEqual(["고우리", "전다은", "이현주"]);
    expect(assignNightStaff("2026-09-04", positions)).toEqual(["이율경", "전다은", "이현주"]);
  });

  it("builds the selected month schedule with event dates surfaced beside the table", () => {
    const schedule = buildMonthSchedule(2026, 9, {
      eventDates: {
        expiryReview: "2026-09-08",
        monthlyMeeting: "2026-09-15",
        deepClean: "2026-09-17",
        oralInventory: "2026-09-22",
        injectionInventory: "2026-09-23",
        staffTaskChange: "2026-09-30"
      }
    });

    expect(schedule.days).toHaveLength(30);
    expect(schedule.events).toContainEqual({
      date: "2026-09-08",
      title: "유효기간 조사일",
      type: "expiryReview"
    });
    expect(schedule.days.find((day) => day.dateKey === "2026-09-15")?.events).toContainEqual({
      date: "2026-09-15",
      title: "월례회의",
      type: "monthlyMeeting"
    });
    expect(schedule.days.find((day) => day.dateKey === "2026-09-26")?.morningStaff).toHaveLength(2);
  });

  it("groups the month schedule into Monday-to-Sunday week blocks", () => {
    const schedule = buildMonthSchedule(2026, 9);
    const weeks = buildScheduleWeeks(schedule);

    expect(weeks[0].days.map((day) => day?.day ?? null)).toEqual([null, 1, 2, 3, 4, 5, 6]);
    expect(weeks[1].days.map((day) => day?.day ?? null)).toEqual([7, 8, 9, 10, 11, 12, 13]);
  });
});

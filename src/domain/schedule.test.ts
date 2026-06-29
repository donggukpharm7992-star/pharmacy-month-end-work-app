import { describe, expect, it } from "vitest";
import {
  assignNightPharmacists,
  assignNightStaff,
  buildMonthSchedule,
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

  it("assigns two night pharmacists per date from the rotated list", () => {
    const names = ["윤주원", "정순미", "송유희", "이상훈", "장소희", "김동신"];

    expect(assignNightPharmacists("2026-09-21", names)).toEqual(["윤주원", "정순미"]);
    expect(assignNightPharmacists("2026-09-22", names)).toEqual(["송유희", "장소희"]);
  });

  it("assigns night staff by three positions with three-day alternation", () => {
    const positions = [
      ["이율경", "고우리"],
      ["전다은", "신혜정"],
      ["이현주", "현경아"]
    ];

    expect(assignNightStaff("2026-09-01", positions)).toEqual(["고우리", "신혜정", "현경아"]);
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
    expect(schedule.days.find((day) => day.dateKey === "2026-09-26")?.morningStaff).toHaveLength(2);
  });
});


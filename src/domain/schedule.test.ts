import { describe, expect, it } from "vitest";
import {
  assignNightPharmacists,
  assignNightStaff,
  buildMonthSchedule,
  buildNightPharmacistTurnEvents,
  buildScheduleWeeks,
  rotateNightPharmacists,
  scheduleNameDensityClass
} from "./schedule";

describe("schedule rules", () => {
  it("moves the fourth night pharmacist to the end on August 10 and every six weeks", () => {
    const base = ["윤주원", "정순미", "송유희", "김동신", "이상훈", "장소희"];

    expect(rotateNightPharmacists(base, "2026-08-09")).toEqual(base);
    expect(rotateNightPharmacists(base, "2026-08-10")).toEqual([
      "윤주원",
      "정순미",
      "송유희",
      "이상훈",
      "장소희",
      "김동신"
    ]);
    expect(rotateNightPharmacists(base, "2026-09-21")).toEqual([
      "윤주원",
      "정순미",
      "송유희",
      "장소희",
      "김동신",
      "이상훈"
    ]);
  });

  it("repeats six ordered night pharmacist combinations", () => {
    const names = ["윤주원", "정순미", "송유희", "김동신", "이상훈", "장소희"];

    expect(assignNightPharmacists("2026-08-04", names)).toEqual(["윤주원", "김동신"]);
    expect(assignNightPharmacists("2026-08-05", names)).toEqual(["정순미", "이상훈"]);
    expect(assignNightPharmacists("2026-08-06", names)).toEqual(["송유희", "장소희"]);
    expect(assignNightPharmacists("2026-08-07", names)).toEqual(["김동신", "윤주원"]);
    expect(assignNightPharmacists("2026-08-08", names)).toEqual(["이상훈", "정순미"]);
    expect(assignNightPharmacists("2026-08-09", names)).toEqual(["장소희", "송유희"]);
  });

  it("starts August 1 with positions 4+1 and applies the August 10 turn", () => {
    const names = ["윤주원", "정순미", "송유희", "김동신", "이상훈", "장소희"];

    expect(assignNightPharmacists("2026-08-01", names)).toEqual(["김동신", "윤주원"]);
    expect(assignNightPharmacists("2026-08-02", names)).toEqual(["이상훈", "정순미"]);
    expect(assignNightPharmacists("2026-08-03", names)).toEqual(["장소희", "송유희"]);
    expect(assignNightPharmacists("2026-08-10", names)).toEqual(["윤주원", "이상훈"]);
    expect(assignNightPharmacists("2026-08-11", names)).toEqual(["정순미", "장소희"]);
    expect(assignNightPharmacists("2026-08-12", names)).toEqual(["송유희", "김동신"]);
  });

  it("moves the current fourth pharmacist to position 6 again on September 21", () => {
    const names = ["윤주원", "정순미", "송유희", "김동신", "이상훈", "장소희"];

    expect(assignNightPharmacists("2026-09-21", names)).toEqual(["윤주원", "장소희"]);
    expect(assignNightPharmacists("2026-09-22", names)).toEqual(["정순미", "김동신"]);
    expect(assignNightPharmacists("2026-09-24", names)).toEqual(["장소희", "윤주원"]);
  });

  it("uses the August default order and turn date", () => {
    const names = ["윤주원", "정순미", "송유희", "김동신", "이상훈", "장소희"];

    expect(assignNightPharmacists("2026-08-01", names)).toEqual(["김동신", "윤주원"]);
    expect(assignNightPharmacists("2026-08-10", names)).toEqual(["윤주원", "이상훈"]);
    expect(assignNightPharmacists("2026-09-21", names)).toEqual(["윤주원", "장소희"]);
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

  it("keeps legacy slash-joined night staff positions working after a name edit", () => {
    const legacyPositions = [
      ["이율경/고우리"],
      ["전다은/신혜정"],
      ["이현주/현경아"]
    ];

    expect(assignNightStaff("2026-09-01", legacyPositions)).toEqual(["고우리", "신혜정", "현경아"]);
  });

  it("keeps three night staff on every August date", () => {
    const schedule = buildMonthSchedule(2026, 8);

    expect(schedule.days.every((day) => day.nightStaff.length === 3)).toBe(true);
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

  it("surfaces automatic night pharmacist turn changes every six weeks", () => {
    expect(buildNightPharmacistTurnEvents(2026, 8)).toContainEqual({
      date: "2026-08-10",
      title: "나이트 턴 변경",
      type: "turn"
    });
    expect(buildNightPharmacistTurnEvents(2026, 9)).toContainEqual({
      date: "2026-09-21",
      title: "나이트 턴 변경",
      type: "turn"
    });
    expect(buildNightPharmacistTurnEvents(2026, 11)).toContainEqual({
      date: "2026-11-02",
      title: "나이트 턴 변경",
      type: "turn"
    });
  });

  it("keeps Seo Yunseok fixed only on Sundays, not on holidays", () => {
    const schedule = buildMonthSchedule(2026, 9);
    const sunday = schedule.days.find((day) => day.dateKey === "2026-09-06");
    const holiday = schedule.days.find((day) => day.dateKey === "2026-09-24");

    expect(sunday?.dayPharmacists).toContain("서윤석");
    expect(holiday?.dayPharmacists).toHaveLength(2);
    expect(holiday?.dayPharmacists).not.toContain("서윤석");
  });

  it("groups the month schedule into Monday-to-Sunday week blocks", () => {
    const schedule = buildMonthSchedule(2026, 9);
    const weeks = buildScheduleWeeks(schedule);

    expect(weeks[0].days.map((day) => day?.day ?? null)).toEqual([null, 1, 2, 3, 4, 5, 6]);
    expect(weeks[1].days.map((day) => day?.day ?? null)).toEqual([7, 8, 9, 10, 11, 12, 13]);
  });

  it("classifies schedule cells by slash-separated name count", () => {
    expect(scheduleNameDensityClass("고우리/신혜정/현경아")).toBe("three-names");
    expect(scheduleNameDensityClass("윤주원/이상훈")).toBe("two-names");
    expect(scheduleNameDensityClass("")).toBe("");
  });
});

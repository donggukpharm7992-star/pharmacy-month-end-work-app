import {
  CalendarEvent,
  dateKeyToDate,
  daysInMonth,
  isHoliday,
  toDateKey
} from "./calendar";

export type EventDateKey =
  | "expiryReview"
  | "monthlyMeeting"
  | "deepClean"
  | "oralInventory"
  | "injectionInventory"
  | "staffTaskChange";

export type ScheduleEventDates = Partial<Record<EventDateKey, string>>;

export type MonthScheduleOptions = {
  eventDates?: ScheduleEventDates;
  nightPharmacists?: string[];
  nightStaffPositions?: string[][];
  weekendStaff?: string[];
  weekendPharmacists?: string[];
};

export type ScheduleDay = {
  dateKey: string;
  day: number;
  weekday: number;
  holiday: boolean;
  nightPharmacists: string[];
  nightStaff: string[];
  morningStaff: string[];
  lowerMorningStaff: string[];
  dayPharmacists: string[];
  upperMorningPharmacists: string[];
  notes: string[];
};

export type MonthSchedule = {
  year: number;
  month: number;
  days: ScheduleDay[];
  events: CalendarEvent[];
};

export const defaultNightPharmacists = ["윤주원", "정순미", "송유희", "이상훈", "장소희", "김동신"];

export const defaultNightStaffPositions = [
  ["이율경", "고우리"],
  ["전다은", "신혜정"],
  ["이현주", "현경아"]
];

export const defaultWeekendStaff = [
  "김동희",
  "박종연",
  "김지은",
  "김지현",
  "강승원",
  "박지숙",
  "송현우",
  "김서훈"
];

export const defaultWeekendPharmacists = [
  "최윤영",
  "이지은",
  "오아라",
  "이정화",
  "안혜정",
  "박현영",
  "김연지",
  "이호연",
  "김경원",
  "김수빈",
  "박주영"
];

const eventTitles: Record<EventDateKey, string> = {
  expiryReview: "유효기간 조사일",
  monthlyMeeting: "월례회의",
  deepClean: "대청소",
  oralInventory: "재고 조사_경구",
  injectionInventory: "재고조사_주사",
  staffTaskChange: "직원 업무 변경일"
};

const DAY_MS = 24 * 60 * 60 * 1000;
const NIGHT_PHARMACIST_TURN_ANCHOR = "2026-09-21";
const NIGHT_STAFF_ANCHOR = "2026-09-01";

function diffDays(dateKey: string, anchorKey: string): number {
  const date = dateKeyToDate(dateKey).getTime();
  const anchor = dateKeyToDate(anchorKey).getTime();
  return Math.floor((date - anchor) / DAY_MS);
}

function moveFourthToEnd(names: string[]): string[] {
  if (names.length < 4) return [...names];
  const result = [...names];
  const [fourth] = result.splice(3, 1);
  result.push(fourth);
  return result;
}

function takeCycled<T>(items: T[], start: number, count: number): T[] {
  if (items.length === 0) return [];
  return Array.from({ length: count }, (_, offset) => items[(start + offset) % items.length]);
}

export function rotateNightPharmacists(names: string[], dateKey: string): string[] {
  const turns = Math.max(0, Math.floor(diffDays(dateKey, NIGHT_PHARMACIST_TURN_ANCHOR) / 42) + 1);
  let rotated = [...names];
  for (let index = 0; index < turns; index += 1) {
    rotated = moveFourthToEnd(rotated);
  }
  return diffDays(dateKey, NIGHT_PHARMACIST_TURN_ANCHOR) < 0 ? [...names] : rotated;
}

export function assignNightPharmacists(dateKey: string, names = defaultNightPharmacists): string[] {
  const rotated = rotateNightPharmacists(names, dateKey);
  const dayOffset = Math.max(0, diffDays(dateKey, NIGHT_PHARMACIST_TURN_ANCHOR));
  return takeCycled(rotated, dayOffset * 2, 2);
}

export function assignNightStaff(
  dateKey: string,
  positions = defaultNightStaffPositions
): string[] {
  const dayOffset = Math.max(0, diffDays(dateKey, NIGHT_STAFF_ANCHOR));
  const block = Math.floor(dayOffset / 3);
  return positions.map((pair) => pair[block % 2 === 0 ? 1 : 0]).filter(Boolean);
}

function buildEvents(eventDates: ScheduleEventDates = {}): CalendarEvent[] {
  return Object.entries(eventDates)
    .filter((entry): entry is [EventDateKey, string] => Boolean(entry[1]))
    .map(([type, date]) => ({
      date,
      title: eventTitles[type],
      type
    }));
}

function dayPharmacistNames(
  dateKey: string,
  weekday: number,
  holiday: boolean,
  month: number,
  names: string[]
): string[] {
  if (weekday !== 6 && weekday !== 0 && !holiday) return [];
  const monthShift = month % 2;
  const index = Math.abs(diffDays(dateKey, "2026-01-01")) + monthShift;
  if (weekday === 6) return [names[index % names.length], "이승현"];
  const fixedFirst = month % 2 === 1;
  const rotating = names[index % names.length];
  return fixedFirst ? ["서윤석", rotating] : [rotating, "서윤석"];
}

function upperMorningPharmacists(dateKey: string, weekday: number, names: string[]): string[] {
  if (weekday !== 6) return [];
  const reversed = [...names].reverse();
  const weekIndex = Math.floor(dateKeyToDate(dateKey).getDate() / 7);
  const count = weekIndex === 0 ? 3 : 2;
  return takeCycled(reversed, weekIndex * 2, count);
}

export function buildMonthSchedule(
  year: number,
  month: number,
  options: MonthScheduleOptions = {}
): MonthSchedule {
  const nightPharmacists = options.nightPharmacists ?? defaultNightPharmacists;
  const nightStaffPositions = options.nightStaffPositions ?? defaultNightStaffPositions;
  const weekendStaff = options.weekendStaff ?? defaultWeekendStaff;
  const weekendPharmacists = options.weekendPharmacists ?? defaultWeekendPharmacists;
  let weekendStaffCursor = 0;

  const days: ScheduleDay[] = Array.from({ length: daysInMonth(year, month) }, (_, index) => {
    const day = index + 1;
    const dateKey = toDateKey(year, month, day);
    const weekday = dateKeyToDate(dateKey).getDay();
    const holiday = isHoliday(dateKey);
    const morningStaff = weekday === 6 ? takeCycled(weekendStaff, weekendStaffCursor, 2) : [];
    if (morningStaff.length > 0) weekendStaffCursor += morningStaff.length;
    const lowerMorningStaff = weekday === 0 || holiday ? takeCycled(weekendStaff, weekendStaffCursor++, 1) : [];

    return {
      dateKey,
      day,
      weekday,
      holiday,
      nightPharmacists: assignNightPharmacists(dateKey, nightPharmacists),
      nightStaff: assignNightStaff(dateKey, nightStaffPositions),
      morningStaff,
      lowerMorningStaff,
      dayPharmacists: dayPharmacistNames(dateKey, weekday, holiday, month, weekendPharmacists),
      upperMorningPharmacists: upperMorningPharmacists(dateKey, weekday, weekendPharmacists),
      notes: []
    };
  });

  return {
    year,
    month,
    days,
    events: buildEvents(options.eventDates)
  };
}


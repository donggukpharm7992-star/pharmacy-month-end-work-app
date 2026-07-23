import {
  CalendarEvent,
  dateKeyToDate,
  daysInMonth,
  getHolidayName,
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
  nightPharmacistTurnDate?: string;
  nightStaffPositions?: string[][];
  weekendStaff?: string[];
  weekendPharmacists?: string[];
};

export type ScheduleDay = {
  dateKey: string;
  day: number;
  weekday: number;
  holiday: boolean;
  holidayName?: string;
  events: CalendarEvent[];
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

export type ScheduleWeek = {
  index: number;
  days: Array<ScheduleDay | null>;
};

export const defaultNightPharmacists = ["윤주원", "정순미", "송유희", "김동신", "이상훈", "장소희"];

export const defaultNightStaffPositions = [
  ["이율경", "고우리"],
  ["전다은", "신혜정"],
  ["이현주", "현경아"]
];

export function normalizeNightStaffPositions(positions: string[][]): string[][] {
  const names = positions
    .flatMap((pair) => pair)
    .flatMap((name) => name.split("/").map((item) => item.trim()).filter(Boolean));

  return defaultNightStaffPositions.map((defaultPair, index) => [
    names[index * 2] ?? defaultPair[0],
    names[index * 2 + 1] ?? defaultPair[1]
  ]);
}

export const defaultWeekendStaff = [
  "김동희",
  "박종연",
  "김지은",
  "김지현",
  "박지숙",
  "송현우",
  "김서훈",
  "심관석"
];

const AUGUST_2026_WEEKEND_STAFF = [
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
  expiryReview: "유효기간조사/휴가금지",
  monthlyMeeting: "월례회의",
  deepClean: "대청소_휴가금지",
  oralInventory: "재고조사_경구/휴가금지",
  injectionInventory: "재고조사/주사-휴가금지",
  staffTaskChange: "직원업무 변경"
};

const DAY_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_NIGHT_PHARMACIST_TURN_DATE = "2026-08-10";
const NIGHT_PHARMACIST_PAIR_ANCHOR = "2026-07-29";
const NIGHT_STAFF_POSITION_ANCHORS = ["2026-09-01", "2026-08-30", "2026-08-31"];
const WEEKEND_STAFF_ROTATION_ANCHOR = "2026-09-05";
const WEEKEND_STAFF_ROTATION_START_INDEX = 1;
const HOLIDAY_STAFF_ROTATION_ANCHOR = "2026-09-24";
const HOLIDAY_STAFF_ROTATION_START_INDEX = 6;

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

function modulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function takeCycled<T>(items: T[], start: number, count: number): T[] {
  if (items.length === 0) return [];
  return Array.from({ length: count }, (_, offset) => items[(start + offset) % items.length]);
}

function countWeekendStaffSlotsBefore(dateKey: string): number {
  const target = dateKeyToDate(dateKey);
  let current = dateKeyToDate(WEEKEND_STAFF_ROTATION_ANCHOR);
  let slots = 0;

  while (current < target) {
    if (current.getDay() === 6) slots += 2;
    if (current.getDay() === 0) slots += 1;
    current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1);
  }

  return slots;
}

function assignWeekendDutyStaff(dateKey: string, names: string[], count: number): string[] {
  if (names.length === 0) return [];
  const start = WEEKEND_STAFF_ROTATION_START_INDEX + countWeekendStaffSlotsBefore(dateKey);
  return takeCycled(names, modulo(start, names.length), count);
}

function countHolidayStaffSlotsBefore(dateKey: string): number {
  const target = dateKeyToDate(dateKey);
  let current = dateKeyToDate(HOLIDAY_STAFF_ROTATION_ANCHOR);
  let slots = 0;

  while (current < target) {
    const currentKey = toDateKey(current.getFullYear(), current.getMonth() + 1, current.getDate());
    if (isHoliday(currentKey)) slots += 1;
    current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1);
  }

  return slots;
}

function assignHolidayDutyStaff(dateKey: string, names: string[]): string[] {
  if (names.length === 0) return [];
  const start = HOLIDAY_STAFF_ROTATION_START_INDEX + countHolidayStaffSlotsBefore(dateKey);
  return takeCycled(names, modulo(start, names.length), 1);
}

function nthWorkingWeekdayDateKey(
  year: number,
  month: number,
  weekday: number,
  occurrence: number
): string {
  let count = 0;

  for (let day = 1; day <= daysInMonth(year, month); day += 1) {
    const dateKey = toDateKey(year, month, day);
    if (dateKeyToDate(dateKey).getDay() !== weekday || isHoliday(dateKey)) continue;
    count += 1;
    if (count === occurrence) return dateKey;
  }

  return "";
}

export function buildDefaultScheduleEventDates(year: number, month: number): ScheduleEventDates {
  return {
    expiryReview: nthWorkingWeekdayDateKey(year, month, 4, 1),
    monthlyMeeting: nthWorkingWeekdayDateKey(year, month, 2, 2),
    deepClean: nthWorkingWeekdayDateKey(year, month, 4, 2),
    oralInventory: nthWorkingWeekdayDateKey(year, month, 3, 3),
    injectionInventory: nthWorkingWeekdayDateKey(year, month, 4, 3),
    staffTaskChange: nthWorkingWeekdayDateKey(year, month, 3, 4)
  };
}

function nightPharmacistTurnCount(dateKey: string, turnDate: string): number {
  const elapsedDays = diffDays(dateKey, turnDate);
  return elapsedDays < 0 ? 0 : Math.floor(elapsedDays / 42) + 1;
}

export function rotateNightPharmacists(
  names: string[],
  dateKey: string,
  turnDate = DEFAULT_NIGHT_PHARMACIST_TURN_DATE
): string[] {
  const turns = nightPharmacistTurnCount(dateKey, turnDate);
  let rotated = [...names];
  for (let index = 0; index < turns; index += 1) {
    rotated = moveFourthToEnd(rotated);
  }
  return rotated;
}

export function assignNightPharmacists(
  dateKey: string,
  names = defaultNightPharmacists,
  turnDate = DEFAULT_NIGHT_PHARMACIST_TURN_DATE
): string[] {
  const turnCount = nightPharmacistTurnCount(dateKey, turnDate);
  const sequenceAnchor = turnCount === 0
    ? NIGHT_PHARMACIST_PAIR_ANCHOR
    : (() => {
      const cycleStart = dateKeyToDate(turnDate);
      cycleStart.setDate(cycleStart.getDate() + (turnCount - 1) * 42);
      return toDateKey(cycleStart.getFullYear(), cycleStart.getMonth() + 1, cycleStart.getDate());
    })();
  const orderedNames = rotateNightPharmacists(names, dateKey, turnDate);
  const sequenceIndex = modulo(diffDays(dateKey, sequenceAnchor), 6);
  return [
    orderedNames[sequenceIndex],
    orderedNames[(sequenceIndex + 3) % 6]
  ].filter(Boolean);
}

export function assignNightStaff(
  dateKey: string,
  positions = defaultNightStaffPositions
): string[] {
  return normalizeNightStaffPositions(positions)
    .map((pair, index) => {
      const anchor = NIGHT_STAFF_POSITION_ANCHORS[index] ?? NIGHT_STAFF_POSITION_ANCHORS[0];
      const block = Math.floor(diffDays(dateKey, anchor) / 3);
      return pair[modulo(block, 2) === 0 ? 1 : 0];
    })
    .filter(Boolean);
}

export function scheduleNameDensityClass(value: string): string {
  const nameCount = value
    .split("/")
    .map((name) => name.trim())
    .filter(Boolean).length;

  if (nameCount >= 3) return "three-names";
  if (nameCount === 2) return "two-names";
  return "";
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

export function buildNightPharmacistTurnEvents(
  year: number,
  month: number,
  turnDate = DEFAULT_NIGHT_PHARMACIST_TURN_DATE
): CalendarEvent[] {
  const firstOfMonth = dateKeyToDate(toDateKey(year, month, 1));
  const lastOfMonth = dateKeyToDate(toDateKey(year, month, daysInMonth(year, month)));
  const anchor = dateKeyToDate(turnDate);
  const events: CalendarEvent[] = [];
  let currentTurnDate = anchor;

  while (currentTurnDate < firstOfMonth) {
    currentTurnDate = new Date(currentTurnDate.getFullYear(), currentTurnDate.getMonth(), currentTurnDate.getDate() + 42);
  }

  while (currentTurnDate <= lastOfMonth) {
    events.push({
      date: toDateKey(currentTurnDate.getFullYear(), currentTurnDate.getMonth() + 1, currentTurnDate.getDate()),
      title: "나이트 턴 변경",
      type: "turn"
    });
    currentTurnDate = new Date(currentTurnDate.getFullYear(), currentTurnDate.getMonth(), currentTurnDate.getDate() + 42);
  }

  return events;
}

function dayPharmacistNames(
  dateKey: string,
  weekday: number,
  holiday: boolean,
  year: number,
  month: number,
  names: string[]
): string[] {
  if (weekday !== 6 && weekday !== 0 && !holiday) return [];
  const targetDay = dateKeyToDate(dateKey).getDate();
  let rotationSlots = 0;

  for (let day = 1; day < targetDay; day += 1) {
    const currentDateKey = toDateKey(year, month, day);
    const currentWeekday = dateKeyToDate(currentDateKey).getDay();
    if (isHoliday(currentDateKey)) {
      rotationSlots += 2;
    } else if (currentWeekday === 0) {
      rotationSlots += 1;
    } else if (currentWeekday === 6 && day > 7) {
      rotationSlots += 1;
    }
  }

  if (holiday) return takeCycled(names, rotationSlots, 2);
  if (weekday === 6 && targetDay <= 7) return ["최윤영", "이승현"];
  if (weekday === 6) return [...takeCycled(names, rotationSlots, 1), "이승현"];
  const fixedFirst = month % 2 === 1;
  const rotating = takeCycled(names, rotationSlots, 1)[0];
  if (!rotating) return ["서윤석"];
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
  const nightPharmacistTurnDate = options.nightPharmacistTurnDate ?? DEFAULT_NIGHT_PHARMACIST_TURN_DATE;
  const nightStaffPositions = normalizeNightStaffPositions(
    options.nightStaffPositions ?? defaultNightStaffPositions
  );
  const weekendStaff = options.weekendStaff ?? defaultWeekendStaff;
  const weekendPharmacists = options.weekendPharmacists ?? defaultWeekendPharmacists;
  const eventDates = options.eventDates ?? buildDefaultScheduleEventDates(year, month);
  const events = [...buildEvents(eventDates), ...buildNightPharmacistTurnEvents(year, month, nightPharmacistTurnDate)];
  let legacyWeekendStaffCursor = 0;

  const days: ScheduleDay[] = Array.from({ length: daysInMonth(year, month) }, (_, index) => {
    const day = index + 1;
    const dateKey = toDateKey(year, month, day);
    const weekday = dateKeyToDate(dateKey).getDay();
    const holiday = isHoliday(dateKey);
    const holidayName = getHolidayName(dateKey);
    const dayEvents = events.filter((event) => event.date === dateKey);
    let morningStaff: string[] = [];
    let lowerMorningStaff: string[] = [];

    if (year === 2026 && month === 8) {
      morningStaff = weekday === 6
        ? takeCycled(AUGUST_2026_WEEKEND_STAFF, legacyWeekendStaffCursor, 2)
        : [];
      legacyWeekendStaffCursor += morningStaff.length;

      if (weekday === 0 || holiday) {
        const assigned = takeCycled(AUGUST_2026_WEEKEND_STAFF, legacyWeekendStaffCursor, 1);
        legacyWeekendStaffCursor += 1;
        lowerMorningStaff = dateKey === "2026-08-17" ? ["김지현"] : assigned;
      }
    } else if (dateKey >= "2026-09-01") {
      morningStaff = weekday === 6 ? assignWeekendDutyStaff(dateKey, weekendStaff, 2) : [];
      lowerMorningStaff = holiday
        ? assignHolidayDutyStaff(dateKey, weekendStaff)
        : weekday === 0
          ? assignWeekendDutyStaff(dateKey, weekendStaff, 1)
          : [];
    } else {
      morningStaff = weekday === 6 ? takeCycled(weekendStaff, legacyWeekendStaffCursor, 2) : [];
      legacyWeekendStaffCursor += morningStaff.length;
      if (weekday === 0 || holiday) {
        lowerMorningStaff = takeCycled(weekendStaff, legacyWeekendStaffCursor, 1);
        legacyWeekendStaffCursor += 1;
      }
    }

    return {
      dateKey,
      day,
      weekday,
      holiday,
      holidayName,
      events: dayEvents,
      nightPharmacists: assignNightPharmacists(dateKey, nightPharmacists, nightPharmacistTurnDate),
      nightStaff: assignNightStaff(dateKey, nightStaffPositions),
      morningStaff,
      lowerMorningStaff,
      dayPharmacists: dayPharmacistNames(dateKey, weekday, holiday, year, month, weekendPharmacists),
      upperMorningPharmacists: upperMorningPharmacists(dateKey, weekday, weekendPharmacists),
      notes: []
    };
  });

  return {
    year,
    month,
    days,
    events
  };
}

export function buildScheduleWeeks(schedule: MonthSchedule): ScheduleWeek[] {
  const firstWeekday = dateKeyToDate(schedule.days[0].dateKey).getDay();
  const mondayBasedOffset = (firstWeekday + 6) % 7;
  const cells: Array<ScheduleDay | null> = [
    ...Array.from({ length: mondayBasedOffset }, () => null),
    ...schedule.days
  ];

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return Array.from({ length: cells.length / 7 }, (_, index) => ({
    index,
    days: cells.slice(index * 7, index * 7 + 7)
  }));
}

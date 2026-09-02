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

export type ScheduleDutyEditOptions = {
  weekendStaff: string[];
  weekendPharmacists: string[];
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
  "김지혜",
  "최윤영",
  "이지은",
  "오아라",
  "이정화",
  "안혜정",
  "박현영",
  "김연지",
  "이호연",
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
const HALF_DAY_PHARMACIST_ROTATION_ANCHOR = "2026-09-05";
const FULL_DAY_PHARMACIST_ROTATION_ANCHOR = "2026-09-06";

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

function rotateFromName(names: string[], anchorName: string): string[] {
  const normalizedNames = names.map((name) => name.trim()).filter(Boolean);
  const anchorIndex = normalizedNames.indexOf(anchorName);
  if (anchorIndex < 0) return [anchorName, ...normalizedNames];
  return [...normalizedNames.slice(anchorIndex), ...normalizedNames.slice(0, anchorIndex)];
}

function isFirstSaturday(dateKey: string): boolean {
  const date = dateKeyToDate(dateKey);
  return date.getDay() === 6 && date.getDate() <= 7;
}

function countFullDayPharmacistSlotsBefore(dateKey: string): number {
  const target = dateKeyToDate(dateKey);
  let current = dateKeyToDate(FULL_DAY_PHARMACIST_ROTATION_ANCHOR);
  let slots = 0;

  while (current < target) {
    const currentKey = toDateKey(current.getFullYear(), current.getMonth() + 1, current.getDate());
    if (current.getDay() === 6) {
      if (!isFirstSaturday(currentKey)) slots += 1;
    } else if (isHoliday(currentKey)) {
      slots += 2;
    } else if (current.getDay() === 0) {
      slots += 1;
    }
    current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1);
  }

  return slots;
}

function takeCycledExcluding(
  names: string[],
  start: number,
  count: number,
  excludedNames: string[]
): { assigned: string[]; nextStart: number } {
  if (names.length === 0) return { assigned: [], nextStart: start };
  const excluded = new Set(excludedNames);
  const assigned: string[] = [];
  let cursor = start;
  let inspected = 0;

  while (assigned.length < count && inspected < names.length) {
    const name = names[cursor % names.length];
    cursor += 1;
    inspected += 1;
    if (!excluded.has(name)) assigned.push(name);
  }

  return { assigned, nextStart: cursor };
}

function assignHalfDayPharmacists(dateKey: string, names: string[]): string[] {
  const target = dateKeyToDate(dateKey);
  let current = dateKeyToDate(HALF_DAY_PHARMACIST_ROTATION_ANCHOR);
  let cursor = 0;
  const orderedNames = rotateFromName(names, "김지혜");

  while (current <= target) {
    const currentKey = toDateKey(current.getFullYear(), current.getMonth() + 1, current.getDate());
    const weekday = current.getDay();
    const holiday = isHoliday(currentKey);

    if (weekday === 6 || holiday) {
      const count = weekday === 6
        ? isFirstSaturday(currentKey) && !holiday ? 3 : 2
        : 1;
      const fullDayNames = dayPharmacistNames(
        currentKey,
        weekday,
        holiday,
        current.getFullYear(),
        current.getMonth() + 1,
        names
      );
      const result = takeCycledExcluding(orderedNames, cursor, count, fullDayNames);
      if (currentKey === dateKey) return result.assigned;
      cursor = result.nextStart;
    }

    current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1);
  }

  return [];
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
    if (isHoliday(currentKey) && current.getDay() !== 6) slots += 1;
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

  if (dateKey >= FULL_DAY_PHARMACIST_ROTATION_ANCHOR) {
    const orderedNames = rotateFromName(names, "박주영");
    const rotationSlots = countFullDayPharmacistSlotsBefore(dateKey);
    if (isFirstSaturday(dateKey)) return ["최윤영", "이승현"];
    if (weekday === 6) return [...takeCycled(orderedNames, rotationSlots, 1), "이승현"];
    if (holiday) return takeCycled(orderedNames, rotationSlots, 2);
    const rotating = takeCycled(orderedNames, rotationSlots, 1)[0];
    if (!rotating) return ["서윤석"];
    return month % 2 === 1 ? ["서윤석", rotating] : [rotating, "서윤석"];
  }

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

  if (weekday === 6 && targetDay <= 7) return ["최윤영", "이승현"];
  if (weekday === 6) return [...takeCycled(names, rotationSlots, 1), "이승현"];
  if (holiday) return takeCycled(names, rotationSlots, 2);
  const fixedFirst = month % 2 === 1;
  const rotating = takeCycled(names, rotationSlots, 1)[0];
  if (!rotating) return ["서윤석"];
  return fixedFirst ? ["서윤석", rotating] : [rotating, "서윤석"];
}

function upperMorningPharmacists(
  dateKey: string,
  weekday: number,
  holiday: boolean,
  names: string[]
): string[] {
  if (weekday !== 6 && !holiday) return [];
  if (dateKey >= HALF_DAY_PHARMACIST_ROTATION_ANCHOR) {
    return assignHalfDayPharmacists(dateKey, names);
  }
  if (holiday && weekday !== 6) return takeCycled([...names].reverse(), 0, 1);
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

      if ((weekday === 0 || holiday) && weekday !== 6) {
        const assigned = takeCycled(AUGUST_2026_WEEKEND_STAFF, legacyWeekendStaffCursor, 1);
        legacyWeekendStaffCursor += 1;
        lowerMorningStaff = dateKey === "2026-08-17" ? ["김지현"] : assigned;
      }
    } else if (dateKey >= "2026-09-01") {
      morningStaff = weekday === 6 ? assignWeekendDutyStaff(dateKey, weekendStaff, 2) : [];
      lowerMorningStaff = holiday && weekday !== 6
        ? assignHolidayDutyStaff(dateKey, weekendStaff)
        : weekday === 0
          ? assignWeekendDutyStaff(dateKey, weekendStaff, 1)
          : [];
    } else {
      morningStaff = weekday === 6 ? takeCycled(weekendStaff, legacyWeekendStaffCursor, 2) : [];
      legacyWeekendStaffCursor += morningStaff.length;
      if ((weekday === 0 || holiday) && weekday !== 6) {
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
      upperMorningPharmacists: upperMorningPharmacists(dateKey, weekday, holiday, weekendPharmacists),
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

type DutyRotationStream = "staffWeekend" | "staffHoliday" | "pharmacistFullDay" | "pharmacistHalfDay";

type DutyEdit = {
  dateKey: string;
  value: string;
};

function dutyNames(value: string): string[] {
  return value.split("/").map((name) => name.trim()).filter(Boolean);
}

function dutyEditStream(dateKey: string, rowId: string): DutyRotationStream | null {
  const weekday = dateKeyToDate(dateKey).getDay();
  const holiday = isHoliday(dateKey);

  if (rowId === "dayPharmacists" && (weekday === 0 || weekday === 6 || holiday)) return "pharmacistFullDay";
  if (rowId === "upperMorningPharmacists" && (weekday === 6 || holiday)) return "pharmacistHalfDay";
  if (rowId === "morningStaff" && weekday === 6) return "staffWeekend";
  if (rowId !== "lowerMorningStaff") return null;
  if (holiday && weekday !== 6) return "staffHoliday";
  if (weekday === 0) return "staffWeekend";
  return null;
}

function collectActiveDutyEdits(
  edits: Record<string, string>,
  monthStart: string,
  monthEnd: string
): Record<DutyRotationStream, Map<string, DutyEdit>> {
  const grouped: Record<DutyRotationStream, DutyEdit[]> = {
    staffWeekend: [],
    staffHoliday: [],
    pharmacistFullDay: [],
    pharmacistHalfDay: []
  };

  Object.entries(edits).forEach(([key, value]) => {
    const dateKey = key.slice(0, 10);
    const rowId = key.slice(11);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || dateKey > monthEnd) return;
    const stream = dutyEditStream(dateKey, rowId);
    if (stream) grouped[stream].push({ dateKey, value });
  });

  return Object.fromEntries(
    Object.entries(grouped).map(([stream, streamEdits]) => {
      const prior = streamEdits
        .filter((edit) => edit.dateKey < monthStart)
        .sort((left, right) => right.dateKey.localeCompare(left.dateKey))[0];
      const current = streamEdits.filter((edit) => edit.dateKey >= monthStart);
      return [stream, new Map([...(prior ? [prior] : []), ...current].map((edit) => [edit.dateKey, edit]))];
    })
  ) as Record<DutyRotationStream, Map<string, DutyEdit>>;
}

function cursorAfterDutyEdit(
  orderedNames: string[],
  plannedNames: string[],
  editedValue: string,
  cursorBefore: number,
  cursorAfterPlanned: number
): number {
  const editedNames = dutyNames(editedValue).filter((name) => orderedNames.includes(name));
  if (editedNames.length === 0) return cursorBefore;

  const planned = plannedNames.filter((name) => orderedNames.includes(name));
  const hasReplacement = editedNames.some((name) => !planned.includes(name));
  if (hasReplacement) return orderedNames.indexOf(editedNames[editedNames.length - 1]) + 1;

  const remaining = [...editedNames];
  const firstDeleted = planned.find((name) => {
    const index = remaining.indexOf(name);
    if (index < 0) return true;
    remaining.splice(index, 1);
    return false;
  });
  if (firstDeleted) return orderedNames.indexOf(firstDeleted);

  return editedNames.length === planned.length
    ? cursorAfterPlanned
    : orderedNames.indexOf(editedNames[editedNames.length - 1]) + 1;
}

function fullDayDutyFromCursor(
  dateKey: string,
  orderedNames: string[],
  cursor: number
): { assigned: string[]; rotating: string[]; nextCursor: number } {
  const date = dateKeyToDate(dateKey);
  const weekday = date.getDay();
  const holiday = isHoliday(dateKey);
  if (weekday !== 0 && weekday !== 6 && !holiday) return { assigned: [], rotating: [], nextCursor: cursor };
  if (isFirstSaturday(dateKey)) return { assigned: ["최윤영", "이승현"], rotating: [], nextCursor: cursor };

  const count = weekday === 6 ? 1 : holiday ? 2 : 1;
  const rotating = takeCycled(orderedNames, cursor, count);
  if (weekday === 6) return { assigned: [...rotating, "이승현"], rotating, nextCursor: cursor + count };
  if (holiday) return { assigned: rotating, rotating, nextCursor: cursor + count };
  return {
    assigned: date.getMonth() % 2 === 0 ? ["서윤석", ...rotating] : [...rotating, "서윤석"],
    rotating,
    nextCursor: cursor + count
  };
}

function halfDayCursorBefore(dateKey: string, names: string[]): number {
  let current = dateKeyToDate(HALF_DAY_PHARMACIST_ROTATION_ANCHOR);
  const target = dateKeyToDate(dateKey);
  const orderedNames = rotateFromName(names, "김지혜");
  let cursor = 0;

  while (current < target) {
    const currentKey = toDateKey(current.getFullYear(), current.getMonth() + 1, current.getDate());
    const weekday = current.getDay();
    const holiday = isHoliday(currentKey);
    if (weekday === 6 || holiday) {
      const count = weekday === 6 ? isFirstSaturday(currentKey) && !holiday ? 3 : 2 : 1;
      const fullDayNames = dayPharmacistNames(
        currentKey, weekday, holiday, current.getFullYear(), current.getMonth() + 1, names
      );
      cursor = takeCycledExcluding(orderedNames, cursor, count, fullDayNames).nextStart;
    }
    current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1);
  }

  return cursor;
}

export function applyScheduleDutyEditContinuations(
  schedule: MonthSchedule,
  edits: Record<string, string>,
  options: ScheduleDutyEditOptions
): MonthSchedule {
  const monthStart = toDateKey(schedule.year, schedule.month, 1);
  const monthEnd = toDateKey(schedule.year, schedule.month, daysInMonth(schedule.year, schedule.month));
  const activeEdits = collectActiveDutyEdits(edits, monthStart, monthEnd);
  const hasStaffWeekendEdits = activeEdits.staffWeekend.size > 0;
  const hasStaffHolidayEdits = activeEdits.staffHoliday.size > 0;
  const hasFullDayEdits = activeEdits.pharmacistFullDay.size > 0;
  const hasHalfDayEdits = activeEdits.pharmacistHalfDay.size > 0;
  if (!hasStaffWeekendEdits && !hasStaffHolidayEdits && !hasFullDayEdits && !hasHalfDayEdits) return schedule;
  const firstPriorDate = Object.values(activeEdits)
    .flatMap((streamEdits) => [...streamEdits.keys()].filter((dateKey) => dateKey < monthStart))
    .sort()[0];
  const simulationStart = firstPriorDate ?? monthStart;
  const days = schedule.days.map((day) => ({
    ...day,
    morningStaff: [...day.morningStaff],
    lowerMorningStaff: [...day.lowerMorningStaff],
    dayPharmacists: [...day.dayPharmacists],
    upperMorningPharmacists: [...day.upperMorningPharmacists]
  }));
  const outputDays = new Map(days.map((day) => [day.dateKey, day]));
  const staffNames = options.weekendStaff.map((name) => name.trim()).filter(Boolean);
  const fullDayNames = rotateFromName(options.weekendPharmacists, "박주영");
  const halfDayNames = rotateFromName(options.weekendPharmacists, "김지혜");
  let staffWeekendCursor: number | null = null;
  let staffHolidayCursor: number | null = null;
  let fullDayCursor: number | null = null;
  let halfDayCursor: number | null = null;
  let current = dateKeyToDate(simulationStart);
  const last = dateKeyToDate(monthEnd);

  while (current <= last) {
    const dateKey = toDateKey(current.getFullYear(), current.getMonth() + 1, current.getDate());
    const weekday = current.getDay();
    const holiday = isHoliday(dateKey);
    const outputDay = outputDays.get(dateKey);

    let fullCursorBefore = fullDayCursor ?? countFullDayPharmacistSlotsBefore(dateKey);
    const plannedFullDay = fullDayDutyFromCursor(dateKey, fullDayNames, fullCursorBefore);
    const fullEdit = activeEdits.pharmacistFullDay.get(dateKey);
    let actualFullDay = fullDayCursor == null
      ? dayPharmacistNames(dateKey, weekday, holiday, current.getFullYear(), current.getMonth() + 1, options.weekendPharmacists)
      : plannedFullDay.assigned;
    if (fullEdit) {
      actualFullDay = dutyNames(fullEdit.value);
      fullDayCursor = cursorAfterDutyEdit(
        fullDayNames, plannedFullDay.rotating, fullEdit.value, fullCursorBefore, plannedFullDay.nextCursor
      );
    } else if (fullDayCursor != null) {
      fullDayCursor = plannedFullDay.nextCursor;
    }
    if (outputDay && hasFullDayEdits) outputDay.dayPharmacists = actualFullDay;

    if (hasHalfDayEdits && (weekday === 6 || holiday)) {
      const halfCursorBefore = halfDayCursor ?? halfDayCursorBefore(dateKey, options.weekendPharmacists);
      const halfCount = weekday === 6 ? isFirstSaturday(dateKey) && !holiday ? 3 : 2 : 1;
      const plannedHalfDay = takeCycledExcluding(halfDayNames, halfCursorBefore, halfCount, actualFullDay);
      const halfEdit = activeEdits.pharmacistHalfDay.get(dateKey);
      let actualHalfDay = halfDayCursor == null
        ? upperMorningPharmacists(dateKey, weekday, holiday, options.weekendPharmacists)
        : plannedHalfDay.assigned;
      if (halfEdit) {
        actualHalfDay = dutyNames(halfEdit.value);
        halfDayCursor = cursorAfterDutyEdit(
          halfDayNames, plannedHalfDay.assigned, halfEdit.value, halfCursorBefore, plannedHalfDay.nextStart
        );
      } else if (halfDayCursor != null) {
        halfDayCursor = plannedHalfDay.nextStart;
      }
      if (outputDay) outputDay.upperMorningPharmacists = actualHalfDay;
    }

    const staffWeekendCount = weekday === 6 ? 2 : weekday === 0 && !holiday ? 1 : 0;
    if (hasStaffWeekendEdits && staffWeekendCount > 0) {
      const cursorBefore: number = staffWeekendCursor ?? WEEKEND_STAFF_ROTATION_START_INDEX + countWeekendStaffSlotsBefore(dateKey);
      const planned = takeCycled(staffNames, cursorBefore, staffWeekendCount);
      const edit = activeEdits.staffWeekend.get(dateKey);
      let actual = planned;
      if (edit) {
        actual = dutyNames(edit.value);
        staffWeekendCursor = cursorAfterDutyEdit(
          staffNames, planned, edit.value, cursorBefore, cursorBefore + staffWeekendCount
        );
      } else if (staffWeekendCursor != null) {
        staffWeekendCursor = cursorBefore + staffWeekendCount;
      }
      if (outputDay) {
        if (weekday === 6) outputDay.morningStaff = actual;
        else outputDay.lowerMorningStaff = actual;
      }
    }

    if (hasStaffHolidayEdits && holiday && weekday !== 6) {
      const cursorBefore: number = staffHolidayCursor ?? HOLIDAY_STAFF_ROTATION_START_INDEX + countHolidayStaffSlotsBefore(dateKey);
      const planned = takeCycled(staffNames, cursorBefore, 1);
      const edit = activeEdits.staffHoliday.get(dateKey);
      let actual = planned;
      if (edit) {
        actual = dutyNames(edit.value);
        staffHolidayCursor = cursorAfterDutyEdit(staffNames, planned, edit.value, cursorBefore, cursorBefore + 1);
      } else if (staffHolidayCursor != null) {
        staffHolidayCursor = cursorBefore + 1;
      }
      if (outputDay) outputDay.lowerMorningStaff = actual;
    }

    current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1);
  }

  return { ...schedule, days };
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

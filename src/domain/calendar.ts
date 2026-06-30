export type EventType =
  | "expiryReview"
  | "monthlyMeeting"
  | "deepClean"
  | "oralInventory"
  | "injectionInventory"
  | "staffTaskChange"
  | "turn"
  | "custom";

export type CalendarEvent = {
  date: string;
  title: string;
  type: EventType | string;
};

export type MonthCell = {
  kind: "blank" | "day";
  day?: number;
  dateKey?: string;
  weekday?: number;
  weekend?: boolean;
  holidayName?: string;
  events: CalendarEvent[];
};

export const koreanHolidays: Record<string, string> = {
  "2026-01-01": "신정",
  "2026-02-16": "설날 연휴",
  "2026-02-17": "설날",
  "2026-02-18": "설날 연휴",
  "2026-03-01": "삼일절",
  "2026-03-02": "삼일절 대체공휴일",
  "2026-05-05": "어린이날",
  "2026-05-24": "부처님오신날",
  "2026-05-25": "부처님오신날 대체공휴일",
  "2026-06-03": "전국동시지방선거",
  "2026-06-06": "현충일",
  "2026-08-15": "광복절",
  "2026-08-17": "광복절 대체공휴일",
  "2026-09-24": "추석 연휴",
  "2026-09-25": "추석",
  "2026-09-26": "추석 연휴",
  "2026-10-03": "개천절",
  "2026-10-05": "개천절 대체공휴일",
  "2026-10-09": "한글날",
  "2026-12-25": "성탄절",
  "2027-01-01": "신정",
  "2027-02-06": "설날 연휴",
  "2027-02-07": "설날",
  "2027-02-08": "설날 연휴",
  "2027-02-09": "설날 대체공휴일",
  "2027-03-01": "삼일절",
  "2027-05-05": "어린이날",
  "2027-05-13": "부처님오신날",
  "2027-06-06": "현충일",
  "2027-06-07": "현충일 대체공휴일",
  "2027-08-15": "광복절",
  "2027-08-16": "광복절 대체공휴일",
  "2027-09-14": "추석 연휴",
  "2027-09-15": "추석",
  "2027-09-16": "추석 연휴",
  "2027-10-03": "개천절",
  "2027-10-04": "개천절 대체공휴일",
  "2027-10-09": "한글날",
  "2027-10-11": "한글날 대체공휴일",
  "2027-12-25": "성탄절",
  "2027-12-27": "성탄절 대체공휴일"
};

export function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function dateKeyToDate(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function isWeekend(date: Date): boolean {
  const weekday = date.getDay();
  return weekday === 0 || weekday === 6;
}

export function getHolidayName(dateKey: string): string | undefined {
  return koreanHolidays[dateKey];
}

export function isHoliday(dateKey: string): boolean {
  return getHolidayName(dateKey) != null;
}

export function buildMonthDays(
  year: number,
  month: number,
  events: CalendarEvent[] = []
): MonthCell[] {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const cells: MonthCell[] = Array.from({ length: firstWeekday }, () => ({
    kind: "blank",
    events: []
  }));

  for (let day = 1; day <= daysInMonth(year, month); day += 1) {
    const dateKey = toDateKey(year, month, day);
    const date = dateKeyToDate(dateKey);
    cells.push({
      kind: "day",
      day,
      dateKey,
      weekday: date.getDay(),
      weekend: isWeekend(date),
      holidayName: getHolidayName(dateKey),
      events: events.filter((event) => event.date === dateKey)
    });
  }

  return cells;
}

import {
  CalendarDays,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Printer,
  Save,
  Users
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import appIcon from "./assets/app-icon.png";
import palette from "./assets/palette.png";
import { buildMonthDays, CalendarEvent, dateKeyToDate, getHolidayName, isWeekend, toDateKey } from "./domain/calendar";
import {
  buildDefaultScheduleEventDates,
  buildMonthSchedule,
  buildNightPharmacistTurnEvents,
  buildScheduleWeeks,
  DEFAULT_NIGHT_PHARMACIST_TURN_DATE,
  defaultNightPharmacists,
  defaultNightStaffPositions,
  defaultWeekendPharmacists,
  defaultWeekendStaff,
  normalizeNightStaffPositions,
  EventDateKey,
  scheduleNameDensityClass,
  ScheduleEventDates
} from "./domain/schedule";
import {
  buildChecklistMonthDays,
  checklistPrintGroups,
  MonthEndDocumentGroup,
  MonthEndPrintItem,
  monthEndDocumentGroups,
  notebookChecklistGroups,
  staffChecklistSections
} from "./domain/documents";
import {
  defaultStaffEarlyNames,
  defaultStaffTimeNames,
  rotateStaffAssignments,
  staffAssignmentMonthOffset,
  staffAssignmentColumns,
  StaffAssignmentColumnKey,
  staffAssignmentTemplate
} from "./domain/taskRotation";
import {
  assignmentPrintViews,
  AssignmentViewId
} from "./domain/assignmentViews";
import {
  buildPharmacistAssignment,
  defaultFixedPharmacistNames,
  defaultPharmacistNameList,
  defaultRotatingPharmacistNames,
  PharmacistAssignment,
  PharmacistAssignmentColumnKey
} from "./domain/pharmacistAssignment";
import { useLocalStorageState } from "./storage";

type MainTab = "schedule" | "assignment" | "documents" | "checklists";
type PrintOrientation = "portrait" | "landscape";

type EditableLists = {
  nightPharmacists: string[];
  nightStaffPositions: string[][];
  weekendStaff: string[];
  weekendPharmacists: string[];
};

type AssignmentNameLists = {
  staffTimeNames: string[];
  staffEarlyNames: string[];
  pharmacistNames: string[];
  fixedPharmacistNames: string[];
  rotatingPharmacistNames: string[];
};

type ScheduleEventDatesByMonth = Record<string, ScheduleEventDates>;

const legacyNightPharmacistOrder = ["윤주원", "정순미", "송유희", "이상훈", "장소희", "김동신"];
const nightPharmacistAugustRuleMigrationKey = "pharmacy-app-night-pharmacist-august-2026-rule";
const legacyWeekendStaffOrder = ["김동희", "박종연", "김지은", "김지현", "강승원", "박지숙", "송현우", "김서훈"];
const weekendStaffSeptemberRuleMigrationKey = "pharmacy-app-weekend-staff-september-2026-rule";
const legacyWeekendPharmacistOrder = ["최윤영", "이지은", "오아라", "이정화", "안혜정", "박현영", "김연지", "이호연", "김경원", "김수빈", "박주영"];
const weekendPharmacistSeptemberAnchorMigrationKey = "pharmacy-app-weekend-pharmacist-september-2026-anchor";
const weekendPharmacistOrderWithKimGyeongwon = ["김지혜", "최윤영", "이지은", "오아라", "이정화", "안혜정", "박현영", "김연지", "이호연", "김경원", "김수빈", "박주영"];
const weekendPharmacistKimGyeongwonRemovalMigrationKey = "pharmacy-app-weekend-pharmacist-remove-kim-gyeongwon";
const legacyStaffTimeNameOrder = ["박종연", "송현우", "강승원", "박지숙", "김동희", "지현", "예은", "김서훈"];
const legacyStaffEarlyNameOrder = ["지현", "김동희", "지숙"];
const staffAssignmentAugustRuleMigrationKey = "pharmacy-app-staff-assignment-august-2026-rule";

const eventLabels: Record<EventDateKey, string> = {
  expiryReview: "유효기간조사/휴가금지",
  monthlyMeeting: "월례회의",
  deepClean: "대청소_휴가금지",
  oralInventory: "재고조사_경구/휴가금지",
  injectionInventory: "재고조사/주사-휴가금지",
  staffTaskChange: "직원업무 변경"
};

function listToText(list: string[]) {
  return list.join("\n");
}

function textToList(text: string) {
  return text
    .split(/\r?\n|→|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function positionTextToList(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line
      .split("/")
      .map((item) => item.trim())
      .filter(Boolean))
    .filter((line) => line.length > 0);
}

function readLegacyEventDatesByMonth(): ScheduleEventDatesByMonth {
  try {
    const stored = window.localStorage.getItem("pharmacy-app-event-dates");
    if (stored == null) return {};
    const legacyDates = JSON.parse(stored) as ScheduleEventDates;

    return Object.entries(legacyDates).reduce<ScheduleEventDatesByMonth>((result, [type, date]) => {
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return result;
      const monthKey = date.slice(0, 7);
      result[monthKey] = {
        ...result[monthKey],
        [type]: date
      };
      return result;
    }, {});
  } catch {
    return {};
  }
}

function pharmacistEditKey(rowId: string, columnKey: PharmacistAssignmentColumnKey) {
  return `${rowId}:${columnKey}`;
}

function scheduleCellEditKey(dateKey: string, rowId: string) {
  return `${dateKey}:${rowId}`;
}

function staffAssignmentEditKey(
  year: number,
  month: number,
  rowIndex: number,
  columnKey: StaffAssignmentColumnKey
) {
  return `${year}-${String(month).padStart(2, "0")}:${rowIndex}:${columnKey}`;
}

function staffCellValue(
  row: ReturnType<typeof rotateStaffAssignments>[number],
  columnKey: StaffAssignmentColumnKey
) {
  return row[columnKey] ?? "";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function downloadExcelFile(filename: string, title: string, headers: string[], rows: string[][]) {
  const table = `
    <table border="1">
      <caption style="font-size:20px;font-weight:800;padding:8px 0;">${escapeHtml(title)}</caption>
      <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
      <tbody>
        ${rows
          .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell).replace(/\n/g, "<br />")}</td>`).join("")}</tr>`)
          .join("")}
      </tbody>
    </table>
  `;
  const html = `<!doctype html><html><head><meta charset="UTF-8" /></head><body>${table}</body></html>`;
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTab>("schedule");
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 8, 1));
  const [printOrientation, setPrintOrientation] = useState<PrintOrientation>("landscape");
  const [printCalendar, setPrintCalendar] = useState(false);
  const [printAllDocumentsMode, setPrintAllDocumentsMode] = useState<PrintOrientation | null>(null);
  const [printAllChecklists, setPrintAllChecklists] = useState(false);
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1;

  const [lists, setLists] = useLocalStorageState<EditableLists>("pharmacy-app-lists", {
    nightPharmacists: defaultNightPharmacists,
    nightStaffPositions: defaultNightStaffPositions,
    weekendStaff: defaultWeekendStaff,
    weekendPharmacists: defaultWeekendPharmacists
  });

  const initialEventDatesByMonth = useMemo(readLegacyEventDatesByMonth, []);
  const [eventDatesByMonth, setEventDatesByMonth] = useLocalStorageState<ScheduleEventDatesByMonth>(
    "pharmacy-app-event-dates-by-month",
    initialEventDatesByMonth
  );
  const eventDateMonthKey = `${year}-${String(month).padStart(2, "0")}`;
  const defaultEventDates = useMemo(() => buildDefaultScheduleEventDates(year, month), [month, year]);
  const eventDates = useMemo(
    () => ({ ...defaultEventDates, ...(eventDatesByMonth[eventDateMonthKey] ?? {}) }),
    [defaultEventDates, eventDateMonthKey, eventDatesByMonth]
  );

  function setEventDates(value: ScheduleEventDates) {
    setEventDatesByMonth((current) => ({ ...current, [eventDateMonthKey]: value }));
  }

  const [nightPharmacistTurnDate, setNightPharmacistTurnDate] = useLocalStorageState(
    "pharmacy-app-night-pharmacist-turn-date",
    DEFAULT_NIGHT_PHARMACIST_TURN_DATE
  );
  const [scheduleSubtitle, setScheduleSubtitle] = useLocalStorageState(
    "pharmacy-app-schedule-subtitle",
    "휴가자 연차 2명"
  );
  const [scheduleCellEdits, setScheduleCellEdits] = useLocalStorageState<Record<string, string>>(
    "pharmacy-app-schedule-cell-edits",
    {}
  );

  useEffect(() => {
    if (window.localStorage.getItem(nightPharmacistAugustRuleMigrationKey) === "applied") return;

    const usesLegacyOrder =
      lists.nightPharmacists.length === legacyNightPharmacistOrder.length &&
      lists.nightPharmacists.every((name, index) => name === legacyNightPharmacistOrder[index]);

    if (usesLegacyOrder) {
      setLists((current) => ({ ...current, nightPharmacists: defaultNightPharmacists }));
    }
    if (nightPharmacistTurnDate === "2026-09-21") {
      setNightPharmacistTurnDate(DEFAULT_NIGHT_PHARMACIST_TURN_DATE);
    }

    window.localStorage.setItem(nightPharmacistAugustRuleMigrationKey, "applied");
  }, [lists.nightPharmacists, nightPharmacistTurnDate, setLists, setNightPharmacistTurnDate]);

  useEffect(() => {
    if (window.localStorage.getItem(weekendStaffSeptemberRuleMigrationKey) === "applied") return;

    const usesLegacyOrder =
      lists.weekendStaff.length === legacyWeekendStaffOrder.length &&
      lists.weekendStaff.every((name, index) => name === legacyWeekendStaffOrder[index]);

    if (usesLegacyOrder) {
      setLists((current) => ({ ...current, weekendStaff: defaultWeekendStaff }));
    }

    window.localStorage.setItem(weekendStaffSeptemberRuleMigrationKey, "applied");
  }, [lists.weekendStaff, setLists]);

  useEffect(() => {
    if (window.localStorage.getItem(weekendPharmacistSeptemberAnchorMigrationKey) === "applied") return;

    const usesLegacyOrder =
      lists.weekendPharmacists.length === legacyWeekendPharmacistOrder.length &&
      lists.weekendPharmacists.every((name, index) => name === legacyWeekendPharmacistOrder[index]);

    if (usesLegacyOrder) {
      setLists((current) => ({ ...current, weekendPharmacists: defaultWeekendPharmacists }));
    }

    window.localStorage.setItem(weekendPharmacistSeptemberAnchorMigrationKey, "applied");
  }, [lists.weekendPharmacists, setLists]);

  useEffect(() => {
    if (window.localStorage.getItem(weekendPharmacistKimGyeongwonRemovalMigrationKey) === "applied") return;

    const usesPreviousDefaultOrder =
      lists.weekendPharmacists.length === weekendPharmacistOrderWithKimGyeongwon.length &&
      lists.weekendPharmacists.every((name, index) => name === weekendPharmacistOrderWithKimGyeongwon[index]);

    if (usesPreviousDefaultOrder) {
      setLists((current) => ({ ...current, weekendPharmacists: defaultWeekendPharmacists }));
    }

    window.localStorage.setItem(weekendPharmacistKimGyeongwonRemovalMigrationKey, "applied");
  }, [lists.weekendPharmacists, setLists]);

  const [pharmacistCellEdits, setPharmacistCellEdits] = useLocalStorageState<Record<string, string>>(
    "pharmacy-app-pharmacist-assignment-edits",
    {}
  );
  const [staffCellEdits, setStaffCellEdits] = useLocalStorageState<Record<string, string>>(
    "pharmacy-app-staff-assignment-edits",
    {}
  );
  const [assignmentNameLists, setAssignmentNameLists] = useLocalStorageState<AssignmentNameLists>(
    "pharmacy-app-assignment-name-lists",
    {
      staffTimeNames: defaultStaffTimeNames,
      staffEarlyNames: defaultStaffEarlyNames,
      pharmacistNames: defaultPharmacistNameList,
      fixedPharmacistNames: defaultFixedPharmacistNames,
      rotatingPharmacistNames: defaultRotatingPharmacistNames
    }
  );

  useEffect(() => {
    if (window.localStorage.getItem(staffAssignmentAugustRuleMigrationKey) === "applied") return;

    const usesLegacyTimeOrder =
      assignmentNameLists.staffTimeNames.length === legacyStaffTimeNameOrder.length &&
      assignmentNameLists.staffTimeNames.every((name, index) => name === legacyStaffTimeNameOrder[index]);
    const usesLegacyEarlyOrder =
      assignmentNameLists.staffEarlyNames.length === legacyStaffEarlyNameOrder.length &&
      assignmentNameLists.staffEarlyNames.every((name, index) => name === legacyStaffEarlyNameOrder[index]);

    if (usesLegacyTimeOrder || usesLegacyEarlyOrder) {
      setAssignmentNameLists((current) => ({
        ...current,
        staffTimeNames: usesLegacyTimeOrder ? defaultStaffTimeNames : current.staffTimeNames,
        staffEarlyNames: usesLegacyEarlyOrder ? defaultStaffEarlyNames : current.staffEarlyNames
      }));
    }

    window.localStorage.setItem(staffAssignmentAugustRuleMigrationKey, "applied");
  }, [assignmentNameLists.staffEarlyNames, assignmentNameLists.staffTimeNames, setAssignmentNameLists]);

  const schedule = useMemo(
    () =>
      buildMonthSchedule(year, month, {
        eventDates,
        nightPharmacists: lists.nightPharmacists,
        nightPharmacistTurnDate,
        nightStaffPositions: lists.nightStaffPositions,
        weekendStaff: lists.weekendStaff,
        weekendPharmacists: lists.weekendPharmacists
      }),
    [eventDates, lists, month, nightPharmacistTurnDate, year]
  );

  const calendarEvents: CalendarEvent[] = schedule.events;
  const calendarCells = buildMonthDays(year, month, calendarEvents);
  const staffAssignments = rotateStaffAssignments(
    staffAssignmentTemplate,
    staffAssignmentMonthOffset(year, month),
    {
      timeNames: assignmentNameLists.staffTimeNames,
      earlyNames: assignmentNameLists.staffEarlyNames
    }
  );
  const pharmacistAssignment = useMemo(
    () => buildPharmacistAssignment(year, month, {
      pharmacistNames: assignmentNameLists.pharmacistNames,
      fixedNames: assignmentNameLists.fixedPharmacistNames,
      rotatingNames: assignmentNameLists.rotatingPharmacistNames
    }),
    [
      assignmentNameLists.fixedPharmacistNames,
      assignmentNameLists.pharmacistNames,
      assignmentNameLists.rotatingPharmacistNames,
      month,
      year
    ]
  );

  function moveMonth(direction: -1 | 1) {
    setSelectedDate(new Date(year, month - 1 + direction, 1));
  }

  function printCurrent(orientation: PrintOrientation = printOrientation) {
    setPrintOrientation(orientation);
    window.setTimeout(() => window.print(), 50);
  }

  function printCalendarOnly() {
    setPrintCalendar(true);
    printCurrent("landscape");
  }

  function printAllDocuments(orientation: PrintOrientation) {
    setPrintAllDocumentsMode(orientation);
    setPrintOrientation(orientation);
    window.setTimeout(() => window.print(), 50);
  }

  function printAllChecklistPages() {
    setPrintAllChecklists(true);
    setPrintOrientation("portrait");
    window.setTimeout(() => window.print(), 50);
  }

  useEffect(() => {
    const finishPrinting = () => {
      setPrintCalendar(false);
      setPrintAllDocumentsMode(null);
      setPrintAllChecklists(false);
    };
    window.addEventListener("afterprint", finishPrinting);
    return () => window.removeEventListener("afterprint", finishPrinting);
  }, []);

  return (
    <div className={`app print-${printOrientation} ${printCalendar ? "printing-calendar" : ""} ${printAllDocumentsMode ? "printing-all-documents" : ""} ${printAllChecklists ? "printing-all-checklists" : ""}`}>
      <aside className="sidebar no-print">
        <div className="brand">
          <img src={appIcon} alt="약제팀 업무 앱 아이콘" />
          <div>
            <strong>약제팀 월말 업무</strong>
            <span>근무표 · 결재 · 체크리스트</span>
          </div>
        </div>
        <nav className="nav-tabs">
          <TabButton active={activeTab === "schedule"} onClick={() => setActiveTab("schedule")} icon={<CalendarDays />} label="근무표" />
          <TabButton active={activeTab === "assignment"} onClick={() => setActiveTab("assignment")} icon={<Users />} label="업무 분장" />
          <TabButton active={activeTab === "documents"} onClick={() => setActiveTab("documents")} icon={<FileText />} label="월말 결재 서류" />
          <TabButton active={activeTab === "checklists"} onClick={() => setActiveTab("checklists")} icon={<CheckSquare />} label="체크리스트" />
        </nav>
        <div className="palette-card">
          <span>적용 팔레트</span>
          <img src={palette} alt="색상 팔레트" />
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar no-print">
          <div className="month-control">
            <button type="button" onClick={() => moveMonth(-1)} aria-label="이전 달">
              <ChevronLeft size={18} />
            </button>
            <div>
              <span>선택 월</span>
              <strong>{year}년 {String(month).padStart(2, "0")}월</strong>
            </div>
            <button type="button" onClick={() => moveMonth(1)} aria-label="다음 달">
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="top-actions">
            <button type="button" onClick={printCalendarOnly}>
              <Printer size={17} /> 월간 달력 출력
            </button>
            <button type="button" onClick={printAllChecklistPages}>
              <Printer size={17} /> 체크리스트 전체 출력
            </button>
            <button type="button" onClick={() => printAllDocuments("landscape")}>
              <Printer size={17} /> 가로 출력
            </button>
            <button type="button" onClick={() => printAllDocuments("portrait")}>
              <Printer size={17} /> 세로 출력
            </button>
          </div>
        </header>

        <section className={`calendar-panel print-page ${printCalendar ? "print-calendar" : ""}`}>
          <div className="section-title">
            <h1>{year}년 {month}월 업무 달력</h1>
            <p>토요일, 일요일, 공휴일, 수기 입력 일정이 표시됩니다.</p>
          </div>
          <CalendarGrid cells={calendarCells} />
        </section>

        {activeTab === "schedule" && (
          <ScheduleTab
            schedule={schedule}
            lists={lists}
            setLists={setLists}
            eventDates={eventDates}
            setEventDates={setEventDates}
            scheduleSubtitle={scheduleSubtitle}
            setScheduleSubtitle={setScheduleSubtitle}
            scheduleCellEdits={scheduleCellEdits}
            setScheduleCellEdits={setScheduleCellEdits}
            nightPharmacistTurnDate={nightPharmacistTurnDate}
            setNightPharmacistTurnDate={setNightPharmacistTurnDate}
            onPrint={() => printCurrent("landscape")}
          />
        )}

        {activeTab === "assignment" && (
          <AssignmentTab
            year={year}
            month={month}
            staffAssignments={staffAssignments}
            staffCellEdits={staffCellEdits}
            setStaffCellEdits={setStaffCellEdits}
            pharmacistAssignment={pharmacistAssignment}
            pharmacistCellEdits={pharmacistCellEdits}
            setPharmacistCellEdits={setPharmacistCellEdits}
            assignmentNameLists={assignmentNameLists}
            setAssignmentNameLists={setAssignmentNameLists}
          />
        )}

        {activeTab === "documents" && <DocumentsTab year={year} month={month} onPrint={printCurrent} />}

        {activeTab === "checklists" && <ChecklistsTab year={year} month={month} onPrint={printCurrent} />}

        {printAllDocumentsMode && <GlobalDocumentPrint year={year} month={month} orientation={printAllDocumentsMode} />}
        {printAllChecklists && <GlobalChecklistPrint year={year} month={month} />}
      </main>
    </div>
  );
}

function TabButton({
  active,
  icon,
  label,
  onClick
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className={active ? "active" : ""} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function CalendarGrid({ cells }: { cells: ReturnType<typeof buildMonthDays> }) {
  return (
    <div className="calendar-grid">
      {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
        <div className="weekday" key={day}>{day}</div>
      ))}
      {cells.map((cell, index) => {
        if (cell.kind === "blank") return <div className="calendar-cell blank" key={`blank-${index}`} />;
        const classes = [
          "calendar-cell",
          cell.weekday === 0 ? "sun" : "",
          cell.weekday === 6 ? "sat" : "",
          cell.holidayName ? "holiday" : ""
        ].join(" ");
        return (
          <div className={classes} key={cell.dateKey}>
            <strong>{cell.day}</strong>
            {cell.holidayName && <span className="holiday-label">{cell.holidayName}</span>}
            {cell.events.map((event) => (
              <span className="event-pill" key={`${event.date}-${event.title}`}>{event.title}</span>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function ScheduleTab({
  schedule,
  lists,
  setLists,
  eventDates,
  setEventDates,
  scheduleSubtitle,
  setScheduleSubtitle,
  scheduleCellEdits,
  setScheduleCellEdits,
  nightPharmacistTurnDate,
  setNightPharmacistTurnDate,
  onPrint
}: {
  schedule: ReturnType<typeof buildMonthSchedule>;
  lists: EditableLists;
  setLists: (value: EditableLists) => void;
  eventDates: ScheduleEventDates;
  setEventDates: (value: ScheduleEventDates) => void;
  scheduleSubtitle: string;
  setScheduleSubtitle: (value: string) => void;
  scheduleCellEdits: Record<string, string>;
  setScheduleCellEdits: (value: Record<string, string>) => void;
  nightPharmacistTurnDate: string;
  setNightPharmacistTurnDate: (value: string) => void;
  onPrint: () => void;
}) {
  const [showLists, setShowLists] = useState(true);
  const weeks = buildScheduleWeeks(schedule);
  const weekdays = ["월", "화", "수", "목", "금", "토", "일"];
  const rows = [
    { id: "nightPharmacists", label: "17:00-익일08:00", get: (day: (typeof schedule.days)[number]) => day.nightPharmacists.join("/") },
    { id: "nightStaff", label: "20:00-익일07:00", get: (day: (typeof schedule.days)[number]) => day.nightStaff.join("/") },
    { id: "nightCategory", label: "나이트 업무 구분", get: () => "" },
    { id: "morningStaff", label: "07:15-11:15", get: (day: (typeof schedule.days)[number]) => day.morningStaff.join("/") },
    { id: "dayPharmacists", label: "08:00-17:00", get: (day: (typeof schedule.days)[number]) => day.dayPharmacists.join("/") },
    { id: "upperMorningPharmacists", label: "08:00-12:00 약사", get: (day: (typeof schedule.days)[number]) => day.upperMorningPharmacists.join("/") },
    { id: "lowerMorningStaff", label: "08:00-12:00 직원", get: (day: (typeof schedule.days)[number]) => day.lowerMorningStaff.join("/") }
  ];
  const currentMonthTurnDate =
    buildNightPharmacistTurnEvents(schedule.year, schedule.month, nightPharmacistTurnDate)[0]?.date ?? "";

  function changeCurrentMonthTurnDate(nextDate: string) {
    if (!nextDate) return;
    if (!currentMonthTurnDate) {
      setNightPharmacistTurnDate(nextDate);
      return;
    }

    const shiftDays = Math.round(
      (dateKeyToDate(nextDate).getTime() - dateKeyToDate(currentMonthTurnDate).getTime()) /
      (24 * 60 * 60 * 1000)
    );
    const anchor = dateKeyToDate(nightPharmacistTurnDate);
    anchor.setDate(anchor.getDate() + shiftDays);
    setNightPharmacistTurnDate(
      toDateKey(anchor.getFullYear(), anchor.getMonth() + 1, anchor.getDate())
    );
  }

  return (
    <section className="print-page panel schedule-print-page">
      <div className="section-title row-title schedule-section-title">
        <div className="schedule-title-copy">
          <h2>{schedule.year}년 {String(schedule.month).padStart(2, "0")}월 근무표</h2>
          <p className="schedule-subtitle-display">({scheduleSubtitle})</p>
          <p className="schedule-description no-print">나이트 약사, 나이트 직원, 주말/공휴일 근무와 지정 일정을 주 단위로 표시합니다.</p>
          <label className="schedule-subtitle-editor no-print">
            <span>근무표 부제</span>
            <input
              type="text"
              value={scheduleSubtitle}
              onChange={(event) => setScheduleSubtitle(event.currentTarget.value)}
            />
          </label>
        </div>
        <div className="top-actions no-print">
          <button type="button" className="quiet" onClick={() => setShowLists((open) => !open)}>
            <Save size={16} /> 이름 리스트 편집
          </button>
          <button type="button" onClick={onPrint}>
            <Printer size={16} /> 근무표 출력
          </button>
        </div>
      </div>

      <div className="schedule-weeks">
        {weeks.map((week) => (
          <div className="wide-table schedule-week" key={week.index}>
            <table className="schedule-week-table">
              <thead>
                <tr>
                  <th>근무시간</th>
                  {weekdays.map((weekday) => (
                    <th key={weekday}>{weekday}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="date-row">
                  <td className="time-col">{schedule.month}월 {week.index + 1}주</td>
                  {week.days.map((day, index) => (
                    <td
                      key={`date-${week.index}-${index}`}
                      className={day == null ? "blank-day" : day.weekday === 0 || day.holiday || day.weekday === 6 ? "date-highlight" : ""}
                    >
                      {day ? `${schedule.month}월${day.day}일` : ""}
                    </td>
                  ))}
                </tr>
                {rows.map((row) => (
                  <tr key={`${week.index}-${row.id}`}>
                    <td className="time-col">{row.label}</td>
                    {week.days.map((day, index) => {
                      const generatedValue = day ? row.get(day) : "";
                      const editKey = day ? scheduleCellEditKey(day.dateKey, row.id) : "";
                      const hasManualEdit = Boolean(day) && Object.prototype.hasOwnProperty.call(scheduleCellEdits, editKey);
                      const value = hasManualEdit ? scheduleCellEdits[editKey] : generatedValue;
                      const editable = Boolean(day) && row.id !== "nightCategory" && (Boolean(generatedValue) || hasManualEdit);
                      const weekendClass = value && day?.weekday === 6
                        ? "blue-day weekend-duty-cell"
                        : value && day?.weekday === 0
                          ? "red-day weekend-duty-cell"
                          : "";
                      const cellClasses = [
                        day == null ? "blank-day" : weekendClass,
                        day && (day.weekday === 0 || day.weekday === 6 || day.holiday) ? "date-highlight" : "",
                        value ? scheduleNameDensityClass(value) : ""
                      ].filter(Boolean).join(" ");
                      return (
                        <td
                          key={`${week.index}-${row.id}-${index}`}
                          className={cellClasses}
                        >
                          {editable ? (
                            <>
                              <input
                                className="schedule-cell-input no-print"
                                value={value}
                                onChange={(event) =>
                                  setScheduleCellEdits({
                                    ...scheduleCellEdits,
                                    [editKey]: event.currentTarget.value
                                  })
                                }
                              />
                              <span className="schedule-cell-print-value">{value}</span>
                            </>
                          ) : value}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="schedule-event-row">
                  <td className="time-col">일정</td>
                  {week.days.map((day, index) => (
                    <td key={`event-${week.index}-${index}`} className={day == null ? "blank-day" : day.weekday === 0 || day.weekday === 6 || day.holiday ? "date-highlight" : ""}>
                      {day?.holidayName && <span className="schedule-chip holiday-chip">{day.holidayName}</span>}
                      {day?.events.map((event) => (
                        <span className="schedule-chip" key={`${event.date}-${event.title}`}>{event.title}</span>
                      ))}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="event-editor no-print">
        {Object.entries(eventLabels).map(([key, label]) => (
          <label key={key}>
            <span>{label}</span>
            <input
              type="date"
              value={eventDates[key as EventDateKey] ?? ""}
              onChange={(event) =>
                setEventDates({ ...eventDates, [key]: event.currentTarget.value })
              }
            />
          </label>
        ))}
        <label>
          <span>나이트 턴 변경일(해당 월·6주 주기)</span>
          <input
            type="date"
            value={currentMonthTurnDate}
            onChange={(event) => changeCurrentMonthTurnDate(event.currentTarget.value)}
          />
        </label>
      </div>

      {showLists && (
        <div className="list-editor no-print">
          <TextListEditor
            title="나이트 약사 리스트"
            value={listToText(lists.nightPharmacists)}
            onChange={(value) => setLists({ ...lists, nightPharmacists: textToList(value) })}
          />
          <TextListEditor
            title="나이트 직원 포지션"
            value={normalizeNightStaffPositions(lists.nightStaffPositions).map((row) => row.join("/")).join("\n")}
            onChange={(value) => setLists({ ...lists, nightStaffPositions: normalizeNightStaffPositions(positionTextToList(value)) })}
          />
          <TextListEditor
            title="직원 이름 순번"
            value={listToText(lists.weekendStaff)}
            onChange={(value) => setLists({ ...lists, weekendStaff: textToList(value) })}
          />
          <TextListEditor
            title="주말 약사 이름 리스트"
            value={listToText(lists.weekendPharmacists)}
            onChange={(value) => setLists({ ...lists, weekendPharmacists: textToList(value) })}
          />
        </div>
      )}
    </section>
  );
}

function AssignmentTab({
  year,
  month,
  staffAssignments,
  staffCellEdits,
  setStaffCellEdits,
  pharmacistAssignment,
  pharmacistCellEdits,
  setPharmacistCellEdits,
  assignmentNameLists,
  setAssignmentNameLists
}: {
  year: number;
  month: number;
  staffAssignments: ReturnType<typeof rotateStaffAssignments>;
  staffCellEdits: Record<string, string>;
  setStaffCellEdits: (value: Record<string, string>) => void;
  pharmacistAssignment: PharmacistAssignment;
  pharmacistCellEdits: Record<string, string>;
  setPharmacistCellEdits: (value: Record<string, string>) => void;
  assignmentNameLists: AssignmentNameLists;
  setAssignmentNameLists: (value: AssignmentNameLists) => void;
}) {
  const [selectedView, setSelectedView] = useState<AssignmentViewId>("staff");
  const selectedPrintView =
    assignmentPrintViews.find((view) => view.id === selectedView) ?? assignmentPrintViews[0];

  function getStaffEditValue(
    row: ReturnType<typeof rotateStaffAssignments>[number],
    rowIndex: number,
    columnKey: StaffAssignmentColumnKey
  ) {
    const editKey = staffAssignmentEditKey(year, month, rowIndex, columnKey);
    return staffCellEdits[editKey] ?? staffCellValue(row, columnKey);
  }

  function exportAssignmentExcel() {
    if (selectedView === "staff") {
      downloadExcelFile(
        `직원_업무분장_${year}-${String(month).padStart(2, "0")}.xls`,
        `${year}년 ${month}월 직원 업무 분장`,
        staffAssignmentColumns.map((column) => column.label),
        staffAssignments.map((row, rowIndex) =>
          staffAssignmentColumns.map((column) => getStaffEditValue(row, rowIndex, column.key))
        )
      );
      return;
    }

    downloadExcelFile(
      `약사_업무분장_${year}-${String(month).padStart(2, "0")}.xls`,
      pharmacistAssignment.title,
      pharmacistAssignment.columns.map((column) => column.label),
      pharmacistAssignment.rows.map((row) =>
        pharmacistAssignment.columns.map((column) => {
          const editKey = pharmacistEditKey(row.id, column.key);
          return pharmacistCellEdits[editKey] ?? row.cells[column.key].value;
        })
      )
    );
  }

  return (
    <section className={`panel print-page assignment-print-page ${selectedPrintView.id}`}>
      <div className="section-title row-title">
        <div>
          <h2>업무 분장</h2>
          <p>직원 업무 분장과 약사 업무 분장을 하위 탭으로 분리하고, 모든 칸을 저장 가능한 수기 입력으로 관리합니다.</p>
        </div>
        <button
          type="button"
          className="quiet no-print"
          onClick={exportAssignmentExcel}
        >
          <Save size={16} /> {selectedPrintView.title} 엑셀 출력
        </button>
      </div>

      <div className="subtabs assignment-subtabs no-print">
        {assignmentPrintViews.map((view) => (
          <button
            key={view.id}
            type="button"
            className={view.id === selectedView ? "selected" : ""}
            onClick={() => setSelectedView(view.id)}
          >
            {view.title}
          </button>
        ))}
      </div>

      {selectedView === "staff" && (
        <div className="assignment-single-panel">
          <h3>직원 업무 분장</h3>
          <table className="assignment-table staff-assignment-table">
            <thead>
              <tr>
                {staffAssignmentColumns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staffAssignments.map((row, rowIndex) => (
                <tr key={`${row.task}-${rowIndex}`}>
                  {staffAssignmentColumns.map((column) => {
                    const editKey = staffAssignmentEditKey(year, month, rowIndex, column.key);
                    const value = getStaffEditValue(row, rowIndex, column.key);
                    const compact = column.key === "task" || column.key.includes("Name") || column.key.includes("lunch");
                    return (
                      <td key={`${rowIndex}-${column.key}`} className="editable-cell staff-task-text">
                        {compact ? (
                          <input
                            className="cell-input"
                            value={value}
                            onChange={(event) =>
                              setStaffCellEdits({
                                ...staffCellEdits,
                                [editKey]: event.currentTarget.value
                              })
                            }
                          />
                        ) : (
                          <textarea
                            className="cell-textarea assignment-textarea"
                            value={value}
                            onChange={(event) =>
                              setStaffCellEdits({
                                ...staffCellEdits,
                                [editKey]: event.currentTarget.value
                              })
                            }
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="assignment-list-panel no-print">
            <TextListEditor
              title="시 간 이름 목록"
              value={listToText(assignmentNameLists.staffTimeNames)}
              onChange={(value) =>
                setAssignmentNameLists({
                  ...assignmentNameLists,
                  staffTimeNames: textToList(value)
                })
              }
            />
            <TextListEditor
              title="7:15~8:00 이름 목록"
              value={listToText(assignmentNameLists.staffEarlyNames)}
              onChange={(value) =>
                setAssignmentNameLists({
                  ...assignmentNameLists,
                  staffEarlyNames: textToList(value)
                })
              }
            />
          </div>
        </div>
      )}

      {selectedView === "pharmacist" && (
        <div className="assignment-single-panel pharmacist-assignment-panel">
          <h3>{pharmacistAssignment.title}</h3>
          <p className="assignment-source-note">
            약제팀 업무분장_2026.xlsx 틀을 기준으로 구성했습니다. 모든 표시 칸은 수기 편집 후 저장됩니다.
          </p>
          <table className="assignment-table pharmacist-assignment-table">
            <thead>
              <tr>
                {pharmacistAssignment.columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pharmacistAssignment.rows.map((row) => (
                <tr key={row.id} className={row.kind === "note" ? "note-row" : ""}>
                  {row.merged ? (
                    <td colSpan={pharmacistAssignment.columns.length} className="editable-cell merged-note-cell">
                      <input
                        className="cell-input"
                        value={pharmacistCellEdits[pharmacistEditKey(row.id, "name")] ?? row.cells.name.value}
                        onChange={(event) =>
                          setPharmacistCellEdits({
                            ...pharmacistCellEdits,
                            [pharmacistEditKey(row.id, "name")]: event.currentTarget.value
                          })
                        }
                      />
                    </td>
                  ) : pharmacistAssignment.columns.map((column) => {
                    const cell = row.cells[column.key];
                    const editKey = pharmacistEditKey(row.id, column.key);
                    const value = pharmacistCellEdits[editKey] ?? cell.value;
                    return (
                      <td key={column.key} className={cell.editable ? "editable-cell" : ""}>
                        {cell.editable ? (
                          column.key === "name" ? (
                            <input
                              className="cell-input"
                              value={value}
                              onChange={(event) =>
                                setPharmacistCellEdits({
                                  ...pharmacistCellEdits,
                                  [editKey]: event.currentTarget.value
                                })
                              }
                            />
                          ) : (
                            <textarea
                              className="cell-textarea"
                              value={value}
                              onChange={(event) =>
                                setPharmacistCellEdits({
                                  ...pharmacistCellEdits,
                                  [editKey]: event.currentTarget.value
                                })
                              }
                            />
                          )
                        ) : (
                          cell.value
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="assignment-list-panel no-print pharmacist-list-panel">
            <TextListEditor
              title="약사 이름 목록"
              value={listToText(assignmentNameLists.pharmacistNames)}
              onChange={(value) =>
                setAssignmentNameLists({
                  ...assignmentNameLists,
                  pharmacistNames: textToList(value)
                })
              }
            />
            <TextListEditor
              title="업무 고정 약사 그룹"
              value={listToText(assignmentNameLists.fixedPharmacistNames)}
              onChange={(value) =>
                setAssignmentNameLists({
                  ...assignmentNameLists,
                  fixedPharmacistNames: textToList(value)
                })
              }
            />
            <TextListEditor
              title="업무 순환 약사 그룹"
              value={listToText(assignmentNameLists.rotatingPharmacistNames)}
              onChange={(value) =>
                setAssignmentNameLists({
                  ...assignmentNameLists,
                  rotatingPharmacistNames: textToList(value)
                })
              }
            />
          </div>
        </div>
      )}
    </section>
  );
}

function DocumentsTab({
  year,
  month,
  onPrint
}: {
  year: number;
  month: number;
  onPrint: (orientation: PrintOrientation) => void;
}) {
  const [selected, setSelected] = useState(monthEndDocumentGroups[0].title);
  const [selectedItemId, setSelectedItemId] = useState(monthEndDocumentGroups[0].printItems[0].id);
  const [selectedPrintItemIds, setSelectedPrintItemIds] = useState<string[]>([monthEndDocumentGroups[0].printItems[0].id]);
  const [selectedEquipmentAssetNo, setSelectedEquipmentAssetNo] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);
  const group = monthEndDocumentGroups.find((item) => item.title === selected) ?? monthEndDocumentGroups[0];
  const selectedItem = group.printItems.find((item) => item.id === selectedItemId) ?? group.printItems[0];
  const days = Array.from({ length: new Date(year, month, 0).getDate() }, (_, index) => {
    const day = index + 1;
    const date = new Date(year, month - 1, day);
    const dateKey = toDateKey(year, month, day);
    return {
      day,
      weekday: ["일", "월", "화", "수", "목", "금", "토"][date.getDay()],
      holidayName: getHolidayName(dateKey),
      highlighted: isWeekend(date) || getHolidayName(dateKey) != null
    };
  });

  function selectGroup(nextGroupTitle: string) {
    const nextGroup = monthEndDocumentGroups.find((item) => item.title === nextGroupTitle) ?? monthEndDocumentGroups[0];
    setSelected(nextGroup.title);
    setSelectedItemId(nextGroup.printItems[0].id);
    setSelectedPrintItemIds([nextGroup.printItems[0].id]);
    setSelectedEquipmentAssetNo("");
  }

  function selectPrintItem(nextItemId: string) {
    setSelectedItemId(nextItemId);
    setSelectedEquipmentAssetNo("");
  }

  function togglePrintItem(itemId: string) {
    setSelectedPrintItemIds((ids) => ids.includes(itemId) ? ids.filter((id) => id !== itemId) : [...ids, itemId]);
  }

  function printSelectedItems() {
    if (selectedPrintItemIds.length === 0) return;
    setIsPrinting(true);
    window.setTimeout(() => onPrint(group.orientation), 50);
  }

  useEffect(() => {
    const finishPrinting = () => setIsPrinting(false);
    window.addEventListener("afterprint", finishPrinting);
    return () => window.removeEventListener("afterprint", finishPrinting);
  }, []);

  return (
    <section className="panel print-page">
      <div className="section-title">
        <h2>월말 결재 서류</h2>
        <p>원본 엑셀 서류의 시트와 장비 목록을 선택해 낱장으로 출력합니다.</p>
      </div>
      <div className="subtabs no-print">
        {monthEndDocumentGroups.map((item) => (
          <button
            key={item.title}
            type="button"
            className={item.title === selected ? "selected" : ""}
            onClick={() => selectGroup(item.title)}
          >
            {item.title}
          </button>
        ))}
      </div>

      <div className="document-sheet">
        <div className="document-sheet-title">
          <div>
            <h3>{year}년 {month}월 {selectedItem.title}</h3>
            <p>원본 파일: {group.sourceFile} / 시트: {selectedItem.sourceSheet}</p>
          </div>
          <button type="button" className="no-print" onClick={printSelectedItems} disabled={selectedPrintItemIds.length === 0}>
            <Printer size={16} /> 선택 서류 출력
          </button>
        </div>
        <div className="editable-fields no-print">
          {[...group.editableFields, ...selectedItem.columns].map((field, index) => (
            <label key={`${field}-${index}`}>
              <span>{field}</span>
              <input defaultValue={field} />
            </label>
          ))}
        </div>
        {selectedItem.notes?.map((note) => (
          <p className="document-note" key={note}>{note}</p>
        ))}

        {selectedItem.equipment ? (
          <table className="equipment-document-table">
            <thead>
              <tr>
                <th>자산번호</th>
                <th>장비명</th>
                {days.map(({ day, weekday, holidayName, highlighted }) => (
                  <th className={highlighted ? "date-highlight" : ""} key={day}>
                    {day}
                    <span>{weekday}</span>
                    {holidayName && <small>{holidayName}</small>}
                  </th>
                ))}
                <th>점검자 확인</th>
              </tr>
            </thead>
            <tbody>
              {selectedItem.equipment.map((equipment) => (
                <tr
                  className={equipment.assetNo === selectedEquipmentAssetNo ? "selected-equipment-row" : ""}
                  key={equipment.assetNo}
                >
                  <td><input className="cell-input compact-input" defaultValue={equipment.assetNo} /></td>
                  <td><input className="cell-input compact-input" defaultValue={equipment.name} /></td>
                  {days.map(({ day, highlighted }) => (
                    <td className={`empty-write-cell ${highlighted ? "date-highlight" : ""}`} key={day}></td>
                  ))}
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="document-data-table">
            <thead>
              <tr>
                <th>날짜</th>
                <th>요일</th>
                {selectedItem.columns.map((field) => (
                  <th key={field}>{field}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map(({ day, weekday, holidayName, highlighted }) => (
                <tr className={highlighted ? "date-highlight" : ""} key={day}>
                  <td>{day}일</td>
                  <td>
                    {weekday}
                    {holidayName && <small className="holiday-inline">{holidayName}</small>}
                  </td>
                  {selectedItem.columns.map((field) => (
                    <td className="empty-write-cell" key={field}></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="document-item-list no-print">
          <div>
            <h4>출력 항목 목록</h4>
            <div className="document-print-actions">
              <button type="button" onClick={() => setSelectedPrintItemIds(group.printItems.map((item) => item.id))}>전체 선택</button>
              <button type="button" onClick={() => setSelectedPrintItemIds([])}>선택 해제</button>
            </div>
            <div className="document-item-buttons">
              {group.printItems.map((item) => (
                <label key={item.id} className={item.id === selectedItem.id ? "selected" : ""}>
                  <input type="checkbox" checked={selectedPrintItemIds.includes(item.id)} onChange={() => togglePrintItem(item.id)} />
                  <button type="button" onClick={() => selectPrintItem(item.id)}>
                    <strong>{item.title}</strong>
                    <span>{item.sourceSheet}</span>
                  </button>
                </label>
              ))}
            </div>
          </div>

          {selectedItem.equipment && (
            <div>
              <h4>장비 목록</h4>
              <div className="equipment-list">
                {selectedItem.equipment.map((equipment) => (
                  <button
                    key={equipment.assetNo}
                    type="button"
                    className={equipment.assetNo === selectedEquipmentAssetNo ? "selected" : ""}
                    onClick={() => setSelectedEquipmentAssetNo(equipment.assetNo)}
                  >
                    <span>{equipment.assetNo}</span>
                    <strong>{equipment.name}</strong>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {isPrinting && (
        <div className="print-document-sheets">
          {group.printItems
            .filter((item) => selectedPrintItemIds.includes(item.id))
            .map((item) => <PrintDocumentSheet key={item.id} year={year} month={month} group={group} item={item} />)}
        </div>
      )}
    </section>
  );
}

function PrintDocumentSheet({
  year,
  month,
  group,
  item
}: {
  year: number;
  month: number;
  group: MonthEndDocumentGroup;
  item: MonthEndPrintItem;
}) {
  const days = buildChecklistMonthDays(year, month);
  return (
    <section className={`print-document-sheet ${item.id}`}>
      <h3>{group.title} - {item.title}</h3>
      <div className="print-approval-box">
        <div>담당자</div><div>파트장</div><div>팀장</div>
        <div className="approval-signature"></div><div className="approval-signature"></div><div className="approval-signature"></div>
      </div>
      <div className="print-document-meta">
        <span>{year}년 {month}월</span>
      </div>
      {item.notes?.map((note) => <p className="print-document-note" key={note}>{note}</p>)}
      {item.equipment ? (
        <table className="equipment-document-table document-data-table">
          <thead><tr><th>자산번호</th><th>장비명</th>{days.map((day) => <th className={day.offDay ? "date-highlight" : ""} key={day.dateKey}>{day.day}<span>{day.weekdayLabel}</span>{day.holidayName && <small>{day.holidayName}</small>}</th>)}<th>점검자</th></tr></thead>
          <tbody>{item.equipment.map((equipment) => (
            <tr key={equipment.assetNo}><td>{equipment.assetNo}</td><td>{equipment.name}</td>{days.map((day) => <td className={`empty-write-cell ${day.offDay ? "date-highlight" : ""}`} key={day.dateKey}></td>)}<td></td></tr>
          ))}</tbody>
        </table>
      ) : (
        <table className="document-data-table">
          <thead><tr><th>일자</th><th>요일</th>{item.columns.map((field) => <th key={field}>{field}</th>)}</tr></thead>
          <tbody>{days.map((day) => {
            return <tr className={day.offDay ? "date-highlight" : ""} key={day.dateKey}><td>{day.day}일</td><td>{day.weekdayLabel}{day.holidayName && <small className="holiday-inline">{day.holidayName}</small>}</td>{item.columns.map((field) => <td className={`empty-write-cell ${day.offDay ? "date-highlight" : ""}`} key={field}></td>)}</tr>;
          })}</tbody>
        </table>
      )}
    </section>
  );
}

function GlobalDocumentPrint({
  year,
  month,
  orientation
}: {
  year: number;
  month: number;
  orientation: PrintOrientation;
}) {
  return (
    <div className="global-document-print">
      {monthEndDocumentGroups
        .filter((group) => group.orientation === orientation)
        .flatMap((group) => group.printItems.map((item) => (
          <PrintDocumentSheet key={item.id} year={year} month={month} group={group} item={item} />
        )))}
    </div>
  );
}

function GlobalChecklistPrint({ year, month }: { year: number; month: number }) {
  const monthDays = buildChecklistMonthDays(year, month);
  return (
    <div className="global-checklist-print">
      {checklistPrintGroups.map((group) => (
        <article className="global-checklist-page" key={group.title}>
          <h3>{year}년 {month}월 {group.title}</h3>
          {group.sections.map((section) => (
            <table className="monthly-checklist-table" key={section}>
              <thead>
                <tr><th rowSpan={2}>번호</th><th rowSpan={2}>체크 항목</th><th rowSpan={2}>기준</th>{monthDays.map((day) => <th className={day.offDay ? "date-highlight" : ""} key={day.dateKey}>{day.day}</th>)}</tr>
                <tr>{monthDays.map((day) => <th className={`${day.offDay ? "date-highlight " : ""}checklist-weekday-cell`} key={`${day.dateKey}-weekday`}>{day.weekdayLabel}{day.holidayName && <small>{day.holidayName}</small>}</th>)}</tr>
              </thead>
              <tbody>{(staffChecklistSections[section] ?? []).map((item, index) => (
                <tr key={item}><td>{index + 1}</td><td>{item}</td><td></td>{monthDays.map((day) => <td className={`empty-write-cell ${day.offDay ? "date-highlight" : ""}`} key={day.dateKey}></td>)}</tr>
              ))}</tbody>
            </table>
          ))}
        </article>
      ))}
      {notebookChecklistGroups.map((group) => (
        <article className="global-checklist-page notebook-checklist-page" key={group.title}>
          <h3>{year}년 {month}월 {group.title}</h3>
          <NotebookSourceTable group={group} monthDays={monthDays} month={month} />
        </article>
      ))}
    </div>
  );
}

function NotebookSourceTable({
  group,
  monthDays,
  month
}: {
  group: (typeof notebookChecklistGroups)[number];
  monthDays: ReturnType<typeof buildChecklistMonthDays>;
  month: number;
}) {
  const columns = group.columns ?? [];
  return (
    <table className="notebook-source-table">
      <thead>
        <tr>
          {columns.map((column) => <th key={column}>{column}</th>)}
        </tr>
      </thead>
      <tbody>
        {monthDays.map((day) => (
          <tr className={day.offDay ? "date-highlight" : ""} key={day.dateKey}>
            <td className={day.offDay ? "date-highlight" : ""}>{month}/{day.day}</td>
            <td className={day.offDay ? "date-highlight" : ""}>{day.weekdayLabel}</td>
            {columns.slice(2).map((column) => <td className={`empty-write-cell ${day.offDay ? "date-highlight" : ""}`} key={column}></td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ChecklistsTab({
  year,
  month,
  onPrint
}: {
  year: number;
  month: number;
  onPrint: (orientation: PrintOrientation) => void;
}) {
  const [selected, setSelected] = useState("staff");
  const [selectedNotebook, setSelectedNotebook] = useState("1");
  const [selectedStaffPrintGroups, setSelectedStaffPrintGroups] = useState<string[]>(checklistPrintGroups.map((group) => group.title));
  const [isPrintingStaff, setIsPrintingStaff] = useState(false);
  const monthDays = buildChecklistMonthDays(year, month);
  const notebookGroups =
    selectedNotebook === "all"
      ? notebookChecklistGroups
      : notebookChecklistGroups.filter((_, index) => String(index + 1) === selectedNotebook);

  function checklistStandard(section: string, item: string) {
    if (section === "PTP 업무" && item.includes("칼시오")) return "60포";
    return "";
  }

  function toggleStaffPrintGroup(title: string) {
    setSelectedStaffPrintGroups((titles) => titles.includes(title) ? titles.filter((item) => item !== title) : [...titles, title]);
  }

  function printSelectedStaffGroups() {
    if (selectedStaffPrintGroups.length === 0) return;
    setIsPrintingStaff(true);
    window.setTimeout(() => onPrint("landscape"), 50);
  }

  useEffect(() => {
    const finishPrinting = () => setIsPrintingStaff(false);
    window.addEventListener("afterprint", finishPrinting);
    return () => window.removeEventListener("afterprint", finishPrinting);
  }, []);

  return (
    <section className="panel print-page">
      <div className="section-title row-title">
        <div>
          <h2>체크리스트</h2>
          <p>직원 업무 체크리스트는 가로, 노트북 체크리스트는 세로 출력입니다.</p>
        </div>
        <div className="segmented no-print">
          <button type="button" className={selected === "staff" ? "selected" : ""} onClick={() => setSelected("staff")}>
            직원 업무
          </button>
          <button type="button" className={selected === "notebook" ? "selected" : ""} onClick={() => setSelected("notebook")}>
            노트북
          </button>
        </div>
      </div>

      {selected === "staff" && (
        <div className={`checklist-pages ${isPrintingStaff ? "printing-staff" : ""}`}>
          <div className="staff-print-actions no-print">
            <button type="button" onClick={() => setSelectedStaffPrintGroups(checklistPrintGroups.map((group) => group.title))}>전체 선택</button>
            <button type="button" onClick={() => setSelectedStaffPrintGroups([])}>선택 해제</button>
            <button type="button" onClick={printSelectedStaffGroups} disabled={selectedStaffPrintGroups.length === 0}>
              <Printer size={16} /> 선택 항목 출력
            </button>
          </div>
          {checklistPrintGroups.map((group) => (
            <article className={`checklist-page ${group.orientation} ${selectedStaffPrintGroups.includes(group.title) ? "staff-print-selected" : ""}`} key={group.title}>
              <div className="checklist-title">
                <h3>{year}년 {month}월 {group.title}</h3>
                <label className="staff-print-select no-print">
                  <input type="checkbox" checked={selectedStaffPrintGroups.includes(group.title)} onChange={() => toggleStaffPrintGroup(group.title)} />
                  선택
                </label>
                <button type="button" className="no-print" onClick={() => {
                  setSelectedStaffPrintGroups([group.title]);
                  setIsPrintingStaff(true);
                  window.setTimeout(() => onPrint("landscape"), 50);
                }}>
                  <Printer size={16} /> 이 장 출력
                </button>
              </div>
              {group.sections.map((section) => (
                <div key={section} className="checklist-table-wrap">
                  <h4>{section}</h4>
                  <table className="monthly-checklist-table">
                    <thead>
                      <tr>
                        <th rowSpan={2}>번호</th>
                        <th rowSpan={2}>체크 항목</th>
                        <th rowSpan={2}>기준</th>
                        {monthDays.map((day) => (
                          <th className={day.offDay ? "date-highlight" : ""} key={day.dateKey}>{month}/{day.day}</th>
                        ))}
                      </tr>
                      <tr>
                        {monthDays.map((day) => (
                          <th
                            className={[
                              "checklist-weekday-cell",
                              day.offDay ? "date-highlight" : ""
                            ].filter(Boolean).join(" ")}
                            key={`${day.dateKey}-weekday`}
                          >
                            {day.weekdayLabel}
                            {day.holidayName && <small>{day.holidayName}</small>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(staffChecklistSections[section] ?? []).map((item, index) => (
                        <tr key={item}>
                          <td>{index + 1}</td>
                          <td className="checklist-item-cell">{item}</td>
                          <td>{checklistStandard(section, item)}</td>
                          {monthDays.map((day) => (
                            <td className={`empty-write-cell ${day.offDay ? "date-highlight" : ""}`} key={day.dateKey}></td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </article>
          ))}
        </div>
      )}

      {selected === "notebook" && (
        <div className="checklist-pages">
          <div className="notebook-selector no-print">
            {notebookChecklistGroups.map((group, index) => (
              <button
                key={group.title}
                type="button"
                className={selectedNotebook === String(index + 1) ? "selected" : ""}
                onClick={() => setSelectedNotebook(String(index + 1))}
              >
                {index + 1}번
              </button>
            ))}
            <button
              type="button"
              className={selectedNotebook === "all" ? "selected" : ""}
              onClick={() => setSelectedNotebook("all")}
            >
              전체
            </button>
            <button type="button" className="quiet" onClick={() => onPrint("portrait")}>
              <Printer size={16} /> {selectedNotebook === "all" ? "전체 출력" : "선택 출력"}
            </button>
          </div>
          {notebookGroups.map((group) => (
            <article className="checklist-page portrait notebook-checklist-page" key={group.title}>
              <div className="checklist-title">
                <h3>{year}년 {month}월 {group.title}</h3>
              </div>
              <NotebookSourceTable group={group} monthDays={monthDays} month={month} />
              <table className="notebook-month-table legacy-notebook-month-table">
                <thead>
                  <tr>
                    <th>날짜</th>
                    <th>요일</th>
                    <th>전원</th>
                    <th>인터넷</th>
                    <th>충전기</th>
                    <th>보관 위치</th>
                    <th>비고</th>
                    <th>확인</th>
                  </tr>
                </thead>
                <tbody>
                  {monthDays.map((day) => (
                    <tr className={day.offDay ? "date-highlight" : ""} key={day.dateKey}>
                      <td>{month}/{day.day}</td>
                      <td>
                        {day.weekdayLabel}
                        {day.holidayName && <small className="holiday-inline">{day.holidayName}</small>}
                      </td>
                      <td className="empty-write-cell"></td>
                      <td className="empty-write-cell"></td>
                      <td className="empty-write-cell"></td>
                      <td className="empty-write-cell"></td>
                      <td className="empty-write-cell"></td>
                      <td className="empty-write-cell"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function TextListEditor({
  title,
  value,
  onChange
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-list-editor">
      <span>{title}</span>
      <textarea value={value} onChange={(event) => onChange(event.currentTarget.value)} />
    </label>
  );
}

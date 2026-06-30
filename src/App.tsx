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
import { useMemo, useState } from "react";
import appIcon from "./assets/app-icon.png";
import palette from "./assets/palette.png";
import { buildMonthDays, CalendarEvent, getHolidayName, isWeekend, toDateKey } from "./domain/calendar";
import {
  buildMonthSchedule,
  buildScheduleWeeks,
  defaultNightPharmacists,
  defaultNightStaffPositions,
  defaultWeekendPharmacists,
  defaultWeekendStaff,
  EventDateKey,
  scheduleNameDensityClass,
  ScheduleEventDates
} from "./domain/schedule";
import {
  buildChecklistMonthDays,
  checklistPrintGroups,
  monthEndDocumentGroups,
  notebookChecklistGroups,
  staffChecklistSections
} from "./domain/documents";
import {
  defaultStaffEarlyNames,
  defaultStaffTimeNames,
  rotateStaffAssignments,
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

const eventLabels: Record<EventDateKey, string> = {
  expiryReview: "유효기간 조사일",
  monthlyMeeting: "월례회의",
  deepClean: "대청소",
  oralInventory: "재고 조사_경구",
  injectionInventory: "재고조사_주사",
  staffTaskChange: "직원 업무 변경일"
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
    .map((line) => textToList(line))
    .filter((line) => line.length > 0);
}

function monthOffsetFrom2026(year: number, month: number) {
  return (year - 2026) * 12 + (month - 1);
}

function pharmacistEditKey(rowId: string, columnKey: PharmacistAssignmentColumnKey) {
  return `${rowId}:${columnKey}`;
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
      <caption>${escapeHtml(title)}</caption>
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
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1;

  const [lists, setLists] = useLocalStorageState<EditableLists>("pharmacy-app-lists", {
    nightPharmacists: defaultNightPharmacists,
    nightStaffPositions: defaultNightStaffPositions,
    weekendStaff: defaultWeekendStaff,
    weekendPharmacists: defaultWeekendPharmacists
  });

  const [eventDates, setEventDates] = useLocalStorageState<ScheduleEventDates>(
    "pharmacy-app-event-dates",
    {
      expiryReview: "",
      monthlyMeeting: "",
      deepClean: "",
      oralInventory: "",
      injectionInventory: "",
      staffTaskChange: ""
    }
  );

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

  const schedule = useMemo(
    () =>
      buildMonthSchedule(year, month, {
        eventDates,
        nightPharmacists: lists.nightPharmacists,
        nightStaffPositions: lists.nightStaffPositions,
        weekendStaff: lists.weekendStaff,
        weekendPharmacists: lists.weekendPharmacists
      }),
    [eventDates, lists, month, year]
  );

  const calendarEvents: CalendarEvent[] = schedule.events;
  const calendarCells = buildMonthDays(year, month, calendarEvents);
  const staffAssignments = rotateStaffAssignments(
    staffAssignmentTemplate,
    Math.max(0, monthOffsetFrom2026(year, month)),
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

  return (
    <div className={`app print-${printOrientation}`}>
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
            <button type="button" onClick={() => printCurrent("landscape")}>
              <Printer size={17} /> 가로 출력
            </button>
            <button type="button" onClick={() => printCurrent("portrait")}>
              <Printer size={17} /> 세로 출력
            </button>
          </div>
        </header>

        <section className="calendar-panel print-page">
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
  setEventDates
}: {
  schedule: ReturnType<typeof buildMonthSchedule>;
  lists: EditableLists;
  setLists: (value: EditableLists) => void;
  eventDates: ScheduleEventDates;
  setEventDates: (value: ScheduleEventDates) => void;
}) {
  const [showLists, setShowLists] = useState(true);
  const weeks = buildScheduleWeeks(schedule);
  const weekdays = ["월", "화", "수", "목", "금", "토", "일"];
  const rows = [
    { label: "17:00-익일08:00", get: (day: (typeof schedule.days)[number]) => day.nightPharmacists.join("/") },
    { label: "20:00-익일07:00", get: (day: (typeof schedule.days)[number]) => day.nightStaff.join("/") },
    { label: "나이트 업무 구분", get: () => "" },
    { label: "07:15-11:15", get: (day: (typeof schedule.days)[number]) => day.morningStaff.join("/") },
    { label: "08:00-17:00", get: (day: (typeof schedule.days)[number]) => day.dayPharmacists.join("/") },
    { label: "08:00-12:00 약사", get: (day: (typeof schedule.days)[number]) => day.upperMorningPharmacists.join("/") },
    { label: "08:00-12:00 직원", get: (day: (typeof schedule.days)[number]) => day.lowerMorningStaff.join("/") }
  ];

  return (
    <section className="print-page panel">
      <div className="section-title row-title">
        <div>
          <h2>약제팀 근무표</h2>
          <p>나이트 약사, 나이트 직원, 주말/공휴일 근무와 지정 일정을 주 단위로 표시합니다.</p>
        </div>
        <button type="button" className="quiet no-print" onClick={() => setShowLists((open) => !open)}>
          <Save size={16} /> 이름 리스트 편집
        </button>
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
                      className={day == null ? "blank-day" : day.weekday === 0 || day.holiday ? "red-day" : day.weekday === 6 ? "blue-day" : ""}
                    >
                      {day ? `${schedule.month}월${day.day}일` : ""}
                    </td>
                  ))}
                </tr>
                {rows.map((row) => (
                  <tr key={`${week.index}-${row.label}`}>
                    <td className="time-col">{row.label}</td>
                    {week.days.map((day, index) => {
                      const value = day ? row.get(day) : "";
                      const weekendClass = value && day?.weekday === 6
                        ? "blue-day weekend-duty-cell"
                        : value && day?.weekday === 0
                          ? "red-day weekend-duty-cell"
                          : "";
                      const cellClasses = [
                        day == null ? "blank-day" : weekendClass,
                        value ? scheduleNameDensityClass(value) : ""
                      ].filter(Boolean).join(" ");
                      return (
                        <td
                          key={`${week.index}-${row.label}-${index}`}
                          className={cellClasses}
                        >
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="schedule-event-row">
                  <td className="time-col">일정</td>
                  {week.days.map((day, index) => (
                    <td key={`event-${week.index}-${index}`} className={day == null ? "blank-day" : ""}>
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
            value={lists.nightStaffPositions.map((row) => row.join("/")).join("\n")}
            onChange={(value) => setLists({ ...lists, nightStaffPositions: positionTextToList(value) })}
          />
          <TextListEditor
            title="직원 이름 리스트"
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
  const [selectedEquipmentAssetNo, setSelectedEquipmentAssetNo] = useState("");
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
    setSelectedEquipmentAssetNo("");
  }

  function selectPrintItem(nextItemId: string) {
    setSelectedItemId(nextItemId);
    setSelectedEquipmentAssetNo("");
  }

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
          <button type="button" className="no-print" onClick={() => onPrint(selectedItem.orientation)}>
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
          <table>
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
            <div className="document-item-buttons">
              {group.printItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={item.id === selectedItem.id ? "selected" : ""}
                  onClick={() => selectPrintItem(item.id)}
                >
                  <strong>{item.title}</strong>
                  <span>{item.sourceSheet}</span>
                </button>
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
    </section>
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
  const monthDays = buildChecklistMonthDays(year, month);
  const notebookGroups =
    selectedNotebook === "all"
      ? notebookChecklistGroups
      : notebookChecklistGroups.filter((_, index) => String(index + 1) === selectedNotebook);

  function checklistStandard(section: string, item: string) {
    if (section === "PTP 업무" && item.includes("칼시오")) return "60포";
    return "";
  }

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
        <div className="checklist-pages">
          {checklistPrintGroups.map((group) => (
            <article className={`checklist-page ${group.orientation}`} key={group.title}>
              <div className="checklist-title">
                <h3>{year}년 {month}월 {group.title}</h3>
                <button type="button" className="no-print" onClick={() => onPrint("landscape")}>
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
              <table className="notebook-month-table">
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

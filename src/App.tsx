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
import { buildMonthDays, CalendarEvent, toDateKey } from "./domain/calendar";
import {
  buildMonthSchedule,
  defaultNightPharmacists,
  defaultNightStaffPositions,
  defaultWeekendPharmacists,
  defaultWeekendStaff,
  EventDateKey,
  ScheduleEventDates
} from "./domain/schedule";
import {
  checklistPrintGroups,
  monthEndDocumentGroups,
  notebookChecklistGroups,
  staffChecklistSections
} from "./domain/documents";
import {
  rotateStaffAssignments,
  staffAssignmentTemplate
} from "./domain/taskRotation";
import {
  assignmentPrintViews,
  AssignmentViewId
} from "./domain/assignmentViews";
import {
  buildPharmacistAssignment,
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

  const calendarEvents: CalendarEvent[] = schedule.events.concat({
    date: "2026-09-21",
    title: "나이트 턴 변경",
    type: "turn"
  });
  const calendarCells = buildMonthDays(year, month, calendarEvents);
  const staffAssignments = rotateStaffAssignments(
    staffAssignmentTemplate,
    Math.max(0, monthOffsetFrom2026(year, month))
  );
  const pharmacistAssignment = useMemo(
    () => buildPharmacistAssignment(year, month),
    [month, year]
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
            pharmacistAssignment={pharmacistAssignment}
            pharmacistCellEdits={pharmacistCellEdits}
            setPharmacistCellEdits={setPharmacistCellEdits}
          />
        )}

        {activeTab === "documents" && <DocumentsTab year={year} month={month} />}

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
  const rows = [
    { label: "17:00-익일08:00", get: (day: (typeof schedule.days)[number]) => day.nightPharmacists.join("/") },
    { label: "20:00-익일07:00", get: (day: (typeof schedule.days)[number]) => day.nightStaff.join("/") },
    { label: "07:15-11:15", get: (day: (typeof schedule.days)[number]) => day.morningStaff.join("/") },
    { label: "08:00-17:00", get: (day: (typeof schedule.days)[number]) => day.dayPharmacists.join("/") },
    { label: "08:00-12:00 위", get: (day: (typeof schedule.days)[number]) => day.upperMorningPharmacists.join("/") },
    { label: "08:00-12:00 아래", get: (day: (typeof schedule.days)[number]) => day.lowerMorningStaff.join("/") }
  ];

  return (
    <section className="print-page panel">
      <div className="section-title row-title">
        <div>
          <h2>약사 근무표</h2>
          <p>나이트 약사, 나이트 직원, 주말/공휴일 근무를 자동 산출합니다.</p>
        </div>
        <button type="button" className="quiet no-print" onClick={() => setShowLists((open) => !open)}>
          <Save size={16} /> 이름 리스트 편집
        </button>
      </div>

      <div className="wide-table">
        <table>
          <thead>
            <tr>
              <th>근무시간</th>
              {schedule.days.map((day) => (
                <th key={day.dateKey} className={day.weekday === 0 || day.holiday ? "red-day" : day.weekday === 6 ? "blue-day" : ""}>
                  {day.day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="time-col">{row.label}</td>
                {schedule.days.map((day) => (
                  <td key={`${row.label}-${day.dateKey}`}>{row.get(day)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
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
  pharmacistAssignment,
  pharmacistCellEdits,
  setPharmacistCellEdits
}: {
  year: number;
  month: number;
  staffAssignments: ReturnType<typeof rotateStaffAssignments>;
  pharmacistAssignment: PharmacistAssignment;
  pharmacistCellEdits: Record<string, string>;
  setPharmacistCellEdits: (value: Record<string, string>) => void;
}) {
  const [selectedView, setSelectedView] = useState<AssignmentViewId>("staff");
  const selectedPrintView =
    assignmentPrintViews.find((view) => view.id === selectedView) ?? assignmentPrintViews[0];

  return (
    <section className={`panel print-page assignment-print-page ${selectedPrintView.id}`}>
      <div className="section-title row-title">
        <div>
          <h2>업무 분장</h2>
          <p>직원 업무 분장과 약사 업무 분장을 하위 탭으로 분리해 각각 한 장씩 출력합니다.</p>
        </div>
        <button
          type="button"
          className="quiet no-print"
          onClick={() => window.print()}
        >
          <Printer size={16} /> {selectedPrintView.title} 출력
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
          <table className="assignment-table">
            <thead>
              <tr>
                <th>업무</th>
                <th>B행 담당</th>
                <th>C/D 흰색 셀</th>
                <th>점심</th>
                <th>오전 업무</th>
                <th>오후 업무</th>
              </tr>
            </thead>
            <tbody>
              {staffAssignments.map((row) => (
                <tr key={row.task}>
                  <td>{row.task}</td>
                  <td className="editable-cell" contentEditable suppressContentEditableWarning>{row.primaryName}</td>
                  <td className="editable-cell" contentEditable suppressContentEditableWarning>{row.helperName ?? ""}</td>
                  <td>{row.lunchSlot}</td>
                  <td>{row.morningTask}</td>
                  <td>{row.afternoonTask}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedView === "pharmacist" && (
        <div className="assignment-single-panel pharmacist-assignment-panel">
          <h3>{pharmacistAssignment.title}</h3>
          <p className="assignment-source-note">
            약제팀 업무분장_2026.xlsx 틀을 기준으로 구성했습니다. 이름 칸은 모두 편집 가능하며, 지정 약사의 업무 칸만 수기 편집 대상입니다.
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
                  {pharmacistAssignment.columns.map((column) => {
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
        </div>
      )}
    </section>
  );
}

function DocumentsTab({ year, month }: { year: number; month: number }) {
  const [selected, setSelected] = useState(monthEndDocumentGroups[0].title);
  const group = monthEndDocumentGroups.find((item) => item.title === selected) ?? monthEndDocumentGroups[0];
  const days = Array.from({ length: new Date(year, month, 0).getDate() }, (_, index) => index + 1);

  return (
    <section className="panel print-page">
      <div className="section-title">
        <h2>월말 결재 서류</h2>
        <p>원본 엑셀 서류의 출력 단위를 앱 안에서 편집 가능한 표로 재구성합니다.</p>
      </div>
      <div className="subtabs no-print">
        {monthEndDocumentGroups.map((item) => (
          <button
            key={item.title}
            type="button"
            className={item.title === selected ? "selected" : ""}
            onClick={() => setSelected(item.title)}
          >
            {item.title}
          </button>
        ))}
      </div>

      <div className="document-sheet">
        <h3>{year}년 {month}월 {group.title}</h3>
        <p>원본 파일: {group.sourceFile}</p>
        <div className="editable-fields no-print">
          {group.editableFields.map((field) => (
            <label key={field}>
              <span>{field}</span>
              <input defaultValue={field} />
            </label>
          ))}
        </div>
        <table>
          <thead>
            <tr>
              <th>날짜</th>
              {group.editableFields.map((field) => (
                <th key={field}>{field}</th>
              ))}
              <th>확인</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day}>
                <td>{day}일</td>
                {group.editableFields.map((field) => (
                  <td className="empty-write-cell" key={field}></td>
                ))}
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>
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
  const allGroups = selected === "staff" ? checklistPrintGroups : notebookChecklistGroups;

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

      <div className="checklist-pages">
        {allGroups.map((group) => (
          <article className={`checklist-page ${group.orientation}`} key={group.title}>
            <div className="checklist-title">
              <h3>{year}년 {month}월 {group.title}</h3>
              <button type="button" className="no-print" onClick={() => onPrint(group.orientation)}>
                <Printer size={16} /> 이 장 출력
              </button>
            </div>
            {group.sections.map((section) => (
              <div key={section}>
                <h4>{section}</h4>
                <table>
                  <thead>
                    <tr>
                      <th>번호</th>
                      <th>체크 항목</th>
                      {Array.from({ length: 7 }, (_, index) => (
                        <th key={index}>{month}/{index + 1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(staffChecklistSections[section] ?? ["점검", "충전 상태", "보관 위치", "비고"]).map((item, index) => (
                      <tr key={item}>
                        <td>{index + 1}</td>
                        <td>{item}</td>
                        {Array.from({ length: 7 }, (_, dayIndex) => (
                          <td className="empty-write-cell" key={dayIndex}></td>
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

import React, { useState, useEffect } from 'react';
import { Calendar, FileText, CheckSquare, Users, Clock, Printer, ChevronLeft, ChevronRight, Edit3, MapPin } from 'lucide-react';

const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month - 1, 1).getDay();
const formatDate = (year, month, day) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
const isSunday = (year, month, day) => new Date(year, month - 1, day).getDay() === 0;
const isSaturday = (year, month, day) => new Date(year, month - 1, day).getDay() === 6;

const HOLIDAYS_2026 = {
  '2026-01-01': '신정', '2026-02-16': '설날연휴', '2026-02-17': '설날', '2026-02-18': '설날연휴',
  '2026-03-01': '삼일절', '2026-05-05': '어린이날', '2026-05-24': '부처님오신날', '2026-05-25': '대체공휴일',
  '2026-06-06': '현충일', '2026-08-15': '광복절', '2026-09-24': '추석연휴', '2026-09-25': '추석',
  '2026-09-26': '추석연휴', '2026-10-03': '개천절', '2026-10-09': '한글날', '2026-12-25': '기독탄신일'
};

const isHoliday = (year, month, day) => !!HOLIDAYS_2026[formatDate(year, month, day)];
const isOffDay = (year, month, day) => isSunday(year, month, day) || isSaturday(year, month, day) || isHoliday(year, month, day);

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 1));
  const [activeTab, setActiveTab] = useState('calendar');
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const [printOrientation, setPrintOrientation] = useState('portrait');

  // 데이터 관리
  const [nightPharmList, setNightPharmList] = useState("윤주원\n정순미\n송유희\n이상훈\n장소희\n김동신");
  const [nightStaffList, setNightStaffList] = useState("이율경,고우리\n전다은,신혜정\n이현주,현경아");
  const [weekendStaffList, setWeekendStaffList] = useState("김동희\n박종연\n김지은\n김지현\n강승원\n박지숙\n송현우\n김서훈");
  const [weekendPharmList, setWeekendPharmList] = useState("최윤영\n이지은\n오아라\n이정화\n안혜정\n박현영\n김연지\n이호연\n김경원\n김수빈\n박주영");
  const [events, setEvents] = useState([{ date: '2026-07-15', title: '월례회의', type: '회의' }]);
  const [equipments, setEquipments] = useState(["정제정류포장시스템(ATC)", "자동분할포장기", "산제 조제기"]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      <style>{`@media print { @page { size: ${printOrientation}; margin: 10mm; } .no-print { display: none !important; } }`}</style>
      
      <header className="bg-teal-700 text-white p-4 flex justify-between items-center no-print">
        <h1 className="text-xl font-bold">약제팀 통합 업무 꾸러미</h1>
        <div className="flex items-center gap-2 bg-teal-800 p-1 rounded">
          <button onClick={() => setCurrentDate(new Date(year, month - 2, 1))} className="p-1"><ChevronLeft size={18} /></button>
          <span>{year}년 {month}월</span>
          <button onClick={() => setCurrentDate(new Date(year, month, 1))} className="p-1"><ChevronRight size={18} /></button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <nav className="w-56 bg-white border-r p-4 flex flex-col gap-2 no-print">
          <NavButton active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} icon={<Calendar size={16}/>} text="달력" />
          <NavButton active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} icon={<Clock size={16}/>} text="근무표" />
          <NavButton active={activeTab === 'task_pharm'} onClick={() => setActiveTab('task_pharm')} icon={<Users size={16}/>} text="약제팀 업무 분장" />
          <NavButton active={activeTab === 'task_staff'} onClick={() => setActiveTab('task_staff')} icon={<Users size={16}/>} text="직원 업무 분장" />
          <NavButton active={activeTab === 'docs'} onClick={() => setActiveTab('docs')} icon={<FileText size={16}/>} text="월말 결재 서류" />
          <NavButton active={activeTab === 'checklist'} onClick={() => setActiveTab('checklist')} icon={<CheckSquare size={16}/>} text="체크리스트" />
          <button onClick={() => window.print()} className="mt-auto bg-indigo-600 text-white p-2 rounded">출력</button>
        </nav>
        <main className="flex-1 overflow-auto p-6">
          {activeTab === 'calendar' && <CalendarTab year={year} month={month} events={events} />}
          {activeTab === 'schedule' && <ScheduleTab year={year} month={month} lists={{nightPharmList, nightStaffList, weekendStaffList, weekendPharmList}} setters={{setNightPharmList, setNightStaffList, setWeekendStaffList, setWeekendPharmList, setEvents}} events={events} />}
          {activeTab === 'task_pharm' && <PharmTaskTab year={year} month={month} />}
          {activeTab === 'task_staff' && <StaffTaskTab year={year} month={month} />}
          {activeTab === 'docs' && <DocsTab year={year} month={month} equipments={equipments} setEquipments={setEquipments} setOrientation={setPrintOrientation} />}
          {activeTab === 'checklist' && <ChecklistTab year={year} month={month} setOrientation={setPrintOrientation} />}
        </main>
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon, text }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${active ? 'bg-teal-50 text-teal-700' : 'hover:bg-slate-100'}`}>
      {icon} {text}
    </button>
  );
}

function CalendarTab({ year, month, events }) {
  const days = Array.from({ length: getDaysInMonth(year, month) }, (_, i) => i + 1);
  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">{year}년 {month}월</h2>
      <div className="grid grid-cols-7 gap-px bg-slate-200 border rounded overflow-hidden">
        {['일', '월', '화', '수', '목', '금', '토'].map(d => <div key={d} className="bg-slate-50 p-2 text-center text-sm font-bold">{d}</div>)}
        {Array.from({ length: getFirstDayOfMonth(year, month) }).map((_, i) => <div key={i} className="bg-white min-h-[100px]"></div>)}
        {days.map(d => (
          <div key={d} className={`min-h-[100px] p-2 ${isOffDay(year, month, d) ? 'bg-slate-100' : 'bg-white'}`}>
            <div className="font-bold">{d}</div>
            {events.filter(e => e.date === formatDate(year, month, d)).map((ev, i) => <div key={i} className="text-xs bg-teal-100 p-1 mt-1 rounded">{ev.title}</div>)}
          </div>
        ))}
      </div>
    </div>
  );
}

function ScheduleTab({ year, month, lists, setters, events }) {
  const days = Array.from({ length: getDaysInMonth(year, month) }, (_, i) => i + 1);
  return (
    <div className="bg-white p-6 rounded shadow overflow-x-auto">
      <table className="w-full border-collapse text-xs text-center">
        <thead>
          <tr className="bg-slate-100">
            <th className="border p-2">구분</th>
            {days.map(d => <th key={d} className={`border p-1 ${isOffDay(year, month, d) ? 'bg-slate-200' : ''}`}>{d}</th>)}
          </tr>
        </thead>
        <tbody>
          <tr><td className="border p-2">나이트 약사</td>{days.map(d => <td key={d} className="border"></td>)}</tr>
          <tr><td className="border p-2">나이트 직원</td>{days.map(d => <td key={d} className="border"></td>)}</tr>
        </tbody>
      </table>
    </div>
  );
}

function PharmTaskTab({ year, month }) {
  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">약제팀 업무 분장 ({year}년 {month}월)</h2>
      <table className="w-full border-collapse border text-sm">
        <thead className="bg-teal-50">
          <tr>
            <th className="border p-2">이름</th>
            <th className="border p-2">08:00-10:00</th>
            <th className="border p-2">10:00-11:30</th>
            <th className="border p-2">점심</th>
            <th className="border p-2">오후</th>
          </tr>
        </thead>
        <tbody>
           {/* 샘플 행 2개 */}
           {['최윤영', '김지혜'].map(name => (
             <tr key={name}><td className="border p-2">{name}</td><td className="border p-2"></td><td className="border p-2"></td><td className="border p-2"></td><td className="border p-2"></td></tr>
           ))}
        </tbody>
      </table>
    </div>
  );
}

function StaffTaskTab({ year, month }) {
  // 8인 업무 분장
  const initialNames = ["김동희","박종연","김지은","김지현","강승원","박지숙","송현우","김서훈"];
  const shiftAmount = (year * 12 + month) % initialNames.length;
  let names = [...initialNames];
  for(let i=0; i<shiftAmount; i++) names.unshift(names.pop());
  
  const tasks = [
    { type: '조제보조1' }, { type: '조제보조2' }, { type: '추/긴' }, { type: '외용' }, 
    { type: 'ATC' }, { type: 'PTP' }, { type: '주사' }, { type: '비품/사무' }
  ];

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">직원 업무 분장</h2>
      <table className="w-full border-collapse border text-sm text-center">
        <thead className="bg-indigo-50">
          <tr>
            <th className="border p-2">업무</th>
            <th className="border p-2">담당자</th>
            <th className="border p-2">8:00-11:30</th>
            <th className="border p-2">오후업무</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t, i) => (
            <tr key={i}>
              <td className="border p-2 font-bold bg-slate-50">{t.type}</td>
              <td className="border p-2"><input className="w-full text-center outline-none" defaultValue={names[i]} /></td>
              <td className="border p-2"></td>
              <td className="border p-2"></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DocsTab({ year, month, equipments, setEquipments, setOrientation }) {
  const [selectedLoc, setSelectedLoc] = useState('외래약국');
  useEffect(() => setOrientation('portrait'), [setOrientation]);
  const days = Array.from({ length: getDaysInMonth(year, month) }, (_, i) => i + 1);

  return (
    <div className="flex gap-4">
      <div className="w-48 no-print">
        {['외래약국', '병동조제실', '주사조제실', '마약실'].map(loc => (
          <button key={loc} onClick={() => setSelectedLoc(loc)} className={`block w-full p-2 text-left border mb-1 rounded ${selectedLoc === loc ? 'bg-teal-50 border-teal-500' : ''}`}>{loc}</button>
        ))}
      </div>
      <div className="flex-1 bg-white p-6 rounded shadow">
        <h2 className="text-lg font-bold">냉장고 온도 기록 ({selectedLoc})</h2>
        <table className="w-full border-collapse border mt-4 text-sm">
          {days.map(d => (
            <tr key={d} className={isOffDay(year, month, d) ? 'bg-slate-100' : ''}>
              <td className="border p-1">{d}일</td>
              <td className="border p-1"></td>
            </tr>
          ))}
        </table>
      </div>
    </div>
  );
}

function ChecklistTab({ year, month, setOrientation }) {
  const days = Array.from({ length: getDaysInMonth(year, month) }, (_, i) => i + 1);
  return (
    <div className="bg-white p-6 rounded shadow">
      <table className="w-full border-collapse border text-xs text-center">
        <thead>
          <tr>
             <th className="border p-1">날짜</th>
             {days.map(d => <th key={d} className={`border p-1 ${isOffDay(year, month, d) ? 'bg-slate-200' : ''}`}>{d}</th>)}
          </tr>
        </thead>
        <tbody>
           <tr><td className="border p-2">외용제체크</td>{days.map(d => <td key={d} className={`border ${isOffDay(year, month, d) ? 'bg-slate-100' : ''}`}></td>)}</tr>
        </tbody>
      </table>
    </div>
  );
}
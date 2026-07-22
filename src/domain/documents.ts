import { dateKeyToDate, daysInMonth, getHolidayName, isWeekend, toDateKey } from "./calendar";

export type PrintOrientation = "portrait" | "landscape";

export type PrintableGroup = {
  title: string;
  sections: string[];
  orientation: PrintOrientation;
  columns?: string[];
};

export type ChecklistMonthDay = {
  day: number;
  dateKey: string;
  weekdayLabel: string;
  holidayName?: string;
  offDay: boolean;
};

export type DocumentEquipment = {
  assetNo: string;
  name: string;
};

export type MonthEndPrintItem = {
  id: string;
  title: string;
  sourceSheet: string;
  columns: string[];
  orientation: PrintOrientation;
  notes?: string[];
  equipment?: DocumentEquipment[];
};

export type MonthEndDocumentGroup = {
  title: string;
  sourceFile: string;
  editableFields: string[];
  orientation: PrintOrientation;
  printItems: MonthEndPrintItem[];
};

const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];

export function buildChecklistMonthDays(year: number, month: number): ChecklistMonthDay[] {
  return Array.from({ length: daysInMonth(year, month) }, (_, index) => {
    const day = index + 1;
    const dateKey = toDateKey(year, month, day);
    const date = dateKeyToDate(dateKey);
    const holidayName = getHolidayName(dateKey);
    return {
      day,
      dateKey,
      weekdayLabel: weekdayLabels[date.getDay()],
      holidayName,
      offDay: isWeekend(date) || holidayName != null
    };
  });
}

export const monthEndDocumentGroups: MonthEndDocumentGroup[] = [
  {
    title: "냉장고 온습도 관리 기록부",
    sourceFile: "★냉장고 온습도 관리기록부20180911.xls",
    editableFields: ["설치장소", "냉장고명", "점검 항목", "점검자"],
    orientation: "portrait",
    printItems: [
      {
        id: "refrigerator-ward-am",
        title: "병동약국-오전",
        sourceSheet: "병동약국-오전",
        orientation: "portrait",
        columns: ["점검시간", "주사약냉장고(1)", "주사약냉장고(2)", "주사약냉장고(3)", "주사약냉장고(4)", "외용제", "외용제냉동실", "불출장", "적합/부적합", "점검자"]
      },
      {
        id: "refrigerator-ward-pm",
        title: "병동약국-오후",
        sourceSheet: "병동약국-오후",
        orientation: "portrait",
        columns: ["점검시간", "주사약냉장고(1)", "주사약냉장고(2)", "주사약냉장고(3)", "주사약냉장고(4)", "외용제", "외용제냉동실", "불출장", "적합/부적합", "점검자"]
      },
      {
        id: "refrigerator-prepare-am",
        title: "제제실-오전",
        sourceSheet: "제제실-오전",
        orientation: "portrait",
        columns: ["점검시간", "냉장실", "적합/부적합", "점검자"]
      },
      {
        id: "refrigerator-prepare-pm",
        title: "제제실-오후",
        sourceSheet: "제제실-오후",
        orientation: "portrait",
        columns: ["점검시간", "냉장실", "적합/부적합", "점검자"]
      },
      {
        id: "refrigerator-temp-humidity",
        title: "온습도",
        sourceSheet: "온습도",
        orientation: "portrait",
        columns: ["점검시간", "조제실 온도", "조제실 습도", "원내제제실 온도", "원내제제실 습도", "적합/부적합", "점검자"]
      },
      {
        id: "refrigerator-outpatient",
        title: "외래약국",
        sourceSheet: "외래약국",
        orientation: "portrait",
        columns: ["점검시간", "냉장실", "냉동실", "적합/부적합", "점검자"],
        notes: ["일요일과 공휴일은 원본 서식 지시에 따라 제외 여부를 확인합니다."]
      }
    ]
  },
  {
    title: "의료기기 일상 점검표",
    sourceFile: "★의료기기일상점검표 (조제실)190902.xlsx",
    editableFields: ["자산번호", "장비명", "점검 항목"],
    orientation: "landscape",
    printItems: [
      {
        id: "medical-device-clean-room",
        title: "조제실",
        sourceSheet: "조제실",
        orientation: "landscape",
        columns: ["자산번호", "장비명", "외관 및 Accessory 확인", "전원 및 충전상태 확인", "점검자 확인"],
        notes: ["○: 양호, X: 불량, 해당 없음은 사선 처리합니다."],
        equipment: [
          { assetNo: "MBMAB170017", name: "정제정류포장시스템(ATC)" },
          { assetNo: "MBMAB150022", name: "정제정류포장시스템(ATC)" },
          { assetNo: "QEACH220001", name: "자동분할포장기(정제전용JXT-90)" },
          { assetNo: "GIBCA240001", name: "산제 조제기(웰리스)" },
          { assetNo: "MAMAB130028", name: "자동분할포장기(JX45-Ⅲ/P)" },
          { assetNo: "FLCJA170007", name: "자동분할포장기(JX45-Ⅲ/P)" },
          { assetNo: "MBMAB190008", name: "자동분할포장기(YS-TWIN)" },
          { assetNo: "FLCJA170006", name: "자동정제계수기" },
          { assetNo: "FLCJA130004", name: "제진기" },
          { assetNo: "GEADA060001", name: "제진기" },
          { assetNo: "GEADA070001", name: "제진기" },
          { assetNo: "FLCJA120002", name: "PTP-자동제포기" },
          { assetNo: "FQABA210001", name: "약품냉장고(항암제실)" },
          { assetNo: "FQABA250001", name: "약품냉장고1" },
          { assetNo: "FQABA250002", name: "약품냉장고2" },
          { assetNo: "FQABA240001", name: "약품냉장고3" },
          { assetNo: "FLCJA170009", name: "약품냉장고4" }
        ]
      }
    ]
  },
  {
    title: "조제장비관리기록지",
    sourceFile: "★조제장비관리기록지(산제,정제,청소일지).xls",
    editableFields: ["장비명", "청소구역", "작동여부 항목"],
    orientation: "landscape",
    printItems: [
      {
        id: "compounding-powder",
        title: "산제",
        sourceSheet: "산제",
        orientation: "landscape",
        columns: [
          "포장기(유야마·흰색)",
          "포장기(유야마·유색)",
          "콩콩이 산제기",
          "분쇄기",
          "산제조제대",
          "진공청소기",
          "포장기1",
          "포장기2",
          "포장기3",
          "콩콩이 산제기(작동)",
          "분쇄기 2대(작동)",
          "점검자"
        ]
      },
      {
        id: "compounding-tablet",
        title: "정제",
        sourceSheet: "정제",
        orientation: "landscape",
        columns: [
          "정제포장기1(청소)",
          "정제계수기(청소)",
          "ATC1호기(청소)",
          "ATC2호기(청소)",
          "정제포장기1(작동)",
          "정제계수기(작동)",
          "ATC1호기(작동)",
          "ATC2호기(작동)",
          "점검자"
        ]
      },
      {
        id: "compounding-cleaning-log",
        title: "청소일지",
        sourceSheet: "청소일지",
        orientation: "landscape",
        columns: ["경구약장(PTP)", "ATC앞(ATC)", "ATC뒤(추/긴)", "산제예제장(산제)", "외용/탕비실(외용)", "주사장(주사)", "주사냉장고(PRN2)", "점검자"]
      }
    ]
  }
];

export const checklistPrintGroups: PrintableGroup[] = [
  { title: "외용제 업무", sections: ["외용제"], orientation: "landscape" },
  { title: "추/긴 업무 + ATC 업무", sections: ["추/긴 업무", "ATC 업무"], orientation: "landscape" },
  { title: "PTP 업무 + 주사 업무", sections: ["PTP 업무", "주사 업무"], orientation: "landscape" }
];

const notebookBaseColumns = ["날짜", "요일", "사용 업무 및 사용 시간", "사용자1", "사용자2", "사용자3"];
const notebookChecklistColumns = [
  "노트북정돈 및 외관이상유무",
  "어댑터 이상 유무",
  "충전"
];
const notebookChecklistColumnsWithPencil = [
  "노트북정돈 및 외관이상유무",
  "노트북펜슬 정돈 및 이상 유무",
  "어댑터 이상 유무",
  "충전"
];

export const notebookChecklistGroups: PrintableGroup[] = Array.from({ length: 6 }, (_, index) => ({
  title: `${index + 1}번 노트북 체크리스트`,
  sections: [`${index + 1}번 노트북`],
  orientation: "portrait",
  columns: [...notebookBaseColumns, ...(index >= 4 ? notebookChecklistColumnsWithPencil : notebookChecklistColumns)]
}));

export const staffChecklistSections: Record<string, string[]> = {
  외용제: [
    "흡입기 채우기",
    "외용제 채우기",
    "시럽병 채우기",
    "소모품 채우기",
    "바세린 20개 이상 유지",
    "글리세린 10개 유지",
    "둘코락스/비오플 자르기",
    "퇴근 준비 및 추/긴 외용 정리"
  ],
  "추/긴 업무": ["추/긴 자리 비닐봉투 채우기", "퇴근 준비 추/긴 주사업무 정리"],
  "ATC 업무": [
    "카세트 양사이드 채우기(정규 후)",
    "카세트 양사이드 채우기(퇴근 1시간 전)",
    "카세트 중앙 채우기(점심시간 후)",
    "분할 정제 채우기",
    "빈통 모으기"
  ],
  "PTP 업무": ["바구니 PTP 채우기", "칼시오 예제 만들기", "개봉한 약통 뚜껑 자르기"],
  "주사 업무": ["바이알 채우기", "앰플 채우기", "Denogan 꺼내기"]
};

export type PrintOrientation = "portrait" | "landscape";

export type PrintableGroup = {
  title: string;
  sections: string[];
  orientation: PrintOrientation;
};

export type MonthEndDocumentGroup = {
  title: string;
  sourceFile: string;
  editableFields: string[];
  orientation: PrintOrientation;
};

export const monthEndDocumentGroups: MonthEndDocumentGroup[] = [
  {
    title: "냉장고 온습도 관리 기록부",
    sourceFile: "★냉장고 온습도 관리기록부20180911.xls",
    editableFields: ["설치장소", "냉장고명", "점검 항목", "점검자"],
    orientation: "portrait"
  },
  {
    title: "의료기기 일상 점검표",
    sourceFile: "★의료기기일상점검표 (조제실)190902.xlsx",
    editableFields: ["자산번호", "장비명", "점검 항목"],
    orientation: "landscape"
  },
  {
    title: "조제장비관리기록지",
    sourceFile: "★조제장비관리기록지(산제,정제,청소일지).xls",
    editableFields: ["장비명", "청소구역", "작동여부 항목"],
    orientation: "landscape"
  }
];

export const checklistPrintGroups: PrintableGroup[] = [
  { title: "외용제 업무", sections: ["외용제"], orientation: "landscape" },
  { title: "추/긴 업무 + ATC 업무", sections: ["추/긴 업무", "ATC 업무"], orientation: "landscape" },
  { title: "PTP 업무 + 주사 업무", sections: ["PTP 업무", "주사 업무"], orientation: "landscape" }
];

export const notebookChecklistGroups: PrintableGroup[] = Array.from({ length: 4 }, (_, index) => ({
  title: `${index + 1}번 노트북 체크리스트`,
  sections: [`${index + 1}번 노트북`],
  orientation: "portrait"
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


export type LunchSlot = "11:45-12:30" | "12:30-13:30";

export type StaffAssignmentRow = {
  task: string;
  primaryName: string;
  helperName?: string;
  secondHelperName?: string;
  morningTask: string;
  afternoonTask: string;
  lunchEarly?: string;
  lunchLate: string;
  lunchSlot: LunchSlot;
  eveningTask?: string;
  deepCleanTask?: string;
  inventoryTask?: string;
  medicineRefillTask?: string;
};

export type StaffAssignmentColumnKey =
  | "task"
  | "primaryName"
  | "helperName"
  | "secondHelperName"
  | "morningTask"
  | "lunchEarly"
  | "lunchLate"
  | "afternoonTask"
  | "eveningTask"
  | "deepCleanTask"
  | "inventoryTask"
  | "medicineRefillTask";

export type StaffAssignmentColumn = {
  key: StaffAssignmentColumnKey;
  label: string;
  editable?: boolean;
};

export const staffAssignmentColumns: StaffAssignmentColumn[] = [
  { key: "task", label: "업무", editable: true },
  { key: "primaryName", label: "시 간", editable: true },
  { key: "helperName", label: "7:15~8:00", editable: true },
  { key: "secondHelperName", label: "", editable: true },
  { key: "morningTask", label: "8:00-11:30", editable: true },
  { key: "lunchEarly", label: "11:45-12:30", editable: true },
  { key: "lunchLate", label: "12:30-13:30", editable: true },
  { key: "afternoonTask", label: "13:30-17:00", editable: true },
  { key: "eveningTask", label: "18:00:00", editable: true },
  { key: "deepCleanTask", label: "대청고", editable: true },
  { key: "inventoryTask", label: "재고 조사/유효기간", editable: true },
  { key: "medicineRefillTask", label: "약 채우기", editable: true }
];

export const staffAssignmentTemplate: StaffAssignmentRow[] = [
  {
    task: "추/긴",
    primaryName: "박종연",
    helperName: "지현",
    morningTask: "추가/긴급 접수 / 라벨붙이고 챙기기 / 검수된 약 병동 불출",
    lunchLate: "식사",
    afternoonTask: "추가/긴급/외래 약 챙기기 / 추긴 자리 봉투 채우기, 검수된 약 병동 불출",
    deepCleanTask: "추긴자리,마약금고 위, 슈터근처, 외래약국",
    lunchSlot: "11:45-12:30"
  },
  {
    task: "외용",
    primaryName: "송현우",
    helperName: "김동희",
    morningTask: "외용제채우기, 물약 챙기기 / 외래 주사 챙기기",
    lunchLate: "식사",
    afternoonTask: "반납약(외용) 정리 / 외래/퇴원챙기기, 외래 주사 챙기기",
    eveningTask: "소모품 관리 / (봉투,라벨,시럽병 등)",
    deepCleanTask: "시럽 조제대 및 약장 / 싱크대/ 탕비실 정리",
    inventoryTask: "외용",
    medicineRefillTask: "외용",
    lunchSlot: "11:45-12:30"
  },
  {
    task: "ATC",
    primaryName: "강승원",
    morningTask: "ATC 정제 채우기/ STS깔기 / 외래약 올리기",
    lunchLate: "식사",
    afternoonTask: "ATC 정제 채우기/STS깔기",
    deepCleanTask: "ATC/반자동포장기 / 계수기 청소",
    inventoryTask: "원병/ATC/뻉뻉이",
    medicineRefillTask: "ATC",
    lunchSlot: "11:45-12:30"
  },
  {
    task: "산제",
    primaryName: "박지숙",
    morningTask: "산제분포 / 외래/퇴원챙기기, 외래 주사 챙기기",
    lunchEarly: "식사",
    lunchLate: "",
    afternoonTask: "산제분포 / 외래/퇴원챙기기, 외래 주사 챙기기/ 산제실 청소",
    deepCleanTask: "산제실 청소 / (필터교체) / 불출장",
    inventoryTask: "냉장약/ 수액",
    lunchSlot: "11:45-12:30"
  },
  {
    task: "주사",
    primaryName: "김동희",
    morningTask: "병동 정규불출 및 반납 받기 / 외래/퇴원챙기기, 외래 주사 챙기기",
    lunchEarly: "식사",
    lunchLate: "",
    afternoonTask: "반납약 업무 및 주사/수액 채우기 / 외래/퇴원챙기기, 외래 주사 챙기기",
    eveningTask: "장비점검일지",
    deepCleanTask: "주사장 청소 / (앰플, 바이알 한달씩 / 번갈아 가며 하기)",
    inventoryTask: "주사",
    medicineRefillTask: "주사/수액",
    lunchSlot: "11:45-12:30"
  },
  {
    task: "PTP반납1",
    primaryName: "지현",
    helperName: "지숙",
    morningTask: "병동약 반납업무 / PTP 약정리/외래/퇴원챙기기, 외래 주사 챙기기",
    lunchLate: "식사",
    afternoonTask: "Y키 넣기/경구약(병,PTP)장 정리 / PTP예제제 만들기 / 외래/퇴원챙기기, 외래 주사 챙기기",
    deepCleanTask: "PTP 약장 정리",
    inventoryTask: "PTP",
    medicineRefillTask: "PTP",
    lunchSlot: "11:45-12:30"
  },
  {
    task: "PRN1",
    primaryName: "예은",
    morningTask: "신규직원교육, 오전 온도 체크 / 외래/퇴원 챙기기, 외래 주사 챙기기 / *바쁜 포지션 백업 업무* / *휴가자 있을 시 휴가자 포지션*",
    lunchEarly: "식사",
    lunchLate: "",
    afternoonTask: "신규직원교육, 오후 온도 체크 / 외래/퇴원 챙기기, 외래 주사 챙기기 / *바쁜 포지션 백업 업무* / *휴가자 있을 시 휴가자 포지션*",
    eveningTask: "조제실(추긴/ 산제)",
    deepCleanTask: "청소기 돌리기",
    inventoryTask: "냉장주사/수액",
    lunchSlot: "11:45-12:30"
  },
  {
    task: "PRN2/반납",
    primaryName: "김서훈",
    morningTask: "외래/퇴원 챙기기, 외래 주사 챙기기 / *바쁜 포지션 백업 업무* / 반납업무",
    lunchLate: "식사",
    afternoonTask: "외래/퇴원 챙기기, 외래 주사 챙기기 / *바쁜 포지션 백업 업무* / *휴가자 있을 시 휴가자 포지션*",
    deepCleanTask: "주사냉장고/수액장",
    lunchSlot: "11:45-12:30"
  }
];

function rotateRight<T>(items: T[], steps: number): T[] {
  if (items.length === 0) return [];
  const normalized = ((steps % items.length) + items.length) % items.length;
  return [...items.slice(items.length - normalized), ...items.slice(0, items.length - normalized)];
}

export function rotateStaffAssignments(
  rows: StaffAssignmentRow[],
  monthOffset: number
): StaffAssignmentRow[] {
  const primaryNames = rotateRight(
    rows.map((row) => row.primaryName),
    monthOffset
  );
  const helperSlots = rows.flatMap((row, index) =>
    ([
      ["helperName", row.helperName],
      ["secondHelperName", row.secondHelperName]
    ] as const)
      .filter((slot): slot is ["helperName" | "secondHelperName", string] => Boolean(slot[1]))
      .map(([key, helperName]) => ({ index, key, helperName }))
  );
  const rotatedHelpers = rotateRight(
    helperSlots.map((slot) => slot.helperName),
    monthOffset
  );

  return rows.map((row, index) => {
    const helperName = helperSlots.find((slot) => slot.index === index && slot.key === "helperName")
      ? rotatedHelpers[helperSlots.findIndex((slot) => slot.index === index && slot.key === "helperName")]
      : undefined;
    const secondHelperName = helperSlots.find((slot) => slot.index === index && slot.key === "secondHelperName")
      ? rotatedHelpers[helperSlots.findIndex((slot) => slot.index === index && slot.key === "secondHelperName")]
      : undefined;
    const primaryName = primaryNames[index];
    return {
      ...row,
      primaryName,
      helperName,
      secondHelperName,
      lunchEarly: "",
      lunchLate: "식사",
      lunchSlot: "12:30-13:30"
    };
  });
}

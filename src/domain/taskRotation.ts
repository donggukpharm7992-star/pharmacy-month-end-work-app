export type LunchSlot = "11:45-12:30" | "12:30-13:30";

export type StaffAssignmentRow = {
  task: string;
  primaryName: string;
  helperName?: string;
  secondHelperName?: string;
  morningTask: string;
  afternoonTask: string;
  lunchSlot: LunchSlot;
};

export const staffAssignmentTemplate: StaffAssignmentRow[] = [
  {
    task: "추/긴",
    primaryName: "박종연",
    helperName: "지현",
    morningTask: "추가/긴급 접수, 라벨 붙이기, 검수된 약 병동 불출",
    afternoonTask: "추가/긴급, 외래 약 챙기기, 봉투 채우기",
    lunchSlot: "11:45-12:30"
  },
  {
    task: "외용",
    primaryName: "송현우",
    helperName: "김동희",
    morningTask: "외용제 채우기, 물약 챙기기, 외래 주사 챙기기",
    afternoonTask: "반납약 외용 정리, 외래/퇴원 챙기기",
    lunchSlot: "11:45-12:30"
  },
  {
    task: "ATC",
    primaryName: "강승원",
    morningTask: "ATC 정제 채우기, STS 깔기, 외래약 올리기",
    afternoonTask: "ATC 정제 채우기, STS 깔기",
    lunchSlot: "11:45-12:30"
  },
  {
    task: "산제",
    primaryName: "박지숙",
    morningTask: "산제분포, 외래/퇴원 챙기기",
    afternoonTask: "산제분포, 산제실 청소",
    lunchSlot: "11:45-12:30"
  },
  {
    task: "주사",
    primaryName: "김동희",
    morningTask: "병동 정규불출 및 반납 받기",
    afternoonTask: "반납약 업무 및 주사/수액 채우기",
    lunchSlot: "11:45-12:30"
  },
  {
    task: "PTP반납1",
    primaryName: "지현",
    helperName: "지숙",
    morningTask: "병동약 반납업무, PTP 약 정리",
    afternoonTask: "Y키 넣기, 경구약장 정리, PTP 예제 만들기",
    lunchSlot: "11:45-12:30"
  },
  {
    task: "PRN1",
    primaryName: "예은",
    morningTask: "신규직원교육, 오전 온도 체크, 바쁜 포지션 백업",
    afternoonTask: "오후 온도 체크, 바쁜 포지션 백업",
    lunchSlot: "11:45-12:30"
  },
  {
    task: "PRN2/반납",
    primaryName: "김서훈",
    morningTask: "외래/퇴원 챙기기, 반납업무",
    afternoonTask: "외래/퇴원 챙기기, 휴가자 포지션 백업",
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
  const helperSlots = rows
    .map((row, index) => ({ index, helperName: row.helperName }))
    .filter((slot): slot is { index: number; helperName: string } => Boolean(slot.helperName));
  const rotatedHelpers = rotateRight(
    helperSlots.map((slot) => slot.helperName),
    monthOffset
  );

  return rows.map((row, index) => {
    const helperSlotIndex = helperSlots.findIndex((slot) => slot.index === index);
    const helperName = helperSlotIndex >= 0 ? rotatedHelpers[helperSlotIndex] : undefined;
    const primaryName = primaryNames[index];
    return {
      ...row,
      primaryName,
      helperName,
      lunchSlot: helperName === primaryName ? "12:30-13:30" : row.lunchSlot
    };
  });
}


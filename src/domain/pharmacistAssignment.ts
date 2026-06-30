export type PharmacistAssignmentColumnKey =
  | "name"
  | "code"
  | "early"
  | "morningSupport"
  | "morningMain"
  | "lunchEarly"
  | "lunchLate"
  | "afternoonA"
  | "afternoonB"
  | "duty";

export type PharmacistAssignmentColumn = {
  key: PharmacistAssignmentColumnKey;
  label: string;
};

export type PharmacistAssignmentCell = {
  value: string;
  editable: boolean;
};

export type PharmacistAssignmentRow = {
  id: string;
  kind: "person" | "note";
  cells: Record<PharmacistAssignmentColumnKey, PharmacistAssignmentCell>;
};

export type PharmacistAssignment = {
  title: string;
  columns: PharmacistAssignmentColumn[];
  rows: PharmacistAssignmentRow[];
};

export const pharmacistAssignmentColumns: PharmacistAssignmentColumn[] = [
  { key: "name", label: "이름" },
  { key: "code", label: "7:15~" },
  { key: "early", label: "8:00-10:00" },
  { key: "morningSupport", label: "8:00-10:00 보조" },
  { key: "morningMain", label: "10:00-11:30" },
  { key: "lunchEarly", label: "11:30-12:30" },
  { key: "lunchLate", label: "12:30-1:30" },
  { key: "afternoonA", label: "1:30-3:00" },
  { key: "afternoonB", label: "3:00-5:30" },
  { key: "duty", label: "담당업무" }
];

const sourceRows: Array<{
  id: string;
  kind?: "person" | "note";
  values: Record<PharmacistAssignmentColumnKey, string>;
}> = [
  {
    id: "kim-okseon",
    values: {
      name: "김옥선",
      code: "o50601",
      early: "약제팀 총괄, 약품마스터 관리",
      morningSupport: "",
      morningMain: "",
      lunchEarly: "식사",
      lunchLate: "약제팀 총괄, 약품마스터 관리",
      afternoonA: "",
      afternoonB: "",
      duty: "팀장, 약무(202310~)"
    }
  },
  {
    id: "song-eunho",
    values: {
      name: "송은호",
      code: "o81001",
      early: "약무 총괄, 마스터 관리",
      morningSupport: "",
      morningMain: "",
      lunchEarly: "",
      lunchLate: "식사",
      afternoonA: "ASP 임상업무",
      afternoonB: "",
      duty: "파트장, 약무행정(202009~) / ASP 임상업무(2411~)"
    }
  },
  {
    id: "choi-yunyoung",
    values: {
      name: "최윤영",
      code: "110901",
      early: "조제실 총괄, 사무행정, QI, 비품",
      morningSupport: "",
      morningMain: "",
      lunchEarly: "식사 / 조제실 PRN",
      lunchLate: "조제실 총괄, 사무행정/직원교육",
      afternoonA: "",
      afternoonB: "",
      duty: "파트장, 사무행정(1909~) / 조제실 비품 관리(2303~)"
    }
  },
  {
    id: "kim-jihye",
    values: {
      name: "김지혜",
      code: "120715",
      early: "약무, 조제실 재고관리",
      morningSupport: "",
      morningMain: "",
      lunchEarly: "식사",
      lunchLate: "외래/퇴원",
      afternoonA: "약무, 조제실 재고관리",
      afternoonB: "",
      duty: "약무(2411~)"
    }
  },
  {
    id: "shin-jinyoung",
    values: {
      name: "신진영",
      code: "160301",
      early: "휴가자 2인 발생 시 / 경구 재고 조사일 / 92W, 102W, 111W~ / 조제실 요청 시 외퇴 서브",
      morningSupport: "",
      morningMain: "ASP 임상업무",
      lunchEarly: "",
      lunchLate: "식사",
      afternoonA: "ASP 임상업무 / 경구 재고 조사일 추가/긴급",
      afternoonB: "추가/긴급 / 조제실/항암제 휴가자 발생 시",
      duty: "ASP(2411~)"
    }
  },
  {
    id: "lee-jieun",
    values: {
      name: "이지은",
      code: "170301",
      early: "정규 경구61W, 72W(오전9시)",
      morningSupport: "",
      morningMain: "외래약국2 퇴원약 투약 전 검수 / 복약지도, 퇴원투약(9시 이후)",
      lunchEarly: "",
      lunchLate: "식사",
      afternoonA: "추가/긴급 / 경구 재고 조사일 오후 ATC 재고 조사 2",
      afternoonB: "",
      duty: "복직(250909~) / 2시간 단축 근로"
    }
  },
  {
    id: "oh-ara",
    values: {
      name: "오아라",
      code: "180301",
      early: "외래약국",
      morningSupport: "",
      morningMain: "",
      lunchEarly: "",
      lunchLate: "식사",
      afternoonA: "PRN1/반납약 정리 / 휴가자 없을 시 3시 이후 추가/긴급 / 경구 재고 조사일 7988 처방감사 백업",
      afternoonB: "",
      duty: ""
    }
  },
  {
    id: "lee-junghwa",
    values: {
      name: "이정화",
      code: "180301",
      early: "마약류 관리/AN 잔량 반납복약지도(신장/호흡기/내분비)",
      morningSupport: "",
      morningMain: "",
      lunchEarly: "추가/긴급",
      lunchLate: "식사",
      afternoonA: "마약/복약지도(신장/호흡기/내분비)",
      afternoonB: "",
      duty: "마약(2410~) 복약지도(2411~)"
    }
  },
  {
    id: "song-yeri",
    values: {
      name: "송예리",
      code: "200301",
      early: "분만휴가",
      morningSupport: "",
      morningMain: "",
      lunchEarly: "",
      lunchLate: "",
      afternoonA: "",
      afternoonB: "",
      duty: "(2506~)"
    }
  },
  {
    id: "ahn-hyejung",
    values: {
      name: "안혜정",
      code: "200301",
      early: "필요시 조제실 지원 / 휴가자 발생시 / 경구 재고 조사일 / 정규 경구 검수71W, 81W,101W",
      morningSupport: "",
      morningMain: "ADR",
      lunchEarly: "식사",
      lunchLate: "PRN",
      afternoonA: "정보실 약품 정보 관련 업무 / ADR",
      afternoonB: "",
      duty: "약품정보/ADR(2411~) / ADR 보고(2507~) / 당뇨 자가 주사 교육(2509~10)"
    }
  },
  {
    id: "park-hyunyoung",
    values: {
      name: "박현영",
      code: "200301",
      early: "외래/퇴원",
      morningSupport: "",
      morningMain: "",
      lunchEarly: "식사",
      lunchLate: "NST 임상업무 인수인계",
      afternoonA: "",
      afternoonB: "",
      duty: "NST(2512~)"
    }
  },
  {
    id: "kim-yeonji",
    values: {
      name: "김연지",
      code: "220815",
      early: "PRN 2 / 휴가자 없을 시 71W, 81W,101W / 복약지도 / 휴가자 발생 시 PRN1 정규 경구 조제",
      morningSupport: "",
      morningMain: "",
      lunchEarly: "식사",
      lunchLate: "7988/처방감사",
      afternoonA: "반납약 정리/조제실 정리/학생 교육 / PRN2 / 복약지도",
      afternoonB: "",
      duty: "조제실 관리(2511~) / 복약지도(2606~)"
    }
  },
  {
    id: "lee-hoyeon",
    values: {
      name: "이호연",
      code: "230301",
      early: "TPN, 항암제조제 총괄(조제/처방감사/항암제 재고관리/기타 업무 총괄) / 정규 경구 검수 42W, 62W",
      morningSupport: "",
      morningMain: "",
      lunchEarly: "",
      lunchLate: "식사",
      afternoonA: "항암제/원내제제",
      afternoonB: "",
      duty: "항암제(2506~)"
    }
  },
  {
    id: "park-hyejung",
    values: {
      name: "박혜정",
      code: "231201",
      early: "추가/긴급",
      morningSupport: "",
      morningMain: "",
      lunchEarly: "처방감사/7988",
      lunchLate: "식사",
      afternoonA: "7988/처방감사 / 경구 재고 조사일 오후 ATC 재고 조사 1",
      afternoonB: "",
      duty: ""
    }
  },
  {
    id: "kim-kyungwon",
    values: {
      name: "김경원",
      code: "240201",
      early: "PRN 1/외퇴서브/휴가자 없을 시/정규 경구 92W, 102W, 111W~ / 경구 재고 조사일 / 산제 및 3단 재고 조사2",
      morningSupport: "",
      morningMain: "",
      lunchEarly: "외래/퇴원",
      lunchLate: "식사",
      afternoonA: "외래/퇴원",
      afternoonB: "",
      duty: "복귀(2507~)"
    }
  },
  {
    id: "kim-subin",
    values: {
      name: "김수빈",
      code: "250294",
      early: "정규 경구 82W / 10시 전 외래 많을 시 항암제 담당이 처리",
      morningSupport: "항암제실 준비 청소 / 외래 항암제 조제 / 항암제실 재고 수량 조사",
      morningMain: "항암제 조제",
      lunchEarly: "식사",
      lunchLate: "추가/긴급",
      afternoonA: "항암제/원내제제/반납약 정리",
      afternoonB: "조제실 휴가 3인시 조제실 지원",
      duty: "항암제 서브(2607~) / 항암제 담당 휴가 시 항암제 메인 업무 처리"
    }
  },
  {
    id: "park-juyoung",
    values: {
      name: "박주영 / (~5시 30분)",
      code: "260202~",
      early: "처방감사/7988 / 경구 재고 조사일 3단 재고 조사1",
      morningSupport: "",
      morningMain: "",
      lunchEarly: "식사",
      lunchLate: "외래약국",
      afternoonA: "",
      afternoonB: "",
      duty: ""
    }
  },
  {
    id: "park-yunseon",
    values: {
      name: "박윤선",
      code: "250501",
      early: "항생제 / 주사 검수",
      morningSupport: "ASP 임상업무",
      morningMain: "",
      lunchEarly: "",
      lunchLate: "식사",
      afternoonA: "ASP 임상업무",
      afternoonB: "",
      duty: "ASP 임상업무(2505~)"
    }
  },
  {
    id: "note-inventory",
    kind: "note",
    values: {
      name: "항암제실 PRN 시 Sub 업무로 투입 / 경구 재고 조사일 업무 확인",
      code: "",
      early: "",
      morningSupport: "",
      morningMain: "",
      lunchEarly: "",
      lunchLate: "",
      afternoonA: "",
      afternoonB: "",
      duty: ""
    }
  },
  {
    id: "note-night",
    kind: "note",
    values: {
      name: "정순미, 윤주원, 송유희, 김동신, 이상훈, 장소희 night",
      code: "",
      early: "",
      morningSupport: "",
      morningMain: "",
      lunchEarly: "",
      lunchLate: "",
      afternoonA: "",
      afternoonB: "",
      duty: ""
    }
  }
];

function isEditableCell(
  _rowKind: "person" | "note",
  _name: string,
  _key: PharmacistAssignmentColumnKey
) {
  return true;
}

function createCell(
  rowKind: "person" | "note",
  name: string,
  key: PharmacistAssignmentColumnKey,
  value: string
): PharmacistAssignmentCell {
  return {
    value,
    editable: isEditableCell(rowKind, name, key)
  };
}

export function buildPharmacistAssignment(year: number, month: number): PharmacistAssignment {
  const lastDay = new Date(year, month, 0).getDate();
  const title = `** ${String(month).padStart(2, "0")}월 01일 ~ ${String(month).padStart(2, "0")}월 ${String(lastDay).padStart(2, "0")}일 약제팀 업무분장 **`;

  return {
    title,
    columns: pharmacistAssignmentColumns,
    rows: sourceRows.map((row) => {
      const kind = row.kind ?? "person";
      const name = row.values.name;
      return {
        id: row.id,
        kind,
        cells: Object.fromEntries(
          pharmacistAssignmentColumns.map((column) => [
            column.key,
            createCell(kind, name, column.key, row.values[column.key])
          ])
        ) as Record<PharmacistAssignmentColumnKey, PharmacistAssignmentCell>
      };
    })
  };
}

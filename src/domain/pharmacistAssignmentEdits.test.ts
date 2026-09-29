import { describe, expect, it } from "vitest";
import { buildPharmacistAssignment } from "./pharmacistAssignment";
import {
  capturePharmacistAssignmentSnapshot,
  latestPharmacistRotationAnchor,
  pharmacistCellValue,
  pharmacistMonthlyEditKey
} from "./pharmacistAssignmentEdits";

describe("pharmacist assignment monthly edits", () => {
  it("migrates a legacy global October edit into the saved rotation baseline only", () => {
    const october = buildPharmacistAssignment(2026, 10, { anticancerSubNames: [] });
    const edits = { "lee-jieun:early": "10월 수기 오전 업무" };
    const baseline = capturePharmacistAssignmentSnapshot(2026, 10, october, edits);

    expect(baseline["lee-jieun"].early).toBe("10월 수기 오전 업무");
    expect(pharmacistCellValue(2026, 11, edits, "lee-jieun", "early", "11월 자동 업무")).toBe("11월 자동 업무");
    expect(pharmacistCellValue(2026, 11, { "note-night:name": "야간 메모" }, "note-night", "name", "기본 메모")).toBe("야간 메모");
  });

  it("keeps a November override in November after reload without changing October or December", () => {
    const edits = JSON.parse(JSON.stringify({
      [pharmacistMonthlyEditKey(2026, 11, "lee-jieun", "afternoonA")]: "11월 오후 수기 업무"
    }));

    expect(pharmacistCellValue(2026, 10, edits, "lee-jieun", "afternoonA", "10월 기준 업무")).toBe("10월 기준 업무");
    expect(pharmacistCellValue(2026, 11, edits, "lee-jieun", "afternoonA", "11월 자동 업무")).toBe("11월 오후 수기 업무");
    expect(pharmacistCellValue(2026, 12, edits, "lee-jieun", "afternoonA", "12월 자동 업무")).toBe("12월 자동 업무");
  });

  it("uses a reloaded October edit as November's exact rotating donor and refreshes after an October correction", () => {
    const october = buildPharmacistAssignment(2026, 10);
    const edits = { "park-juyoung:early": "10월 박주영 오전 업무" };
    const reloadedBaseline = JSON.parse(JSON.stringify(capturePharmacistAssignmentSnapshot(2026, 10, october, edits)));
    const november = buildPharmacistAssignment(2026, 11, {
      rotationAnchor: { year: 2026, month: 10, baseline: reloadedBaseline }
    });
    const novemberLee = november.rows.find((row) => row.id === "lee-jieun");

    expect(novemberLee?.cells.early.value).toBe("10월 박주영 오전 업무");

    reloadedBaseline["park-juyoung"].early = "수정된 10월 박주영 오전 업무";
    const correctedNovember = buildPharmacistAssignment(2026, 11, {
      rotationAnchor: { year: 2026, month: 10, baseline: reloadedBaseline }
    });
    expect(correctedNovember.rows.find((row) => row.id === "lee-jieun")?.cells.early.value).toBe(
      "수정된 10월 박주영 오전 업무"
    );
  });

  it("uses only an exported final assignment as the next month's anchor", () => {
    const options = {
      allDayFixedNames: [],
      morningFixedNames: [],
      afternoonFixedNames: [],
      allDayRotatingNames: ["이지은", "박혜정"],
      morningRotatingNames: [],
      afternoonRotatingNames: [],
      anticancerSubNames: []
    };
    const october = buildPharmacistAssignment(2026, 10, options);
    const octoberFinal = capturePharmacistAssignmentSnapshot(2026, 10, october, {});
    const novemberDraft = { "2026-11:park-hyejung:early": "11월 최종 업무" };
    const decemberAnchor = latestPharmacistRotationAnchor({}, octoberFinal, 2026, 12);
    const december = buildPharmacistAssignment(2026, 12, { ...options, rotationAnchor: decemberAnchor });
    const novemberFinal = capturePharmacistAssignmentSnapshot(2026, 11, buildPharmacistAssignment(2026, 11, {
      ...options,
      rotationAnchor: { year: 2026, month: 10, baseline: octoberFinal }
    }), novemberDraft);
    const finalizedDecemberAnchor = latestPharmacistRotationAnchor(
      { "2026-11": JSON.parse(JSON.stringify(novemberFinal)) },
      octoberFinal,
      2026,
      12
    );
    const finalizedDecember = buildPharmacistAssignment(2026, 12, {
      ...options,
      rotationAnchor: finalizedDecemberAnchor
    });

    expect(december.rows.find((row) => row.id === "lee-jieun")?.cells.early.value).toBe(
      octoberFinal["lee-jieun"].early
    );
    expect(finalizedDecember.rows.find((row) => row.id === "lee-jieun")?.cells.early.value).toBe(
      "11월 최종 업무"
    );
  });

  it("keeps the latest finalized month as the anchor when an earlier month is re-exported", () => {
    const october = { "lee-jieun": { early: "10월" } };
    const november = { "lee-jieun": { early: "11월" } };
    const reexportedOctober = { "lee-jieun": { early: "수정된 10월" } };
    const anchor = latestPharmacistRotationAnchor(
      { "2026-10": reexportedOctober, "2026-11": JSON.parse(JSON.stringify(november)) },
      october,
      2027,
      1
    );

    expect(anchor?.year).toBe(2026);
    expect(anchor?.month).toBe(11);
    expect(anchor?.baseline["lee-jieun"].early).toBe("11월");
  });
});

import { describe, expect, it } from "vitest";
import {
  checklistPrintGroups,
  monthEndDocumentGroups,
  notebookChecklistGroups
} from "./documents";

describe("document and checklist grouping", () => {
  it("keeps month-end approval documents as printable sub tabs", () => {
    expect(monthEndDocumentGroups.map((group) => group.title)).toEqual([
      "냉장고 온습도 관리 기록부",
      "의료기기 일상 점검표",
      "조제장비관리기록지"
    ]);
  });

  it("keeps refrigerator source sheets as selectable print items", () => {
    const refrigerator = monthEndDocumentGroups.find((group) => group.title === "냉장고 온습도 관리 기록부");

    expect(refrigerator?.printItems.map((item) => item.title)).toEqual([
      "병동약국-오전",
      "병동약국-오후",
      "제제실-오전",
      "제제실-오후",
      "온습도",
      "외래약국"
    ]);
  });

  it("keeps medical device equipment rows available under the source sheet", () => {
    const medicalDevice = monthEndDocumentGroups.find((group) => group.title === "의료기기 일상 점검표");
    const cleanRoom = medicalDevice?.printItems.find((item) => item.sourceSheet === "조제실");

    expect(cleanRoom?.equipment?.at(0)).toEqual({
      assetNo: "MBMAB170017",
      name: "정제정류포장시스템(ATC)"
    });
    expect(cleanRoom?.equipment?.map((item) => item.name)).toContain("약품냉장고4");
  });

  it("keeps compounding equipment workbook sheets as selectable print items", () => {
    const compounding = monthEndDocumentGroups.find((group) => group.title === "조제장비관리기록지");

    expect(compounding?.printItems.map((item) => item.title)).toEqual(["산제", "정제", "청소일지"]);
  });

  it("groups staff checklists by requested print pages", () => {
    expect(checklistPrintGroups).toEqual([
      { title: "외용제 업무", sections: ["외용제"], orientation: "landscape" },
      { title: "추/긴 업무 + ATC 업무", sections: ["추/긴 업무", "ATC 업무"], orientation: "landscape" },
      { title: "PTP 업무 + 주사 업무", sections: ["PTP 업무", "주사 업무"], orientation: "landscape" }
    ]);
  });

  it("creates four portrait notebook checklists", () => {
    expect(notebookChecklistGroups).toHaveLength(4);
    expect(notebookChecklistGroups[0]).toMatchObject({
      title: "1번 노트북 체크리스트",
      orientation: "portrait"
    });
  });
});

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


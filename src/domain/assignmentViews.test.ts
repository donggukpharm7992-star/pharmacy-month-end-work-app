import { describe, expect, it } from "vitest";
import { assignmentPrintViews } from "./assignmentViews";

describe("assignment print views", () => {
  it("separates staff and pharmacist assignments into independent printable tabs", () => {
    expect(assignmentPrintViews).toEqual([
      {
        id: "staff",
        title: "직원 업무 분장",
        orientation: "landscape"
      },
      {
        id: "pharmacist",
        title: "약사 업무 분장",
        orientation: "landscape"
      }
    ]);
  });
});


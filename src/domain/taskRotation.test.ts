import { describe, expect, it } from "vitest";
import {
  rotateStaffAssignments,
  staffAssignmentTemplate
} from "./taskRotation";

describe("staff task assignment rotation", () => {
  it("rotates B-column names by moving the bottom name to the top each month", () => {
    const rotated = rotateStaffAssignments(staffAssignmentTemplate, 1);

    expect(rotated.map((row) => row.primaryName)).toEqual([
      "김서훈",
      "박종연",
      "송현우",
      "강승원",
      "박지숙",
      "김동희",
      "지현",
      "예은"
    ]);
  });

  it("rotates white-cell helper names independently", () => {
    const rotated = rotateStaffAssignments(staffAssignmentTemplate, 1);

    expect(rotated[0].helperName).toBe("지숙");
    expect(rotated[1].helperName).toBe("지현");
  });

  it("moves lunch to the later slot when the primary name also appears in a white helper cell", () => {
    const rotated = rotateStaffAssignments(staffAssignmentTemplate, 3);
    const affected = rotated.find((row) => row.primaryName === row.helperName);

    expect(affected?.lunchSlot).toBe("12:30-13:30");
  });
});


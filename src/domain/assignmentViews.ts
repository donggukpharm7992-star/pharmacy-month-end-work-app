import type { PrintOrientation } from "./documents";

export type AssignmentViewId = "staff" | "pharmacist";

export type AssignmentPrintView = {
  id: AssignmentViewId;
  title: string;
  orientation: PrintOrientation;
};

export const assignmentPrintViews: AssignmentPrintView[] = [
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
];


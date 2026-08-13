// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pdfMutate = vi.fn();
const excelMutate = vi.fn();
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: true, loading: false }) }));
vi.mock("wouter", () => ({ useLocation: () => ["/snapshot/7", vi.fn()], useParams: () => ({ id: "7" }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/trpc", () => ({ trpc: { snapshot: {
  getSnapshot: { useQuery: () => ({ data: { id: 7, filename: "show.snap", mixerName: "WING", mixerModel: "WING", snapshotSchema: "snapshot.9", createdAt: new Date("2026-01-01"), totalInputs: 1, totalOutputs: 1, totalChannels: 1, activeRoutes: 1 } }) },
  generatePDF: { useMutation: (options: any) => ({ isPending: false, mutate: (input: any) => { pdfMutate(input); options.onSuccess({ data: btoa("pdf-content"), filename: "show-routing.pdf" }); } }) },
  generateExcel: { useMutation: (options: any) => ({ isPending: false, mutate: (input: any) => { excelMutate(input); options.onSuccess({ data: btoa("xlsx-content"), filename: "show-routing.xlsx" }); } }) },
  deleteSnapshot: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
} } }));

import SnapshotDetail from "./SnapshotDetail";

afterEach(cleanup);
beforeEach(() => {
  pdfMutate.mockClear();
  excelMutate.mockClear();
  Object.defineProperty(window.URL, "createObjectURL", { value: vi.fn(() => "blob:download"), writable: true });
  Object.defineProperty(window.URL, "revokeObjectURL", { value: vi.fn(), writable: true });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
});

describe("SnapshotDetail export workflow", () => {
  it("invokes the PDF and Excel mutations and triggers downloaded deliverables from the rendered detail page", async () => {
    const user = userEvent.setup();
    render(<SnapshotDetail />);
    await user.click(screen.getByRole("button", { name: "Routing PDF" }));
    await user.click(screen.getByRole("button", { name: "Excel Workbook" }));
    expect(pdfMutate).toHaveBeenCalledWith({ snapshotId: 7 });
    expect(excelMutate).toHaveBeenCalledWith({ snapshotId: 7 });
    expect(window.URL.createObjectURL).toHaveBeenCalledTimes(2);
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(2);
    expect(window.URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });
});

// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const exportMutate = vi.fn();
const sourceSnapshot = { parsed: { inputs: [{ id: "LCL_1", name: "Lead", group: "LCL", index: 1, gain: 0 }] } };
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: true, loading: false }) }));
vi.mock("wouter", () => ({ useLocation: () => ["/snapshot/7/source-management", vi.fn()], useParams: () => ({ id: "7" }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/trpc", () => ({ trpc: { snapshot: {
  getSnapshot: { useQuery: () => ({ data: sourceSnapshot }) },
  exportSnapshot: { useMutation: (options: any) => ({ mutate: (input: any) => { exportMutate(input); options.onSuccess({ data: { ae_data: {} }, filename: "show-modified.snap" }); } }) },
} } }));

import SourceManagement from "./SourceManagement";

afterEach(cleanup);
beforeEach(() => {
  exportMutate.mockClear();
  Object.defineProperty(window.URL, "createObjectURL", { value: vi.fn(() => "blob:download"), writable: true });
  Object.defineProperty(window.URL, "revokeObjectURL", { value: vi.fn(), writable: true });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
});

describe("SourceManagement export workflow", () => {
  it("runs the modified snapshot export mutation and triggers a .snap download from the rendered page", async () => {
    const user = userEvent.setup();
    render(<SourceManagement />);
    await user.click(screen.getByRole("button", { name: "Export .snap File" }));
    expect(exportMutate).toHaveBeenCalledWith({ snapshotId: 7, modifications: { inputGains: { LCL_1: 0 } } });
    expect(window.URL.createObjectURL).toHaveBeenCalledOnce();
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:download");
  });
});

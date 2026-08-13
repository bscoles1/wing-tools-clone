// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: true, loading: false }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/trpc", () => ({ trpc: { snapshot: {
  listSnapshots: { useQuery: () => ({ data: [{ id: 1, filename: "before.snap" }, { id: 2, filename: "after.snap" }] }) },
  getSnapshot: { useQuery: ({ snapshotId }: { snapshotId: number }) => ({ isLoading: false, data: snapshotId === 1 ? { parsed: { channels: [{ index: 1, name: "Lead", gain: 0, routes: [] }] } } : snapshotId === 2 ? { parsed: { channels: [{ index: 1, name: "Lead", gain: 3, routes: [] }] } } : undefined }) },
} } }));

import RoutingDiff from "./RoutingDiff";

afterEach(cleanup);

describe("RoutingDiff page workflow", () => {
  it("renders differences after two loaded snapshots are selected and compared", async () => {
    const user = userEvent.setup();
    render(<RoutingDiff />);
    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[0], "1");
    await user.selectOptions(selects[1], "2");
    await user.click(screen.getByRole("button", { name: "Compare snapshots" }));
    expect(screen.getByText("Differences found: 1")).toBeTruthy();
    expect(screen.getByText(/Gain: 0.0dB → 3.0dB/)).toBeTruthy();
  });
});

// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const deleteMutate = vi.fn();
const refetchSnapshots = vi.fn();
const snapshots = [{ id: 42, filename: "festival.snap", mixerName: "WING", totalChannels: 40, totalInputs: 48, totalOutputs: 24 }];

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: true, loading: false }) }));
vi.mock("wouter", () => ({ useLocation: () => ["/uploader", vi.fn()] }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/trpc", () => ({ trpc: { snapshot: {
  listSnapshots: { useQuery: () => ({ data: snapshots, refetch: refetchSnapshots }) },
  uploadSnapshot: { useMutation: () => ({ mutateAsync: vi.fn() }) },
  deleteSnapshot: { useMutation: (options: any) => ({ isPending: false, mutate: (input: { snapshotId: number }) => { deleteMutate(input); options.onSuccess({ success: true }, input); } }) },
} } }));

import Uploader from "./Uploader";

afterEach(() => {
  cleanup();
  deleteMutate.mockClear();
  refetchSnapshots.mockClear();
});

describe("Uploader snapshot list deletion", () => {
  it("requires confirmation, deletes the selected snapshot, and refreshes the list", async () => {
    const user = userEvent.setup();
    render(<Uploader />);
    await user.click(screen.getByRole("button", { name: "Delete festival.snap" }));
    expect(screen.getByRole("heading", { name: "Delete this snapshot?" })).toBeTruthy();
    expect(screen.getByRole("alertdialog").textContent).toContain("festival.snap and its generated documentation");
    await user.click(screen.getByRole("button", { name: "Delete snapshot" }));
    expect(deleteMutate).toHaveBeenCalledWith({ snapshotId: 42 });
    expect(refetchSnapshots).toHaveBeenCalledTimes(1);
  });
});

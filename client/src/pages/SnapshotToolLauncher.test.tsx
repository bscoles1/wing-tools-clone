// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SnapshotToolLaunchList } from "./SnapshotToolLauncher";

afterEach(cleanup);

describe("SnapshotToolLaunchList", () => {
  it("presents a functional snapshot-specific launch action", async () => {
    const user = userEvent.setup();
    const onLaunch = vi.fn();
    render(<SnapshotToolLaunchList tool="linter" snapshots={[{ id: 12, filename: "festival.snap", mixerName: "WING", totalChannels: 32, totalInputs: 16 }]} onLaunch={onLaunch} />);

    expect(screen.getByText("festival.snap")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Run linter" }));
    expect(onLaunch).toHaveBeenCalledWith(12);
  });
});

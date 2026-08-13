// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SourceTagWorkspace } from "./SourceTags";

afterEach(cleanup);

describe("SourceTagWorkspace", () => {
  it("renders source tag controls and wires tag-manifest export", async () => {
    const user = userEvent.setup();
    const onToggleTag = vi.fn();
    const onExport = vi.fn();
    render(<SourceTagWorkspace snapshotId={7} snapshotName="festival.snap" inputs={[{ id: "LCL_1", name: "Lead Vocal", group: "LCL", index: 1 }]} tags={{}} onToggleTag={onToggleTag} onExport={onExport} />);

    expect(screen.getByText("Lead Vocal")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "+ Vocals" }));
    await user.click(screen.getByRole("button", { name: "Export tag manifest" }));
    expect(onToggleTag).toHaveBeenCalledWith("LCL_1", "Vocals");
    expect(onExport).toHaveBeenCalledOnce();
  });
});

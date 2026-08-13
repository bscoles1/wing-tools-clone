// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createStarterSnapshot } from "@/lib/snapshotGenerator";
import { SnapshotGeneratorForm } from "./SnapshotGenerator";

afterEach(cleanup);

describe("SnapshotGeneratorForm", () => {
  it("renders generated inventory labels and wires the download and workspace actions", async () => {
    const user = userEvent.setup();
    const onDownload = vi.fn();
    const onSave = vi.fn();
    const snapshot = createStarterSnapshot({ name: "Festival", channelCount: 3, busCount: 2, channelPrefix: "VOC" });

    render(<SnapshotGeneratorForm name="Festival" channelCount={3} busCount={2} channelPrefix="VOC" generatedSnapshot={snapshot} filename="festival.snap" isSaving={false} onNameChange={vi.fn()} onChannelCountChange={vi.fn()} onBusCountChange={vi.fn()} onChannelPrefixChange={vi.fn()} onDownload={onDownload} onSave={onSave} />);

    expect(screen.getByText("VOC 01")).toBeTruthy();
    expect(screen.getByText("VOC 03")).toBeTruthy();
    expect(screen.getByText("festival.snap")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Download .snap" }));
    await user.click(screen.getByRole("button", { name: "Save to Workspace" }));
    expect(onDownload).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledOnce();
  });
});

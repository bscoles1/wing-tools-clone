// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OscCommandPreview } from "./ProtocolExplorer";

afterEach(cleanup);

describe("OscCommandPreview", () => {
  it("renders snapshot channel context and invokes copy for its generated OSC command", async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    render(<OscCommandPreview channel={{ index: 7, name: "LECTERN", inputSource: { group: "AES50A", index: 3 }, routes: ["bus"] }} onCopy={onCopy} />);

    expect(screen.getByText("LECTERN · CH 7")).toBeTruthy();
    expect(screen.getByText("Patched source: AES50A 3")).toBeTruthy();
    expect(screen.getByText("/ch/7/fdr")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Copy Read fader OSC example" }));
    expect(onCopy).toHaveBeenCalledWith("/ch/7/fdr");
  });
});

// @vitest-environment jsdom
import React, { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RoutingDiffControls } from "./RoutingDiff";

afterEach(cleanup);

describe("RoutingDiffControls", () => {
  it("selects two snapshots and enables the user-facing comparison action", async () => {
    const user = userEvent.setup();
    const onCompare = vi.fn();
    function Harness() {
      const [first, setFirst] = useState<number | null>(null);
      const [second, setSecond] = useState<number | null>(null);
      return <RoutingDiffControls firstId={first} secondId={second} snapshots={[{ id: 1, filename: "before.snap" }, { id: 2, filename: "after.snap" }]} onFirstChange={setFirst} onSecondChange={setSecond} onCompare={onCompare} isLoading={false} />;
    }
    render(<Harness />);
    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[0], "1");
    await user.selectOptions(selects[1], "2");
    const compare = screen.getByRole("button", { name: "Compare snapshots" });
    expect((compare as HTMLButtonElement).disabled).toBe(false);
    await user.click(compare);
    expect(onCompare).toHaveBeenCalledOnce();
  });
});

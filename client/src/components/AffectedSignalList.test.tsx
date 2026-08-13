/** @vitest-environment jsdom */
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { AffectedSignalList } from "./AffectedSignalList";

afterEach(cleanup);

describe("AffectedSignalList", () => {
  it("reveals all affected signals through Show more and Show all actions", async () => {
    const user = userEvent.setup();
    const signals = Array.from({ length: 17 }, (_, index) => `Signal ${index + 1}`);
    render(<AffectedSignalList items={signals} />);

    expect(screen.getByText("Signal 5")).toBeTruthy();
    expect(screen.queryByText("Signal 6")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Show 10 more" }));
    expect(screen.getByText("Signal 15")).toBeTruthy();
    expect(screen.queryByText("Signal 16")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Show all 2" }));
    expect(screen.getByText("Signal 17")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Show all/ })).toBeNull();
  });
});

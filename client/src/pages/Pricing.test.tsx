// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Pricing from "./Pricing";

afterEach(cleanup);

describe("payment-free access page", () => {
  it("communicates that all workspace features are available without checkout", () => {
    render(<Pricing />);
    expect(screen.getByText("All WingTools features are available")).toBeTruthy();
    expect(screen.getByText("No payment, checkout, or subscription upgrade is required. Upload a WING snapshot and use the complete documentation and analysis workspace.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open workspace" })).toBeTruthy();
  });
});

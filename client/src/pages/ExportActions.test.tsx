// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DocumentationExportActions } from "./SnapshotDetail";
import { SourceExportButton } from "./SourceManagement";

afterEach(cleanup);

describe("snapshot export actions", () => {
  it("wires the user-facing PDF and Excel documentation controls", async () => {
    const user = userEvent.setup();
    const onPDF = vi.fn();
    const onExcel = vi.fn();
    render(<DocumentationExportActions onPDF={onPDF} onExcel={onExcel} />);
    await user.click(screen.getByRole("button", { name: "Routing PDF" }));
    await user.click(screen.getByRole("button", { name: "Excel Workbook" }));
    expect(onPDF).toHaveBeenCalledOnce();
    expect(onExcel).toHaveBeenCalledOnce();
  });

  it("wires the user-facing modified snapshot export control", async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    render(<SourceExportButton onExport={onExport} isExporting={false} />);
    await user.click(screen.getByRole("button", { name: "Export .snap File" }));
    expect(onExport).toHaveBeenCalledOnce();
  });
});

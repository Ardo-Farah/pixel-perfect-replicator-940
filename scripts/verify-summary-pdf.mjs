import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const shell = read("src/components/AppShell.tsx");
const generator = read("src/lib/summary-pdf.ts");

assert.ok(shell.includes("onClick={handleDownload}"), "summary download button should have a click handler");
assert.ok(shell.includes("downloadSummaryPdf(selectedReportId, selectedReport)"), "button should use the selected report");
assert.ok(shell.includes("Creating PDF..."), "button should expose PDF generation progress");
assert.ok(generator.includes('import("jspdf")'), "PDF library should be loaded only when download is requested");
assert.ok(generator.includes('single("report_summary")'), "template should include overall report figures");
assert.ok(generator.includes('single("mpox_data")'), "template should include Mpox figures");
assert.ok(generator.includes('single("measles_data")'), "template should include Measles figures");
assert.ok(generator.includes('many("ebola_data")'), "template should include Ebola figures");
assert.ok(generator.includes('many("cholera_data")'), "template should include Cholera figures");
assert.ok(generator.includes('many("dengue_data")'), "template should include Dengue figures");
assert.ok(generator.includes('action: "download_pdf"'), "successful downloads should be audited");
assert.ok(generator.includes("pdf.save(filename)"), "generator should download an actual PDF");

console.log("summary PDF verification passed");


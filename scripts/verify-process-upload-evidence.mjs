import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../supabase/functions/process-upload/index.ts", import.meta.url), "utf8");

assert.match(
  source,
  /### Slide \\d\+\\n\|\\n### Embedded Workbook: /,
  "slide block parser must stop before embedded workbook blocks",
);
assert.match(source, /#### Speaker Notes/, "PPTX speaker notes must remain a first-class evidence source");
assert.ok(
  source.includes("ppt\\/embeddings\\/") && source.includes("xlsx|xlsm|xls"),
  "PPTX embedded workbooks must be scanned",
);

const groundDrop = {
  mpox_data: [
    "cumulative_cases",
    "new_cases_this_week",
    "deaths",
    "recovered",
    "active_facility",
    "active_home",
    "contacts_listed",
    "contacts_completed",
    "contacts_follow_up",
    "vaccinations",
    "traveller_screenings",
    "hiv_co_infection_deaths",
  ],
  measles_data: ["total_cases", "confirmed", "suspected"],
};
const leanDiseaseTables = ["ebola_data", "cholera_data", "dengue_data"];

function compactSnippet(s) {
  return s.replace(/\s+/g, " ").trim().slice(0, 500);
}

function numberVariants(v) {
  const out = new Set([String(v), v.toLocaleString("en-US")]);
  for (const [div, suffixes] of [[1e6, ["million", "m"]], [1e3, ["thousand", "k"]]]) {
    if (Math.abs(v) >= div) {
      const scaled = v / div;
      for (const f of new Set([String(scaled), scaled.toFixed(1), String(Math.round(scaled))])) {
        for (const suffix of suffixes) out.add(`${f} ${suffix}`);
      }
    }
  }
  return [...out].filter(Boolean).sort((a, b) => b.length - a.length);
}

function snippetAroundValue(sourceText, value) {
  const variants = numberVariants(value);
  const lower = sourceText.toLowerCase();
  let idx = -1;
  for (const variant of variants) {
    idx = lower.indexOf(variant.toLowerCase());
    if (idx >= 0) break;
  }
  if (idx < 0) return compactSnippet(sourceText);
  return compactSnippet(sourceText.slice(Math.max(0, idx - 220), Math.min(sourceText.length, idx + 280)));
}

function splitSourceBlocks(text) {
  const blocks = [];
  const re = /### Slide (\d+)\n([\s\S]*?)(?=\n### Slide \d+\n|\n### Embedded Workbook: |$)/g;
  for (const m of text.matchAll(re)) {
    const slide_number = Number(m[1]);
    const body = m[2];
    const sections = [
      { marker: "#### Tables", type: "table", idx: body.indexOf("#### Tables") },
      { marker: "#### Charts", type: "chart", idx: body.indexOf("#### Charts") },
      { marker: "#### Speaker Notes", type: "notes", idx: body.indexOf("#### Speaker Notes") },
    ].filter((s) => s.idx >= 0).sort((a, b) => a.idx - b.idx);
    const proseEnd = Math.min(...sections.map((s) => s.idx), body.length);
    const prose = body.slice(0, proseEnd);
    if (prose.trim()) blocks.push({ source_type: "text", slide_number, text: prose });
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const end = sections[i + 1]?.idx ?? body.length;
      blocks.push({ source_type: section.type, slide_number, text: body.slice(section.idx, end) });
    }
  }
  const workbookRe = /### Embedded Workbook: ([^\n]+)\n([\s\S]*?)(?=\n### Embedded Workbook: |$)/g;
  for (const m of text.matchAll(workbookRe)) {
    if (m[2].trim()) blocks.push({ source_type: "workbook", text: `${m[1]}\n${m[2]}` });
  }
  if (blocks.length === 0 && text.trim()) blocks.push({ source_type: "text", text });
  return blocks;
}

function findEvidence(blocks, value, hints = []) {
  if (!Number.isFinite(value)) return null;
  const variants = numberVariants(value).map((v) => v.toLowerCase().replace(/[\s,]/g, ""));
  const cleanHints = hints.map((h) => h.toLowerCase()).filter(Boolean);
  let best = null;
  let bestScore = -1;
  for (const block of blocks) {
    const normalized = block.text.toLowerCase().replace(/[\s,]/g, "");
    if (!variants.some((v) => v && normalized.includes(v))) continue;
    const hintHits = cleanHints.filter((h) => block.text.toLowerCase().includes(h)).length;
    const score =
      hintHits * 10 +
      (block.source_type === "table" ? 4 :
        block.source_type === "workbook" ? 4 :
          block.source_type === "chart" ? 3 :
            block.source_type === "notes" ? 2 : 1);
    if (score > bestScore) {
      bestScore = score;
      best = {
        field_path: "",
        value_text: String(value),
        numeric_value: value,
        source_type: block.source_type,
        slide_number: block.slide_number,
        source_snippet: snippetAroundValue(block.text, value),
        confidence: hintHits > 0 ? 0.9 : 0.7,
      };
    }
  }
  return best;
}

function addNumericEvidence(out, blocks, fieldPath, value, hints = []) {
  if (typeof value !== "number" || !Number.isFinite(value) || value === 0) return;
  const ev = findEvidence(blocks, value, hints);
  if (ev) out.push({ ...ev, field_path: fieldPath });
}

function buildExtractionEvidence(extracted, text) {
  const blocks = splitSourceBlocks(text);
  const out = [];
  const obj = (key) => {
    const v = extracted[key];
    return v && typeof v === "object" && !Array.isArray(v) ? v : null;
  };
  const addFields = (table, fields, hints) => {
    const row = obj(table);
    if (!row) return;
    for (const field of fields) addNumericEvidence(out, blocks, `${table}.${field}`, row[field], [...hints, field.replace(/_/g, " ")]);
  };

  addFields("report_summary", ["new_events", "outbreaks", "grade_1", "grade_2", "grade_3"], ["emergencies", "grade", "outbreak"]);
  addFields("mpox_data", groundDrop.mpox_data, ["mpox"]);
  addFields("measles_data", groundDrop.measles_data, ["measles"]);
  addFields("idsr_data", ["completeness_pct", "timeliness_pct", "cebs_community_signals"], ["idsr"]);
  addFields("nutrition_data", ["phase3_above", "phase4_5"], ["nutrition", "ipc"]);

  for (const table of ["mpox_counties", "measles_counties", ...leanDiseaseTables, "idsr_counties", "nutrition_counties"]) {
    const rows = extracted[table];
    if (!Array.isArray(rows)) continue;
    rows.slice(0, 80).forEach((row, i) => {
      if (!row || typeof row !== "object") return;
      const place = String(row.county_name ?? row.county ?? row.sub_county ?? "");
      for (const field of ["cases_2026", "case_count", "cases", "deaths", "completeness_pct", "timeliness_pct", "population_affected"]) {
        addNumericEvidence(out, blocks, `${table}[${i}].${field}`, row[field], [table.replace(/_/g, " "), place, field.replace(/_/g, " ")]);
      }
    });
  }

  const seen = new Set();
  return out.filter((r) => {
    const k = `${r.field_path}|${r.value_text}|${r.slide_number ?? ""}|${r.source_snippet.slice(0, 80)}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function countEvidenceCandidateFields(extracted) {
  const paths = new Set();
  const obj = (key) => {
    const v = extracted[key];
    return v && typeof v === "object" && !Array.isArray(v) ? v : null;
  };
  const addFields = (table, fields) => {
    const row = obj(table);
    if (!row) return;
    for (const field of fields) {
      const value = row[field];
      if (typeof value === "number" && Number.isFinite(value) && value !== 0) paths.add(`${table}.${field}`);
    }
  };

  addFields("report_summary", ["new_events", "outbreaks", "grade_1", "grade_2", "grade_3"]);
  addFields("mpox_data", groundDrop.mpox_data);
  addFields("measles_data", groundDrop.measles_data);
  addFields("idsr_data", ["completeness_pct", "timeliness_pct", "cebs_community_signals"]);
  addFields("nutrition_data", ["phase3_above", "phase4_5"]);

  for (const table of ["mpox_counties", "measles_counties", ...leanDiseaseTables, "idsr_counties", "nutrition_counties"]) {
    const rows = extracted[table];
    if (!Array.isArray(rows)) continue;
    rows.slice(0, 80).forEach((row, i) => {
      if (!row || typeof row !== "object") return;
      for (const field of ["cases_2026", "case_count", "cases", "deaths", "completeness_pct", "timeliness_pct", "population_affected"]) {
        const value = row[field];
        if (typeof value === "number" && Number.isFinite(value) && value !== 0) paths.add(`${table}[${i}].${field}`);
      }
    });
  }

  return paths.size;
}

const fixtureText = [
  "### Slide 1",
  "Mpox overview: cumulative cases 42. Report summary: 2 new events and 5 active outbreaks.",
  "#### Tables",
  "County\tCases",
  "Nairobi\t12",
  "#### Charts",
  "Mpox vaccinations 350",
  "#### Speaker Notes",
  "Mpox contacts listed: 1,376. Contacts completed: 1,141.",
  "### Slide 2",
  "IDSR performance: completeness 87.5 and timeliness 79.",
  "### Embedded Workbook: ppt/embeddings/oleObject1.xlsx",
  "### Sheet: mpox",
  "metric\tvalue",
  "traveller screenings\t10.2 million",
].join("\n");

const blocks = splitSourceBlocks(fixtureText);
assert.equal(blocks.filter((b) => b.source_type === "workbook").length, 1, "embedded workbook should be its own source block");
assert.equal(blocks.find((b) => b.slide_number === 2 && b.source_type === "text").text.includes("Embedded Workbook"), false, "last slide text must not absorb workbook content");
assert.deepEqual(
  blocks.map((b) => b.source_type),
  ["text", "table", "chart", "notes", "text", "workbook"],
  "source blocks should preserve text, table, chart, notes, and workbook evidence lanes",
);

const extractedFixture = {
  report_summary: { new_events: 2, outbreaks: 5 },
  mpox_data: {
    cumulative_cases: 42,
    contacts_listed: 1376,
    contacts_completed: 1141,
    vaccinations: 350,
    traveller_screenings: 10200000,
  },
  mpox_counties: [{ county_name: "Nairobi", cases_2026: 12 }],
  idsr_data: { completeness_pct: 87.5, timeliness_pct: 79 },
};
const evidence = buildExtractionEvidence(extractedFixture, fixtureText);

const byPath = Object.fromEntries(evidence.map((row) => [row.field_path, row]));
assert.equal(byPath["mpox_data.cumulative_cases"]?.source_type, "text");
assert.equal(byPath["mpox_data.contacts_listed"]?.source_type, "notes");
assert.equal(byPath["mpox_data.vaccinations"]?.source_type, "chart");
assert.equal(byPath["mpox_data.traveller_screenings"]?.source_type, "workbook");
assert.equal(byPath["mpox_counties[0].cases_2026"]?.source_type, "table");
assert.equal(byPath["idsr_data.completeness_pct"]?.slide_number, 2);
assert.ok(byPath["mpox_data.traveller_screenings"].source_snippet.includes("10.2 million"));
assert.equal(countEvidenceCandidateFields(extractedFixture), 10, "fixture should expose the expected denominator");
assert.equal(new Set(evidence.map((row) => row.field_path)).size, 10, "all fixture numeric candidates should be grounded");
assert.ok(source.includes("coverage_pct"), "process-upload response should include evidence coverage percentage");
assert.ok(source.includes("candidate_fields"), "process-upload response should include evidence candidate denominator");
assert.ok(source.includes('DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-5"'), "process-upload should default to a current Anthropic model");
assert.ok(source.includes('configured === "claude-sonnet-4-20250514"'), "process-upload should map the known invalid Claude model secret");
assert.equal(source.match(/temperature: 0/g)?.length ?? 0, 1, "only the Groq validation request should set temperature");

console.log(`process-upload evidence verification passed (${evidence.length} evidence rows)`);

// routes/sheet.js
const express = require("express");
const router = express.Router();
const { appendRows, getRows, updateRow, deleteRow, clearSheet, getSheetList } = require("../services/googleSheets");
const { streamExcel, filterRows } = require("../services/exportExcel");

function getISTDateISO() {
  const now = new Date();
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + istOffsetMs).toISOString();
}

// LIST with filters + pagination
router.get("/list", async (req, res) => {
  try {
    const { status, project, q, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    const all = await getRows();
    const filtered = filterRows(all, { status, project, q, dateFrom, dateTo, dateField: "createdAt" });

    const p = Math.max(1, parseInt(page, 10));
    const l = Math.max(1, Math.min(500, parseInt(limit, 10)));
    const total = filtered.length;
    const start = (p - 1) * l;
    const end = start + l;

    res.json({ data: filtered.slice(start, end), total });
  } catch (err) {
    console.error("GET /list error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

//search 
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const all = await getRows();
    const matches = all.filter(r =>
      r.companyName?.toLowerCase().includes(q.toLowerCase())
    );

    // limit results so UI doesn’t get flooded
    res.json(matches.slice(0, 10));
  } catch (err) {
    console.error("GET /search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});


// CREATE
router.post("/creat", async (req, res) => {
  try {
    const { companyName, projectName, status = "Active", empId, activeValue = "" } = req.body;
    if (!companyName || !empId) return res.status(400).json({ error: "Missing fields" });

    const createdAt = getISTDateISO();
    const values = [[companyName, projectName || "", status, empId, createdAt, activeValue]];
    const result = await appendRows(values);
    res.json(result);
  } catch (err) {
    console.error("POST /create error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// TOGGLE
router.post("/toggle/:companyName", async (req, res) => {
  try {
    const { companyName } = req.params;
    const rows = await getRows();
    const row = rows.find(r => r.companyName === companyName);
    if (!row) return res.status(404).json({ error: "Company not found" });
    if (row.status.toLowerCase() === "inactive") return res.status(409).json({ error: "Already inactive" });

    const id = { sheetName: row.sheetName, rowId: row.rowId };
    await updateRow(id, [row.companyName, row.projectName, "Inactive", row.empId, row.createdAt, row.activeValue ?? ""]);
    res.json({ success: true, message: "Status changed to inactive" });
  } catch (err) {
    console.error("POST /toggle error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE
router.delete("/delete", async (req, res) => {
  try {
    const { companyName, projectName } = req.body;
    if (!companyName) return res.status(400).json({ error: "Missing companyName" });

    const rows = await getRows();
    const row = rows.find(r => r.companyName === companyName && (!projectName || r.projectName === projectName));
    if (!row) return res.status(404).json({ error: "Company not found" });

    const id = { sheetName: row.sheetName, rowId: row.rowId };
    await deleteRow(id);
    res.json({ success: true, message: `"${companyName}" deleted` });
  } catch (err) {
    console.error("DELETE /delete error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// CLEAR last sheet
router.post("/clear", async (req, res) => {
  try {
    const sheets = await getSheetList();
    if (!sheets.length) return res.status(404).json({ error: "No sheets found" });
    const lastSheet = sheets[sheets.length - 1];
    await clearSheet(lastSheet.title);
    res.json({ success: true, message: `Sheet "${lastSheet.title}" cleared` });
  } catch (err) {
    console.error("POST /clear error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// EXPORT XLSX (multi-sheet, auto split)
router.get("/export", async (req, res) => {
  try {
    const { mode = "all", status, project, q, dateFrom, dateTo } = req.query;
    const all = await getRows();
    const filtered = filterRows(all, { status, project, q, dateFrom, dateTo, dateField: "createdAt" });

    const fileNameBase =
      mode === "today" ? "today" :
      mode === "range" ? `${dateFrom || "from"}_${dateTo || "to"}` :
      mode === "datewise" ? "datewise" : "all";

    const fileName = `companies_${fileNameBase}.xlsx`;

    await streamExcel(
      res,
      filtered,
      { mode, dateField: "createdAt", dateFrom, dateTo },
      fileName
    );
  } catch (err) {
    console.error("GET /export error:", err);
    res.status(500).json({ error: "Export failed" });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const {
  appendRows,
  getRows,
  updateRow,
  deleteRow,
  clearSheet,
  getSheetList,
} = require("../services/googleSheets"); // adjust path

   function getISTDate() {
  const date = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // 5:30
  return new Date(date.getTime() + istOffset).toISOString();
}

createdAt=getISTDate();
router.get("/list", async (req, res) => {
  try {
    const { status, project, page = 1, limit = 20 } = req.query;
    let rows = await getRows();
    if (status) rows = rows.filter(r => r.status.toLowerCase() === status.toLowerCase());
    if (project) rows = rows.filter(r => r.projectName === project);

    const total = rows.length;
    const start = (page - 1) * limit;
    const end = start + Number(limit);
    const data = rows.slice(start, end);
    res.json({ data, total });
  } catch (err) {
    console.error("GET /list error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Add new company
router.post("/creat", async (req, res) => {
  try {
    const { companyName, projectName, status = "Active", empId,activeValue = "" } = req.body;
    if (!companyName || !empId) return res.status(400).json({ error: "Missing fields" });

    const values = [[companyName, projectName || "", status, empId, createdAt,activeValue]];

    const result = await appendRows(values);
    res.json(result);
  } catch (err) {
    console.error("POST /add error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Search company by prefix
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const rows = await getRows();
    const results = rows.filter(r => r.companyName.toLowerCase().startsWith(q.toLowerCase()));
    res.json(results.slice(0, 10));
  } catch (err) {
    console.error("GET /search error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Toggle active → inactive
router.post("/toggle/:companyName", async (req, res) => {
  try {
    const { companyName } = req.params;

    if (!companyName) return res.status(400).json({ error: "Missing companyName" });

    const rows = await getRows();
    const row = rows.find(r => r.companyName === companyName);
    if (!row) return res.status(404).json({ error: "Company not found" });
    if (row.status.toLowerCase() === "inactive") return res.status(409).json({ error: "Already inactive" });

    const rowIdentifier = { sheetName: row.sheetName, rowId: row.rowId };
    await updateRow(rowIdentifier, [row.companyName, row.projectName, "Inactive", row.empId, row.createdAt]);
    res.json({ success: true, message: "Status changed to inactive" });
  } catch (err) {
    console.error("POST /toggle error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Delete company
router.delete("/delete", async (req, res) => {
  try {
    const { companyName, projectName } = req.body;
    if (!companyName) return res.status(400).json({ error: "Missing companyName" });

    const rows = await getRows();
    const row = rows.find(r => r.companyName === companyName && (!projectName || r.projectName === projectName));
    if (!row) return res.status(404).json({ error: "Company not found" });

    const rowIdentifier = { sheetName: row.sheetName, rowId: row.rowId };
    await deleteRow(rowIdentifier);
    res.json({ success: true, message: `"${companyName}" deleted` });
  } catch (err) {
    console.error("DELETE /delete error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Clear last sheet
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

module.exports = router;

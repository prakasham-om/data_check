const express = require("express");
const router = express.Router();
const { appendRows, getRows, updateRow,deleteRow,clearSheet } = require("../services/googleSheets"); // <-- added updateRow

// Helper: get current IST date as YYYY-MM-DD
function getISTDate() {
  const date = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 mins in ms
  const istDate = new Date(date.getTime() + istOffset);

  const yyyy = istDate.getUTCFullYear();
  const mm = String(istDate.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(istDate.getUTCDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

// Add new company + project
router.post("/add", async (req, res) => {
  try {
    const { companyName, projectName, status, empId } = req.body;
    if (!companyName)
      return res.status(400).json({ error: "Missing fields" });

    const existing = await getRows();
    if (
      existing.some(
        (c) =>
          c.companyName.toLowerCase() === companyName.toLowerCase() &&
          c.projectName.toLowerCase() === projectName.toLowerCase()
      )
    ) {
      return res.status(409).json({ error: "Company+Project already exists" });
    }

    const createdAt = getISTDate();
    await appendRows([[companyName, projectName, status, empId, createdAt]]);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// List companies
router.get("/list", async (req, res) => {
  const { status, project, page = 1, limit = 10 } = req.query;
  let data = await getRows();

  if (status) data = data.filter((d) => d.status === status);
  if (project) data = data.filter((d) => d.projectName === project);

  const total = data.length;
  const start = (page - 1) * limit;
  const end = start + Number(limit);

  res.json({ data: data.slice(start, end), total });
});

// Search by company name
router.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  const data = await getRows();
  const result = data.filter((d) =>
    d.companyName.toLowerCase().startsWith(q.toLowerCase())
  );
  res.json(result.slice(0, 10));
});

// Toggle active/inactive status
router.post("/toggle/:companyName", async (req, res) => {
  try {
    const { companyName } = req.params;
    if (!companyName) return res.status(400).json({ error: "Missing companyName" });

    const rows = await getRows();
    const row = rows.find((r) => r.companyName.toLowerCase() === companyName.toLowerCase());

    if (!row) return res.status(404).json({ error: "Company not found" });

    if (row.status === "inactive") {
      // Cannot toggle inactive rows
      return res.status(409).json({ error: "Row is already inactive, cannot toggle" });
    }

    // Only active → inactive
    const updatedValues = [
      row.companyName,
      row.projectName,
      "inactive",
      row.empId,
      row.createdAt,
    ];

    await updateRow(row.id, updatedValues);
    res.json({ success: true, message: "Status changed to inactive" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


router.post("/clear/:sheetName", async (req, res) => {
  try {
    const sheetName = req.params.sheetName?.trim();
    if (!sheetName) return res.status(400).json({ error: "Missing sheetName" });

    await clearSheet(sheetName);
    res.json({ success: true, message: `Sheet ${sheetName} cleared` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});




router.delete("/delete", async (req, res) => {
  try {
    const { companyName } = req.body;
    if (!companyName) return res.status(400).json({ error: "Missing company name" });

    // Get all rows
    const rows = await getRows();

    // Find the row by company name
    const rowToDelete = rows.find(r => r.companyName === companyName);
    if (!rowToDelete) return res.status(404).json({ error: "Company not found" });

    // Delete the row
    await deleteRow({ sheetName: rowToDelete.sheetName, rowId: rowToDelete.rowId });

    return res.json({ success: true, message: `"${companyName}" deleted successfully` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to delete company" });
  }
});

router.get("/rows", async (req, res) => {
  try {
    const rows = await getRows();
    res.json(rows);
  } catch (err) {
    console.error("Google Sheets API Error:", err.response?.data || err.message);
    res.status(500).json({
      error: err.message,
      details: err.response?.data || null
    });
  }
});


module.exports = router;

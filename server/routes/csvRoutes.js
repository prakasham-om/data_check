
const express = require("express");
const router = express.Router();
const { Dropbox } = require("dropbox");
const { stringify } = require("csv-stringify/sync");
require("dotenv").config();

const dbx = new Dropbox({ accessToken: process.env.DROPBOX_KEY });

// CSV Path by date
function getCSVPath(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `/daily/${yyyy}-${mm}-${dd}.csv`;
}

// Read CSV
async function readCSV(path) {
  const rows = [];
  try {
    const file = await dbx.filesDownload({ path });
    const content = file.result.fileBinary.toString("utf8");
    const lines = content.split("\n");
    lines.forEach((line, idx) => {
      if (idx === 0 || !line.trim()) return;
      const [companyName, projectName, status, empId, createdAt, activeValue] = line.split(",");
      rows.push({ companyName, projectName, status, empId, createdAt, activeValue });
    });
  } catch (err) {
    if (err.status === 409) return []; // File not found
    throw err;
  }
  return rows;
}

// Write CSV
async function writeCSV(path, data) {
  const csvContent = stringify(data, {
    header: true,
    columns: ["companyName", "projectName", "status", "empId", "createdAt", "activeValue"],
  });
  await dbx.filesUpload({
    path,
    contents: csvContent,
    mode: { ".tag": "overwrite" },
  });
}

// Add company
router.post("/creat", async (req, res) => {
  try {
    const { companyName, projectName, empId, status = "Active", activeValue = "" } = req.body;
    if (!companyName || !empId) return res.status(400).json({ success: false, error: "Missing fields" });

    const csvFile = getCSVPath();
    let rows = await readCSV(csvFile);

    if (rows.find(r => r.companyName === companyName))
      return res.json({ success: false, error: "Company already exists" });

    rows.push({ companyName, projectName, status, empId, createdAt: new Date().toISOString(), activeValue });
    await writeCSV(csvFile, rows);

    res.json({ success: true, message: "Company added", data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// List companies
router.get("/list", async (req, res) => {
  try {
    const { status, project, page = 1, limit = 20 } = req.query;
    const csvFile = getCSVPath();
    let rows = await readCSV(csvFile);

    if (status) rows = rows.filter(r => r.status.toLowerCase() === status.toLowerCase());
    if (project) rows = rows.filter(r => r.projectName === project);

    const total = rows.length;
    const start = (page - 1) * limit;
    const data = rows.slice(start, start + Number(limit));

    res.json({ success: true, data, total });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// GET /api/csv/search?q=&page=&limit=


// Search companies by name for autocomplete / duplicate check
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, data: [] });

    const csvFile = getCSVPath();
    const rows = await readCSV(csvFile);

    // Filter by company name starting with query (case-insensitive)
    const results = rows.filter(r => 
      r.companyName && r.companyName.toLowerCase().startsWith(q.toLowerCase())
    );

    // Return top 10 matches
    res.json({ success: true, data: results.slice(0, 10) });
  } catch (err) {
    console.error("GET /search error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});


// --- Toggle / Deactivate company ---
router.post("/toggle/:companyName", async (req, res) => {
  try {
    const { companyName } = req.params;
    const csvFile = getCSVPath();
    let rows = await readCSV(csvFile);

    const row = rows.find(r => r.companyName === companyName);
    if (!row) return res.status(404).json({ error: "Company not found" });

    if (row.status.toLowerCase() === "existing") {
      // Already deactivated/existing
      return res.json({ success: true, message: "Company already existing", data: rows });
    }

    // Deactivate the company, mark as Existing
    row.status = "Existing"; // don’t touch activeValue
    await writeCSV(csvFile, rows);

    res.json({ success: true, message: "Company deactivated", data: rows });
  } catch (err) {
    console.error("POST /toggle error:", err);
    res.status(500).json({ error: "Server error" });
  }
});



// Delete company
router.delete("/delete", async (req, res) => {
  try {
    const { companyName } = req.body;
    if (!companyName) return res.status(400).json({ success: false, error: "Missing companyName" });

    const csvFile = getCSVPath();
    let rows = await readCSV(csvFile);

    const filtered = rows.filter(r => r.companyName !== companyName);
    if (filtered.length === rows.length)
      return res.status(404).json({ success: false, error: "Company not found" });

    await writeCSV(csvFile, filtered);
    res.json({ success: true, message: "Company deleted", data: filtered });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

module.exports = router;

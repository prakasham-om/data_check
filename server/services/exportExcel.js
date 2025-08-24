// services/exportExcel.js
const ExcelJS = require("exceljs");

// Excel’s practical hard limit per sheet (true Excel max = 1,048,576 rows)
const EXCEL_MAX_ROWS = 1_048_576;

function groupByDate(rows, dateField) {
  const map = {};
  for (const r of rows) {
    const key = (r[dateField] || "").slice(0, 10) || "NoDate";
    if (!map[key]) map[key] = [];
    map[key].push(r);
  }
  return map;
}

function filterRows(rows, { status, project, q, dateFrom, dateTo, dateField = "createdAt" }) {
  return rows.filter((r) => {
    if (status && r.status?.toLowerCase() !== status.toLowerCase()) return false;
    if (project && r.projectName !== project) return false;
    if (q && !`${r.companyName}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (dateFrom || dateTo) {
      const d = (r[dateField] || "").slice(0, 10);
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
    }
    return true;
  });
}

/**
 * Stream an XLSX to Express res, splitting across many sheets automatically.
 * @param {Response} res Express response
 * @param {Array<Object>} rows data
 * @param {Object} opts { mode: "all" | "today" | "datewise" | "range", dateFrom, dateTo, dateField }
 * @param {String} fileName
 */
async function streamExcel(res, rows, opts = {}, fileName = "export.xlsx") {
  const { mode = "all", dateField = "createdAt", dateFrom, dateTo } = opts;

  // Pre-filter for mode
  let filtered = rows;
  if (mode === "today") {
    const today = new Date().toISOString().slice(0, 10);
    filtered = filterRows(rows, { dateFrom: today, dateTo: today, dateField });
  } else if (mode === "range") {
    filtered = filterRows(rows, { dateFrom, dateTo, dateField });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Data-Check";
  workbook.created = new Date();

  const addChunkedSheets = (title, data) => {
    if (data.length === 0) {
      const ws = workbook.addWorksheet(`${title}_empty`);
      ws.addRow(["No data"]);
      return;
    }
    // headers
    const headers = Object.keys(data[0]);
    for (let i = 0; i < data.length; i += (EXCEL_MAX_ROWS - 1)) {
      const chunk = data.slice(i, i + (EXCEL_MAX_ROWS - 1));
      const ws = workbook.addWorksheet(`${title}_${Math.floor(i / (EXCEL_MAX_ROWS - 1)) + 1}`);
      ws.columns = headers.map((h) => ({ header: h, key: h, width: 20 }));
      ws.addRows(chunk);
    }
  };

  if (mode === "datewise") {
    const groups = groupByDate(filtered, dateField);
    for (const [dateKey, list] of Object.entries(groups)) {
      addChunkedSheets(dateKey, list);
    }
  } else {
    addChunkedSheets(mode === "all" ? "All" : "Filtered", filtered);
  }

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  await workbook.xlsx.write(res); // stream to response
  res.end();
}

module.exports = { streamExcel, filterRows };

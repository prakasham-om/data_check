const express = require("express");
const router = express.Router();
const { BigQuery } = require("@google-cloud/bigquery");
require("dotenv").config();

// ✅ Set projectId here
const projectId = "bold-bond-469518-n4";

// ✅ BigQuery Client
const bigquery = new BigQuery({
  projectId,
  credentials: {
    client_email: process.env.PRIVATE_EMAIL,
    private_key: process.env.PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
});

const datasetId = "my_dataset";
const tableId = "company_data";

// ✅ Create dataset + table if not exists
async function initTable() {
  const [datasets] = await bigquery.getDatasets();
  if (!datasets.find(d => d.id === datasetId)) {
    await bigquery.createDataset(datasetId);
    console.log(`Dataset ${datasetId} created`);
  }

  const dataset = bigquery.dataset(datasetId);
  const [tables] = await dataset.getTables();
  if (!tables.find(t => t.id === tableId)) {
    await dataset.createTable(tableId, {
      schema: [
        { name: "companyName", type: "STRING" },
        { name: "projectName", type: "STRING" },
        { name: "status", type: "STRING" },
        { name: "empId", type: "STRING" },
        { name: "createdAt", type: "TIMESTAMP" },
      ],
    });
    console.log(`Table ${tableId} created`);
  }
}
initTable();

// ✅ Helper IST timestamp
function getISTDate() {
  const date = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(date.getTime() + istOffset).toISOString();
}

// ✅ Add new company
router.post("/creat", async (req, res) => {
  try {
    const { companyName, projectName, status, empId } = req.body;
    if (!companyName || !projectName) return res.status(400).json({ error: "Missing fields" });

    const query = `
      MERGE \`${projectId}.${datasetId}.${tableId}\` T
      USING (SELECT @companyName AS companyName, @projectName AS projectName, @status AS status, @empId AS empId, @createdAt AS createdAt) S
      ON T.companyName = S.companyName AND T.projectName = S.projectName
      WHEN NOT MATCHED THEN
      INSERT (companyName, projectName, status, empId, createdAt)
      VALUES (S.companyName, S.projectName, S.status, S.empId, S.createdAt)
    `;
    const options = {
      query,
      params: {
        companyName,
        projectName,
        status: status || "active",
        empId: empId || "",
        createdAt: getISTDate(),
      },
    };

    await bigquery.query(options);
    res.json({ success: true, message: "Inserted (or already exists)" });
  } catch (err) {
    console.error("POST /add error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ List companies
router.get("/list", async (req, res) => {
  try {
    const { status, project, page = 1, limit = 10 } = req.query;

    let query = `SELECT * FROM \`${projectId}.${datasetId}.${tableId}\``;
    const conditions = [];
    const params = {};

    if (status) {
      conditions.push("status = @status");
      params.status = status;
    }
    if (project) {
      conditions.push("projectName = @project");
      params.project = project;
    }
    if (conditions.length > 0) query += " WHERE " + conditions.join(" AND ");
    query += " ORDER BY createdAt DESC";
    query += ` LIMIT @limit OFFSET @offset`;
    params.limit = Number(limit);
    params.offset = (Number(page) - 1) * Number(limit);

    const [rows] = await bigquery.query({ query, params });
    res.json({ data: rows, total: rows.length });
  } catch (err) {
    console.error("GET /list error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Search
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const query = `
      SELECT * FROM \`${projectId}.${datasetId}.${tableId}\`
      WHERE LOWER(companyName) LIKE @prefix
      LIMIT 10
    `;
    const [rows] = await bigquery.query({ query, params: { prefix: q.toLowerCase() + "%" } });
    res.json(rows);
  } catch (err) {
    console.error("GET /search error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Toggle inactive
router.post("/toggle/:companyName", async (req, res) => {
  try {
    const { companyName } = req.params;
    const { projectName } = req.body;

    if (!companyName) return res.status(400).json({ error: "Missing companyName" });

    const querySelect = `
      SELECT status FROM \`${projectId}.${datasetId}.${tableId}\`
      WHERE companyName=@companyName ${projectName ? "AND projectName=@projectName" : ""}
      LIMIT 1
    `;
    const [rows] = await bigquery.query({ query: querySelect, params: { companyName, projectName } });
    if (!rows.length) return res.status(404).json({ error: "Company not found" });

    if (rows[0].status === "inactive") return res.status(409).json({ error: "Already inactive" });

    const queryUpdate = `
      UPDATE \`${projectId}.${datasetId}.${tableId}\`
      SET status='inactive'
      WHERE companyName=@companyName ${projectName ? "AND projectName=@projectName" : ""}
    `;
    await bigquery.query({ query: queryUpdate, params: { companyName, projectName } });
    res.json({ success: true, message: "Status changed to inactive" });
  } catch (err) {
    console.error("POST /toggle error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Clear table
router.post("/clear", async (req, res) => {
  try {
    const query = `TRUNCATE TABLE \`${projectId}.${datasetId}.${tableId}\``;
    await bigquery.query(query);
    res.json({ success: true, message: "Table cleared" });
  } catch (err) {
    console.error("POST /clear error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete company
router.delete("/delete", async (req, res) => {
  try {
    const { companyName, projectName } = req.body;
    if (!companyName) return res.status(400).json({ error: "Missing companyName" });

    let query = `DELETE FROM \`${projectId}.${datasetId}.${tableId}\` WHERE companyName=@companyName`;
    const params = { companyName };
    if (projectName) {
      query += " AND projectName=@projectName";
      params.projectName = projectName;
    }

    await bigquery.query({ query, params });
    res.json({ success: true, message: `"${companyName}" deleted` });
  } catch (err) {
    console.error("DELETE /delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

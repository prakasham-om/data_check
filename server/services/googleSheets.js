
const { google } = require("googleapis");
require("dotenv").config();
const path = require("path");
const keyPath = path.join(__dirname, "../config/credentials.json");

const cred=require('../config/credentials.json');

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const MAX_ROWS_PER_SHEET = 50000;

const auth = new google.auth.GoogleAuth({
  credentials: cred,

  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function getSheetsClient() {
  const authClient = await auth.getClient();
  return google.sheets({ version: "v4", auth: authClient });
}

// Get all sheets with titles and row counts
async function getSheetList() {
  const sheets = await getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  return meta.data.sheets.map((s) => ({
    title: s.properties.title,
    rowCount: s.properties.gridProperties.rowCount,
    sheetId: s.properties.sheetId,
  }));
}

// Append multiple rows
async function appendRows(values) {
  const sheets = await getSheetsClient();
  let sheetList = await getSheetList();
  let targetSheet = sheetList[sheetList.length - 1];

  // Get current number of rows
  const currentResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: targetSheet.title,
  });
  const currentRows = currentResp.data.values?.length || 0;

  // Create new sheet if exceeds max rows
  if (currentRows + values.length > MAX_ROWS_PER_SHEET) {
    const newSheetTitle = `Sheet${sheetList.length + 1}`;
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: newSheetTitle } } }] },
    });
    targetSheet.title = newSheetTitle;
    console.log(`📄 Created new sheet: ${newSheetTitle}`);
  }

  // Append rows
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: targetSheet.title,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });

  console.log("✅ Data appended:", response.data.updates.updatedRange);
  return {
    success: true,
    message: `Rows appended to ${targetSheet.title}`,
    sheetName: targetSheet.title,
    startRow: currentRows + 1,
    endRow: currentRows + values.length,
  };
}

// Get all rows from all sheets
async function getRows() {
  const sheets = await getSheetsClient();
  const sheetList = await getSheetList();
  let allRows = [];

  for (let sheet of sheetList) {
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: sheet.title,
    });
    const rows = resp.data.values || [];
    rows.slice(1).forEach((r, i) => {
      allRows.push({
        sheetName: sheet.title,
        rowId: i + 1, // 0-based for batchUpdate delete
        companyName: r[0] || "",
        projectName: r[1] || "",
        status: r[2] || "",
        empId: r[3] || "",
        createdAt: r[4] || "",
      });
    });
  }

  return allRows;
}

// Update a single row
async function updateRow(rowIdentifier, values) {
  const sheets = await getSheetsClient();
  const range = `${rowIdentifier.sheetName}!A${rowIdentifier.rowId + 1}:E${rowIdentifier.rowId + 1}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
  console.log(`✅ Row ${rowIdentifier.rowId} updated in ${rowIdentifier.sheetName}`);
  return { success: true, message: `Row ${rowIdentifier.rowId} updated` };
}

// Delete a single row
async function deleteRow(rowIdentifier) {
  const sheets = await getSheetsClient();
  const sheetList = await getSheetList();
  const sheet = sheetList.find((s) => s.title === rowIdentifier.sheetName);
  if (!sheet) throw new Error("Sheet not found: " + rowIdentifier.sheetName);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheet.sheetId,
              dimension: "ROWS",
              startIndex: rowIdentifier.rowId,
              endIndex: rowIdentifier.rowId + 1,
            },
          },
        },
      ],
    },
  });
  console.log(`🗑 Row ${rowIdentifier.rowId} deleted in ${rowIdentifier.sheetName}`);
  return { success: true, message: `Row ${rowIdentifier.rowId} deleted` };
}

// Clear all rows in a sheet
async function clearSheet(sheetName) {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetName,
  });
  console.log(`🧹 Sheet ${sheetName} cleared`);
  return { success: true, message: `Sheet ${sheetName} cleared` };
}

module.exports = {
  appendRows,
  getRows,
  updateRow,
  deleteRow,
  clearSheet,
};

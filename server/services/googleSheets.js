// services/googleSheets.js
const { google } = require("googleapis");
require("dotenv").config();

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const MAX_ROWS_PER_SHEET = 50000; // storage per sheet in Google Sheets (your append logic)

const cred = JSON.parse(Buffer.from(process.env.CRED, "base64").toString("utf8"));
const auth = new google.auth.GoogleAuth({
  credentials: cred,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function getSheetsClient() {
  const authClient = await auth.getClient();
  return google.sheets({ version: "v4", auth: authClient });
}

async function getSheetList() {
  const sheets = await getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  return (meta.data.sheets || []).map((s) => ({
    title: s.properties.title,
    rowCount: s.properties.gridProperties.rowCount,
    sheetId: s.properties.sheetId,
  }));
}

// Append rows (your same logic)
async function appendRows(values) {
  const sheets = await getSheetsClient();
  let sheetList = await getSheetList();
  let targetSheet = sheetList[sheetList.length - 1];

  const currentResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: targetSheet.title,
  });
  const currentRows = currentResp.data.values?.length || 0;

  if (currentRows + values.length > MAX_ROWS_PER_SHEET) {
    const newSheetTitle = `Sheet${sheetList.length + 1}`;
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: newSheetTitle } } }] },
    });
    targetSheet.title = newSheetTitle;
    console.log(`Created new sheet: ${newSheetTitle}`);
  }

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: targetSheet.title,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });

  return {
    success: true,
    message: `Rows appended to ${targetSheet.title}`,
    sheetName: targetSheet.title,
    startRow: currentRows + 1,
    endRow: currentRows + values.length,
  };
}

// Read all rows (A:F expected: company, project, status, empId, createdAt, activeValue)
async function getRows() {
  const sheets = await getSheetsClient();
  const sheetList = await getSheetList();
  const all = [];

  for (const sheet of sheetList) {
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: sheet.title,
    });
    const rows = resp.data.values || [];
    // assuming first row is header
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i] || [];
      all.push({
        sheetName: sheet.title,
        rowId: i, // 0-based for deleteDimension
        companyName: r[0] || "",
        projectName: r[1] || "",
        status: r[2] || "",
        empId: r[3] || "",
        createdAt: r[4] || "",
        activeValue: r[5] ?? "",
      });
    }
  }
  return all;
}

async function updateRow(rowIdentifier, values) {
  const sheets = await getSheetsClient();
  const range = `${rowIdentifier.sheetName}!A${rowIdentifier.rowId + 1}:F${rowIdentifier.rowId + 1}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
  return { success: true, message: `Row ${rowIdentifier.rowId} updated` };
}

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
  return { success: true, message: `Row ${rowIdentifier.rowId} deleted` };
}

async function clearSheet(sheetName) {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetName,
  });
  return { success: true, message: `Sheet ${sheetName} cleared` };
}

module.exports = {
  appendRows,
  getRows,
  updateRow,
  deleteRow,
  clearSheet,
  getSheetList,
};

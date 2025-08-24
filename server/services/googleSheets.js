const { google } = require("googleapis");
require("dotenv").config();

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const MAX_ROWS_PER_SHEET = 50000;

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

// Append rows, create new sheet if full
async function appendRows(values) {
  const sheets = await getSheetsClient();
  let sheetList = await getSheetList();
  let targetSheet = sheetList[sheetList.length - 1];

  // Create sheet if none exists
  if (!targetSheet) {
    const newSheetTitle = "Sheet1";
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: newSheetTitle } } }] },
    });
    targetSheet = { title: newSheetTitle };
    sheetList.push(targetSheet);
  }

  // Get current rows
  const currentResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: targetSheet.title,
  });
  const currentRows = currentResp.data.values?.length || 0;

  // Create new sheet if full
  if (currentRows + values.length > MAX_ROWS_PER_SHEET) {
    const newSheetTitle = `Sheet${sheetList.length + 1}`;
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: newSheetTitle } } }] },
    });
    targetSheet.title = newSheetTitle;

    // Optional: add headers
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${newSheetTitle}!A1:F1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [["Company", "Project", "Status", "EmpId", "CreatedAt", "ActiveValue"]] },
    });
    console.log(`Created new sheet: ${newSheetTitle}`);
  }

  // Append rows
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: targetSheet.title,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });

  return { success: true, message: `Rows appended to ${targetSheet.title}`, sheetName: targetSheet.title, startRow: currentRows, endRow: currentRows + values.length };
}

// Get all rows
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

    for (let i = 0; i < rows.length; i++) { // start at 0, treat every row as data
      const r = rows[i] || [];
      all.push({
        sheetName: sheet.title,
        rowId: i,
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

// Update a row
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

// Delete a row
async function deleteRow(rowIdentifier) {
  const sheets = await getSheetsClient();
  const sheetList = await getSheetList();
  const sheet = sheetList.find((s) => s.title === rowIdentifier.sheetName);
  if (!sheet) throw new Error("Sheet not found: " + rowIdentifier.sheetName);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
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

// Clear sheet
async function clearSheet(sheetName) {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetName,
  });
  return { success: true, message: `Sheet ${sheetName} cleared` };
}

module.exports = { appendRows, getRows, updateRow, deleteRow, clearSheet, getSheetList };

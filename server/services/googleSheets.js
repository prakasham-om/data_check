const { google } = require("googleapis");
const { Buffer } = require("buffer");

// 🔑 Your Service Account JSON
const creds = {
  type: "service_account",
  project_id: "bold-bond-469518-n4",
  private_key_id: "233f3bd094b9c0c58b9f6be20d6d017c1ae225f6",
  private_key: Buffer.from(process.env.GOOGLE_PRIVATE_KEY, "base64").toString(),
  client_email: "sheet-service@bold-bond-469518-n4.iam.gserviceaccount.com",
  client_id: "116636218015051192562",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/sheet-service%40bold-bond-469518-n4.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
};


// ✅ Your Google Sheet ID
const SPREADSHEET_ID = "1BwRHdA3CpqUY02xExJaiEHCyEMPK8cSOBA-_M74BL-4";
const MAX_ROWS_PER_SHEET = 50000;

// Auth with direct JSON
const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function getSheetsClient() {
  const authClient = await auth.getClient();
  return google.sheets({ version: "v4", auth: authClient });
}



async function getSheetList() {
  const sheets = await getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  return meta.data.sheets.map((s) => ({
    title: s.properties.title,
    rowCount: s.properties.gridProperties.rowCount,
  }));
}

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
    console.log(`📄 Created new sheet: ${newSheetTitle}`);
  }

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
        rowId: i + 1,
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

async function deleteRow(rowIdentifier) {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: await getSheetId(rowIdentifier.sheetName),
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

async function getSheetId(sheetName) {
  const sheets = await getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheet = meta.data.sheets.find((s) => s.properties.title === sheetName);
  if (!sheet) throw new Error("Sheet not found: " + sheetName);
  return sheet.properties.sheetId;
}

async function clearSheet(sheetName) {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetName,
  });
  console.log(`🧹 Sheet ${sheetName} cleared`);
  return { success: true, message: `Sheet ${sheetName} cleared` };
}

module.exports = { appendRows, getRows, updateRow, deleteRow, clearSheet };

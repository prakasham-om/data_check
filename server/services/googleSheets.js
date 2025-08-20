const { google } = require("googleapis");

// 🔑 Your Service Account JSON
const creds = {
  type: "service_account",
  project_id: "bold-bond-469518-n4",
  private_key_id: "233f3bd094b9c0c58b9f6be20d6d017c1ae225f6",
  private_key: "-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDalrh6ITeuadmc
BJFeMuTqa5C2v7P0qVX/dIuAsqNitwDjOyM5geBY4JKIyzQpJ38/xjdiCdSoVQin
eWYhR09XFubNChYFXCGV/MgSY+GDTjQ6JLAgSZLejq9+1M1zJwiQ4FzcmcYS3CN7
aHFuUEnnQrbsN2sXK0CKQgkPihqJRbyA4AyPcnA2xHlJPUSgKlekqPDgkXEvh9j5
lCXL0emLQ/BnccavZ/jJV1SizrSVS55r+wJPObMj6+8SrvZg6qrrxkedDKCphvMg
X6+ltVd9a1RhS36GcbKRCj+XhzkJ6ZP/JA5sjj8IRpFzKlSe2nq+TgjiiAAg7NgJ
6e8wUjyVAgMBAAECggEAGkj5BoCjkjbaytLWyzHKCrFkHcGoKWHKfFU+qDty/74b
XnfASNxIBs/8dvQegdtkxx22D7U4bASLrZ3gzNwnG4UevGW716moRUG4KlP17IT1
LU+3mS5XuakFS/ZZfUEim89LA2D/a0mq/55D05zWgjdoyTdxyn+yO13s+oAkKEDw
Ssc+58xAn4TRN4OuRY+LH/fhl3gsqNUVg4TJAVHGYF9KbzIubLVAUIGw0tkora/x
sXvbnDoauvqgNceFtLynhTKN++vqcxztnkxbxc6tSgrDlck2Kdwmbd+xr4g7m5zB
t9AK4NRA10nT6zlu8NC0x3+TRs5gIz34CLu/zDkTqQKBgQD6GsLTgQPL4OZgd4mL
cuJY85x0VIduvBhU1FF9YUOJKndAaj8uZ8AutfAFO7suf/ZR3EnahNnUR4TAs52O
E5uNCrifVOyWolCisgaLb95CkabipA9DW5FHv4t953FlrqkX8rhZxkDqGqEMd8Om
NHsz1i2GFVR6VP1Vt6aUgiagzQKBgQDfvcea0PNgARHHoVxZBhx7/8QV2l/P/IkU
AbaDFqYAnCBlvy53JkvqRoiWb61RxcJWEsndX+JegUXzpq4WYGG/BZqRZ88C8AOn
2MqnvdyA4h4pXNx4I1aV4BnVlc7kSzvDfLfkJU2PzfoiVXn84ZWgzNhQX6jXWkDr
+lGx6ulq6QKBgQCQyLsuW4qKFRjokWrDmm8kFWrmASUh2quvN/YwwgSpvDaqyJbo
01Dy+YoITYrPoW5D92WdpbjAZeKY96Hm5LzwylsUicIodbB+btbRE6K0IMNegqD/
WlvhECa9bSU9Ov5SicVk2xsrKt0+bXqKlekYmg1iiKiN5PN/EsDRSgL4pQKBgGyZ
LwNEHH0ix8B/39UOFFFTiZeZ0Rug1eAyHKZwHc75+Pep3iHTItHpvm5WcmfYd0VU
BUtAOR3p3UwwQRt3WLphO+8L1fz1BrE3ltXoX9jm6ADno9NkQ6inh6KV/j/tDGsM
ZC2GtajxL1Hu7zEBRaExDGWmqMsucYiYjYKwJO/RAoGAfGc6WXTK2BVqG6yt4bDB
vUcQaTUoY3jLED9kPnw1M/YGcbC40GUpbzuseKR23Lmx8xWT6DCa6Xybm3MSrnKO
/UbVKmSJmLiJjJ6x2ar28ZD5B42GznxDJHrRxaAFQT7bgT3CRH91ioJTXZLfqaHz
sd24GrwTDNGRCYfYoZ+u+eo=
-----END PRIVATE KEY-----\n",
  client_email: "sheet-service@bold-bond-469518-n4.iam.gserviceaccount.com",
  client_id: "116636218015051192562",
  token_uri: "https://oauth2.googleapis.com/token"
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

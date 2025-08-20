const { google } = require("googleapis");
const { JWT } = require("google-auth-library");
const path = require("path");
const fs = require("fs");

const SPREADSHEET_ID = "1BwRHdA3CpqUY02xExJaiEHCyEMPK8cSOBA-_M74BL-4";
const MAX_ROWS_PER_SHEET = 50000;

// 🔐 Load credentials
function getCredentials() {
  // 1️⃣ Try full JSON env
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    try {
      const creds = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
      creds.private_key = creds.private_key.replace(/\\n/g, "\n");
      return creds;
    } catch (e) {
      console.error("Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON", e);
    }
  }

  // 2️⃣ Try separate env vars
  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    return {
      type: "service_account",
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }

  // 3️⃣ Try local file
  try {
    const keyPath = path.join(__dirname, "service-account-key.json");
    if (fs.existsSync(keyPath)) {
      const creds = require(keyPath);
      creds.private_key = creds.private_key.replace(/\\n/g, "\n");
      return creds;
    }
  } catch (e) {
    console.error("Service account key file not found", e);
  }

  throw new Error("❌ No valid Google credentials found.");
}

// 🔐 Auth with JWT
async function getSheetsClient() {
  try {
    console.log("🔐 Attempting authentication...");

    const credentials = getCredentials();

    const jwtClient = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    await jwtClient.authorize();
    console.log("✅ Authentication successful");

    return google.sheets({ version: "v4", auth: jwtClient });
  } catch (error) {
    console.error("❌ Authentication failed:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", JSON.stringify(error.response.data));
    }
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

// 📋 List sheets
async function getSheetList() {
  const sheets = await getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });

  return meta.data.sheets.map((s) => ({
    title: s.properties.title,
    sheetId: s.properties.sheetId,
    rowCount: s.properties.gridProperties.rowCount,
  }));
}

// 📊 Get current row count
async function getCurrentRowCount(sheetTitle) {
  try {
    const sheets = await getSheetsClient();
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetTitle}!A:A`,
    });

    return resp.data.values ? resp.data.values.length : 0;
  } catch (error) {
    if (error.code === 400) return 0;
    throw error;
  }
}

// 📝 Append rows
async function appendRows(values) {
  try {
    console.log(`📝 Appending ${values.length} rows...`);

    const sheets = await getSheetsClient();
    let sheetList = await getSheetList();
    let targetSheet = sheetList[sheetList.length - 1];

    const currentRows = await getCurrentRowCount(targetSheet.title);
    console.log(`📊 Current rows in ${targetSheet.title}: ${currentRows}`);

    if (currentRows + values.length > MAX_ROWS_PER_SHEET) {
      const newSheetTitle = `Sheet${sheetList.length + 1}`;
      console.log(`📄 Creating new sheet: ${newSheetTitle}`);

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: newSheetTitle,
                  gridProperties: { rowCount: 1000, columnCount: 10 },
                },
              },
            },
          ],
        },
      });

      targetSheet.title = newSheetTitle;
      console.log(`✅ Created new sheet: ${newSheetTitle}`);
    }

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${targetSheet.title}!A:E`,
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
      updatedRange: response.data.updates.updatedRange,
    };
  } catch (error) {
    console.error("❌ Error appending rows:", error.message);
    return { success: false, error: error.message, details: error.response?.data };
  }
}

// 📖 Get all rows
async function getRows(sheetName = null) {
  try {
    const sheets = await getSheetsClient();
    let allRows = [];
    let sheetList = await getSheetList();

    if (sheetName) {
      sheetList = sheetList.filter((sheet) => sheet.title === sheetName);
    }

    for (let sheet of sheetList) {
      console.log(`📋 Reading data from: ${sheet.title}`);

      const resp = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheet.title}!A:E`,
      });

      const rows = resp.data.values || [];
      console.log(`📊 Found ${rows.length} rows in ${sheet.title}`);

      const dataRows = rows.length > 1 ? rows.slice(1) : rows;

      dataRows.forEach((r, i) => {
        allRows.push({
          sheetName: sheet.title,
          rowId: i + 2,
          companyName: r[0] || "",
          projectName: r[1] || "",
          status: r[2] || "",
          empId: r[3] || "",
          createdAt: r[4] || "",
        });
      });
    }

    console.log(`✅ Retrieved ${allRows.length} total rows`);
    return allRows;
  } catch (error) {
    console.error("❌ Error getting rows:", error.message);
    throw error;
  }
}

// 🔄 Update a row
async function updateRow(sheetName, rowNumber, values) {
  try {
    const sheets = await getSheetsClient();
    const range = `${sheetName}!A${rowNumber}:E${rowNumber}`;

    console.log(`🔄 Updating row ${rowNumber} in ${sheetName}`);

    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [values] },
    });

    console.log(`✅ Row ${rowNumber} updated in ${sheetName}`);

    return { success: true, updatedRange: response.data.updatedRange };
  } catch (error) {
    console.error("❌ Error updating row:", error.message);
    return { success: false, error: error.message };
  }
}

// 🗑 Delete a row
async function deleteRow(sheetName, rowNumber) {
  try {
    const sheets = await getSheetsClient();

    const sheetList = await getSheetList();
    const sheet = sheetList.find((s) => s.title === sheetName);
    if (!sheet) throw new Error(`Sheet '${sheetName}' not found`);

    console.log(`🗑 Deleting row ${rowNumber} from ${sheetName}`);

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheet.sheetId,
                dimension: "ROWS",
                startIndex: rowNumber - 1,
                endIndex: rowNumber,
              },
            },
          },
        ],
      },
    });

    console.log(`✅ Row ${rowNumber} deleted`);
    return { success: true };
  } catch (error) {
    console.error("❌ Error deleting row:", error.message);
    return { success: false, error: error.message };
  }
}

// 🧹 Clear sheet
async function clearSheet(sheetName) {
  try {
    const sheets = await getSheetsClient();

    console.log(`🧹 Clearing sheet: ${sheetName}`);

    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:E`,
    });

    console.log(`✅ Sheet cleared`);
    return { success: true };
  } catch (error) {
    console.error("❌ Error clearing sheet:", error.message);
    return { success: false, error: error.message };
  }
}

// 📄 Create a new sheet
async function createNewSheet(sheetName) {
  try {
    const sheets = await getSheetsClient();

    console.log(`📄 Creating new sheet: ${sheetName}`);

    const response = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
                gridProperties: { rowCount: 1000, columnCount: 10 },
              },
            },
          },
        ],
      },
    });

    const newSheetId = response.data.replies[0].addSheet.properties.sheetId;
    console.log(`✅ Created new sheet: ${sheetName} (ID: ${newSheetId})`);

    return { success: true, sheetId: newSheetId, sheetName };
  } catch (error) {
    console.error("❌ Error creating new sheet:", error.message);
    return { success: false, error: error.message };
  }
}

// 🧪 Test connection
async function testConnection() {
  try {
    console.log("🧪 Testing connection to Google Sheets...");

    const sheets = await getSheetsClient();
    const sheetList = await getSheetList();

    console.log("✅ Connection successful!");
    console.log("📋 Sheets:", sheetList.map((s) => s.title));

    return { success: true, sheets: sheetList };
  } catch (error) {
    console.error("❌ Connection test failed:", error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  appendRows,
  getRows,
  updateRow,
  deleteRow,
  clearSheet,
  createNewSheet,
  getSheetList,
  testConnection,
};

// Run test if script is executed directly
if (require.main === module) {
  (async () => {
    const result = await testConnection();
    if (result.success) {
      console.log("🚀 Google Sheets API is ready to use!");
    } else {
      console.log("💥 Setup failed. Please check your credentials.");
    }
  })();
}

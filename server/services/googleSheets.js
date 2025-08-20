const { google } = require("googleapis");
const { JWT } = require('google-auth-library');

const creds = {
  type: "service_account",
  project_id: "bold-bond-469518-n4",
  private_key_id: "233f3bd094b9c0c58b9f6be20d6d017c1ae225f6",
  private_key: `-----BEGIN PRIVATE KEY-----
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
-----END PRIVATE KEY-----`,
  client_email: "sheet-service@bold-bond-469518-n4.iam.gserviceaccount.com",
  client_id: "116636218015051192562",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/sheet-service%40bold-bond-469518-n4.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

// ✅ Your Google Sheet ID
const SPREADSHEET_ID = "1BwRHdA3CpqUY02xExJaiEHCyEMPK8cSOBA-_M74BL-4";
const MAX_ROWS_PER_SHEET = 50000;

// Auth with JWT client for better error handling
async function getSheetsClient() {
  try {
    console.log("🔐 Attempting authentication...");
    
    // 1. Prioritize environment variables (for production)
    // If they don't exist, fall back to the hardcoded creds object (for local dev)
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL || creds.client_email;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY || creds.private_key;

    // 2. CRITICAL: If the key comes from an environment variable, 
    // it will have literal '\n' characters. We need to convert them into actual newlines.
    // If it's from the creds file, it already has actual newlines, so this does nothing.
    privateKey = privateKey.replace(/\\n/g, '\n');

    console.log("Using client email:", clientEmail);
    // Optional: Log the first few chars of the key to verify it looks right
    console.log("Private key starts with:", privateKey.substring(0, 50)); 

    const jwtClient = new JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    await jwtClient.authorize();
    console.log("✅ Authentication successful");
    
    return google.sheets({ version: "v4", auth: jwtClient });

  } catch (error) {
    console.error("❌ Authentication failed:", error.message);
    // Additional debug info
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }    
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

async function getSheetList() {
  try {
    const sheets = await getSheetsClient();
    const meta = await sheets.spreadsheets.get({ 
      spreadsheetId: SPREADSHEET_ID 
    });
    
    return meta.data.sheets.map((s) => ({
      title: s.properties.title,
      sheetId: s.properties.sheetId,
      rowCount: s.properties.gridProperties.rowCount,
    }));
  } catch (error) {
    console.error("❌ Error getting sheet list:", error.message);
    throw error;
  }
}

async function getCurrentRowCount(sheetTitle) {
  try {
    const sheets = await getSheetsClient();
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetTitle}!A:A`, // Only check column A for row count
    });
    
    return resp.data.values ? resp.data.values.length : 0;
  } catch (error) {
    // If sheet doesn't exist or is empty, return 0
    if (error.code === 400) {
      return 0;
    }
    throw error;
  }
}

async function appendRows(values) {
  try {
    console.log(`📝 Appending ${values.length} rows...`);
    
    const sheets = await getSheetsClient();
    let sheetList = await getSheetList();
    let targetSheet = sheetList[sheetList.length - 1];

    // Get current row count
    const currentRows = await getCurrentRowCount(targetSheet.title);
    console.log(`📊 Current rows in ${targetSheet.title}: ${currentRows}`);

    // Check if we need a new sheet
    if (currentRows + values.length > MAX_ROWS_PER_SHEET) {
      const newSheetTitle = `Sheet${sheetList.length + 1}`;
      console.log(`📄 Creating new sheet: ${newSheetTitle}`);
      
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: { 
          requests: [{ 
            addSheet: { 
              properties: { 
                title: newSheetTitle,
                gridProperties: { rowCount: 1000, columnCount: 10 }
              } 
            } 
          }] 
        },
      });
      
      targetSheet.title = newSheetTitle;
      console.log(`✅ Created new sheet: ${newSheetTitle}`);
    }

    // Append the rows
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${targetSheet.title}!A:E`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values },
    });

    console.log("✅ Data appended successfully:", response.data.updates.updatedRange);
    
    return {
      success: true,
      message: `Rows appended to ${targetSheet.title}`,
      sheetName: targetSheet.title,
      startRow: currentRows + 1,
      endRow: currentRows + values.length,
      updatedRange: response.data.updates.updatedRange
    };
    
  } catch (error) {
    console.error("❌ Error appending rows:", error.message);
    return {
      success: false,
      error: error.message,
      details: error.response?.data
    };
  }
}

async function getRows(sheetName = null) {
  try {
    const sheets = await getSheetsClient();
    let allRows = [];
    let sheetList = await getSheetList();

    // If specific sheet is requested, filter the list
    if (sheetName) {
      sheetList = sheetList.filter(sheet => sheet.title === sheetName);
    }

    for (let sheet of sheetList) {
      console.log(`📋 Reading data from sheet: ${sheet.title}`);
      
      const resp = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheet.title}!A:E`,
      });
      
      const rows = resp.data.values || [];
      console.log(`📊 Found ${rows.length} rows in ${sheet.title}`);
      
      // Skip header row if it exists
      const dataRows = rows.length > 1 ? rows.slice(1) : rows;
      
      dataRows.forEach((r, i) => {
        allRows.push({
          sheetName: sheet.title,
          rowId: i + 2, // +2 because we skip header and arrays are 0-indexed
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
    
    return { 
      success: true, 
      message: `Row ${rowNumber} updated in ${sheetName}`,
      updatedRange: response.data.updatedRange
    };
    
  } catch (error) {
    console.error("❌ Error updating row:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function deleteRow(sheetName, rowNumber) {
  try {
    const sheets = await getSheetsClient();
    
    // Get sheet ID
    const sheetList = await getSheetList();
    const sheet = sheetList.find(s => s.title === sheetName);
    
    if (!sheet) {
      throw new Error(`Sheet '${sheetName}' not found`);
    }

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
                startIndex: rowNumber - 1, // Convert to 0-indexed
                endIndex: rowNumber,
              },
            },
          },
        ],
      },
    });

    console.log(`✅ Row ${rowNumber} deleted from ${sheetName}`);
    
    return { 
      success: true, 
      message: `Row ${rowNumber} deleted from ${sheetName}` 
    };
    
  } catch (error) {
    console.error("❌ Error deleting row:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function clearSheet(sheetName) {
  try {
    const sheets = await getSheetsClient();
    
    console.log(`🧹 Clearing sheet: ${sheetName}`);
    
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:E`,
    });

    console.log(`✅ Sheet ${sheetName} cleared`);
    
    return { 
      success: true, 
      message: `Sheet ${sheetName} cleared` 
    };
    
  } catch (error) {
    console.error("❌ Error clearing sheet:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function createNewSheet(sheetName) {
  try {
    const sheets = await getSheetsClient();
    
    console.log(`📄 Creating new sheet: ${sheetName}`);
    
    const response = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{
          addSheet: {
            properties: {
              title: sheetName,
              gridProperties: {
                rowCount: 1000,
                columnCount: 10
              }
            }
          }
        }]
      }
    });

    const newSheetId = response.data.replies[0].addSheet.properties.sheetId;
    
    console.log(`✅ Created new sheet: ${sheetName} (ID: ${newSheetId})`);
    
    return {
      success: true,
      sheetId: newSheetId,
      sheetName: sheetName
    };
    
  } catch (error) {
    console.error("❌ Error creating new sheet:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test function to verify authentication
async function testConnection() {
  try {
    console.log("🧪 Testing connection to Google Sheets...");
    
    const sheets = await getSheetsClient();
    const sheetList = await getSheetList();
    
    console.log("✅ Connection successful!");
    console.log("📋 Available sheets:", sheetList.map(s => s.title));
    
    return {
      success: true,
      sheets: sheetList
    };
    
  } catch (error) {
    console.error("❌ Connection test failed:", error.message);
    return {
      success: false,
      error: error.message
    };
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
  testConnection 
};

// Fixed: Wrap the test call in an async IIFE (Immediately Invoked Function Expression)
// This ensures 'await' is used properly
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

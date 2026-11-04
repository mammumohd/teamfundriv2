import { DailyLedgerEntry, FundUsageRecord } from '../types';
import { formatTime12h, parseTo24hTime } from './calculator';

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * @OnlyCurrentDoc
 *
 * Google Apps Script Web App for Office Arrival & Team Fund Tracker
 * 
 * PRIVACY GUARANTEE:
 * The '@OnlyCurrentDoc' tag restricts access EXCLUSIVELY to this single spreadsheet.
 * It CANNOT read, edit, view, or access any other document or sheet in your Google Drive.
 *
 * 1. In your Google Sheet, click Extensions > Apps Script
 * 2. Replace everything in Code.gs with this code
 * 3. Click Save, then click Deploy > New deployment (or Manage deployments > Edit > New version)
 * 4. Select type: "Web app"
 * 5. Configuration:
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 6. Click Deploy, Authorize access (for this sheet only), and copy the Web App URL!
 */

function setupHeaders() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Recorded At",
      "Date",
      "Muhammed Arrival",
      "Midhun Arrival",
      "Total Fund (₹)",
      "Muhammed (₹)",
      "Antony (₹)",
      "Gulnaaz (₹)",
      "Midhun (₹)",
      "GG (₹)",
      "Nakul (₹)",
      "Remya (₹)",
      "Status / Purpose",
      "Notes"
    ]);
    sheet.getRange(1, 1, 1, 14).setFontWeight("bold").setBackground("#e2e8f0");
  }
}

function doPost(e) {
  try {
    setupHeaders();
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    var now = new Date().toLocaleString();

    if (data.action === "log_entry") {
      var entry = data.entry;
      var getAmt = function(name) {
        var match = entry.contributions.find(function(c) {
          return c.name.toLowerCase() === name.toLowerCase();
        });
        return match ? match.amount : 0;
      };

      var pendingCount = entry.contributions.filter(function(c) {
        return !c.paid && c.amount > 0;
      }).length;

      var statusText = pendingCount === 0 ? "All Settled" : pendingCount + " Pending";

      // If row for this date already exists, update it instead of creating duplicates
      var rows = sheet.getDataRange().getValues();
      var rowIndex = -1;
      for (var r = 1; r < rows.length; r++) {
        var rowDate = rows[r][1];
        var rowDateStr = rowDate instanceof Date
          ? rowDate.toISOString().slice(0, 10)
          : String(rowDate).trim();
        if (rowDateStr === entry.date && String(rows[r][12] || "").indexOf("FUND USED") === -1) {
          rowIndex = r + 1; // 1-indexed in sheet
          break;
        }
      }

      var rowValues = [
        now,
        entry.date,
        entry.muhammedTime,
        entry.midhunTime,
        entry.totalFund,
        getAmt("Muhammed"),
        getAmt("Antony"),
        getAmt("Gulnaaz"),
        getAmt("Midhun"),
        getAmt("GG"),
        getAmt("Nakul"),
        getAmt("Remya"),
        statusText,
        entry.notes || ""
      ];

      if (rowIndex > 0) {
        sheet.getRange(rowIndex, 1, 1, 14).setValues([rowValues]);
      } else {
        sheet.appendRow(rowValues);
      }

      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Entry logged" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (data.action === "log_expense") {
      var expense = data.expense;
      sheet.appendRow([
        now,
        expense.date,
        "--",
        "--",
        "-₹" + expense.amountSpent,
        "--", "--", "--", "--", "--", "--", "--",
        "FUND USED: " + expense.purpose,
        "Cleared ₹" + expense.clearedPendingDuesAmount + " pending dues"
      ]);

      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Expense logged" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (data.action === "ping") {
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Google Sheet connection active!" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "unknown_action" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    setupHeaders();
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
    var entries = [];

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row || !row[1]) continue;

      var rawDate = row[1];
      var dateStr = "";
      if (rawDate instanceof Date) {
        var y = rawDate.getFullYear();
        var m = (rawDate.getMonth() + 1).toString();
        var d = rawDate.getDate().toString();
        dateStr = y + "-" + (m.length === 1 ? "0" + m : m) + "-" + (d.length === 1 ? "0" + d : d);
      } else {
        dateStr = String(rawDate).trim();
      }

      var isExpense = String(row[12] || "").indexOf("FUND USED") !== -1;

      entries.push({
        recordedAt: String(row[0] || ""),
        date: dateStr,
        muhammedTime: String(row[2] || "").trim(),
        midhunTime: String(row[3] || "").trim(),
        totalFund: Number(row[4]) || 0,
        muhammedAmt: Number(row[5]) || 0,
        antonyAmt: Number(row[6]) || 0,
        gulnaazAmt: Number(row[7]) || 0,
        midhunAmt: Number(row[8]) || 0,
        ggAmt: Number(row[9]) || 0,
        nakulAmt: Number(row[10]) || 0,
        remyaAmt: Number(row[11]) || 0,
        status: String(row[12] || ""),
        notes: String(row[13] || ""),
        isExpense: isExpense
      });
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      entries: entries
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;

/**
 * Sends a daily ledger entry to the Google Sheet web app.
 */
export async function syncDailyEntryToSheets(
  webAppUrl: string,
  entry: DailyLedgerEntry
): Promise<boolean> {
  if (!webAppUrl || !webAppUrl.startsWith('http')) return false;

  try {
    const payload = {
      action: 'log_entry',
      entry: {
        date: entry.date,
        muhammedTime: formatTime12h(entry.muhammedTime),
        midhunTime: formatTime12h(entry.midhunTime),
        totalFund: entry.totalFund,
        notes: entry.notes || '',
        contributions: entry.contributions,
      },
    };

    await fetch(webAppUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    return true;
  } catch (err) {
    console.error('Error syncing entry to Google Sheets:', err);
    return false;
  }
}

/**
 * Sends an expense/cleared dues record to the Google Sheet web app
 */
export async function syncExpenseToSheets(
  webAppUrl: string,
  expense: FundUsageRecord
): Promise<boolean> {
  if (!webAppUrl || !webAppUrl.startsWith('http')) return false;

  try {
    const payload = {
      action: 'log_expense',
      expense: {
        date: expense.date,
        amountSpent: expense.amountSpent,
        purpose: expense.purpose,
        clearedPendingDuesAmount: expense.clearedPendingDuesAmount,
        scope: expense.scope,
      },
    };

    await fetch(webAppUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    return true;
  } catch (err) {
    console.error('Error syncing expense to Google Sheets:', err);
    return false;
  }
}

/**
 * Fetches all records from Google Sheet
 */
export async function fetchSheetEntries(webAppUrl: string): Promise<DailyLedgerEntry[]> {
  if (!webAppUrl || !webAppUrl.startsWith('http')) return [];

  try {
    const res = await fetch(webAppUrl, {
      method: 'GET',
    });
    if (!res.ok) return [];
    const json = await res.json();

    if (json.status === 'success' && Array.isArray(json.entries)) {
      return json.entries
        .filter((r: any) => !r.isExpense && r.date)
        .map((r: any, idx: number) => {
          const isAllSettled =
            String(r.status || '').toLowerCase().includes('settled') ||
            String(r.status || '').toLowerCase().includes('paid');

          const muhammedParsed = parseTo24hTime(r.muhammedTime, '09:50');
          const midhunParsed = parseTo24hTime(r.midhunTime, '10:00');

          return {
            id: `sheet-${r.date}-${idx}`,
            date: r.date,
            muhammedTime: muhammedParsed,
            midhunTime: midhunParsed,
            totalFund: Number(r.totalFund) || 0,
            roundingMode: 'ceil',
            notes: r.notes || '',
            contributions: [
              { memberId: 'muhammed', name: 'Muhammed', amount: Number(r.muhammedAmt) || 0, paid: isAllSettled, breakdown: '' },
              { memberId: 'antony', name: 'Antony', amount: Number(r.antonyAmt) || 0, paid: isAllSettled, breakdown: '' },
              { memberId: 'gulnaaz', name: 'Gulnaaz', amount: Number(r.gulnaazAmt) || 0, paid: isAllSettled, breakdown: '' },
              { memberId: 'midhun', name: 'Midhun', amount: Number(r.midhunAmt) || 0, paid: isAllSettled, breakdown: '' },
              { memberId: 'gg', name: 'GG', amount: Number(r.ggAmt) || 0, paid: isAllSettled, breakdown: '' },
              { memberId: 'nakul', name: 'Nakul', amount: Number(r.nakulAmt) || 0, paid: isAllSettled, breakdown: '' },
              { memberId: 'remya', name: 'Remya', amount: Number(r.remyaAmt) || 0, paid: isAllSettled, breakdown: '' },
            ],
            createdAt: Date.now(),
          } as DailyLedgerEntry;
        });
    }
  } catch (err) {
    console.error('Failed to fetch from Google Sheet:', err);
  }

  return [];
}

/**
 * Tests connection to Google Apps Script Web App
 */
export async function testGoogleSheetsConnection(webAppUrl: string): Promise<boolean> {
  if (!webAppUrl || !webAppUrl.startsWith('http')) return false;

  try {
    await fetch(webAppUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action: 'ping' }),
    });

    return true;
  } catch (err) {
    console.error('Error testing Google Sheets connection:', err);
    return false;
  }
}

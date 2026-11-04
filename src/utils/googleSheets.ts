import { DailyLedgerEntry, FundUsageRecord } from '../types';
import { formatTime12h } from './calculator';

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * Google Apps Script Web App for Office Arrival & Team Fund Tracker
 * 1. In your Google Sheet, click Extensions > Apps Script
 * 2. Replace everything in Code.gs with this code
 * 3. Click Save, then click Deploy > New deployment
 * 4. Select type: "Web app"
 * 5. Configuration:
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 6. Click Deploy, Authorize access, and copy the Web App URL!
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

      sheet.appendRow([
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
      ]);

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
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    message: "Office Team Fund Tracker Web App is online."
  })).setMimeType(ContentService.MimeType.JSON);
}
`;

/**
 * Sends a daily ledger entry to the Google Sheet web app.
 * Note: uses mode 'no-cors' as standard for Google Apps Script redirects.
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

    // Google Apps Script requires text/plain or no-cors redirect
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
 * Tests connection to Google Apps Script Web App
 */
export async function testGoogleSheetsConnection(webAppUrl: string): Promise<boolean> {
  if (!webAppUrl || !webAppUrl.startsWith('http')) return false;

  try {
    // Send a ping action
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

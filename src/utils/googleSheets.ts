import { DailyLedgerEntry, FundUsageRecord } from '../types';
import { formatTime12h, parseTo24hTime } from './calculator';
import { GOOGLE_APPS_SCRIPT_URL, GOOGLE_SHEET_CSV_URL } from '../config';

export const GOOGLE_APPS_SCRIPT_CODE = `/** @OnlyCurrentDoc */

/**
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

      // If row for this date already exists, update it in place
      var rows = sheet.getDataRange().getValues();
      var rowIndex = -1;
      for (var r = 1; r < rows.length; r++) {
        var rowDate = rows[r][1];
        var rowDateStr = rowDate instanceof Date
          ? Utilities.formatDate(rowDate, Session.getScriptTimeZone(), "yyyy-MM-dd")
          : String(rowDate).trim();
        if (rowDateStr === entry.date && String(rows[r][12] || "").indexOf("FUND USED") === -1) {
          rowIndex = r + 1; // 1-indexed
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

      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Entry saved" }))
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
        "Cleared ₹" + expense.clearedPendingDuesAmount + " dues (" + expense.scope + ")"
      ]);

      // If scope is all, mark all previous entries as All Settled
      if (expense.scope === "all") {
        var allRows = sheet.getDataRange().getValues();
        for (var i = 1; i < allRows.length; i++) {
          if (String(allRows[i][12] || "").indexOf("Pending") !== -1) {
            sheet.getRange(i + 1, 13).setValue("All Settled");
          }
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Expense logged" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (data.action === "ping") {
      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "unknown" }))
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
    var expenses = [];

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row || !row[1]) continue;

      var rawDate = row[1];
      var dateStr = "";
      if (rawDate instanceof Date) {
        dateStr = Utilities.formatDate(rawDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
      } else {
        dateStr = String(rawDate).trim();
      }

      var statusStr = String(row[12] || "").trim();
      var isExpense = statusStr.indexOf("FUND USED") !== -1;

      if (isExpense) {
        var cleanAmt = Number(String(row[4]).replace(/[^0-9.-]+/g, "")) || 0;
        expenses.push({
          id: "exp-" + i,
          date: dateStr,
          amountSpent: Math.abs(cleanAmt),
          purpose: statusStr.replace("FUND USED: ", "").trim(),
          clearedPendingDuesAmount: 0,
          scope: String(row[13] || "").indexOf("all") !== -1 ? "all" : "today",
          timestamp: Date.now() - (data.length - i) * 60000
        });
      } else {
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
          status: statusStr,
          notes: String(row[13] || "").trim()
        });
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      entries: entries,
      expenses: expenses
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
 * Checks if a real Web App URL has been configured
 */
export function isGoogleSheetsConfigured(): boolean {
  return (
    !!GOOGLE_APPS_SCRIPT_URL &&
    GOOGLE_APPS_SCRIPT_URL.startsWith('http') &&
    !GOOGLE_APPS_SCRIPT_URL.includes('YOUR_APPS_SCRIPT_URL_HERE')
  );
}

/**
 * Parses standard CSV text (handles quotes, commas inside quotes, multiline)
 */
function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        cell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(cell.trim());
      if (row.length > 0 && row.some((c) => c !== '')) {
        lines.push(row);
      }
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (cell || row.length > 0) {
    row.push(cell.trim());
    if (row.length > 0 && row.some((c) => c !== '')) {
      lines.push(row);
    }
  }

  return lines;
}

/**
 * Normalizes date into YYYY-MM-DD format
 */
function normalizeDateStr(rawDate: string): string {
  if (!rawDate) return '';
  const trimmed = rawDate.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const dmy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = (parsed.getMonth() + 1).toString().padStart(2, '0');
    const d = parsed.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return trimmed;
}

/**
 * Fetches all daily entries and expenses directly from Google Sheet.
 * Reads directly from the live Google Sheet CSV export (instant & zero CORS issue),
 * with fallback to the Google Apps Script Web App JSON endpoint.
 */
export async function fetchSheetData(): Promise<{
  entries: DailyLedgerEntry[];
  expenses: FundUsageRecord[];
}> {
  // Strategy 1: Fetch directly from Google Sheet CSV export
  if (GOOGLE_SHEET_CSV_URL && GOOGLE_SHEET_CSV_URL.startsWith('http')) {
    try {
      const csvUrl = `${GOOGLE_SHEET_CSV_URL}${GOOGLE_SHEET_CSV_URL.includes('?') ? '&' : '?'}t=${Date.now()}`;
      const res = await fetch(csvUrl);
      if (res.ok) {
        const csvText = await res.text();
        const rows = parseCSV(csvText);

        if (rows.length > 1) {
          const entries: DailyLedgerEntry[] = [];
          const expenses: FundUsageRecord[] = [];

          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || !row[1]) continue;

            const dateStr = normalizeDateStr(row[1]);
            if (!dateStr) continue;

            const statusStr = String(row[12] || '').trim();
            const isExpense = statusStr.includes('FUND USED');

            if (isExpense) {
              const cleanAmt = Number(String(row[4]).replace(/[^0-9.-]+/g, '')) || 0;
              expenses.push({
                id: `exp-${i}-${dateStr}`,
                date: dateStr,
                amountSpent: Math.abs(cleanAmt),
                purpose: statusStr.replace('FUND USED:', '').trim(),
                clearedPendingDuesAmount: 0,
                scope: String(row[13] || '').includes('all') ? 'all' : 'today',
                timestamp: Date.now() - (rows.length - i) * 60000,
              });
            } else {
              const isAllSettled =
                statusStr.toLowerCase().includes('settled') ||
                statusStr.toLowerCase().includes('paid');

              const muhammedAmt = Number(row[5]) || 0;
              const antonyAmt = Number(row[6]) || 0;
              const gulnaazAmt = Number(row[7]) || 0;
              const midhunAmt = Number(row[8]) || 0;
              const ggAmt = Number(row[9]) || 0;
              const nakulAmt = Number(row[10]) || 0;
              const remyaAmt = Number(row[11]) || 0;

              entries.push({
                id: `sheet-${dateStr}-${i}`,
                date: dateStr,
                muhammedTime: parseTo24hTime(row[2], '09:50'),
                midhunTime: parseTo24hTime(row[3], '10:00'),
                totalFund: Number(row[4]) || 0,
                roundingMode: 'ceil',
                notes: row[13] || '',
                contributions: [
                  { memberId: 'muhammed', name: 'Muhammed', amount: muhammedAmt, paid: isAllSettled || muhammedAmt === 0, breakdown: '' },
                  { memberId: 'antony', name: 'Antony', amount: antonyAmt, paid: isAllSettled || antonyAmt === 0, breakdown: '' },
                  { memberId: 'gulnaaz', name: 'Gulnaaz', amount: gulnaazAmt, paid: isAllSettled || gulnaazAmt === 0, breakdown: '' },
                  { memberId: 'midhun', name: 'Midhun', amount: midhunAmt, paid: isAllSettled || midhunAmt === 0, breakdown: '' },
                  { memberId: 'gg', name: 'GG', amount: ggAmt, paid: isAllSettled || ggAmt === 0, breakdown: '' },
                  { memberId: 'nakul', name: 'Nakul', amount: nakulAmt, paid: isAllSettled || nakulAmt === 0, breakdown: '' },
                  { memberId: 'remya', name: 'Remya', amount: remyaAmt, paid: isAllSettled || remyaAmt === 0, breakdown: '' },
                ],
                createdAt: Date.now(),
              });
            }
          }

          if (entries.length > 0 || expenses.length > 0) {
            return {
              entries: entries.sort((a, b) => b.date.localeCompare(a.date)),
              expenses: expenses.sort((a, b) => b.date.localeCompare(a.date)),
            };
          }
        }
      }
    } catch (err) {
      console.warn('Direct CSV fetch had an issue, trying Apps Script Web App:', err);
    }
  }

  // Strategy 2: Fallback to Google Apps Script Web App JSON doGet
  if (!isGoogleSheetsConfigured()) {
    return { entries: [], expenses: [] };
  }

  try {
    const res = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'GET',
    });
    if (!res.ok) return { entries: [], expenses: [] };
    const json = await res.json();

    const entries: DailyLedgerEntry[] = [];
    const expenses: FundUsageRecord[] = Array.isArray(json.expenses) ? json.expenses : [];

    if (json.status === 'success' && Array.isArray(json.entries)) {
      json.entries.forEach((r: any, idx: number) => {
        if (!r.date) return;
        const dateStr = normalizeDateStr(r.date);
        const isAllSettled =
          String(r.status || '').toLowerCase().includes('settled') ||
          String(r.status || '').toLowerCase().includes('paid');

        entries.push({
          id: `sheet-${dateStr}-${idx}`,
          date: dateStr,
          muhammedTime: parseTo24hTime(r.muhammedTime, '09:50'),
          midhunTime: parseTo24hTime(r.midhunTime, '10:00'),
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
        });
      });
    }

    return {
      entries: entries.sort((a, b) => b.date.localeCompare(a.date)),
      expenses: expenses.sort((a, b) => b.date.localeCompare(a.date)),
    };
  } catch (err) {
    console.error('Failed to fetch from Google Sheet:', err);
    return { entries: [], expenses: [] };
  }
}

/**
 * Sends a daily ledger entry to the Google Sheet web app.
 */
export async function syncDailyEntryToSheets(entry: DailyLedgerEntry): Promise<boolean> {
  if (!isGoogleSheetsConfigured()) return false;

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

    await fetch(GOOGLE_APPS_SCRIPT_URL, {
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
export async function syncExpenseToSheets(expense: FundUsageRecord): Promise<boolean> {
  if (!isGoogleSheetsConfigured()) return false;

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

    await fetch(GOOGLE_APPS_SCRIPT_URL, {
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

import React, { useState } from 'react';
import { GoogleSheetsConfig, DailyLedgerEntry, FundUsageRecord } from '../types';
import { GOOGLE_APPS_SCRIPT_CODE, testGoogleSheetsConnection, syncDailyEntryToSheets, syncExpenseToSheets } from '../utils/googleSheets';
import { X, Check, Copy, ExternalLink, RefreshCw, Table, ShieldCheck, FileSpreadsheet, Sparkles, AlertCircle } from 'lucide-react';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleSheetsConfig;
  onSaveConfig: (config: GoogleSheetsConfig) => void;
  historyEntries: DailyLedgerEntry[];
  fundUsageRecords: FundUsageRecord[];
  onShowToast: (msg: string) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  historyEntries,
  fundUsageRecords,
  onShowToast,
}) => {
  const [webAppUrl, setWebAppUrl] = useState(config.webAppUrl || '');
  const [sheetUrl, setSheetUrl] = useState(config.sheetUrl || '');
  const [autoSync, setAutoSync] = useState(config.autoSync ?? true);
  const [copiedScript, setCopiedScript] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  if (!isOpen) return null;

  const isConnected = !!config.webAppUrl;

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2500);
    } catch {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2500);
    }
  };

  const handleTestConnection = async () => {
    if (!webAppUrl.trim()) {
      setTestResult('error');
      return;
    }
    setIsTesting(true);
    setTestResult(null);

    const success = await testGoogleSheetsConnection(webAppUrl.trim());
    setIsTesting(false);
    if (success) {
      setTestResult('success');
      onShowToast('Connected successfully to Google Sheet!');
    } else {
      setTestResult('error');
      onShowToast('Could not reach Google Sheet Web App. Check the URL and deployment settings.');
    }
  };

  const handleSave = () => {
    onSaveConfig({
      webAppUrl: webAppUrl.trim(),
      sheetUrl: sheetUrl.trim(),
      autoSync,
      lastSyncedTimestamp: Date.now(),
    });
    onShowToast('Google Sheets settings saved!');
    onClose();
  };

  const handleDisconnect = () => {
    onSaveConfig({
      webAppUrl: '',
      sheetUrl: '',
      autoSync: false,
    });
    setWebAppUrl('');
    setSheetUrl('');
    setTestResult(null);
    onShowToast('Disconnected Google Sheets');
  };

  const handleBulkSyncAll = async () => {
    if (!webAppUrl.trim()) return;
    setIsBulkSyncing(true);

    let syncedCount = 0;
    for (const entry of historyEntries) {
      await syncDailyEntryToSheets(webAppUrl.trim(), entry);
      syncedCount++;
    }

    for (const expense of fundUsageRecords) {
      await syncExpenseToSheets(webAppUrl.trim(), expense);
      syncedCount++;
    }

    setIsBulkSyncing(false);
    onShowToast(`Uploaded ${syncedCount} record(s) to Google Sheets!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Table className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Google Sheets Cloud Storage
                </h3>
                {isConnected ? (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Connected
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    100% Free Forever
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Sync team attendance &amp; fund dues to a Google Sheet in your personal Google Drive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 text-xs text-slate-700">
          {/* Why Google Sheets is best */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Why Google Sheets is the Best Free Alternative:</span>
            </div>
            <p className="text-emerald-800 leading-relaxed text-[11px]">
              • <strong>100% Free &amp; Unlimited:</strong> No credit card, no monthly subscription, no server maintenance.<br />
              • <strong>Full Team Transparency:</strong> Muhammed, Midhun, and all members can view the spreadsheet on their phones in Google Sheets.<br />
              • <strong>Permanent Backup:</strong> Stored securely in your personal Google Drive account.
            </p>
          </div>

          {/* Quick 3-Step Setup */}
          <div className="space-y-3">
            <span className="font-bold text-slate-900 text-xs uppercase tracking-wider block">
              Quick 3-Step Setup (Takes 2 minutes)
            </span>

            {/* Step 1 */}
            <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                1
              </span>
              <div className="space-y-1 flex-1">
                <span className="font-semibold text-slate-900 block">
                  Create a new Google Sheet
                </span>
                <p className="text-slate-500 text-[11px]">
                  Open a new blank spreadsheet in Google Drive. You can name it "Office Arrival &amp; Team Fund".
                </p>
                <a
                  href="https://sheets.new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 pt-0.5"
                >
                  <span>Click here to open a new Google Sheet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                2
              </span>
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 block">
                    Paste the Apps Script Webhook
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-medium px-1.5 py-0.5 rounded">
                    Single Sheet Only
                  </span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  In your Google Sheet, click <strong>Extensions &gt; Apps Script</strong>, delete whatever is in the editor, and paste this script. <em>It includes <code className="text-slate-800 font-mono">@OnlyCurrentDoc</code> to restrict permissions strictly to this single sheet only (never your other files).</em>
                </p>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                    copiedScript
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {copiedScript ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Script Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Google Apps Script Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                3
              </span>
              <div className="space-y-1 flex-1">
                <span className="font-semibold text-slate-900 block">
                  Deploy as Web App
                </span>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  In Apps Script, click <strong>Deploy &gt; New deployment</strong> &gt; Select type: <strong>Web app</strong>.<br />
                  • Execute as: <strong>Me</strong><br />
                  • Who has access: <strong>Anyone</strong><br />
                  Click <strong>Deploy</strong>, authorize permissions, and copy the <strong>Web app URL</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Connection URL Form */}
          <div className="space-y-3 pt-2">
            <span className="font-bold text-slate-900 text-xs uppercase tracking-wider block">
              Google Sheet Connection Details
            </span>

            <div className="space-y-1">
              <label className="font-semibold text-slate-900 block">
                Web App URL <span className="text-rose-600">*</span>
              </label>
              <input
                type="url"
                value={webAppUrl}
                onChange={(e) => setWebAppUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400">
                The URL provided when deploying the Web app in Google Apps Script.
              </p>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-900 block">
                Google Sheet Link (Optional)
              </label>
              <input
                type="url"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400">
                Adding your sheet URL enables a 1-click shortcut to view your spreadsheet anytime.
              </p>
            </div>

            {/* Auto sync toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <span className="font-semibold text-slate-900 block">
                  Automatic Cloud Sync
                </span>
                <span className="text-[11px] text-slate-500">
                  Automatically sync to Google Sheet when saving daily dues or clearing spent fund.
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            {/* Test Connection & Bulk Upload Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={!webAppUrl.trim() || isTesting}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
              </button>

              {webAppUrl && (
                <button
                  type="button"
                  onClick={handleBulkSyncAll}
                  disabled={isBulkSyncing}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{isBulkSyncing ? 'Syncing...' : 'Upload All Ledger Records Now'}</span>
                </button>
              )}

              {sheetUrl && (
                <a
                  href={sheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Sheet in Google Drive</span>
                </a>
              )}
            </div>

            {testResult === 'success' && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Connection test passed! Your Google Sheet is ready to receive entries.</span>
              </div>
            )}

            {testResult === 'error' && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Could not reach Google Sheet. Ensure your Web app deployment is set to "Who has access: Anyone".</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            {isConnected && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
              >
                Disconnect Sheet
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              Save Google Sheet Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

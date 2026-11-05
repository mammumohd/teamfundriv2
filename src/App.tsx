import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { ArrivalInputs } from './components/ArrivalInputs';
import { TeamFundTable } from './components/TeamFundTable';
import { HistoryLedger } from './components/HistoryLedger';
import { RulebookModal } from './components/RulebookModal';
import { ShareModal } from './components/ShareModal';
import { ClearDuesModal } from './components/ClearDuesModal';
import { calculateTeamFund } from './utils/calculator';
import {
  fetchSheetData,
  syncDailyEntryToSheets,
  syncExpenseToSheets,
  isGoogleSheetsConfigured,
} from './utils/googleSheets';
import { GOOGLE_SHEET_VIEW_URL } from './config';
import { DailyLedgerEntry, FundUsageRecord, RoundingMode } from './types';
import { Check, AlertCircle } from 'lucide-react';

export default function App() {
  const getTodayString = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = (today.getMonth() + 1).toString().padStart(2, '0');
    const d = today.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayDateStr = getTodayString();
  const [selectedDate, setSelectedDate] = useState<string>(todayDateStr);

  // In-memory state directly from Google Sheet (No localStorage)
  const [historyEntries, setHistoryEntries] = useState<DailyLedgerEntry[]>([]);
  const [fundUsageRecords, setFundUsageRecords] = useState<FundUsageRecord[]>([]);
  const [isFetchingSheet, setIsFetchingSheet] = useState<boolean>(false);

  // Today's arrival times and status
  const [muhammedTime, setMuhammedTime] = useState<string>('09:50');
  const [midhunTime, setMidhunTime] = useState<string>('10:00');
  const [roundingMode, setRoundingMode] = useState<RoundingMode>('ceil');
  const [paidStatusMap, setPaidStatusMap] = useState<Record<string, boolean>>({});

  // View & Modal states
  const [activeTab, setActiveTab] = useState<'calculator' | 'history'>('calculator');
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isClearDuesOpen, setIsClearDuesOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // FETCH ALL DATA FROM GOOGLE SHEET
  const loadDataFromSheet = useCallback(async (isInitial = false) => {
    if (!isGoogleSheetsConfigured()) {
      if (!isInitial) {
        showToast('Please set your Apps Script URL in src/config.ts');
      }
      return;
    }

    setIsFetchingSheet(true);
    try {
      const { entries, expenses } = await fetchSheetData();
      
      setHistoryEntries(entries);
      setFundUsageRecords(expenses);

      // Check if there is data for today's date in Google Sheet
      const todayEntry = entries.find((e) => e.date === todayDateStr);

      if (todayEntry) {
        // If data exists in sheet for today, populate it
        setMuhammedTime(todayEntry.muhammedTime || '09:50');
        setMidhunTime(todayEntry.midhunTime || '10:00');
        setRoundingMode(todayEntry.roundingMode || 'ceil');

        const paidMap: Record<string, boolean> = {};
        todayEntry.contributions.forEach((c) => {
          paidMap[c.memberId] = c.paid;
        });
        setPaidStatusMap(paidMap);

        showToast(`Loaded today (${todayDateStr}) from Google Sheet`);
      } else {
        // If no data in sheet for today, show default times
        if (selectedDate === todayDateStr) {
          setMuhammedTime('09:50');
          setMidhunTime('10:00');
          setRoundingMode('ceil');
          setPaidStatusMap({});
        }
        if (!isInitial) {
          showToast(`Synced ${entries.length} entries from Google Sheet`);
        }
      }
    } catch (err) {
      console.error('Failed to sync from Google Sheet:', err);
      showToast('Could not fetch data from Google Sheet');
    } finally {
      setIsFetchingSheet(false);
    }
  }, [todayDateStr, selectedDate]);

  // Initial load from Google Sheet on mount
  useEffect(() => {
    loadDataFromSheet(true);
  }, []);

  // Calculate live team fund and individual dues
  const calculation = useMemo(() => {
    return calculateTeamFund(muhammedTime, midhunTime, paidStatusMap, roundingMode);
  }, [muhammedTime, midhunTime, paidStatusMap, roundingMode]);

  const isSavedToday = useMemo(() => {
    return historyEntries.some((e) => e.date === selectedDate);
  }, [historyEntries, selectedDate]);

  const pendingTodayAmount = useMemo(() => {
    return calculation.contributions
      .filter((c) => !c.paid)
      .reduce((sum, c) => sum + c.totalAmount, 0);
  }, [calculation]);

  const pendingTodayMembersCount = useMemo(() => {
    return calculation.contributions.filter((c) => !c.paid && c.totalAmount > 0).length;
  }, [calculation]);

  const pendingAllHistoryAmount = useMemo(() => {
    const fromHistory = historyEntries.reduce((sum, entry) => {
      if (entry.date === selectedDate) return sum;
      return (
        sum +
        entry.contributions
          .filter((c) => !c.paid)
          .reduce((s, c) => s + c.amount, 0)
      );
    }, 0);
    return fromHistory + pendingTodayAmount;
  }, [historyEntries, selectedDate, pendingTodayAmount]);

  // Date switching
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);

    // If selected date has saved entry in sheet/history
    const existing = historyEntries.find((e) => e.date === newDate);
    if (existing) {
      setMuhammedTime(existing.muhammedTime);
      setMidhunTime(existing.midhunTime);
      setRoundingMode(existing.roundingMode || 'ceil');
      const paidMap: Record<string, boolean> = {};
      existing.contributions.forEach((c) => {
        paidMap[c.memberId] = c.paid;
      });
      setPaidStatusMap(paidMap);
      showToast(`Loaded records for ${newDate}`);
    } else {
      // Default data
      setMuhammedTime('09:50');
      setMidhunTime('10:00');
      setRoundingMode('ceil');
      setPaidStatusMap({});
    }
  };

  const handleTogglePaid = (memberId: string) => {
    setPaidStatusMap((prev) => ({
      ...prev,
      [memberId]: !prev[memberId],
    }));
  };

  const handleMarkAllPaid = (paid: boolean) => {
    const updated: Record<string, boolean> = {};
    calculation.contributions.forEach((c) => {
      updated[c.memberId] = paid;
    });
    setPaidStatusMap(updated);
    showToast(paid ? 'All marked Paid' : 'Reset to Pending');
  };

  const handleResetToDefaults = () => {
    setMuhammedTime('09:50');
    setMidhunTime('10:00');
    setRoundingMode('ceil');
    setPaidStatusMap({});
    setSelectedDate(todayDateStr);
    showToast('Reset to defaults');
  };

  const handleSaveEntry = async () => {
    const newEntry: DailyLedgerEntry = {
      id: `entry-${Date.now()}`,
      date: selectedDate,
      muhammedTime,
      midhunTime,
      totalFund: calculation.totalFund,
      roundingMode,
      contributions: calculation.contributions.map((c) => ({
        memberId: c.memberId,
        name: c.name,
        amount: c.totalAmount,
        paid: c.paid,
        breakdown: '',
      })),
      createdAt: Date.now(),
    };

    // Update in-memory state
    setHistoryEntries((prev) => {
      const filtered = prev.filter((e) => e.date !== selectedDate);
      return [newEntry, ...filtered];
    });

    if (isGoogleSheetsConfigured()) {
      showToast(`Saving to Google Sheet...`);
      const success = await syncDailyEntryToSheets(newEntry);
      if (success) {
        showToast(`Saved & synced ${selectedDate} to Google Sheet`);
      } else {
        showToast(`Saved locally. Check Google Apps Script URL.`);
      }
    } else {
      showToast(`Saved for ${selectedDate} (₹${calculation.totalFund})`);
    }
  };

  const handleLoadEntry = (entry: DailyLedgerEntry) => {
    setSelectedDate(entry.date);
    setMuhammedTime(entry.muhammedTime);
    setMidhunTime(entry.midhunTime);
    setRoundingMode(entry.roundingMode || 'ceil');
    const newPaidMap: Record<string, boolean> = {};
    entry.contributions.forEach((c) => {
      newPaidMap[c.memberId] = c.paid;
    });
    setPaidStatusMap(newPaidMap);
    setActiveTab('calculator');
    showToast(`Loaded ${entry.date}`);
  };

  const handleDeleteEntry = (id: string) => {
    setHistoryEntries((prev) => prev.filter((e) => e.id !== id));
    showToast('Removed from view');
  };

  const handleClearAllHistory = () => {
    setHistoryEntries([]);
    showToast('History cleared');
  };

  const handleConfirmClearDues = async ({
    scope,
    purpose,
    amountSpent,
  }: {
    scope: 'today' | 'all';
    purpose: string;
    amountSpent: number;
  }) => {
    const clearedAmount = scope === 'today' ? pendingTodayAmount : pendingAllHistoryAmount;

    // Mark current inputs as paid
    const updatedTodayPaid: Record<string, boolean> = {};
    calculation.contributions.forEach((c) => {
      updatedTodayPaid[c.memberId] = true;
    });
    setPaidStatusMap(updatedTodayPaid);

    // Update history entries in memory
    if (scope === 'all') {
      setHistoryEntries((prev) =>
        prev.map((entry) => ({
          ...entry,
          contributions: entry.contributions.map((c) => ({
            ...c,
            paid: true,
          })),
        }))
      );
    } else {
      setHistoryEntries((prev) =>
        prev.map((entry) => {
          if (entry.date === selectedDate) {
            return {
              ...entry,
              contributions: entry.contributions.map((c) => ({
                ...c,
                paid: true,
              })),
            };
          }
          return entry;
        })
      );
    }

    const newUsageRecord: FundUsageRecord = {
      id: `usage-${Date.now()}`,
      date: selectedDate,
      amountSpent,
      purpose,
      clearedPendingDuesAmount: clearedAmount,
      scope,
      timestamp: Date.now(),
    };

    setFundUsageRecords((prev) => [newUsageRecord, ...prev]);

    if (isGoogleSheetsConfigured()) {
      showToast('Logging expenditure to Google Sheet...');
      await syncExpenseToSheets(newUsageRecord);
      showToast(`Cleared ₹${clearedAmount} & synced to Sheet`);
    } else {
      showToast(`Cleared ₹${clearedAmount} in dues`);
    }
  };

  const handleDeleteFundUsageRecord = (id: string) => {
    setFundUsageRecords((prev) => prev.filter((r) => r.id !== id));
    showToast('Record removed');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* Top Bar */}
      <Header
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        onResetToDefaults={handleResetToDefaults}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onRefreshFromSheet={() => loadDataFromSheet(false)}
        isRefreshing={isFetchingSheet}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        historyCount={historyEntries.length}
      />

      {/* Main Viewport */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-5 space-y-4">
        {/* If Google Sheets is not yet configured, show a discreet reminder banner */}
        {!isGoogleSheetsConfigured() && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Google Sheet Web App URL is currently using placeholder. Paste your deployed Web App URL in <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-900">src/config.ts</code> for live sheet sync.
              </span>
            </div>
            <button
              onClick={() => setIsRulesOpen(true)}
              className="text-amber-900 underline font-medium hover:text-amber-950 shrink-0 cursor-pointer"
            >
              Setup Guide
            </button>
          </div>
        )}

        {activeTab === 'calculator' ? (
          <>
            {/* Arrival Inputs */}
            <ArrivalInputs
              muhammedTime={muhammedTime}
              midhunTime={midhunTime}
              onMuhammedTimeChange={setMuhammedTime}
              onMidhunTimeChange={setMidhunTime}
              isMuhammedOnTime={calculation.isMuhammedOnTime}
              muhammedDelayMinutes={calculation.muhammedDelayMinutes}
              isMidhunOnTime={calculation.isMidhunOnTime}
              midhunDelayMinutes={calculation.midhunDelayMinutes}
              midhunChargedHours={calculation.midhunChargedHours}
              roundingMode={roundingMode}
              onRoundingModeChange={setRoundingMode}
            />

            {/* Dues Table */}
            <TeamFundTable
              calculation={calculation}
              onTogglePaid={handleTogglePaid}
              onMarkAllPaid={handleMarkAllPaid}
              onSaveEntry={handleSaveEntry}
              isSavedToday={isSavedToday}
              onOpenClearDues={() => setIsClearDuesOpen(true)}
            />
          </>
        ) : (
          /* History Ledger View */
          <HistoryLedger
            entries={historyEntries}
            fundUsageRecords={fundUsageRecords}
            onDeleteEntry={handleDeleteEntry}
            onLoadEntry={handleLoadEntry}
            onClearAll={handleClearAllHistory}
            onOpenClearDues={() => setIsClearDuesOpen(true)}
            onDeleteFundUsageRecord={handleDeleteFundUsageRecord}
          />
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-slate-200 bg-white py-3 mt-auto">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium">Office Arrival & Team Fund Tracker</span>
          <div className="flex items-center gap-3">
            {GOOGLE_SHEET_VIEW_URL && (
              <>
                <a
                  href={GOOGLE_SHEET_VIEW_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-slate-700 transition-colors"
                >
                  View Google Sheet
                </a>
                <span>·</span>
              </>
            )}
            <button
              onClick={() => setIsRulesOpen(true)}
              className="hover:text-slate-700 transition-colors cursor-pointer"
            >
              Rules & Apps Script Code
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ClearDuesModal
        isOpen={isClearDuesOpen}
        onClose={() => setIsClearDuesOpen(false)}
        pendingTodayAmount={pendingTodayAmount}
        pendingTodayMembersCount={pendingTodayMembersCount}
        pendingAllHistoryAmount={pendingAllHistoryAmount}
        totalCollectedFund={calculation.totalFund}
        onConfirmClearDues={handleConfirmClearDues}
      />

      <RulebookModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
        onSelectScenario={(mTime, miTime) => {
          setMuhammedTime(mTime);
          setMidhunTime(miTime);
          setActiveTab('calculator');
          showToast('Scenario applied');
        }}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        calculation={calculation}
        selectedDate={selectedDate}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white text-xs font-medium px-3.5 py-2 rounded-lg shadow-lg flex items-center gap-2 border border-slate-800 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

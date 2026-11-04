import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { ArrivalInputs } from './components/ArrivalInputs';
import { TeamFundTable } from './components/TeamFundTable';
import { HistoryLedger } from './components/HistoryLedger';
import { RulebookModal } from './components/RulebookModal';
import { ShareModal } from './components/ShareModal';
import { ClearDuesModal } from './components/ClearDuesModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { calculateTeamFund } from './utils/calculator';
import { syncDailyEntryToSheets, syncExpenseToSheets } from './utils/googleSheets';
import { DailyLedgerEntry, FundUsageRecord, GoogleSheetsConfig, RoundingMode } from './types';
import { Check } from 'lucide-react';

const STORAGE_KEY = 'office_fund_history_v1';
const USAGE_STORAGE_KEY = 'office_fund_usage_v1';
const SHEETS_STORAGE_KEY = 'office_fund_sheets_config_v1';

export default function App() {
  const getTodayString = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = (today.getMonth() + 1).toString().padStart(2, '0');
    const d = today.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString);
  const [muhammedTime, setMuhammedTime] = useState<string>('09:50');
  const [midhunTime, setMidhunTime] = useState<string>('10:00');
  const [roundingMode, setRoundingMode] = useState<RoundingMode>('ceil');
  const [paidStatusMap, setPaidStatusMap] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'calculator' | 'history'>('calculator');
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isClearDuesOpen, setIsClearDuesOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Google Sheets configuration
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(() => {
    try {
      const stored = localStorage.getItem(SHEETS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load sheets config', e);
    }
    return {
      webAppUrl: '',
      sheetUrl: '',
      autoSync: true,
    };
  });

  // History entries from localStorage
  const [historyEntries, setHistoryEntries] = useState<DailyLedgerEntry[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load history from localStorage', e);
    }
    return [
      {
        id: 'seed-1',
        date: '2026-11-02',
        muhammedTime: '09:45',
        midhunTime: '11:15',
        totalFund: 160,
        roundingMode: 'ceil',
        notes: 'Muhammed on time. Midhun late.',
        contributions: [
          { memberId: 'muhammed', name: 'Muhammed', amount: 0, paid: true, breakdown: 'On time' },
          { memberId: 'antony', name: 'Antony', amount: 20, paid: true, breakdown: 'Team share' },
          { memberId: 'gulnaaz', name: 'Gulnaaz', amount: 20, paid: true, breakdown: 'Team share' },
          { memberId: 'midhun', name: 'Midhun', amount: 60, paid: false, breakdown: 'Share + late fee' },
          { memberId: 'gg', name: 'GG', amount: 20, paid: true, breakdown: 'Team share' },
          { memberId: 'nakul', name: 'Nakul', amount: 20, paid: true, breakdown: 'Team share' },
          { memberId: 'remya', name: 'Remya', amount: 20, paid: true, breakdown: 'Team share' },
        ],
        createdAt: Date.now() - 86400000,
      },
    ];
  });

  // Fund usage / expenditure records
  const [fundUsageRecords, setFundUsageRecords] = useState<FundUsageRecord[]>(() => {
    try {
      const stored = localStorage.getItem(USAGE_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load fund usage records', e);
    }
    return [];
  });

  // Save history entries to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(historyEntries));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  }, [historyEntries]);

  // Save fund usage records to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(fundUsageRecords));
    } catch (e) {
      console.error('Failed to save usage records', e);
    }
  }, [fundUsageRecords]);

  // Save sheets config to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SHEETS_STORAGE_KEY, JSON.stringify(sheetsConfig));
    } catch (e) {
      console.error('Failed to save sheets config', e);
    }
  }, [sheetsConfig]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

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
    setSelectedDate(getTodayString());
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

    setHistoryEntries((prev) => {
      const filtered = prev.filter((e) => e.date !== selectedDate);
      return [newEntry, ...filtered];
    });

    if (sheetsConfig.autoSync && sheetsConfig.webAppUrl) {
      syncDailyEntryToSheets(sheetsConfig.webAppUrl, newEntry);
      showToast(`Saved for ${selectedDate} & synced to Google Sheet`);
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
    showToast('Deleted');
  };

  const handleClearAllHistory = () => {
    setHistoryEntries([]);
    showToast('History cleared');
  };

  const handleConfirmClearDues = ({
    scope,
    purpose,
    amountSpent,
  }: {
    scope: 'today' | 'all';
    purpose: string;
    amountSpent: number;
  }) => {
    const clearedAmount = scope === 'today' ? pendingTodayAmount : pendingAllHistoryAmount;

    const updatedTodayPaid: Record<string, boolean> = {};
    calculation.contributions.forEach((c) => {
      updatedTodayPaid[c.memberId] = true;
    });
    setPaidStatusMap(updatedTodayPaid);

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

    if (sheetsConfig.autoSync && sheetsConfig.webAppUrl) {
      syncExpenseToSheets(sheetsConfig.webAppUrl, newUsageRecord);
      showToast(`Fund cleared: ₹${clearedAmount} & synced to Sheet`);
    } else {
      showToast(`Cleared ₹${clearedAmount} in dues`);
    }
  };

  const handleDeleteFundUsageRecord = (id: string) => {
    setFundUsageRecords((prev) => prev.filter((r) => r.id !== id));
    showToast('Removed');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* Top Bar */}
      <Header
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onResetToDefaults={handleResetToDefaults}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenGoogleSheets={() => setIsSheetsModalOpen(true)}
        isSheetsConnected={!!sheetsConfig.webAppUrl}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        historyCount={historyEntries.length}
      />

      {/* Main Viewport */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-5 space-y-4">
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
          <span>Office Fund Tracker</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSheetsModalOpen(true)}
              className="hover:text-slate-700 transition-colors cursor-pointer"
            >
              Google Sheet
            </button>
            <span>·</span>
            <button
              onClick={() => setIsRulesOpen(true)}
              className="hover:text-slate-700 transition-colors cursor-pointer"
            >
              Rules
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        config={sheetsConfig}
        onSaveConfig={setSheetsConfig}
        historyEntries={historyEntries}
        fundUsageRecords={fundUsageRecords}
        onShowToast={showToast}
      />

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
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white text-xs font-medium px-3.5 py-2 rounded-lg shadow-lg flex items-center gap-2 border border-slate-800">
          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

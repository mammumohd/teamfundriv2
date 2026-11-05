import React, { useState, useMemo } from 'react';
import { DailyLedgerEntry, FundUsageRecord } from '../types';
import { TEAM_MEMBERS, formatTime12h, exportLedgerToCSV } from '../utils/calculator';
import { Download, Trash2, Check, Sparkles, Eye, Receipt, Users } from 'lucide-react';

interface HistoryLedgerProps {
  entries: DailyLedgerEntry[];
  fundUsageRecords: FundUsageRecord[];
  onDeleteEntry: (id: string) => void;
  onLoadEntry: (entry: DailyLedgerEntry) => void;
  onClearAll: () => void;
  onOpenClearDues: () => void;
  onDeleteFundUsageRecord: (id: string) => void;
}

export const HistoryLedger: React.FC<HistoryLedgerProps> = ({
  entries,
  fundUsageRecords,
  onDeleteEntry,
  onLoadEntry,
  onClearAll,
  onOpenClearDues,
  onDeleteFundUsageRecord,
}) => {
  const [selectedEntry, setSelectedEntry] = useState<DailyLedgerEntry | null>(
    entries.length > 0 ? entries[0] : null
  );
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);

  const totalAllTimeFund = entries.reduce((sum, e) => sum + e.totalFund, 0);
  const totalSpent = fundUsageRecords.reduce((sum, r) => sum + r.amountSpent, 0);
  const availableBalance = Math.max(0, totalAllTimeFund - totalSpent);

  const totalAllPendingDues = entries.reduce((sum, entry) => {
    return (
      sum +
      entry.contributions
        .filter((c) => !c.paid)
        .reduce((s, c) => s + c.amount, 0)
    );
  }, 0);

  // Calculate outstanding dues and paid breakdown for each individual person
  const memberDuesSummaries = useMemo(() => {
    return TEAM_MEMBERS.map((member) => {
      let pendingAmount = 0;
      let paidAmount = 0;
      let totalAssessed = 0;
      let pendingDaysCount = 0;

      entries.forEach((entry) => {
        const match = entry.contributions.find(
          (c) =>
            c.memberId.toLowerCase() === member.id.toLowerCase() ||
            c.name.toLowerCase() === member.name.toLowerCase()
        );
        if (match) {
          totalAssessed += match.amount;
          if (!match.paid && match.amount > 0) {
            pendingAmount += match.amount;
            pendingDaysCount += 1;
          } else if (match.paid) {
            paidAmount += match.amount;
          }
        }
      });

      return {
        memberId: member.id,
        name: member.name,
        pendingAmount,
        paidAmount,
        totalAssessed,
        pendingDaysCount,
      };
    });
  }, [entries]);

  const handleDownloadCSV = () => {
    if (entries.length === 0) return;
    const csvContent = exportLedgerToCSV(entries);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `office_fund_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* 4 Clean Stat Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium block">Total Generated</span>
          <span className="text-xl sm:text-2xl font-mono tabular-nums font-bold text-slate-900 mt-0.5 block">
            ₹{totalAllTimeFund}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium block">Spent</span>
          <span className="text-xl sm:text-2xl font-mono tabular-nums font-bold text-rose-600 mt-0.5 block">
            ₹{totalSpent}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium block">Balance</span>
          <span className="text-xl sm:text-2xl font-mono tabular-nums font-bold text-emerald-600 mt-0.5 block">
            ₹{availableBalance}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium block">Pending</span>
            {totalAllPendingDues > 0 && (
              <button
                onClick={onOpenClearDues}
                className="text-[10px] text-amber-600 hover:text-amber-800 font-semibold underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <span className="text-xl sm:text-2xl font-mono tabular-nums font-bold text-amber-600 mt-0.5 block">
            ₹{totalAllPendingDues}
          </span>
        </div>
      </div>

      {/* Member Outstanding Dues Grid */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Pending Dues to Pay Now
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Total Outstanding: <span className="font-mono font-bold text-amber-600">₹{totalAllPendingDues}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {memberDuesSummaries.map((m) => {
            const hasDues = m.pendingAmount > 0;
            return (
              <div
                key={m.memberId}
                className={`p-3 rounded-xl border text-center transition-all ${
                  hasDues
                    ? 'bg-amber-50/70 border-amber-200 shadow-2xs'
                    : 'bg-slate-50/60 border-slate-200'
                }`}
              >
                <span className="text-xs font-bold text-slate-900 block truncate">
                  {m.name}
                </span>

                <span
                  className={`text-xl font-mono font-bold block my-1 tabular-nums ${
                    hasDues ? 'text-amber-600' : 'text-emerald-600'
                  }`}
                >
                  ₹{m.pendingAmount}
                </span>

                <div className="flex items-center justify-center">
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      hasDues
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {hasDues
                      ? `${m.pendingDaysCount} ${m.pendingDaysCount === 1 ? 'day' : 'days'} due`
                      : 'All Settled'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fund Usage Log if any */}
      {fundUsageRecords.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900">Expenses Log</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {fundUsageRecords.length}
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {fundUsageRecords.map((r) => (
              <div
                key={r.id}
                className="px-4 py-2 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{r.purpose}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500 font-mono text-[11px]">{r.date}</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-slate-900">
                    -₹{r.amountSpent}
                  </span>
                  <button
                    onClick={() => onDeleteFundUsageRecord(r.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Ledger Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Header toolbar */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50/70">
          <h3 className="text-sm font-bold text-slate-900">Past Daily Records</h3>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenClearDues}
              className="px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Clear Dues</span>
            </button>

            {entries.length > 0 && (
              <>
                <button
                  onClick={handleDownloadCSV}
                  className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>CSV</span>
                </button>
                {confirmClearAll ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        onClearAll();
                        setSelectedEntry(null);
                        setConfirmClearAll(false);
                      }}
                      className="px-2 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors cursor-pointer"
                    >
                      Confirm Clear
                    </button>
                    <button
                      onClick={() => setConfirmClearAll(false)}
                      className="px-1.5 py-1 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmClearAll(true)}
                    className="px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No entries recorded yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* Left list of dates */}
            <div className="lg:col-span-1 max-h-[380px] overflow-y-auto divide-y divide-slate-100">
              {entries.map((entry) => {
                const isSelected = selectedEntry?.id === entry.id;
                const paidCount = entry.contributions.filter((c) => c.paid).length;
                const totalWithDues = entry.contributions.filter((c) => c.amount > 0).length;

                return (
                  <div
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className={`p-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-slate-100 font-semibold'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-900">{entry.date}</span>
                      <span className="font-mono font-bold text-slate-900">
                        ₹{entry.totalFund}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between mt-0.5">
                      <span>M: {formatTime12h(entry.muhammedTime)} · Mi: {formatTime12h(entry.midhunTime)}</span>
                      <span>{paidCount}/{totalWithDues} paid</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right selected entry */}
            <div className="lg:col-span-2 p-3">
              {selectedEntry ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="font-bold text-xs text-slate-900">
                      {selectedEntry.date} (₹{selectedEntry.totalFund})
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onLoadEntry(selectedEntry)}
                        className="px-2 py-0.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Load</span>
                      </button>

                      {deleteEntryId === selectedEntry.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              onDeleteEntry(selectedEntry.id);
                              setSelectedEntry(entries.find((e) => e.id !== selectedEntry.id) || null);
                              setDeleteEntryId(null);
                            }}
                            className="px-1.5 py-0.5 text-[11px] bg-rose-600 text-white rounded font-medium cursor-pointer"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteEntryId(null)}
                            className="text-[11px] text-slate-500 hover:text-slate-700 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteEntryId(selectedEntry.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 text-[11px]">
                        <th className="py-1.5 px-2">Member</th>
                        <th className="py-1.5 px-2 text-right">Amount</th>
                        <th className="py-1.5 px-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedEntry.contributions.map((c) => (
                        <tr key={c.memberId}>
                          <td className="py-1.5 px-2 font-medium text-slate-800">{c.name}</td>
                          <td className="py-1.5 px-2 text-right font-mono font-semibold text-slate-800">₹{c.amount}</td>
                          <td className="py-1.5 px-2 text-center">
                            {c.paid ? (
                              <span className="text-emerald-600 font-semibold text-[11px]">Paid</span>
                            ) : c.amount === 0 ? (
                              <span className="text-slate-400 text-[11px]">--</span>
                            ) : (
                              <span className="text-amber-600 font-semibold text-[11px]">Pending</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Select an entry to view.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

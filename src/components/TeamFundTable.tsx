import React from 'react';
import { MemberContribution, ArrivalCalculationResult } from '../types';
import { Check, CheckCheck, Save, Sparkles } from 'lucide-react';

interface TeamFundTableProps {
  calculation: ArrivalCalculationResult;
  onTogglePaid: (memberId: string) => void;
  onMarkAllPaid: (paid: boolean) => void;
  onSaveEntry: () => void;
  isSavedToday: boolean;
  onOpenClearDues: () => void;
}

export const TeamFundTable: React.FC<TeamFundTableProps> = ({
  calculation,
  onTogglePaid,
  onMarkAllPaid,
  onSaveEntry,
  isSavedToday,
  onOpenClearDues,
}) => {
  const {
    contributions,
    totalFund,
  } = calculation;

  const totalCollected = contributions
    .filter((c) => c.paid)
    .reduce((sum, c) => sum + c.totalAmount, 0);

  const totalPending = totalFund - totalCollected;
  const allPaid = totalFund > 0 && totalPending === 0;

  return (
    <div className="space-y-3">
      {/* 3 Clean Stat Tiles */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900 text-white rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] text-slate-400 font-medium block">Total Fund</span>
          <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-white block mt-0.5">
            ₹{totalFund}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] text-emerald-600 font-medium block">Collected</span>
          <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-emerald-600 block mt-0.5">
            ₹{totalCollected}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-amber-600 font-medium block">Pending</span>
            {totalPending > 0 && (
              <button
                onClick={onOpenClearDues}
                className="text-[11px] text-amber-600 hover:text-amber-800 font-semibold underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-amber-600 block mt-0.5">
            ₹{totalPending}
          </span>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {/* Table Toolbar */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50/70">
          <h3 className="text-sm font-bold text-slate-900">Member Dues</h3>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenClearDues}
              className="px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Clear pending dues"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Clear Dues</span>
            </button>

            {totalFund > 0 && (
              <button
                onClick={() => onMarkAllPaid(!allPaid)}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>{allPaid ? 'Unmark All' : 'Mark All Paid'}</span>
              </button>
            )}

            <button
              onClick={onSaveEntry}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                isSavedToday
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavedToday ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>

        {/* Minimal Clean Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-4">Member</th>
                <th className="py-2.5 px-4 text-right">Muhammed Rule</th>
                <th className="py-2.5 px-4 text-right">Midhun Late Fee</th>
                <th className="py-2.5 px-4 text-right">Total</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {contributions.map((c) => {
                const isZero = c.totalAmount === 0;

                return (
                  <tr
                    key={c.memberId}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      c.isMuhammed || c.isMidhun ? 'bg-slate-50/30' : ''
                    }`}
                  >
                    {/* Member */}
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 ${
                            c.isMuhammed
                              ? 'bg-slate-900'
                              : c.isMidhun
                              ? 'bg-indigo-600'
                              : 'bg-slate-400'
                          }`}
                        >
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-900">
                          {c.name}
                        </span>
                      </div>
                    </td>

                    {/* Muhammed Rule */}
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-xs">
                      {c.muhammedRuleAmount > 0 ? (
                        <span className="text-slate-800 font-medium">
                          ₹{c.muhammedRuleAmount}
                        </span>
                      ) : (
                        <span className="text-slate-400">₹0</span>
                      )}
                    </td>

                    {/* Midhun Late Fee */}
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-xs">
                      {c.midhunRuleAmount > 0 ? (
                        <span className="text-rose-600 font-semibold">
                          +₹{c.midhunRuleAmount}
                        </span>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </td>

                    {/* Total Payable */}
                    <td className="py-2.5 px-4 text-right">
                      <span
                        className={`font-mono tabular-nums font-bold text-sm ${
                          c.totalAmount > 0 ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        ₹{c.totalAmount}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-4 text-center">
                      {isZero ? (
                        <span className="text-xs text-slate-400">--</span>
                      ) : (
                        <button
                          onClick={() => onTogglePaid(c.memberId)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                            c.paid
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          {c.paid ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Paid</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              <span>Pending</span>
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-900 text-xs">
                <td colSpan={3} className="py-2.5 px-4">
                  Total
                </td>
                <td className="py-2.5 px-4 text-right font-mono tabular-nums text-base font-bold text-emerald-700">
                  ₹{totalFund}
                </td>
                <td className="py-2.5 px-4 text-center text-slate-400">
                  {totalPending === 0 && totalFund > 0 ? 'Settled' : `₹${totalPending} left`}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

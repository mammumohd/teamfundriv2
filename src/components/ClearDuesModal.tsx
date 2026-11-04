import React, { useState } from 'react';
import { X, Sparkles, CheckCheck, Utensils, Coffee, PartyPopper, Cake, HelpCircle } from 'lucide-react';

interface ClearDuesModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingTodayAmount: number;
  pendingTodayMembersCount: number;
  pendingAllHistoryAmount: number;
  totalCollectedFund: number;
  onConfirmClearDues: (options: {
    scope: 'today' | 'all';
    purpose: string;
    amountSpent: number;
  }) => void;
}

export const ClearDuesModal: React.FC<ClearDuesModalProps> = ({
  isOpen,
  onClose,
  pendingTodayAmount,
  pendingTodayMembersCount,
  pendingAllHistoryAmount,
  totalCollectedFund,
  onConfirmClearDues,
}) => {
  const [scope, setScope] = useState<'today' | 'all'>('today');
  const [purpose, setPurpose] = useState('Team snacks & refreshments');
  const [amountSpent, setAmountSpent] = useState<number>(totalCollectedFund > 0 ? totalCollectedFund : 0);

  if (!isOpen) return null;

  const quickPurposes = [
    { label: 'Chai & Snacks', text: 'Chai & evening snacks', icon: Coffee },
    { label: 'Team Lunch / Pizza', text: 'Team pizza lunch', icon: Utensils },
    { label: 'Team Outing', text: 'Team outing / celebration', icon: PartyPopper },
    { label: 'Birthday Treat', text: 'Birthday treat & cakes', icon: Cake },
    { label: 'General Fund Settled', text: 'Fund used up and settled', icon: CheckCheck },
  ];

  const pendingTargetAmount = scope === 'today' ? pendingTodayAmount : pendingAllHistoryAmount;

  const handleConfirm = () => {
    onConfirmClearDues({
      scope,
      purpose: purpose.trim() || 'Team fund used up',
      amountSpent: Number(amountSpent) || 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Team Fund Used Up · Clear Dues
              </h3>
              <p className="text-xs text-slate-500">
                Settle all outstanding member payments when fund is spent
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 text-xs text-slate-700">
          {/* Quick status banner */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <span className="text-slate-500 block mb-0.5 font-medium">Pending Dues (Today)</span>
              <span className="text-xl font-bold font-mono text-amber-600">
                ₹{pendingTodayAmount}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {pendingTodayMembersCount} member(s) unpaid
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5 font-medium">All-Time Pending Dues</span>
              <span className="text-xl font-bold font-mono text-slate-900">
                ₹{pendingAllHistoryAmount}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                across all recorded days
              </span>
            </div>
          </div>

          {/* Scope Selection */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-900 block">
              Which pending dues should be cleared?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScope('today')}
                className={`p-3 text-left rounded-xl border transition-all ${
                  scope === 'today'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="font-semibold text-slate-900 flex items-center justify-between">
                  <span>Today's Dues Only</span>
                  {scope === 'today' && <CheckCheck className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Marks all pending members for today as settled (₹{pendingTodayAmount}).
                </p>
              </button>

              <button
                type="button"
                onClick={() => setScope('all')}
                className={`p-3 text-left rounded-xl border transition-all ${
                  scope === 'all'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="font-semibold text-slate-900 flex items-center justify-between">
                  <span>All Historical Dues</span>
                  {scope === 'all' && <CheckCheck className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Clears all pending dues across all days in ledger (₹{pendingAllHistoryAmount}).
                </p>
              </button>
            </div>
          </div>

          {/* Purpose / Event */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-900 block">
              What was the team fund spent on?
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {quickPurposes.map((qp) => {
                const Icon = qp.icon;
                return (
                  <button
                    key={qp.label}
                    type="button"
                    onClick={() => setPurpose(qp.text)}
                    className={`px-2.5 py-1 rounded-md text-[11px] border font-medium flex items-center gap-1 transition-all ${
                      purpose === qp.text
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{qp.label}</span>
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Samosa & tea party for team"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Amount spent input */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-900 flex items-center justify-between">
              <span>Amount of fund used up (₹)</span>
              <span className="text-[11px] text-slate-400 font-normal">Optional</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                min="0"
                value={amountSpent}
                onChange={(e) => setAmountSpent(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full pl-7 pr-3 py-2 text-xs font-mono font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              This records a fund expenditure log and marks {scope === 'today' ? "today's" : "all"} member dues as settled.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Clear Dues &amp; Record Spent</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Calendar, BookOpen, Share2, History, RotateCcw, Table } from 'lucide-react';

interface HeaderProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  onResetToDefaults: () => void;
  onOpenRules: () => void;
  onOpenShare: () => void;
  onOpenGoogleSheets: () => void;
  isSheetsConnected: boolean;
  activeTab: 'calculator' | 'history';
  onTabChange: (tab: 'calculator' | 'history') => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  selectedDate,
  onDateChange,
  onResetToDefaults,
  onOpenRules,
  onOpenShare,
  onOpenGoogleSheets,
  isSheetsConnected,
  activeTab,
  onTabChange,
  historyCount,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-20 shadow-xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              ₹
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
              Office Fund
            </span>
          </div>

          {/* Mode tabs */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => onTabChange('calculator')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                activeTab === 'calculator'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => onTabChange('history')}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3 h-3" />
              <span>Ledger</span>
              {historyCount > 0 && (
                <span className="text-[10px] text-slate-500 font-mono">({historyCount})</span>
              )}
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {activeTab === 'calculator' && (
              <div className="hidden sm:flex items-center gap-1.5 border border-slate-200 rounded-md px-2 py-1 bg-slate-50 text-xs">
                <Calendar className="w-3 h-3 text-slate-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => onDateChange(e.target.value)}
                  className="bg-transparent text-slate-700 text-xs font-medium focus:outline-none cursor-pointer"
                />
              </div>
            )}

            <button
              onClick={onOpenGoogleSheets}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                isSheetsConnected
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Google Sheet"
            >
              <Table className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sheet</span>
              {isSheetsConnected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
            </button>

            <button
              onClick={onOpenRules}
              className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              title="Rules"
            >
              Rules
            </button>

            <button
              onClick={onOpenShare}
              className="px-2.5 py-1 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
              title="Share"
            >
              <Share2 className="w-3 h-3" />
              <span>Share</span>
            </button>

            <button
              onClick={onResetToDefaults}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              title="Reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

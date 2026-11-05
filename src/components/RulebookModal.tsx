import React, { useState } from 'react';
import { X, Check, AlertTriangle, HelpCircle, ArrowRight, Copy, CheckCheck } from 'lucide-react';
import { GOOGLE_APPS_SCRIPT_CODE } from '../utils/googleSheets';

interface RulebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (muhammedTime: string, midhunTime: string) => void;
}

export const RulebookModal: React.FC<RulebookModalProps> = ({
  isOpen,
  onClose,
  onSelectScenario,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  if (!isOpen) return null;

  const scenarios = [
    {
      title: 'Scenario 1: Both On Time',
      muhammedTime: '09:50',
      midhunTime: '09:55',
      desc: 'Muhammed is ≤ 10:00 AM. Antony, Gulnaaz, Midhun, GG, Nakul, Remya contribute ₹20 each (₹120 total). Midhun has no late penalty.',
      totalFund: 120,
    },
    {
      title: 'Scenario 2: Muhammed On Time, Midhun Late (1 hr 15 min)',
      muhammedTime: '09:45',
      midhunTime: '11:15',
      desc: 'Muhammed is on time (others pay ₹20). Midhun is 2 hours late past 10 AM (2 × ₹20 = ₹40 penalty) + ₹20 team contribution = ₹60 total for Midhun.',
      totalFund: 160,
    },
    {
      title: 'Scenario 3: Muhammed Late, Midhun On Time',
      muhammedTime: '10:15',
      midhunTime: '09:50',
      desc: 'Muhammed arrived after 10 AM, so Muhammed pays ₹100. Other team members pay ₹0. Midhun is on time, so ₹0 late fee.',
      totalFund: 100,
    },
    {
      title: 'Scenario 4: Both Late (Muhammed late, Midhun 2 hrs late)',
      muhammedTime: '10:30',
      midhunTime: '11:45',
      desc: 'Muhammed pays ₹100 late penalty. Midhun pays 2 hrs × ₹20 = ₹40 late penalty. Other 5 members pay ₹0.',
      totalFund: 140,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Office Arrival Fund &amp; Penalty Rules
            </h3>
            <p className="text-xs text-slate-500">
              Official agreement for 7 team members
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 text-sm text-slate-700">
          {/* Team Members List */}
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Team Members (7)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { name: 'Muhammed', special: 'Arrival tracked' },
                { name: 'Antony', special: '' },
                { name: 'Gulnaaz', special: '' },
                { name: 'Midhun', special: 'Hourly late rule' },
                { name: 'GG', special: '' },
                { name: 'Nakul', special: '' },
                { name: 'Remya', special: '' },
              ].map((m) => (
                <span
                  key={m.name}
                  className="px-2.5 py-1 bg-slate-100 text-slate-800 text-xs rounded-md border border-slate-200 font-medium"
                >
                  {m.name}
                  {m.special && (
                    <span className="text-slate-400 ml-1 text-[10px]">({m.special})</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* The 3 Core Rules */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              The 3 Official Rules
            </span>

            {/* Rule 1 */}
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Rule 1: Muhammed Arrives On or Before 10:00 AM</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                If Muhammed arrives on or before 10 AM, <strong>all other 6 team members</strong> (Antony, Gulnaaz, Midhun, GG, Nakul, Remya) contribute <strong>₹20 each</strong> to the team fund (<strong>₹120 total</strong>). Muhammed pays <strong>₹0</strong>.
              </p>
            </div>

            {/* Rule 2 */}
            <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Rule 2: Muhammed Arrives Later Than 10:00 AM</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                If Muhammed arrives after 10 AM, he has to pay <strong>₹100</strong> to the team fund. The other team members pay <strong>₹0</strong> under this rule.
              </p>
            </div>

            {/* Rule 3 */}
            <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-bold text-indigo-900 text-sm">
                <AlertTriangle className="w-4 h-4 text-indigo-600" />
                <span>Rule 3: Midhun's Hourly Late Penalty</span>
              </div>
              <p className="text-xs text-indigo-800 leading-relaxed">
                If Midhun arrives late after 10:00 AM, he pays <strong>₹20 towards the team fund for each hour</strong> he is late.
                <em> Note: If Muhammed also arrived on time, Midhun contributes both his ₹20 team member share AND his hourly late penalty!</em>
              </p>
            </div>
          </div>

          {/* Scenarios / Quick Presets */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Try Common Scenarios
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {scenarios.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    onSelectScenario(s.muhammedTime, s.midhunTime);
                    onClose();
                  }}
                  className="p-3 border border-slate-200 rounded-lg hover:border-slate-400 hover:bg-slate-50 cursor-pointer transition-all space-y-1 group"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                    <span>{s.title}</span>
                    <span className="font-mono text-emerald-600">₹{s.totalFund} fund</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {s.desc}
                  </p>
                  <span className="text-[10px] text-indigo-600 font-medium inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Apply this test <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={() => {
              navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
              setCopiedCode(true);
              setTimeout(() => setCopiedCode(false), 2500);
            }}
            className="text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-300 bg-white px-3 py-1.5 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
            title="Copy Google Apps Script Code for Google Sheets"
          >
            {copiedCode ? (
              <>
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copied Code to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Google Apps Script Code</span>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

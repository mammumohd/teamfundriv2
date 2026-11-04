import React from 'react';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatTime12h, formatDelayDescription } from '../utils/calculator';
import { RoundingMode } from '../types';

interface ArrivalInputsProps {
  muhammedTime: string;
  midhunTime: string;
  onMuhammedTimeChange: (time: string) => void;
  onMidhunTimeChange: (time: string) => void;
  isMuhammedOnTime: boolean;
  muhammedDelayMinutes: number;
  isMidhunOnTime: boolean;
  midhunDelayMinutes: number;
  midhunChargedHours: number;
  roundingMode: RoundingMode;
  onRoundingModeChange: (mode: RoundingMode) => void;
}

export const ArrivalInputs: React.FC<ArrivalInputsProps> = ({
  muhammedTime,
  midhunTime,
  onMuhammedTimeChange,
  onMidhunTimeChange,
  isMuhammedOnTime,
  muhammedDelayMinutes,
  isMidhunOnTime,
  midhunDelayMinutes,
  midhunChargedHours,
  roundingMode,
  onRoundingModeChange,
}) => {
  const setNow = (setter: (time: string) => void) => {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    setter(`${h}:${m}`);
  };

  const muhammedPresets = [
    { label: '09:45', time: '09:45' },
    { label: '10:00', time: '10:00' },
    { label: '10:05', time: '10:05' },
    { label: '10:30', time: '10:30' },
  ];

  const midhunPresets = [
    { label: '09:55', time: '09:55' },
    { label: '10:00', time: '10:00' },
    { label: '10:45', time: '10:45' },
    { label: '11:15', time: '11:15' },
    { label: '12:00', time: '12:00' },
  ];

  return (
    <section className="space-y-3">
      {/* Target benchmark & mode strip */}
      <div className="flex items-center justify-between gap-3 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Cutoff: <strong className="text-slate-900 font-mono">10:00 AM</strong></span>
        </div>
        
        {/* Compact hourly rule toggle */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 hidden sm:inline">Hourly rule:</span>
          <div className="inline-flex rounded-md border border-slate-200 p-0.5 bg-slate-50 text-[11px]">
            <button
              onClick={() => onRoundingModeChange('ceil')}
              className={`px-2 py-0.5 rounded transition-colors ${
                roundingMode === 'ceil'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Started Hr
            </button>
            <button
              onClick={() => onRoundingModeChange('floor')}
              className={`px-2 py-0.5 rounded transition-colors ${
                roundingMode === 'floor'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Full Hr
            </button>
            <button
              onClick={() => onRoundingModeChange('exact')}
              className={`px-2 py-0.5 rounded transition-colors ${
                roundingMode === 'exact'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pro-rata
            </button>
          </div>
        </div>
      </div>

      {/* Muhammed & Midhun Input Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Card 1: Muhammed */}
        <div
          className={`border rounded-xl p-4 bg-white shadow-xs transition-all ${
            isMuhammedOnTime
              ? 'border-emerald-200 ring-1 ring-emerald-100'
              : 'border-amber-200 ring-1 ring-amber-100'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                M
              </div>
              <h3 className="text-sm font-bold text-slate-900">Muhammed</h3>
            </div>

            <div className="flex items-center gap-2">
              {isMuhammedOnTime ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  On Time · ₹0
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Late · ₹100
                </span>
              )}
              <button
                onClick={() => setNow(onMuhammedTimeChange)}
                className="px-2 py-0.5 text-xs text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
              >
                Now
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <input
                type="time"
                value={muhammedTime}
                onChange={(e) => onMuhammedTimeChange(e.target.value)}
                className="flex-1 px-3 py-1.5 text-base font-mono font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-sm font-mono font-semibold text-slate-700 shrink-0">
                {formatTime12h(muhammedTime)}
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 pt-0.5">
              {muhammedPresets.map((p) => (
                <button
                  key={p.time}
                  onClick={() => onMuhammedTimeChange(p.time)}
                  className={`px-2 py-0.5 text-xs font-mono rounded border transition-all ${
                    muhammedTime === p.time
                      ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Midhun */}
        <div
          className={`border rounded-xl p-4 bg-white shadow-xs transition-all ${
            isMidhunOnTime
              ? 'border-emerald-200 ring-1 ring-emerald-100'
              : 'border-rose-200 ring-1 ring-rose-100'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                Mi
              </div>
              <h3 className="text-sm font-bold text-slate-900">Midhun</h3>
            </div>

            <div className="flex items-center gap-2">
              {isMidhunOnTime ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  On Time · ₹0 Late
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                  <AlertCircle className="w-3.5 h-3.5" />
                  +{midhunChargedHours * 20} ({midhunChargedHours}h late)
                </span>
              )}
              <button
                onClick={() => setNow(onMidhunTimeChange)}
                className="px-2 py-0.5 text-xs text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
              >
                Now
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <input
                type="time"
                value={midhunTime}
                onChange={(e) => onMidhunTimeChange(e.target.value)}
                className="flex-1 px-3 py-1.5 text-base font-mono font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
              <span className="text-sm font-mono font-semibold text-slate-700 shrink-0">
                {formatTime12h(midhunTime)}
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 pt-0.5">
              {midhunPresets.map((p) => (
                <button
                  key={p.time}
                  onClick={() => onMidhunTimeChange(p.time)}
                  className={`px-2 py-0.5 text-xs font-mono rounded border transition-all ${
                    midhunTime === p.time
                      ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

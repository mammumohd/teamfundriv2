import {
  TeamMember,
  MemberContribution,
  ArrivalCalculationResult,
  RoundingMode,
} from '../types';

export const TEAM_MEMBERS: TeamMember[] = [
  { id: 'muhammed', name: 'Muhammed', isMuhammed: true },
  { id: 'antony', name: 'Antony' },
  { id: 'gulnaaz', name: 'Gulnaaz' },
  { id: 'midhun', name: 'Midhun', isMidhun: true },
  { id: 'gg', name: 'GG' },
  { id: 'nakul', name: 'Nakul' },
  { id: 'remya', name: 'Remya' },
];

export const DEFAULT_THRESHOLD_TIME = '10:00'; // 10:00 AM

/**
 * Converts "HH:MM" (24h) string to minutes from midnight
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

/**
 * Formats "HH:MM" (24h) to a human-friendly "hh:mm AM/PM"
 */
export function formatTime12h(timeStr: string): string {
  if (!timeStr) return '--:--';
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return timeStr;
  
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m.toString().padStart(2, '0');
  return `${displayH}:${displayM} ${period}`;
}

/**
 * Parses any time string (like "9:50 AM", "09:50 AM", "13:45", "1:30 PM") into "HH:MM" (24h)
 */
export function parseTo24hTime(timeStr: string, defaultFallback = '10:00'): string {
  if (!timeStr) return defaultFallback;
  const trimmed = timeStr.trim().toUpperCase();
  
  // If already standard HH:MM (24h)
  if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(trimmed)) {
    const [h, m] = trimmed.split(':');
    return `${h.padStart(2, '0')}:${m}`;
  }

  // If 12h format like "9:50 AM", "10:00 PM"
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const meridiem = match[3];

    if (meridiem === 'PM' && hours < 12) {
      hours += 12;
    } else if (meridiem === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }

  return defaultFallback;
}

/**
 * Format minutes delay into "Xh Ym" or "On time"
 */
export function formatDelayDescription(delayMinutes: number): string {
  if (delayMinutes <= 0) return 'On time';
  const hours = Math.floor(delayMinutes / 60);
  const mins = delayMinutes % 60;
  if (hours === 0) return `${mins} min${mins === 1 ? '' : 's'} late`;
  if (mins === 0) return `${hours} hr${hours === 1 ? '' : 's'} late`;
  return `${hours} hr${hours === 1 ? '' : 's'} ${mins} min${mins === 1 ? '' : 's'} late`;
}

/**
 * Calculate the number of charged hours for Midhun based on selected rounding mode
 */
export function calculateMidhunChargedHours(
  delayMinutes: number,
  mode: RoundingMode = 'ceil'
): number {
  if (delayMinutes <= 0) return 0;
  
  switch (mode) {
    case 'floor':
      return Math.floor(delayMinutes / 60);
    case 'exact':
      // Return 2 decimal places for display or pro-rata
      return parseFloat((delayMinutes / 60).toFixed(2));
    case 'ceil':
    default:
      return Math.ceil(delayMinutes / 60);
  }
}

/**
 * Core calculation logic for office arrival times and fund amounts
 */
export function calculateTeamFund(
  muhammedTime: string,
  midhunTime: string,
  paidStatusMap: Record<string, boolean> = {},
  roundingMode: RoundingMode = 'ceil',
  thresholdTime: string = DEFAULT_THRESHOLD_TIME
): ArrivalCalculationResult {
  const thresholdMinutes = timeToMinutes(thresholdTime);
  const muhammedMinutes = timeToMinutes(muhammedTime);
  const midhunMinutes = timeToMinutes(midhunTime);

  // 1. Muhammed condition:
  // On or before 10 AM (<= 600 min): others contribute ₹20 each, Muhammed pays ₹0.
  // After 10 AM (> 600 min): Muhammed pays ₹100, others pay ₹0 under this rule.
  const isMuhammedOnTime = muhammedMinutes <= thresholdMinutes;
  const muhammedDelayMinutes = Math.max(0, muhammedMinutes - thresholdMinutes);

  // 2. Midhun condition:
  // If Midhun comes late for each hour after 10 AM, he pays ₹20 per hour.
  const isMidhunOnTime = midhunMinutes <= thresholdMinutes;
  const midhunDelayMinutes = Math.max(0, midhunMinutes - thresholdMinutes);
  const midhunChargedHours = calculateMidhunChargedHours(midhunDelayMinutes, roundingMode);
  
  const midhunLatePenalty = roundingMode === 'exact'
    ? Math.round((midhunDelayMinutes / 60) * 20)
    : midhunChargedHours * 20;

  let totalFund = 0;
  let muhammedContributionTotal = 0;
  let midhunContributionTotal = 0;
  let otherMembersContributionTotal = 0;

  const contributions: MemberContribution[] = TEAM_MEMBERS.map((member) => {
    let muhammedRuleAmount = 0;
    let midhunRuleAmount = 0;
    let notes = '';

    if (member.isMuhammed) {
      if (isMuhammedOnTime) {
        muhammedRuleAmount = 0;
        notes = 'Arrived on or before 10 AM. ₹0 to pay.';
      } else {
        muhammedRuleAmount = 100;
        notes = `Arrived after 10 AM (${formatTime12h(muhammedTime)}). Late penalty: ₹100.`;
      }
    } else {
      // Other team members
      if (isMuhammedOnTime) {
        muhammedRuleAmount = 20;
        notes = 'Muhammed arrived on time. ₹20 contribution.';
      } else {
        muhammedRuleAmount = 0;
        notes = 'Muhammed arrived late. ₹0 contribution.';
      }
    }

    if (member.isMidhun) {
      midhunRuleAmount = midhunLatePenalty;
      if (midhunLatePenalty > 0) {
        notes += ` + Late penalty: ₹${midhunLatePenalty} (${midhunChargedHours} hr${midhunChargedHours === 1 ? '' : 's'} late).`;
      } else {
        notes += ' (Arrived on time, no late penalty).';
      }
    }

    const totalAmount = muhammedRuleAmount + midhunRuleAmount;
    totalFund += totalAmount;

    if (member.isMuhammed) {
      muhammedContributionTotal += totalAmount;
    } else if (member.isMidhun) {
      midhunContributionTotal += totalAmount;
    } else {
      otherMembersContributionTotal += totalAmount;
    }

    return {
      memberId: member.id,
      name: member.name,
      isMuhammed: !!member.isMuhammed,
      isMidhun: !!member.isMidhun,
      muhammedRuleAmount,
      midhunRuleAmount,
      totalAmount,
      paid: !!paidStatusMap[member.id],
      notes: notes.trim(),
    };
  });

  return {
    muhammedTime,
    midhunTime,
    thresholdTime,
    isMuhammedOnTime,
    muhammedDelayMinutes,
    isMidhunOnTime,
    midhunDelayMinutes,
    midhunChargedHours,
    contributions,
    totalFund,
    muhammedContributionTotal,
    midhunContributionTotal,
    otherMembersContributionTotal,
  };
}

/**
 * Generate shareable plain text summary for messaging apps (WhatsApp / Slack)
 */
export function generateShareableSummary(
  calc: ArrivalCalculationResult,
  dateFormatted: string
): string {
  const muhammedStatusText = calc.isMuhammedOnTime
    ? `✅ On time (${formatTime12h(calc.muhammedTime)})`
    : `⚠️ Late (${formatTime12h(calc.muhammedTime)} - ${formatDelayDescription(calc.muhammedDelayMinutes)})`;

  const midhunStatusText = calc.isMidhunOnTime
    ? `✅ On time (${formatTime12h(calc.midhunTime)})`
    : `⚠️ Late (${formatTime12h(calc.midhunTime)} - ${calc.midhunChargedHours} hr(s) late penalty)`;

  let text = `📋 *Office Arrival & Team Fund Report*\n`;
  text += `📅 Date: ${dateFormatted}\n\n`;
  text += `⏰ *Arrivals:*\n`;
  text += `• Muhammed: ${muhammedStatusText}\n`;
  text += `• Midhun: ${midhunStatusText}\n\n`;
  text += `💰 *Total Fund Collected: ₹${calc.totalFund}*\n\n`;
  text += `👥 *Individual Dues:*\n`;

  calc.contributions.forEach((c) => {
    const status = c.paid ? '✅ Paid' : '⏳ Pending';
    const detail = c.totalAmount > 0
      ? `₹${c.totalAmount} [${status}]`
      : `₹0 [No dues]`;
    text += `• ${c.name}: ${detail}\n`;
  });

  text += `\n_Generated via Office Team Fund Tracker_`;
  return text;
}

/**
 * Export daily records to CSV string
 */
export function exportLedgerToCSV(entries: any[]): string {
  const headers = [
    'Date',
    'Muhammed Arrival',
    'Midhun Arrival',
    'Total Fund (₹)',
    'Muhammed Dues',
    'Antony Dues',
    'Gulnaaz Dues',
    'Midhun Dues',
    'GG Dues',
    'Nakul Dues',
    'Remya Dues',
  ];

  const rows = entries.map((e) => {
    const getAmt = (name: string) => {
      const match = e.contributions?.find((c: any) => c.name.toLowerCase() === name.toLowerCase());
      return match ? match.amount : 0;
    };

    return [
      e.date,
      formatTime12h(e.muhammedTime),
      formatTime12h(e.midhunTime),
      e.totalFund,
      getAmt('Muhammed'),
      getAmt('Antony'),
      getAmt('Gulnaaz'),
      getAmt('Midhun'),
      getAmt('GG'),
      getAmt('Nakul'),
      getAmt('Remya'),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

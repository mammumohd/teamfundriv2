export type RoundingMode = 'ceil' | 'floor' | 'exact';

export interface TeamMember {
  id: string;
  name: string;
  isMuhammed?: boolean;
  isMidhun?: boolean;
}

export interface MemberContribution {
  memberId: string;
  name: string;
  isMuhammed: boolean;
  isMidhun: boolean;
  muhammedRuleAmount: number; // ₹20 if Muhammed on time (for others), or ₹100 if Muhammed late (for Muhammed)
  midhunRuleAmount: number; // ₹20 * hours if Midhun late (for Midhun)
  totalAmount: number;
  paid: boolean;
  notes: string;
}

export interface ArrivalCalculationResult {
  muhammedTime: string; // "HH:MM" 24h
  midhunTime: string; // "HH:MM" 24h
  thresholdTime: string; // "10:00"
  
  isMuhammedOnTime: boolean;
  muhammedDelayMinutes: number;
  
  isMidhunOnTime: boolean;
  midhunDelayMinutes: number;
  midhunChargedHours: number;
  
  contributions: MemberContribution[];
  totalFund: number;
  muhammedContributionTotal: number;
  midhunContributionTotal: number;
  otherMembersContributionTotal: number;
}

export interface DailyLedgerEntry {
  id: string;
  date: string; // YYYY-MM-DD
  muhammedTime: string;
  midhunTime: string;
  totalFund: number;
  roundingMode: RoundingMode;
  notes?: string;
  contributions: {
    memberId: string;
    name: string;
    amount: number;
    paid: boolean;
    breakdown: string;
  }[];
  createdAt: number;
}

export interface FundUsageRecord {
  id: string;
  date: string;
  amountSpent: number;
  purpose: string;
  clearedPendingDuesAmount: number;
  scope: 'today' | 'all';
  timestamp: number;
}

export interface GoogleSheetsConfig {
  webAppUrl: string;
  sheetUrl?: string;
  autoSync: boolean;
  lastSyncedTimestamp?: number;
}


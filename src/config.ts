/**
 * Hardcoded Google Sheets & Apps Script Configuration
 * 
 * Connected directly to your live Google Sheet and deployed Web App.
 * All application data loads and saves through these endpoints with zero localStorage.
 */

export const GOOGLE_APPS_SCRIPT_URL: string =
  (import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL as string) ||
  'https://script.google.com/macros/s/AKfycbwgmNONEdf_MjzhOf98t12ZQ_A97PAFhS0WF_tYQYfu22dHJjvyOfTZNvA9oi6h_xJb/exec';

export const GOOGLE_SHEET_VIEW_URL: string =
  (import.meta.env.VITE_GOOGLE_SHEET_VIEW_URL as string) ||
  'https://docs.google.com/spreadsheets/d/1t59z0XBnPijKFbeTpkSfeUW_UJyiqehAkus78iTHOHE/edit?usp=sharing';

export const GOOGLE_SHEET_CSV_URL: string =
  'https://docs.google.com/spreadsheets/d/1t59z0XBnPijKFbeTpkSfeUW_UJyiqehAkus78iTHOHE/export?format=csv';

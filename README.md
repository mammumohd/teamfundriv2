# Office Arrival & Team Fund Tracker

A web application designed for tracking daily office arrival timings for **Muhammed** and **Midhun**, and automatically computing individual and total team fund dues for all 7 team members:

1. **Muhammed**
2. **Antony**
3. **Gulnaaz**
4. **Midhun**
5. **GG**
6. **Nakul**
7. **Remya**

---

## 📋 The 3 Rules

1. **Muhammed Arrives On or Before 10:00 AM**:
   - Other 6 team members (Antony, Gulnaaz, Midhun, GG, Nakul, Remya) contribute **₹20 each** (₹120 total) to the fund.
   - Muhammed pays **₹0**.

2. **Muhammed Arrives Later Than 10:00 AM**:
   - Muhammed pays a **₹100** penalty to the team fund.
   - Other members pay **₹0** under this rule.

3. **Midhun's Hourly Late Penalty**:
   - For each hour after 10:00 AM, Midhun pays **₹20** towards the team fund.
   - If Muhammed was also on time, Midhun pays both his ₹20 team member share and his hourly late penalty (e.g., ₹20 + ₹40 = ₹60).

---

## 🚀 How to Host on GitHub (GitHub Pages)

This project is configured for **100% free hosting on GitHub Pages** with automated deployment via **GitHub Actions**.

### Step 1: Push Code to a GitHub Repository

If you haven't already initialized git:
```bash
git init
git add .
git commit -m "Initial commit of Office Arrival & Team Fund Tracker"
git branch -M main
git remote add origin https://github.com/<YOUR-USERNAME>/teamfundriv2.git
git push -u origin main
```

### Step 2: Enable GitHub Pages in Repository Settings

1. Open your repository on GitHub (`teamfundriv2`).
2. Go to **Settings** > **Pages** (in the left sidebar).
3. Under **Build and deployment** > **Source**, select **GitHub Actions**.
4. That's it! GitHub will automatically trigger the included workflow (`.github/workflows/deploy.yml`).

Within 1–2 minutes, your live site URL will be ready at:
```
https://<YOUR-USERNAME>.github.io/teamfundriv2/
```

Every subsequent `git push` to `main` will automatically build and deploy your updates.

---

## 💻 Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the local dev server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

3. **Build for production**:
   ```bash
   npm run build
   ```

---

## 📊 Free Cloud Storage via Google Sheets

You can sync all daily arrival records, member dues, and expenditures directly into a **Google Sheet** stored in your personal Google Drive for **100% free forever**:

1. Click the **Google Sheet** button in the header.
2. Open a new Google Sheet ([sheets.new](https://sheets.new)).
3. In your spreadsheet, click **Extensions** > **Apps Script**.
4. Click **Copy Google Apps Script Code** in the app modal, paste it into Apps Script, and click Save.
5. In Apps Script, click **Deploy** > **New deployment** > Type: **Web app** > Set *Who has access*: **Anyone** > Deploy!
6. Copy the Web app URL and paste it into the app modal.

Once connected:
- Every time you click **Save to Ledger** or **Clear Dues**, it automatically appends a new row to your Google Sheet in real time.
- All team members (Muhammed, Midhun, Antony, etc.) can open and view the Google Sheet from their phones or laptops in Google Drive.
- You can also click **Upload All Ledger Records Now** to back up all existing records in one click.

---

## 🛠️ Features

- **Live Dues Calculator**: Instant calculation of dues with quick preset buttons (09:45, 10:00, 10:45, 11:15, etc.).
- **Payment Status Checkmarks**: Track who has paid and who has pending dues with one-click toggles.
- **Clear Dues When Fund is Used Up**: Record expenditures (e.g. Pizza Party, Tea & Snacks) and clear pending dues across today or all past days.
- **Daily Attendance & Fund Ledger**: Saved records in browser storage (`localStorage`) with all-time fund stats and CSV export.
- **Share to WhatsApp & Slack**: Formatted summary text generator for team chat notifications.
- **Offline & Pure Client-Side**: No backend or database server required to host on GitHub.

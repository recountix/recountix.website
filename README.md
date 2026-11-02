# Computer Shop Billing CRM

A super-lightweight, single-page non-GST billing app for a computer shop. It runs directly in a browser using plain HTML, CSS, and JavaScript.

## Features
- Non-GST Estimate / Cash Memo
- Manually typed item descriptions, quantity, rate, serial number, and warranty note
- No stock/inventory management or cash drawer/day-end closing
- Invoice history with April–March financial-year filter, date range, and customer/mobile search
- A5 printable bill with serial/warranty details and Terms & Conditions
- Browser-local storage and JSON backup/restore

## Run
Open `index.html` in Chrome, Edge, or Firefox. No installation, server, or build step required.

## Setup
1. Open the app and select **Shop Settings**.
2. Enter shop name, phone, address, invoice prefix, and default terms.
3. Create a bill and use **Save bill**.
4. Select **Print A5 / Save PDF**. Choose A5 paper in the print dialog.

## Backup note
Bills are stored in localStorage in the current browser/device. Clearing browser data can remove them. Use **Invoice History → Export JSON backup** regularly. The app has no cloud sync or login.

## Deploy with GitHub Pages
In repository **Settings → Pages**, select branch `main` and folder `/(root)`, then save. Once GitHub Pages publishes, use the URL shown in Settings → Pages.

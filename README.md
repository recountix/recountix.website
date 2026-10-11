# RECOUNTIX — Beyond What's Due

A responsive, single-page marketing website for Recountix, a business receivables management product.

## Files
- `index.html` — complete responsive marketing site with navigation, feature overview, how-it-works section, about section, FAQs, and demo request form.
- `auth.js` — separate Firebase Authentication starter from the setup process. It is **not connected to the marketing page** and must not be considered production login until Firebase is configured and the authentication flow is integrated into the actual app.
- `README.md` — setup notes.

## Run locally
Open the folder in VS Code and use a static server such as Live Server. Since the marketing page is a standalone HTML file, no build step is required.

## Deploy
For GitHub Pages: repository **Settings → Pages**, choose branch `main` and folder `/ (root)`, then save. Wait for GitHub Pages to publish and open the URL it shows.

## Demo request form
The form validates the inputs and opens the visitor's default email application with a prepared message to `support.recountix@gmail.com`. It does not submit directly to a server or save data on this website.

## Accuracy and production notes
- The dashboard-style graphic and sample amounts on the homepage are illustrative, not a live product screenshot or real customer data.
- The website describes only the general receivables-management purpose. It does not claim GST filing, e-Way bills, bank synchronization, inventory, bookkeeping, accounting reports, certifications, customer counts, pricing, or guaranteed outcomes.
- The current marketing page does not require Firebase Authentication. If account login is needed for the actual Recountix app, integrate Firebase separately and secure all backend/database access with proper rules. Never place service-account credentials in browser code.
- Add accurate Privacy Policy and Terms pages before collecting information through a backend or offering account access. The current form only opens an email draft.

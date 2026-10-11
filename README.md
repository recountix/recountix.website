# Recountix Website — Firebase Authentication Starter

This starter adds email/password sign-in, account creation, password reset, and sign-out to a Recountix website.

## Files
- `index.html` — responsive sign-in / create-account screen and signed-in state.
- `auth.js` — Firebase Authentication logic.
- `README.md` — setup and security instructions.

## 1. Create/configure Firebase
1. Open https://console.firebase.google.com/ and create a Firebase project (or select your existing project).
2. In **Project settings → General → Your apps**, add a **Web app** and copy its Firebase config.
3. In **Authentication → Sign-in method**, enable **Email/Password**.
4. In **Authentication → Settings → Authorized domains**, add your production domain (and any development domain you actually use).
5. Open `auth.js` and replace each `YOUR_*` placeholder in `firebaseConfig` with the values from your Firebase web app config.

Firebase web configuration is client-side configuration, not a server secret. Do not put service-account JSON, private keys, or Admin SDK credentials in browser code.

## 2. Upload to GitHub
Upload `README.md`, `index.html`, and `auth.js` into the root of your repository's `main` branch. Keep the filenames exactly as written. If you already have a working Recountix homepage, do not overwrite it blindly; merge the sign-in UI into the existing page instead.

## 3. Test locally / deploy
Because this uses JavaScript modules, open it through a local web server rather than `file://`. You can use VS Code Live Server or any static hosting provider. For GitHub Pages, enable Pages for the `main` branch and the repository root, then add the published domain under Firebase Authorized domains. A custom domain should also be added there.

## 4. Security notes — important
- Firebase Authentication verifies the user's identity; it does **not** automatically secure your database or API.
- If Recountix uses Cloud Firestore, set rules so users can only access their own records. Example starter rule (adjust collection and fields to your real schema):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
  }
}
```

- Do not deploy broad rules such as `allow read, write: if true`.
- For shared business/company data, use server-verified roles/custom claims or a carefully designed membership model; do not trust a role or `isAdmin` flag stored only in browser/localStorage.
- If using Realtime Database or Storage, configure their security rules separately.
- Use Firebase App Check where appropriate, and use Cloud Functions / a trusted server for privileged operations.
- Enable a strong password policy in Firebase Authentication settings. Consider email verification before granting access to sensitive features.
- Password reset uses Firebase's built-in email flow. Configure your email templates and authorized domains in Firebase.
- The example displays an authenticated placeholder, not your actual Recountix application dashboard. Connect the successful sign-in state to your existing app after confirming the app's routes and data model.

## 5. Troubleshooting
- `auth/operation-not-allowed`: enable Email/Password in Firebase Authentication.
- `auth/unauthorized-domain`: add the exact hosting domain in Firebase Authorized domains.
- `auth/invalid-api-key` or configuration errors: check the config values in `auth.js`.
- Login succeeds but records are accessible by the wrong user: fix database security rules; the UI alone is not security.

## 6. Production checklist
- [ ] Replace all Firebase config placeholders.
- [ ] Enable Email/Password sign-in.
- [ ] Add production domain to Authorized domains.
- [ ] Test create-account, sign-in, sign-out, and password reset.
- [ ] Publish restrictive Firestore/Storage/Realtime Database rules that match your real data model.
- [ ] Connect the signed-in state to the real Recountix app.

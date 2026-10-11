// Recountix Firebase Authentication starter.
// Replace the placeholder values below with your Firebase Web App config.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, sendPasswordResetEmail, signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID"
  // Add storageBucket, messagingSenderId, etc. if Firebase supplied them.
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const $ = (id) => document.getElementById(id);
let mode = "login";

$("year").textContent = new Date().getFullYear();

function showMessage(message, kind = "error", target = "message") {
  const el = $(target);
  el.textContent = message;
  el.className = `message show ${kind}`;
}
function clearMessage() {
  $("message").textContent = "";
  $("message").className = "message";
}
function setBusy(busy) {
  $("submitBtn").disabled = busy;
  $("submitBtn").textContent = busy ? "Please wait…" :
    mode === "signup" ? "Create account" : "Sign in";
}
function setMode(nextMode) {
  mode = nextMode;
  const signup = mode === "signup";
  $("loginTab").classList.toggle("active", !signup);
  $("signupTab").classList.toggle("active", signup);
  $("formTitle").textContent = signup ? "Create your account" : "Sign in";
  $("formSub").textContent = signup
    ? "Create an account to access Recountix."
    : "Enter your email and password to continue.";
  $("password").autocomplete = signup ? "new-password" : "current-password";
  $("password").required = true;
  $("forgotRow").classList.toggle("hidden", signup);
  $("submitBtn").textContent = signup ? "Create account" : "Sign in";
  clearMessage();
}
function readableAuthError(error) {
  const messages = {
    "auth/email-already-in-use": "An account already exists for this email. Try signing in.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/weak-password": "Choose a stronger password (at least 6 characters, or follow your Firebase password policy).",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/user-disabled": "This account has been disabled. Contact your administrator.",
    "auth/too-many-requests": "Too many attempts. Please wait and try again.",
    "auth/network-request-failed": "Network error. Check your internet connection.",
    "auth/operation-not-allowed": "Email/Password sign-in is not enabled in Firebase Console.",
    "auth/unauthorized-domain": "This website domain is not authorized in Firebase Authentication settings."
  };
  return messages[error?.code] || "Something went wrong. Check Firebase setup and try again.";
}

$("loginTab").addEventListener("click", () => setMode("login"));
$("signupTab").addEventListener("click", () => setMode("signup"));

$("authForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();
  const email = $("email").value.trim();
  const password = $("password").value;
  setBusy(true);
  try {
    if (mode === "signup") {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // No password is stored in your own database or browser storage.
      await updateProfile(result.user, { displayName: email.split("@")[0] });
      showMessage("Account created successfully.", "ok");
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  } catch (error) {
    showMessage(readableAuthError(error));
  } finally {
    setBusy(false);
  }
});

$("forgotBtn").addEventListener("click", async () => {
  clearMessage();
  const email = $("email").value.trim();
  if (!email) {
    showMessage("Enter your email address first, then choose Forgot password.");
    $("email").focus();
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    // Generic wording avoids confirming whether an account exists.
    showMessage("If an account exists for this email, a password-reset email has been sent.", "ok");
  } catch (error) {
    if (error?.code === "auth/invalid-email") showMessage("Enter a valid email address.");
    else if (error?.code === "auth/unauthorized-domain") showMessage(readableAuthError(error));
    else showMessage("If an account exists for this email, a password-reset email will be sent.", "ok");
  }
});

$("signoutBtn").addEventListener("click", async () => {
  try {
    await signOut(auth);
    showMessage("You have signed out.", "ok", "signedMessage");
  } catch {
    showMessage("Could not sign out. Please try again.", "error", "signedMessage");
  }
});

onAuthStateChanged(auth, (user) => {
  $("authPanel").classList.toggle("hidden", Boolean(user));
  $("signedPanel").classList.toggle("hidden", !user);
  if (user) $("userEmail").textContent = user.email || "Signed-in user";
});

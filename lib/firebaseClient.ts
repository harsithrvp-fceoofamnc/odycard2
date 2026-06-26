"use client";
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Public client config (safe to ship to the browser). Set these in the host env:
//   NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_APP_ID
const cfg = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function app(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(cfg);
}

export function googleConfigured(): boolean {
  return !!cfg.apiKey && !!cfg.authDomain && !!cfg.projectId;
}

/** Opens the Google sign-in popup and returns a verifiable ID token. */
export async function googleIdToken(): Promise<string> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const res = await signInWithPopup(getAuth(app()), provider);
  return res.user.getIdToken();
}

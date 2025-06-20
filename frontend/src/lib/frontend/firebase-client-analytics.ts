"use client"
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported, Analytics, logEvent as firebaseLogEvent } from "firebase/analytics";

// hold analytics instance once initialized
export let analytics: Analytics | null = null;

// initialize Firebase Analytics (call once on app startup)
export async function initFirebaseAnalytics(): Promise<Analytics | null> {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  const app = !getApps().length
    ? initializeApp(firebaseConfig)
    : getApp();

  if (await isSupported()) {
    analytics = getAnalytics(app);
  }

  return analytics;
}

// log custom events
export function logEvent(eventName: string, eventParams?: Record<string, any>) {
  if (!analytics) return;
  firebaseLogEvent(analytics, eventName, eventParams);
}
/**
 * firebase-config.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Replace the placeholder values below with your actual Firebase project
 * credentials from: https://console.firebase.google.com/
 *
 * 1. Go to Project Settings → General → Your apps → Firebase SDK snippet
 * 2. Copy the firebaseConfig object and paste the values below
 *
 * To migrate to AWS later:
 *   - Replace the db export with your AWS Amplify/DynamoDB client
 *   - Replace the auth export with AWS Cognito client
 *   - All section modules import { db, auth } from this file only
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  enableIndexedDbPersistence,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ─── YOUR FIREBASE CREDENTIALS ────────────────────
// ⚠️  Replace ALL values below with your project config
const firebaseConfig = {
  apiKey:            "AIzaSyCqj6B8v3eGsqQpyvvjY2Iz87LmlBt4o9c",
  authDomain:        "ai-emergency-responce-system.firebaseapp.com",
  projectId:         "ai-emergency-responce-system",
  storageBucket:     "ai-emergency-responce-system.firebasestorage.app",
  messagingSenderId: "123395763228",
  appId:             "1:123395763228:web:091f91abc164f5e12983d9",
  measurementId:     "G-NJMHB5W9TG",
};
// ──────────────────────────────────────────────────

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// Enable offline persistence (acts as local cache — swap point for AWS)
enableIndexedDbPersistence(db).catch(() => {});

export { app, auth, db };

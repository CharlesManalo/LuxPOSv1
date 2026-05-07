// Standalone Supabase Test Script for Browser Console
// Run this in the browser console (F12 → Console tab) on any LuxPOS deployment

console.log("🔍 LuxPOS Supabase Domain Configuration Test");
console.log("===========================================");
console.log("Current domain:", window.location.origin);
console.log("");

// Test 1: Check if we can access the Supabase client
console.log("Test 1: Checking Supabase client availability...");
const supabaseUrl = "https://cnycpwqkxytzinejlhkk.supabase.co";

// Test 2: Try to fetch the Supabase health endpoint
fetch(`${supabaseUrl}/rest/v1/tenants?select=id&limit=1`, {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNueWNwd3FreHl0emluZWpsaGtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1NzY0MDAsImV4cCI6MjA1MjE1MjQwMH0.placeholder',
  }
})
.then(res => {
  console.log("Test 2: Supabase REST API reachable:", res.status === 200 ? "✅ Yes" : `⚠️ Status ${res.status}`);
  if (res.status === 401) {
    console.log("   401 is expected - it means API is reachable but needs valid key");
  }
})
.catch(err => {
  console.log("Test 2: Supabase REST API reachable: ❌ No -", err.message);
});

// Test 3: Check browser storage for auth tokens
console.log("Test 3: Checking browser storage for auth tokens...");
const localStorageKeys = Object.keys(localStorage).filter(k => k.includes('supabase') || k.includes('auth'));
const sessionStorageKeys = Object.keys(sessionStorage).filter(k => k.includes('supabase') || k.includes('auth'));
console.log("   localStorage keys:", localStorageKeys.length > 0 ? localStorageKeys : "None found");
console.log("   sessionStorage keys:", sessionStorageKeys.length > 0 ? sessionStorageKeys : "None found");

// Test 4: Try to ping Supabase auth endpoint
fetch(`${supabaseUrl}/auth/v1/health`, {
  method: 'GET',
})
.then(res => {
  console.log("Test 4: Supabase Auth API reachable:", res.status < 400 ? "✅ Yes" : `⚠️ Status ${res.status}`);
})
.catch(err => {
  console.log("Test 4: Supabase Auth API reachable: ❌ No -", err.message);
});

console.log("");
console.log("📋 INTERPRETATION:");
console.log("If Test 4 shows ❌, your domain is NOT configured in Supabase.");
console.log("Fix: Supabase Dashboard → Authentication → URL Configuration");
console.log(`Add: ${window.location.origin}`);
console.log(`Add: ${window.location.origin}/**`);

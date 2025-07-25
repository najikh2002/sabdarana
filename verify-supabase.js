// Script to verify Supabase configuration
// Run with: node verify-supabase.js

import https from 'https';

// Test URLs - Update these with your actual values
const URLS_TO_TEST = [
  'https://gvrrwhdrwcvdgymgnaxs.supabase.co', // New URL
];

console.log('🔍 Supabase URL Verification Tool\n');

function testUrl(url) {
  return new Promise((resolve) => {
    console.log(`Testing: ${url}`);
    
    https.get(url + '/rest/v1/', (res) => {
      console.log(`✅ Status: ${res.statusCode}`);
      console.log(`✅ URL is reachable!\n`);
      resolve(true);
    }).on('error', (err) => {
      if (err.code === 'ENOTFOUND') {
        console.log(`❌ DNS Error: Domain not found`);
        console.log(`❌ This URL is incorrect!\n`);
      } else {
        console.log(`❌ Error: ${err.message}\n`);
      }
      resolve(false);
    });
  });
}

async function runTests() {
  for (const url of URLS_TO_TEST) {
    await testUrl(url);
  }
  
  console.log('\n📝 Next Steps:');
  console.log('1. Go to https://app.supabase.com');
  console.log('2. Select your project');
  console.log('3. Copy the correct Project URL');
  console.log('4. Update your .env file');
  console.log('5. Run this script again with the new URL');
}

runTests();
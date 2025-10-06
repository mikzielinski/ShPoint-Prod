#!/usr/bin/env node

/**
 * Character Testing Script
 * 
 * This script helps test the character collection, creation, and editing endpoints.
 * 
 * Usage:
 * 1. Set your server URL and dev secret key
 * 2. Run: node test-character-endpoints.js
 * 
 * Make sure to replace the placeholders with your actual values.
 */

const BASE_URL = 'https://shpoint-prod.onrender.com'; // Replace with your actual server URL
const DEV_SECRET = 'dev-secret-key-2025'; // Replace with your actual dev secret

// Test character ID (replace with an actual character ID from your JSON files)
const TEST_CHARACTER_ID = 'luke-skywalker'; // Replace with actual character ID
const TEST_USER_ID = 'your-user-id'; // Replace with actual user ID

const headers = {
  'Content-Type': 'application/json',
  'x-dev-secret': DEV_SECRET
};

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers }
    });
    
    const data = await response.json();
    
    console.log(`\n📡 ${options.method || 'GET'} ${url}`);
    console.log(`📊 Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(data, null, 2));
    
    return { response, data };
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    return { error };
  }
}

async function testCharacterSystem() {
  console.log('🧪 Testing Character System');
  console.log('============================');
  
  // Test 1: Check character system status
  console.log('\n1️⃣ Testing character system status...');
  await makeRequest(`${BASE_URL}/api/dev/test-character-system?characterId=${TEST_CHARACTER_ID}`);
  
  // Test 2: Create character from JSON (if needed)
  console.log('\n2️⃣ Testing character creation from JSON...');
  await makeRequest(`${BASE_URL}/api/dev/test-create-character`, {
    method: 'POST',
    body: JSON.stringify({ characterId: TEST_CHARACTER_ID })
  });
  
  // Test 3: Test character collection
  console.log('\n3️⃣ Testing character collection...');
  await makeRequest(`${BASE_URL}/api/dev/test-collection`, {
    method: 'POST',
    body: JSON.stringify({ 
      characterId: TEST_CHARACTER_ID, 
      userId: TEST_USER_ID, 
      status: 'OWNED' 
    })
  });
  
  // Test 4: Test character editing
  console.log('\n4️⃣ Testing character editing...');
  await makeRequest(`${BASE_URL}/api/dev/test-edit-character`, {
    method: 'PUT',
    body: JSON.stringify({ 
      characterId: TEST_CHARACTER_ID,
      updates: {
        name: 'Test Character (Edited)',
        stamina: 5,
        durability: 4,
        squadPoints: 8
      }
    })
  });
  
  // Test 5: Check final status
  console.log('\n5️⃣ Checking final character status...');
  await makeRequest(`${BASE_URL}/api/dev/test-character-system?characterId=${TEST_CHARACTER_ID}`);
  
  console.log('\n✅ Character system testing completed!');
}

async function testRealEndpoints() {
  console.log('\n🔧 Testing Real Endpoints');
  console.log('==========================');
  
  // Test real character collection endpoint
  console.log('\n1️⃣ Testing real character collection endpoint...');
  await makeRequest(`${BASE_URL}/api/shatterpoint/characters`, {
    method: 'POST',
    body: JSON.stringify({ 
      characterId: TEST_CHARACTER_ID, 
      status: 'OWNED',
      notes: 'Test from script'
    })
  });
  
  // Test real character update endpoint
  console.log('\n2️⃣ Testing real character update endpoint...');
  await makeRequest(`${BASE_URL}/api/v2/characters/${TEST_CHARACTER_ID}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: 'Test Character (Real API)',
      stamina: 6,
      durability: 5,
      squadPoints: 9
    })
  });
  
  console.log('\n✅ Real endpoints testing completed!');
}

// Main execution
async function main() {
  console.log('🚀 Character Testing Script');
  console.log('============================');
  console.log(`🌐 Server: ${BASE_URL}`);
  console.log(`🔑 Dev Secret: ${DEV_SECRET}`);
  console.log(`👤 Test Character: ${TEST_CHARACTER_ID}`);
  console.log(`👥 Test User: ${TEST_USER_ID}`);
  
  // Check if fetch is available (Node.js 18+)
  if (typeof fetch === 'undefined') {
    console.log('\n❌ This script requires Node.js 18+ or you need to install node-fetch');
    console.log('   Run: npm install node-fetch');
    process.exit(1);
  }
  
  try {
    await testCharacterSystem();
    await testRealEndpoints();
  } catch (error) {
    console.error('\n💥 Script failed:', error);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { testCharacterSystem, testRealEndpoints };
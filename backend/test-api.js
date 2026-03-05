// Test the execution runs API endpoint
const axios = require('axios');

const token = process.argv[2];

if (!token) {
  console.log('\n❌ Please provide your auth token');
  console.log('Usage: node test-api.js "your-token-here"');
  console.log('\nTo get your token:');
  console.log('1. Open browser DevTools (F12)');
  console.log('2. Go to Console tab');
  console.log('3. Type: localStorage.getItem("token")');
  console.log('4. Copy the token and run this script again\n');
  process.exit(1);
}

async function testAPI() {
  const baseURL = 'http://localhost:5000/api';
  
  console.log('\n🧪 Testing Execution Runs API\n');
  
  // Test with different variations
  const testCases = ['TC-20', '20', 'TC-2026-82099'];
  
  for (const testId of testCases) {
    console.log(`\n📍 Testing with testcase_id: "${testId}"`);
    try {
      const response = await axios.get(
        `${baseURL}/execution-runs/testcase/${testId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log(`✅ Success! Found ${response.data.length} execution runs`);
      if (response.data.length > 0) {
        console.log('   First run:', {
          id: response.data[0].id,
          status: response.data[0].status,
          created_at: response.data[0].created_at
        });
      }
    } catch (error) {
      console.log(`❌ Error:`, error.response?.data || error.message);
    }
  }
  
  console.log('\n✅ Test complete\n');
}

testAPI();

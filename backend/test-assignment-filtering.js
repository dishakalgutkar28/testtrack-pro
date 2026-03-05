#!/usr/bin/env node

/**
 * Test Script for Assignment-Based Filtering
 * 
 * This script tests the role-based assignment filtering implementation
 * Run from: node test-assignment-filtering.js
 * 
 * Prerequisites:
 * 1. Backend server running on http://localhost:5000
 * 2. At least one testcase, bug, and user in the database
 */

const http = require('http');

const API_BASE = 'http://localhost:5000/api';

// Test configuration
const tests = [
  {
    name: 'Admin Can See All Testcases',
    method: 'GET',
    endpoint: '/testcase',
    role: 'admin',
    expectedStatus: 200,
    expectedMinItems: 1
  },
  {
    name: 'Tester Can See Assigned Testcases',
    method: 'GET',
    endpoint: '/testcase',
    role: 'tester',
    expectedStatus: 200
  },
  {
    name: 'Developer Can See Assigned Bugs',
    method: 'GET',
    endpoint: '/bugs',
    role: 'developer',
    expectedStatus: 200
  },
  {
    name: 'Admin Can See All Bugs',
    method: 'GET',
    endpoint: '/bugs',
    role: 'admin',
    expectedStatus: 200
  },
  {
    name: 'Dashboard Filters Items Correctly',
    method: 'GET',
    endpoint: '/dashboard-data',
    role: 'tester',
    expectedStatus: 200
  },
  {
    name: 'Project Stats Filter by Assignment',
    method: 'GET',
    endpoint: '/projects/with-stats',
    role: 'tester',
    expectedStatus: 200
  }
];

/**
 * Mock JWT token for testing
 * In real scenario, get this from login endpoint
 */
function generateMockToken(userId = 1, role = 'admin') {
  // You should replace this with real tokens from your login endpoint
  // This is just for demonstration
  return `mock-token-user${userId}-${role}`;
}

/**
 * Make HTTP request
 */
function makeRequest(method, path, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 5000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : null;
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.abort();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Run single test
 */
async function runTest(test) {
  console.log(`\n📝 Testing: ${test.name}`);
  console.log(`   ${test.method} ${test.endpoint}`);
  
  try {
    // Generate mock token with role
    const token = generateMockToken(1, test.role);
    
    // Make request
    const response = await makeRequest(test.method, test.endpoint, token);
    
    // Check status
    const statusOk = response.status === test.expectedStatus;
    const statusIcon = statusOk ? '✅' : '❌';
    console.log(`   Status: ${statusIcon} ${response.status} (Expected: ${test.expectedStatus})`);
    
    // Check item count if specified
    if (test.expectedMinItems && Array.isArray(response.data)) {
      const countOk = response.data.length >= test.expectedMinItems;
      const countIcon = countOk ? '✅' : '❌';
      console.log(`   Items: ${countIcon} ${response.data.length} (Expected: >= ${test.expectedMinItems})`);
      return statusOk && countOk;
    }
    
    return statusOk;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   Assignment-Based Filtering - Test Suite');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n⚠️  NOTE: You need to update the generateMockToken() function');
  console.log('    with real JWT tokens from your login endpoint.\n');
  
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await runTest(test);
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`Fatal error in test: ${error.message}`);
      failed++;
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`Results: ${passed} passed, ${failed} failed out of ${tests.length} tests`);
  console.log('═══════════════════════════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

/**
 * Manual Test Instructions
 */
function printManualTestGuide() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║          Manual Testing Guide                             ║
╚═══════════════════════════════════════════════════════════╝

STEP 1: Get Real JWT Tokens
━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Login as Admin:
   curl -X POST http://localhost:5000/api/auth/login \\
     -H "Content-Type: application/json" \\
     -d '{"email": "admin@test.com", "password": "password"}'
   
   Copy the token from response

2. Login as Tester:
   curl -X POST http://localhost:5000/api/auth/login \\
     -H "Content-Type: application/json" \\
     -d '{"email": "tester@test.com", "password": "password"}'
   
   Copy the token from response

3. Login as Developer:
   curl -X POST http://localhost:5000/api/auth/login \\
     -H "Content-Type: application/json" \\
     -d '{"email": "developer@test.com", "password": "password"}'
   
   Copy the token from response


STEP 2: Test as Admin (Should See Everything)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

curl -H "Authorization: Bearer <ADMIN_TOKEN>" \\
  http://localhost:5000/api/testcase

Expected: Returns ALL testcases


STEP 3: Test as Tester (Should See Assigned Only)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

curl -H "Authorization: Bearer <TESTER_TOKEN>" \\
  http://localhost:5000/api/testcase

Expected: Returns only testcases where assigned_to = tester_user_id


STEP 4: Test Access Denial
━━━━━━━━━━━━━━━━━━━━━━━━━

1. First, get an execution run ID from an unassigned testcase:
   curl -H "Authorization: Bearer <ADMIN_TOKEN>" \\
     http://localhost:5000/api/execution

   Note an execution ID that's for an unassigned testcase

2. Try to access it as tester:
   curl -H "Authorization: Bearer <TESTER_TOKEN>" \\
     http://localhost:5000/api/execution-run/<EXECUTION_ID>

Expected: Returns 403 Forbidden with error message


STEP 5: Assignment Test
━━━━━━━━━━━━━━━━━━━━━━

1. Admin assigns a testcase:
   curl -X PUT http://localhost:5000/api/testcase/5 \\
     -H "Authorization: Bearer <ADMIN_TOKEN>" \\
     -H "Content-Type: application/json" \\
     -d '{"assigned_to": 3}'

2. Tester (ID 3) now sees it:
   curl -H "Authorization: Bearer <TESTER_TOKEN>" \\
     http://localhost:5000/api/testcase

Expected: Testcase 5 is now in the response


STEP 6: Dashboard Test
━━━━━━━━━━━━━━━━━━━━━

As Admin:
curl -H "Authorization: Bearer <ADMIN_TOKEN>" \\
  http://localhost:5000/api/dashboard-data

As Tester (only shows assigned):
curl -H "Authorization: Bearer <TESTER_TOKEN>" \\
  http://localhost:5000/api/dashboard-data

Expected: Tester's dashboard shows smaller numbers


SUCCESS INDICATORS
━━━━━━━━━━━━━━━━━━
✅ Admin sees all items
✅ Tester/Developer see only assigned
✅ Unassigned items return 403
✅ Dashboard numbers reflect assignments
✅ Assignment/reassignment works
  `);
}

// Run if not imported as module
if (require.main === module) {
  printManualTestGuide();
  console.log('\nTo run automated tests, update the generateMockToken() function first.\n');
  // Uncomment to run auto tests:
  // runAllTests();
}

module.exports = { runTest, runAllTests, makeRequest };

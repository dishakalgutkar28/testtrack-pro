// Quick script to check execution runs in database
const db = require('./config/db');

console.log('\n📊 Checking Execution Runs in Database...\n');

// 1. Check testcases table - what TC-20 maps to
db.query("SELECT id, test_case_id, title FROM testcases WHERE test_case_id LIKE '%20%' OR id = 20", (err, results) => {
  if (err) {
    console.error('❌ Error querying testcases:', err);
  } else {
    console.log('🔍 Testcases matching TC-20:');
    console.table(results);
  }

  // 2. Check all execution runs
  db.query("SELECT * FROM execution_runs ORDER BY created_at DESC LIMIT 10", (err2, results2) => {
    if (err2) {
      console.error('❌ Error querying execution_runs:', err2);
    } else {
      console.log('\n📋 Recent Execution Runs:');
      console.table(results2);
      
      if (results2.length === 0) {
        console.log('\n⚠️  NO EXECUTION RUNS FOUND!');
        console.log('   This means step-by-step executions are not being saved.');
      } else {
        console.log('\n✅ Found', results2.length, 'execution runs');
        
        // Show which testcase_ids have runs
        const testcaseIds = [...new Set(results2.map(r => r.testcase_id))];
        console.log('📌 Testcase IDs with runs:', testcaseIds.join(', '));
      }
    }
    
    // 3. Check execution steps
    db.query("SELECT COUNT(*) as step_count FROM execution_steps", (err3, results3) => {
      if (err3) {
        console.error('❌ Error querying execution_steps:', err3);
      } else {
        console.log('\n📝 Total execution steps:', results3[0].step_count);
      }
      
      db.end();
    });
  });
});

const db = require('./config/db');

console.log('Checking notifications table schema...\n');

db.query('DESCRIBE notifications', (err, results) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  
  console.log('=== NOTIFICATIONS TABLE SCHEMA ===\n');
  results.forEach(col => {
    console.log(`Column: ${col.Field}`);
    console.log(`  Type: ${col.Type}`);
    console.log(`  Null: ${col.Null}`);
    console.log(`  Key: ${col.Key}`);
    console.log(`  Default: ${col.Default}`);
    console.log('');
  });
  
  // Find the type column specifically
  const typeCol = results.find(col => col.Field === 'type');
  if (typeCol) {
    console.log('=====================================');
    console.log('TYPE COLUMN DETAILS:');
    console.log(`Type definition: ${typeCol.Type}`);
    console.log('=====================================');
    
    if (typeCol.Type.includes('enum')) {
      console.log('\n❌ Problem: type column is ENUM with limited values');
      console.log('Solution: Need to add "retest_request" to allowed values');
    }
  }
  
  process.exit(0);
});

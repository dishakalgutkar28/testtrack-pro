// Check bug creation date
const db = require('./config/db');

db.query('SELECT id, title, project_id, created_at FROM bugs WHERE project_id = 1', (err, results) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('\n📅 Bug #13 Details:');
    console.table(results);
    
    if (results.length > 0) {
      const bug = results[0];
      const createdDate = new Date(bug.created_at);
      const now = new Date();
      const daysDiff = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
      
      console.log(`\nCreated: ${createdDate.toLocaleString()}`);
      console.log(`Days ago: ${daysDiff} days`);
      console.log(`\nDate Filter Results:`);
      console.log(`  - Last 7 days: ${daysDiff <= 7 ? '✅ INCLUDED' : '❌ EXCLUDED'}`);
      console.log(`  - Last 30 days: ${daysDiff <= 30 ? '✅ INCLUDED' : '❌ EXCLUDED'}`);
    }
  }
  db.end();
});

/**
 * Cleanup Test Users Script
 * Deletes test/dummy users from database
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function cleanupTestUsers() {
  console.log('🧹 Starting user cleanup...\n');

  try {
    // Create database connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'testtrack'
    });

    console.log('✅ Connected to database\n');

    // Show all users first
    console.log('📋 Current users in database:');
    console.log('─'.repeat(80));
    const [users] = await connection.execute(
      'SELECT id, email, role, email_verified, created_at FROM users ORDER BY id'
    );
    
    if (users.length === 0) {
      console.log('No users found in database.');
      await connection.end();
      return;
    }

    users.forEach(user => {
      const verified = user.email_verified ? '✓ Verified' : '✗ Not verified';
      console.log(`${user.id}. ${user.email} (${user.role}) - ${verified}`);
    });
    console.log('─'.repeat(80));

    // Ask which users to delete
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      rl.question('\n🗑️  Enter user IDs to delete (comma-separated, or "all" for all users, or "role:tester"): ', resolve);
    });
    rl.close();

    const trimmed = answer.trim().toLowerCase();
    
    if (!trimmed || trimmed === 'cancel' || trimmed === 'exit') {
      console.log('\n❌ Cancelled. No users deleted.');
      await connection.end();
      return;
    }

    let query;
    let params;

    if (trimmed === 'all') {
      // Delete all users
      query = 'DELETE FROM users';
      params = [];
      console.log('\n⚠️  Deleting ALL users...');
    } else if (trimmed.startsWith('role:')) {
      // Delete by role
      const role = trimmed.split(':')[1];
      query = 'DELETE FROM users WHERE role = ?';
      params = [role];
      console.log(`\n⚠️  Deleting all users with role "${role}"...`);
    } else {
      // Delete specific IDs
      const ids = trimmed.split(',').map(id => id.trim()).filter(id => id);
      if (ids.length === 0) {
        console.log('\n❌ No valid IDs provided.');
        await connection.end();
        return;
      }
      const placeholders = ids.map(() => '?').join(',');
      query = `DELETE FROM users WHERE id IN (${placeholders})`;
      params = ids;
      console.log(`\n⚠️  Deleting users with IDs: ${ids.join(', ')}...`);
    }

    const [result] = await connection.execute(query, params);
    
    console.log(`✅ Deleted ${result.affectedRows} user(s)\n`);

    // Show remaining users
    const [remaining] = await connection.execute(
      'SELECT id, email, role FROM users ORDER BY id'
    );
    
    if (remaining.length > 0) {
      console.log('📋 Remaining users:');
      console.log('─'.repeat(80));
      remaining.forEach(user => {
        console.log(`${user.id}. ${user.email} (${user.role})`);
      });
      console.log('─'.repeat(80));
    } else {
      console.log('📋 No users remaining in database.');
    }

    await connection.end();
    console.log('\n✅ Cleanup complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the cleanup
cleanupTestUsers();

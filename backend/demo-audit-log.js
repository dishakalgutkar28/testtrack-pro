const axios = require("axios");

(async () => {
  try {
    // Login as admin
    const loginRes = await axios.post("http://localhost:5000/api/login", {
      email: "admin@test.com",
      password: "admin123"
    });
    
    const token = loginRes.data.token;
    console.log("✅ Logged in as admin\n");

    // Get users list
    const usersRes = await axios.get("http://localhost:5000/api/admin/users", {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Find a tester to deactivate
    const tester = usersRes.data.find(u => u.role === 'tester' && u.is_active === 1);
    
    if (!tester) {
      console.log("❌ No active testers found to deactivate");
      process.exit(0);
    }

    console.log(`🎯 Going to deactivate user: ${tester.email} (ID: ${tester.id})\n`);

    // Deactivate the user (this will create an audit log)
    await axios.put(
      `http://localhost:5000/api/admin/users/${tester.id}/deactivate`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("✅ User deactivated successfully!");
    console.log("📝 This action created an audit log entry!\n");

    // Wait a moment for the audit log to be saved
    await new Promise(resolve => setTimeout(resolve, 500));

    // Fetch audit logs
    const auditRes = await axios.get("http://localhost:5000/api/admin/audit-logs?limit=5", {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("📋 AUDIT LOGS (showing most recent):");
    console.table(auditRes.data.map(log => ({
      ID: log.id,
      Action: log.action,
      User_ID: log.user_id,
      Target: `${log.target_type}:${log.target_id}`,
      Details: typeof log.details === 'string' ? log.details : JSON.stringify(log.details),
      Time: new Date(log.created_at).toLocaleString()
    })));

    console.log("\n✅ SUCCESS! Audit log has been created and stored in the database.");
    console.log("💡 Now refresh your admin dashboard to see the audit log count update!\n");

    // Reactivate the user so we can test again
    await axios.put(
      `http://localhost:5000/api/admin/users/${tester.id}/reactivate`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log(`♻️  User ${tester.email} has been reactivated (this also created an audit log!)`);

  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message);
  }
  
  process.exit(0);
})();

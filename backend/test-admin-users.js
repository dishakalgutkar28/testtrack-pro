const axios = require("axios");

// First, login to get a token
const adminLogin = async () => {
  try {
    const loginRes = await axios.post("http://localhost:5000/api/login", {
      email: "admin@test.com",
      password: "admin123"
    });
    
    console.log("✅ Login successful");
    return loginRes.data.token;
  } catch (err) {
    console.error("❌ Login failed:", err.response?.data || err.message);
    process.exit(1);
  }
};

// Then, try to fetch users
const fetchUsers = async (token) => {
  try {
    const usersRes = await axios.get("http://localhost:5000/api/admin/users", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log("\n✅ Users fetched successfully!");
    console.log("Users count:", usersRes.data.length);
    console.table(usersRes.data);
  } catch (err) {
    console.error("\n❌ Failed to fetch users!");
    console.error("Status:", err.response?.status);
    console.error("Error:", err.response?.data || err.message);
  }
};

// Run the test
(async () => {
  console.log("🧪 Testing /api/admin/users endpoint...\n");
  const token = await adminLogin();
  await fetchUsers(token);
  process.exit(0);
})();

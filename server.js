const express = require("express");
const cors = require("cors");
const app = express();
app.use(express.json());

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.listen(5000, () => {
  console.log("Backend running on port 5000");
});

const adminRoutes = require("./routes/adminRoutes");
app.use("/api", adminRoutes);

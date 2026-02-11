const express = require("express");
const path = require("path");
const mysql = require("mysql2");
const fs = require("fs");
const session = require("express-session");

const app = express();

app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: "testtrack-secret",
  resave: false,
  saveUninitialized: true
}));

// Database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "testtrack"
});

db.connect(err => {
  if (err) console.log("DB error:", err);
  else console.log("Database connected");
});

// Middleware functions
function checkLogin(req,res,next){
  if(req.session.user){
    next();
  }else{
    res.redirect("/login");
  }
}

function adminOnly(req,res,next){
  if(req.session.user.role === "admin"){
    next();
  }else{
    res.send("Access denied");
  }
}

// Redirect root
app.get("/", (req,res)=>{
  res.redirect("/login");
});

// Register page
app.get("/register",(req,res)=>{
  res.sendFile(path.join(__dirname,"views/register.html"));
});

// Register user
app.post("/register",(req,res)=>{
  const {name,email,password} = req.body;

  db.query(
    "INSERT INTO users(name,email,password,role) VALUES(?,?,?,'user')",
    [name,email,password],
    ()=>res.redirect("/login")
  );
});

// Login page
app.get("/login",(req,res)=>{
  res.sendFile(path.join(__dirname,"views/login.html"));
});

// Login check
app.post("/login",(req,res)=>{
  const {email,password} = req.body;

  db.query(
    "SELECT * FROM users WHERE email=? AND password=?",
    [email,password],
    (err,result)=>{
      if(result.length>0){
        req.session.user = result[0];

        if(result[0].role==="admin"){
          res.redirect("/dashboard");
        }else{
          res.redirect("/user-dashboard");
        }
      }else{
        res.send("Invalid login");
      }
    }
  );
});

// Logout
app.get("/logout",(req,res)=>{
  req.session.destroy();
  res.redirect("/login");
});

// Admin dashboard
app.get("/dashboard",checkLogin,(req,res)=>{

  const sql1="SELECT COUNT(*) AS testcaseCount FROM testcases";
  const sql2="SELECT COUNT(*) AS bugCount FROM bugs";

  db.query(sql1,(e1,r1)=>{
    db.query(sql2,(e2,r2)=>{

      let html=fs.readFileSync(
        path.join(__dirname,"views/dashboard.html"),"utf8"
      );

      html=html.replace("TESTCASE_COUNT",r1[0].testcaseCount);
      html=html.replace("BUG_COUNT",r2[0].bugCount);

      res.send(html);
    });
  });
});

// USER dashboard
app.get("/user-dashboard",checkLogin,(req,res)=>{
  res.sendFile(path.join(__dirname,"views/user-dashboard.html"));
});


// TESTCASE (ADMIN ONLY)

app.get("/testcase",checkLogin,adminOnly,(req,res)=>{
  res.sendFile(path.join(__dirname,"views/testcase.html"));
});

app.post("/add-testcase",checkLogin,adminOnly,(req,res)=>{
  const {title,description,expected}=req.body;

  db.query(
    "INSERT INTO testcases(title,description,expected) VALUES(?,?,?)",
    [title,description,expected],
    ()=>res.redirect("/dashboard")
  );
});

app.get("/view-testcases",checkLogin,adminOnly,(req,res)=>{
  db.query("SELECT * FROM testcases",(err,rows)=>{

    let html="<h2>Testcases</h2><table border='1'>";
    html+="<tr><th>ID</th><th>Title</th><th>Description</th><th>Expected</th></tr>";

    rows.forEach(r=>{
      html+=`<tr>
      <td>${r.id}</td>
      <td>${r.title}</td>
      <td>${r.description}</td>
      <td>${r.expected}</td>
      </tr>`;
    });

    html+="</table>";
    res.send(html);
  });
});


// BUG (USER + ADMIN)

app.get("/bug",checkLogin,(req,res)=>{
  res.sendFile(path.join(__dirname,"views/bug.html"));
});

app.post("/add-bug",checkLogin,(req,res)=>{
  const {title,description,severity}=req.body;

  db.query(
    "INSERT INTO bugs(title,description,severity) VALUES(?,?,?)",
    [title,description,severity],
    ()=>res.redirect("/dashboard")
  );
});

app.get("/view-bugs",checkLogin,(req,res)=>{
  db.query("SELECT * FROM bugs",(err,rows)=>{

    let html="<h2>Bugs</h2><table border='1'>";
    html+="<tr><th>ID</th><th>Title</th><th>Description</th><th>Severity</th></tr>";

    rows.forEach(r=>{
      html+=`<tr>
      <td>${r.id}</td>
      <td>${r.title}</td>
      <td>${r.description}</td>
      <td>${r.severity}</td>
      </tr>`;
    });

    html+="</table>";
    res.send(html);
  });
});

app.listen(3000,()=>{
  console.log("Server running http://localhost:3000/login");
});

const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "testtrack"
});

db.connect(err => {
    if (err) {
        console.log("DB error:", err);
    } else {
        console.log("Database connected");
    }
});

const express = require("express");
const path = require("path");

const app = express();

app.use(express.urlencoded({ extended: true }));


app.get("/", (req, res) => {
    res.redirect("/login");
});


app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "login.html"));
});
app.post("/login", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    if (email === "admin@test.com" && password === "1234") {
        res.redirect("/dashboard");
    } else {
        res.send("Invalid login");
    }
});

app.get("/dashboard", (req, res) => {
    const fs = require("fs");
    const sql = "SELECT COUNT(*) AS total FROM testcases";

    db.query(sql, (err, result) => {

        if (err) {
            res.send("Database error");
        } else {

            const total = result[0].total;
            let html = fs.readFileSync(path.join(__dirname, "views", "dashboard.html"), "utf8");
            
    
            html = html.replace("<p>0</p>", `<p>${total}</p>`);
            
            res.send(html);
        }
    });
});

app.get("/testcase", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "testcase.html"));
});

app.post("/add-testcase", (req, res) => {

    const { title, description, expected } = req.body;

    const sql =
        "INSERT INTO testcases (title, description, expected) VALUES (?, ?, ?)";

    db.query(sql, [title, description, expected], (err, result) => {

        if (err) {
            console.log(err);
            res.send("Database error");
        } else {
            
            res.redirect("/dashboard");
        }
    });
});


app.listen(3000, () => {
    console.log("Server running at http://localhost:3000/login");
});

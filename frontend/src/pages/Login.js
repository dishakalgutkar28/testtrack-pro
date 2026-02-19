import { useState, useEffect } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const login = () => {
    api.post("/login", { email, password })
      .then(res => {
        if (res.data.success && res.data.token) {

          // Store token
          localStorage.setItem("token", res.data.token);

          // Store role
          const role = res.data.role || "tester";
          localStorage.setItem("role", role);

          // Store user info
          localStorage.setItem("user", JSON.stringify({
            email: res.data.email || email,
            role
          }));

          // ⭐ ROLE-BASED REDIRECT
          if (role === "developer") {
            navigate("/developer-bugs");
          } 
          else if (role === "admin") {
            navigate("/admin/users");
          } 
          else {
            navigate("/dashboard"); // tester
          }

        } else {
          alert(res.data.message || "Login failed");
        }
      })
      .catch(err => {
        console.error(err);
        alert(err.response?.data?.message || "Login error");
      });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login</h2>

        <div className="form-group">
          <input
            className="input-field"
            placeholder="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <input
            className="input-field"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        <button className="login-btn" onClick={login}>
          Login
        </button>

        <p className="register-link">
          Don't have an account?{" "}
          <a onClick={() => navigate("/register")}>
            Register here
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;

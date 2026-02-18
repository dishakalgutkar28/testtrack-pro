import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import "./Register.css";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validatePassword = (pwd) => {
    const errors = [];
    if (pwd.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(pwd)) errors.push("One uppercase letter");
    if (!/[a-z]/.test(pwd)) errors.push("One lowercase letter");
    if (!/[0-9]/.test(pwd)) errors.push("One number");
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) 
      errors.push("One special character (!@#$%^&* etc)");
    return errors;
  };

  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    setPassword(pwd);
    if (pwd.length > 0) {
      setPasswordErrors(validatePassword(pwd));
    } else {
      setPasswordErrors([]);
    }
  };

  const register = () => {
    setError("");
    setSuccess("");
    
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    const errors = validatePassword(password);
    if (errors.length > 0) {
      setError("Password does not meet all requirements");
      return;
    }

    setLoading(true);
    // Only register as tester - no role selection on frontend
    api.post("/api/register", { email, password, role: "tester" })
      .then(() => {
        setSuccess("Registration successful! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Registration failed. Please try again.");
        setLoading(false);
      });
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2>Create Tester Account</h2>
        <p className="account-type-note">Register as a Tester</p>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <div className="form-group">
          <input 
            className="input-field"
            type="email"
            placeholder="Email" 
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
            onChange={handlePasswordChange}
          />
          {passwordErrors.length > 0 && (
            <div className="password-requirements">
              <p>Password must contain:</p>
              {passwordErrors.map((error, idx) => (
                <span key={idx} className="requirement-error">❌ {error}</span>
              ))}
            </div>
          )}
          {password.length > 0 && passwordErrors.length === 0 && (
            <span className="requirement-success">✓ Password meets all requirements</span>
          )}
        </div>

        <button 
          className="register-btn" 
          onClick={register}
          disabled={loading || passwordErrors.length > 0}
        >
          {loading ? "Registering..." : "Register as Tester"}
        </button>

        <p className="note">For Developer or Admin roles, please contact your administrator.</p>
        
        <p className="login-link">
          Already have an account? <a onClick={() => navigate("/login")}>Login here</a>
        </p>
      </div>
    </div>
  );
}

export default Register;

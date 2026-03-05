import { useState, useEffect } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import "./Register.css";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [lastRegisteredEmail, setLastRegisteredEmail] = useState("");
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const validatePassword = (pwd) => {
    const errors = [];
    if (pwd.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(pwd)) errors.push("One uppercase letter");
    if (!/[a-z]/.test(pwd)) errors.push("One lowercase letter");
    if (!/[0-9]/.test(pwd)) errors.push("One number");
    if (!/[!@#$%^&*()_+=[\]{};':"\\|,.<>/?]/.test(pwd)) 
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
    
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const errors = validatePassword(password);
    if (errors.length > 0) {
      setError("Password does not meet all requirements");
      return;
    }

    setLoading(true);
    // Only register as tester - no role selection on frontend
    api.post("/register", { email, password, role: "tester" })
      .then((res) => {
        setSuccess(res.data.message || "Registration successful! Please check your email to verify your account.");
        setLastRegisteredEmail(email);
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setPasswordErrors([]);
        setLoading(false);
        // Don't redirect immediately - user needs to verify email
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Registration failed. Please try again.");
        setLoading(false);
      });
  };

  const resendVerification = async () => {
    const targetEmail = (email || lastRegisteredEmail).trim();

    if (!targetEmail) {
      setError("Please enter your email to resend verification.");
      return;
    }

    setError("");
    setSuccess("");
    setResendLoading(true);

    try {
      const res = await api.post("/resend-verification", { email: targetEmail });
      setSuccess(res.data.message || "Verification email sent! Please check your inbox.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend verification email.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="register-container" style={{
      backgroundImage: 'url(/images/reg.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
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

        <div className="form-group">
          <input 
            className="input-field"
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />
          {confirmPassword.length > 0 && password.length > 0 && (
            confirmPassword === password ? (
              <span className="requirement-success">✓ Passwords match</span>
            ) : (
              <span className="requirement-error">❌ Passwords do not match</span>
            )
          )}
        </div>

        <button 
          className="register-btn" 
          onClick={register}
          disabled={loading || passwordErrors.length > 0 || password !== confirmPassword || !confirmPassword}
        >
          {loading ? "Registering..." : "Register as Tester"}
        </button>

        <button
          className="resend-btn"
          onClick={resendVerification}
          disabled={resendLoading}
          type="button"
        >
          {resendLoading ? "Sending..." : "Resend verification email"}
        </button>

        <p className="note">For Developer or Admin roles, please contact your administrator.</p>

        <div className="password-criteria">
          <p className="criteria-title">Password Criteria:</p>
          <ul className="criteria-list">
            <li>At least 8 characters</li>
            <li>One uppercase letter (A-Z)</li>
            <li>One lowercase letter (a-z)</li>
            <li>One number (0-9)</li>
            <li>One special character (!@#$%^&* etc)</li>
          </ul>
        </div>
        
        <p className="login-link">
          Already have an account? <button onClick={() => navigate("/login")} className="link-button">Login here</button>
        </p>
      </div>
    </div>
  );
}

export default Register;

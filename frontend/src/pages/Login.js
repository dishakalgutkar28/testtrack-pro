import { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import useFormValidation from "../hooks/useFormValidation";
import { loginSchema } from "../validators/schemas";
import FormError from "../components/FormError";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const redirectPath = location.state?.from;

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    const forceLogin = new URLSearchParams(location.search).get("force") === "true";
    if (token && !forceLogin) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, location.search]);

  const handleLogin = async (values) => {
    try {
      const res = await api.post("/login", values);
      
      if (res.data.success && res.data.token) {
        // Store both access and refresh tokens
        localStorage.setItem("token", res.data.token);
        
        if (res.data.refreshToken) {
          localStorage.setItem("refreshToken", res.data.refreshToken);
        }

        // Store role
        const role = res.data.role || "tester";
        localStorage.setItem("role", role);

        // Store user info
        localStorage.setItem("user", JSON.stringify({
          email: res.data.email || values.email,
          role,
          name: res.data.name || "Tester"
        }));

        // Show success message
        toast.success("Login successful! Welcome back.");

        const roleHome = {
          admin: "/admin/users",
          developer: "/developer-bugs",
          tester: "/dashboard"
        };

        navigate(redirectPath || roleHome[role] || "/dashboard");
      } else {
        toast.error(res.data.message || "Login failed");
      }
    } catch (err) {
      const errorData = err.response?.data;
      
      if (errorData?.requiresVerification) {
        setUnverifiedEmail(values.email);
        toast.warning("Please verify your email before logging in. Check your inbox for the verification link.");
      } else {
        setUnverifiedEmail("");
        if (err.response?.status === 401) {
          toast.error(errorData?.message || "Invalid email or password.");
        } else if (!err.response) {
          toast.error("Network error. Please check your connection.");
        } else {
          toast.error(errorData?.message || "Login failed. Please try again.");
        }
      }
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) {
      toast.warning("Enter your email and try login first.");
      return;
    }

    setResendLoading(true);
    try {
      const res = await api.post("/resend-verification", { email: unverifiedEmail });
      toast.success(res.data.message || "Verification email sent. Please check your inbox.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend verification email.");
    } finally {
      setResendLoading(false);
    }
  };

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit
  } = useFormValidation(
    { email: "", password: "" },
    handleLogin,
    loginSchema
  );

  return (
    <div 
      className="login-container"
      style={{
        backgroundImage: 'url(/images/image.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="login-branding">
        <h1 className="brand-title">TestTrack</h1>
        <p className="brand-tagline">
          <span className="brand-tagline-text">
            Plan tests, track bugs, and ship quality software with confidence.
          </span>
        </p>
      </div>

      <div className="login-card">
        <h2>Login</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              className={`input-field ${errors.email && touched.email ? 'input-error' : ''}`}
              placeholder="Email"
              type="email"
              name="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="email"
            />
            <FormError error={errors.email} touched={touched.email} />
          </div>

          <div className="form-group">
            <input
              className={`input-field ${errors.password && touched.password ? 'input-error' : ''}`}
              type="password"
              placeholder="Password"
              name="password"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="current-password"
            />
            <FormError error={errors.password} touched={touched.password} />
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={isSubmitting}
          >
            Login
          </button>
        </form>

        <p className="forgot-password-link">
          <button 
            onClick={() => navigate("/forgot-password")}
            className="link-button"
          >
            Forgot your password?
          </button>
        </p>

        {unverifiedEmail && (
          <p className="resend-link">
            Didn&apos;t get verification email?{" "}
            <button 
              onClick={handleResendVerification}
              className="link-button"
              disabled={resendLoading}
            >
              {resendLoading ? "Sending..." : "Resend now"}
            </button>
          </p>
        )}

        <p className="register-link">
          Don't have an account?{" "}
          <button 
            onClick={() => navigate("/register")}
            className="link-button"
          >
            Register here
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;

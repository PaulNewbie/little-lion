import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import authService from "../../services/authService"; // Import authService for password reset
import ErrorMessage from "../../components/common/ErrorMessage";
import "./LoginPage.css";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const user = await login(email, password);

      // --- 1. CHECK FOR FORCED PASSWORD CHANGE ---
      if (user.mustChangePassword) {
        navigate("/change-password");
        return; // Stop execution so they don't get to the dashboard
      }

      // --- 2. REGULAR NAVIGATION ---
      switch (user.role) {
        case "super_admin":
        case "admin":
          navigate("/admin/dashboard");
          break;
        case "teacher":
          navigate("/teacher/dashboard");
          break;
        case "parent":
          navigate("/parent/dashboard");
          break;
        case "therapist":
           navigate("/therapist/dashboard");
           break;
        default:
          navigate("/");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      handleLogin();
    }
  };

  // --- 3. FORGOT PASSWORD HANDLER ---
  const handleForgotPassword = async () => {
    const emailInput = prompt("Please enter your email address to reset your password:");
    if (emailInput) {
      try {
        await authService.resetPassword(emailInput);
        alert("Password reset email sent! Please check your inbox.");
      } catch (err) {
        alert("Error: " + err.message);
      }
    }
  };

  return (
    <>
      <div className="login-container">
        <div className="login-box">
          <h1 className="login-title">SPED School Monitoring</h1>

          <div>
            <div style={{ marginBottom: "20px" }}>
              <label className="login-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="login-input"
                placeholder="Enter your email"
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label className="login-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="login-input"
                placeholder="Enter your password"
              />
            </div>

            <ErrorMessage message={error} />

            <button
              onClick={handleLogin}
              disabled={loading}
              className="login-button"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            {/* --- FORGOT PASSWORD LINK --- */}
            <div style={{ textAlign: "right", marginTop: "15px" }}>
              <span 
                onClick={handleForgotPassword}
                style={{ 
                  color: "#007bff", 
                  cursor: "pointer", 
                  fontSize: "14px", 
                  textDecoration: "underline" 
                }}
              >
                Forgot Password?
              </span>
            </div>

          </div>

          <div className="demo-box">
            <strong>Demo Accounts:</strong>
            <div style={{ marginTop: "10px" }}>
              <div>Super Admin: super@school.com (Password: password123)</div>
              <div>Admin: admin@school.com (Password: password123)</div>
              <div>Teacher: teacher@school.com (Password: qwerty123)</div>
              <div>Therapist: maria@school.com (Password: qwerty123)</div>
              <div>Parent: revo@school.com (Password: Welcome123!)</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
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

      switch (user.role) {
        case "admin":
          navigate("/admin/dashboard");
          break;
        case "teacher":
          navigate("/teacher/dashboard");
          break;
        case "parent":
          navigate("/parent/dashboard");
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
          </div>

          <div className="demo-box">
            <strong>Demo Accounts:</strong>
            <div style={{ marginTop: "10px" }}>
              <div>Admin: admin@school.com (Password: password123)</div>
              <div>Teacher: teacherr@example.com (Password: Welcome123!)</div>
              <div>Parent: revo@gmail.com (Password: Welcome123!)</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;

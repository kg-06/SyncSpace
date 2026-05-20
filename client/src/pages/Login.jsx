import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState(1); // 1: request, 2: reset
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      setError("");
      setSuccessMessage("");
      const { data } = await API.post("/auth/login", {
        email,
        password
      });

      // store token
      localStorage.setItem("token", data.token);

      // redirect
      navigate("/dashboard");

    } catch (err) {
      console.log(err);
      const status = err.response?.status;
      const msg = err.response?.data?.message || "Login failed";
      if (status === 403) {
        setError("Your email is not verified yet. Please verify with OTP from the registration page, then try logging in again.");
      } else {
        setError(msg);
      }
    }
  };

  const handleRequestOtp = async () => {
    if (!forgotEmail) {
      setForgotError("Please enter your email");
      return;
    }
    try {
      setForgotError("");
      setForgotSuccess("");
      await API.post("/auth/forgot-password", { email: forgotEmail });
      setForgotSuccess("OTP sent to your email successfully!");
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.response?.data?.message || "Failed to send OTP");
    }
  };

  const handleResetPassword = async () => {
    if (!forgotOtp || !newPassword || !confirmPassword) {
      setForgotError("All fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError("Passwords do not match");
      return;
    }
    try {
      setForgotError("");
      await API.post("/auth/reset-password", {
        email: forgotEmail,
        otp: forgotOtp,
        newPassword
      });
      setSuccessMessage("Password reset successfully. Please log in with your new password.");
      setShowForgotModal(false);
    } catch (err) {
      setForgotError(err.response?.data?.message || "Reset password failed");
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "var(--bg-main)" }}>
      <div className="card" style={{ width: "100%", maxWidth: "400px", padding: "2.5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "700" }}>SyncSpace</h2>
          </div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: "600", color: "var(--text-main)" }}>Welcome back</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.5rem" }}>Enter your credentials to access your account</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {error && (
            <div style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", border: "1px solid rgba(239, 68, 68, 0.35)", backgroundColor: "rgba(239, 68, 68, 0.08)", color: "var(--danger)", fontSize: "0.9rem", fontWeight: "600" }}>
              {error}
            </div>
          )}

          {successMessage && (
            <div style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", border: "1px solid rgba(16, 185, 129, 0.35)", backgroundColor: "rgba(16, 185, 129, 0.08)", color: "var(--success)", fontSize: "0.9rem", fontWeight: "600" }}>
              {successMessage}
            </div>
          )}

          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>Email</label>
            <input
              type="email"
              placeholder="sample@syncspace.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: "10px 15px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", outline: "none", fontSize: "1rem" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", padding: "10px 15px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", outline: "none", fontSize: "1rem" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-0.2rem" }}>
            <button
              onClick={() => {
                setForgotEmail("");
                setForgotOtp("");
                setNewPassword("");
                setConfirmPassword("");
                setForgotStep(1);
                setForgotError("");
                setForgotSuccess("");
                setShowForgotModal(true);
              }}
              style={{ color: "var(--primary)", fontWeight: "500", background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", padding: 0 }}
            >
              Forgot Password?
            </button>
          </div>

          <button className="btn-primary" onClick={handleLogin} style={{ width: "100%", padding: "12px", marginTop: "1rem", fontSize: "1rem" }}>
            Sign in
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.9rem" }}>
          <span style={{ color: "var(--text-muted)" }}>Don't have an account? </span>
          <button onClick={() => navigate("/register")} style={{ color: "var(--primary)", fontWeight: "500", background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", padding: 0 }}>
            Sign up
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "400px",
              padding: "2rem",
              backgroundColor: "white",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem"
            }}
          >
            <div style={{ textAlign: "center" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: "700", marginBottom: "0.5rem" }}>Reset Password</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                {forgotStep === 1
                  ? "Enter your email address and we'll send you an OTP to reset your password."
                  : `Enter the 6-digit OTP code sent to ${forgotEmail}`}
              </p>
            </div>

            {forgotError && (
              <div style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", border: "1px solid rgba(239, 68, 68, 0.35)", backgroundColor: "rgba(239, 68, 68, 0.08)", color: "var(--danger)", fontSize: "0.85rem", fontWeight: "600" }}>
                {forgotError}
              </div>
            )}

            {forgotSuccess && (
              <div style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", border: "1px solid rgba(16, 185, 129, 0.35)", backgroundColor: "rgba(16, 185, 129, 0.08)", color: "var(--success)", fontSize: "0.85rem", fontWeight: "600" }}>
                {forgotSuccess}
              </div>
            )}

            {forgotStep === 1 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "500" }}>Email Address</label>
                  <input
                    type="email"
                    placeholder="sample@syncspace.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", outline: "none", fontSize: "0.95rem" }}
                  />
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "0.5rem" }}>
                  <button
                    onClick={() => setShowForgotModal(false)}
                    style={{ flex: 1, padding: "10px", borderRadius: "var(--radius-md)", backgroundColor: "var(--secondary)", color: "var(--text-main)", fontSize: "0.9rem", fontWeight: "500", border: "none", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestOtp}
                    className="btn-primary"
                    style={{ flex: 1, padding: "10px", fontSize: "0.9rem" }}
                  >
                    Send OTP
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "500" }}>OTP Code</label>
                  <input
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", outline: "none", fontSize: "0.95rem", letterSpacing: "2px", textAlign: "center" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "500" }}>New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", outline: "none", fontSize: "0.95rem" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "500" }}>Confirm Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", outline: "none", fontSize: "0.95rem" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "0.5rem" }}>
                  <button
                    onClick={() => setForgotStep(1)}
                    style={{ flex: 1, padding: "10px", borderRadius: "var(--radius-md)", backgroundColor: "var(--secondary)", color: "var(--text-main)", fontSize: "0.9rem", fontWeight: "500", border: "none", cursor: "pointer" }}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleResetPassword}
                    className="btn-primary"
                    style={{ flex: 1, padding: "10px", fontSize: "0.9rem" }}
                  >
                    Reset Password
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
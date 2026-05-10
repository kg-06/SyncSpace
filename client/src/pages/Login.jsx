import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      setError("");
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
    </div>
  );
}
import { useEffect, useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("register"); // register | otp
  const [pendingEmail, setPendingEmail] = useState("");
  const [resendIn, setResendIn] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const handleRegister = async () => {
    try {
      const { data } = await API.post("/auth/register", {
        name,
        email,
        password
      });

      setPendingEmail(data.email || email);
      setStep("otp");
      setResendIn(30);

    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  const handleResendOtp = async () => {
    try {
      const targetEmail = pendingEmail || email;
      if (!targetEmail) return;
      await API.post("/auth/resend-otp", { email: targetEmail });
      setResendIn(30);
      alert("OTP resent to your email");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to resend OTP");
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const { data } = await API.post("/auth/verify-otp", {
        email: pendingEmail || email,
        otp
      });

      localStorage.setItem("token", data.token);
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "OTP verification failed");
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "var(--bg-main)" }}>
      <div className="card" style={{ width: "100%", maxWidth: "400px", padding: "2.5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "700" }}>SyncSpace</h2>
          </div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: "600", color: "var(--text-main)" }}>
            {step === "register" ? "Create an account" : "Verify your email"}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.5rem" }}>
            {step === "register"
              ? "Get started with your free account"
              : `Enter the OTP sent to ${pendingEmail || email}`}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {step === "register" ? (
            <>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>Full Name</label>
                <input
                  type="text"
                  placeholder="Keshav Garg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: "100%", padding: "10px 15px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", outline: "none", fontSize: "1rem" }}
                />
              </div>

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

              <button className="btn-primary" onClick={handleRegister} style={{ width: "100%", padding: "12px", marginTop: "1rem", fontSize: "1rem" }}>
                Send OTP
              </button>
            </>
          ) : (
            <>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  style={{ width: "100%", padding: "10px 15px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", outline: "none", fontSize: "1rem", letterSpacing: "3px" }}
                />
              </div>

              <button className="btn-primary" onClick={handleVerifyOtp} style={{ width: "100%", padding: "12px", marginTop: "1rem", fontSize: "1rem" }}>
                Verify & Continue
              </button>

              <button
                type="button"
                disabled={resendIn > 0}
                onClick={handleResendOtp}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                  background: "transparent",
                  cursor: resendIn > 0 ? "not-allowed" : "pointer",
                  color: "var(--text-main)",
                  fontWeight: "600"
                }}
              >
                {resendIn > 0 ? `Resend OTP (${resendIn}s)` : "Resend OTP"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("register");
                  setOtp("");
                }}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0, marginTop: "10px" }}
              >
                Back
              </button>
            </>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.9rem" }}>
          <span style={{ color: "var(--text-muted)" }}>Already have an account? </span>
          <button onClick={() => navigate("/")} style={{ color: "var(--primary)", fontWeight: "500", background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", padding: 0 }}>
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
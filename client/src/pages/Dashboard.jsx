import { useEffect, useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useRoles } from "../hooks/useRoles";
export default function Dashboard() {
  const [workspaces, setWorkspaces] = useState([]);
  const [name, setName] = useState("");
  const navigate = useNavigate();

  // fetch workspaces
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const { data } = await API.get("/workspaces");
        setWorkspaces(data);
      } catch (err) {
        console.log(err);
      }
    };

    fetchWorkspaces();
  }, []);

  // create workspace
  const createWorkspace = async () => {
    try {
      const { data } = await API.post("/workspaces", { name });

      setWorkspaces([...workspaces, data]);
      setName("");
    } catch (err) {
      alert("Error creating workspace");
    }
  };

  const { userId } = useRoles();

  const activeWorkspaces = workspaces.filter(ws => {
    const me = ws.members?.find(m => {
      const id = typeof m.user === 'object' ? m.user._id : m.user;
      return id === userId;
    });
    return me && me.status !== "pending";
  });

  const pendingWorkspaces = workspaces.filter(ws => {
    const me = ws.members?.find(m => {
      const id = typeof m.user === 'object' ? m.user._id : m.user;
      return id === userId;
    });
    return me && me.status === "pending";
  });

  const acceptInvite = async (wsId) => {
    try {
      await API.post(`/workspaces/${wsId}/accept-invite`);
      // refetch workspaces
      const { data } = await API.get("/workspaces");
      setWorkspaces(data);
    } catch (err) {
      alert("Error accepting invite");
    }
  };

  return (
    <Layout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700" }}>Your Workspaces</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            placeholder="New Workspace Name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: "8px 15px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", outline: "none" }}
          />
          <button className="btn-primary" onClick={createWorkspace}>Create</button>
        </div>
      </div>

      {pendingWorkspaces.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "1rem", color: "var(--warning)" }}>Pending Invitations</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {pendingWorkspaces.map((ws) => (
              <div key={ws._id} className="card" style={{ display: "flex", flexDirection: "column", gap: "10px", border: "1px solid var(--warning)" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "600" }}>{ws.name}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>You have been invited.</p>
                <button className="btn-primary" style={{ backgroundColor: "var(--success)" }} onClick={() => acceptInvite(ws._id)}>Accept Invite</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "1rem" }}>Active Workspaces</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
        {activeWorkspaces.map((ws) => (
          <div
            key={ws._id}
            className="card"
            style={{ cursor: "pointer", transition: "transform 0.2s", display: "flex", flexDirection: "column", gap: "10px" }}
            onClick={() => navigate(`/workspace/${ws._id}`)}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ backgroundColor: "var(--primary)", color: "white", padding: "10px", borderRadius: "8px", fontWeight: "bold" }}>
                {ws.name.charAt(0).toUpperCase()}
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "600" }}>{ws.name}</h3>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "10px" }}>
              {ws.members?.length || 1} Members
            </p>
          </div>
        ))}
        {activeWorkspaces.length === 0 && (
          <p style={{ color: "var(--text-muted)" }}>No workspaces yet. Create one to get started!</p>
        )}
      </div>
    </Layout>
  );
}
import { useEffect, useState } from "react";
import API from "../api/axios";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { Users, Layout as LayoutIcon, Trash2 } from "lucide-react";
import { useRoles } from "../hooks/useRoles";
import { useSocket } from "../context/SocketContext";

export default function Workspace() {
  const { workspaceId } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [boards, setBoards] = useState([]);
  const [boardTitle, setBoardTitle] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [view, setView] = useState("boards"); // boards | members

  const { isLead, isOwner } = useRoles(workspace);
  const navigate = useNavigate();
  const socket = useSocket();

  const fetchWorkspaceAndBoards = async () => {
    try {
      const wsRes = await API.get(`/workspaces/${workspaceId}`);
      setWorkspace(wsRes.data);
      
      const boardsRes = await API.get(`/boards/workspace/${workspaceId}`);
      setBoards(boardsRes.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchWorkspaceAndBoards();
  }, [workspaceId]);

  useEffect(() => {
    if (socket) {
      const handleRefresh = (payload) => {
        if (payload.workspaceId === workspaceId) {
          fetchWorkspaceAndBoards();
        }
      };
      socket.on("refresh_workspace", handleRefresh);
      return () => socket.off("refresh_workspace", handleRefresh);
    }
  }, [socket, workspaceId]);

  const createBoard = async () => {
    if (!boardTitle) return;
    try {
      const { data } = await API.post("/boards", { title: boardTitle, workspaceId });
      setBoards([...boards, data]);
      setBoardTitle("");
    } catch (err) {
      alert("Error creating board");
    }
  };

  const deleteBoard = async (boardId) => {
    if (!window.confirm("Delete this board?")) return;
    try {
      await API.delete(`/boards/${boardId}`);
      setBoards((prev) => prev.filter((b) => b._id !== boardId));
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting board");
    }
  };

  const inviteMember = async () => {
    if (!inviteEmail) return;
    try {
      await API.post(`/workspaces/${workspaceId}/members`, { email: inviteEmail, role: inviteRole });
      alert("Invitation sent!");
      setInviteEmail("");
      fetchWorkspaceAndBoards();
    } catch (err) {
      alert(err.response?.data?.message || "Error inviting member");
    }
  };

  const deleteWorkspace = async () => {
    if (!window.confirm("Delete this workspace? This cannot be undone.")) return;
    try {
      await API.delete(`/workspaces/${workspaceId}`);
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting workspace");
    }
  };

  if (!workspace) return <Layout><p>Loading...</p></Layout>;

  return (
    <Layout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
        <div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "5px" }}>Workspace</p>
          <h1 style={{ fontSize: "1.8rem", fontWeight: "700" }}>{workspace.name}</h1>
        </div>
        {isOwner && (
          <button
            type="button"
            onClick={deleteWorkspace}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--danger)",
              color: "var(--danger)",
              background: "transparent",
              fontWeight: "700",
              cursor: "pointer"
            }}
          >
            <Trash2 size={16} />
            Delete Workspace
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: "2rem", borderBottom: "1px solid var(--border)", marginBottom: "2rem" }}>
        <button onClick={() => setView("boards")} style={{ padding: "10px 0", borderBottom: view === "boards" ? "2px solid var(--primary)" : "none", fontWeight: view === "boards" ? "600" : "500", display: "flex", alignItems: "center", gap: "8px", color: view === "boards" ? "var(--primary)" : "var(--text-muted)" }}>
          <LayoutIcon size={18} /> Boards
        </button>
        <button onClick={() => setView("members")} style={{ padding: "10px 0", borderBottom: view === "members" ? "2px solid var(--primary)" : "none", fontWeight: view === "members" ? "600" : "500", display: "flex", alignItems: "center", gap: "8px", color: view === "members" ? "var(--primary)" : "var(--text-muted)" }}>
          <Users size={18} /> Members
        </button>
      </div>

      {view === "boards" && (
        <>
          {isLead && (
            <div style={{ marginBottom: "2rem", display: "flex", gap: "10px" }}>
              <input
                placeholder="New Board Title..."
                value={boardTitle}
                onChange={(e) => setBoardTitle(e.target.value)}
                style={{ padding: "8px 15px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", outline: "none" }}
              />
              <button className="btn-primary" onClick={createBoard}>Create Board</button>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {boards.map((board) => (
              <div
                key={board._id}
                className="card"
                style={{ cursor: "pointer", transition: "transform 0.2s", position: "relative" }}
                onClick={() => navigate(`/workspace/${workspaceId}/board/${board._id}`)}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                {isLead && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteBoard(board._id);
                    }}
                    title="Delete board"
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      border: "none",
                      background: "transparent",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: "4px"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "10px" }}>{board.title}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  {board.columns?.length || 0} Columns
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {view === "members" && (
        <div style={{ maxWidth: "600px" }}>
          {isLead && (
            <div className="card" style={{ display: "flex", gap: "10px", marginBottom: "2rem", alignItems: "center" }}>
              <input
                type="email"
                placeholder="User Email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                style={{ flex: 1, padding: "8px 15px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", outline: "none" }}
              />
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} style={{ padding: "8px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                <option value="member">Member</option>
                <option value="lead">Lead</option>
              </select>
              <button className="btn-primary" onClick={inviteMember}>Invite</button>
            </div>
          )}

          <div className="card" style={{ padding: "0" }}>
            {workspace.members.map((m, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem", borderBottom: idx !== workspace.members.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div>
                  <p style={{ fontWeight: "600", margin: 0 }}>{m.user?.name || m.user?.email || "Unknown"}</p>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>Role: <span style={{ textTransform: "capitalize" }}>{m.role}</span></p>
                </div>
                <div>
                  {m.status === "pending" ? (
                    <span style={{ fontSize: "0.8rem", backgroundColor: "var(--warning)", color: "white", padding: "4px 8px", borderRadius: "12px", fontWeight: "600" }}>Pending Invite</span>
                  ) : (
                    <span style={{ fontSize: "0.8rem", backgroundColor: "var(--success)", color: "white", padding: "4px 8px", borderRadius: "12px", fontWeight: "600" }}>Active</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}

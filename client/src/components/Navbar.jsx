import { useState, useEffect, useRef } from "react";
import { Bell, Search, Home, Check, ChevronDown, LogOut } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import { useSocket } from "../context/SocketContext";

const Navbar = () => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [me, setMe] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ workspaces: [], boards: [], tasks: [] });
  const [showSearch, setShowSearch] = useState(false);

  const navigate = useNavigate();
  const socket = useSocket();
  const notifRef = useRef(null);
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    // Fetch notifications on load
    const fetchNotifications = async () => {
      try {
        const { data } = await API.get("/notifications");
        setNotifications(data);
      } catch (err) {
        console.error("Error fetching notifications", err);
      }
    };
    fetchNotifications();

    if (socket) {
      socket.on("notification", (newNotif) => {
        setNotifications((prev) => [newNotif, ...prev]);
      });
      return () => socket.off("notification");
    }
  }, [socket]);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setMe(null);
          return;
        }
        const { data } = await API.get("/auth/me");
        setMe(data);
      } catch (err) {
        setMe(null);
      }
    };
    fetchMe();
  }, []);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setMe(null);
    setShowUserMenu(false);
    navigate("/");
  };

  const handleSearch = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults({ workspaces: [], boards: [], tasks: [] });
      setShowSearch(false);
      return;
    }

    try {
      const { data } = await API.get(`/search?q=${q}`);
      setSearchResults(data);
      setShowSearch(true);
    } catch (err) {
      console.error("Search failed", err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {}
  };

  const markAllAsRead = async () => {
    try {
      await API.put("/notifications/read-all");
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {}
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="header" style={{ position: "relative", zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <Link to="/dashboard" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: "700", margin: 0, color: "var(--text-main)" }}>SyncSpace</h2>
        </Link>
        
        <div style={{ position: "relative", width: "300px" }} ref={searchRef}>
          <Search size={18} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input 
            type="text" 
            placeholder="Search Workspaces, Boards, Tasks..." 
            value={searchQuery}
            onChange={handleSearch}
            onFocus={() => { if (searchQuery.length >= 2) setShowSearch(true); }}
            style={{ width: "100%", padding: "10px 10px 10px 35px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", outline: "none", backgroundColor: "var(--bg-main)" }}
          />
          
          {showSearch && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: "10px", backgroundColor: "var(--bg-main)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)", maxHeight: "400px", overflowY: "auto", padding: "10px" }}>
              {searchResults.workspaces.length === 0 && searchResults.boards.length === 0 && searchResults.tasks.length === 0 && (
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", margin: "10px 0" }}>No results found</p>
              )}
              
              {searchResults.workspaces.length > 0 && (
                <div style={{ marginBottom: "10px" }}>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold", marginBottom: "5px" }}>Workspaces</p>
                  {searchResults.workspaces.map(ws => (
                    <div key={ws._id} style={{ padding: "8px", borderRadius: "var(--radius-sm)", cursor: "pointer" }} onClick={() => { navigate(`/workspace/${ws._id}`); setShowSearch(false); }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--secondary)"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                      {ws.name}
                    </div>
                  ))}
                </div>
              )}

              {searchResults.boards.length > 0 && (
                <div style={{ marginBottom: "10px" }}>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold", marginBottom: "5px" }}>Boards</p>
                  {searchResults.boards.map(b => (
                    <div key={b._id} style={{ padding: "8px", borderRadius: "var(--radius-sm)", cursor: "pointer" }} onClick={() => { navigate(`/workspace/${b.workspace}/board/${b._id}`); setShowSearch(false); }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--secondary)"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                      {b.title}
                    </div>
                  ))}
                </div>
              )}

              {searchResults.tasks.length > 0 && (
                <div>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold", marginBottom: "5px" }}>Tasks</p>
                  {searchResults.tasks.map(t => (
                    <div key={t._id} style={{ padding: "8px", borderRadius: "var(--radius-sm)", cursor: "pointer" }} onClick={() => { navigate(`/workspace/${t.workspaceId}/board/${t.boardId}`); setShowSearch(false); }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--secondary)"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                      {t.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <button onClick={() => navigate("/dashboard")} style={{ color: "var(--text-muted)", border: "none", background: "none", cursor: "pointer" }}>
          <Home size={24} />
        </button>

        <div style={{ position: "relative" }} ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ position: "relative", color: "var(--text-muted)", border: "none", background: "none", cursor: "pointer" }}
          >
            <Bell size={24} />
            {unreadCount > 0 && (
              <span style={{ position: "absolute", top: "0", right: "0", width: "10px", height: "10px", backgroundColor: "var(--danger)", borderRadius: "50%", border: "2px solid white" }}></span>
            )}
          </button>

          {showNotifications && (
            <div style={{ position: "absolute", top: "100%", right: 0, marginTop: "10px", width: "350px", backgroundColor: "var(--bg-main)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)", maxHeight: "400px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", borderBottom: "1px solid var(--border)" }}>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: "600" }}>Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "0.8rem", cursor: "pointer", fontWeight: "500" }}>Mark all as read</button>
                )}
              </div>
              
              <div style={{ padding: "10px" }}>
                {notifications.length === 0 ? (
                  <p style={{ textAlign: "center", color: "var(--text-muted)", margin: "20px 0" }}>No notifications yet</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n._id} style={{ display: "flex", gap: "10px", padding: "10px", borderRadius: "var(--radius-sm)", backgroundColor: n.read ? "transparent" : "rgba(var(--primary-rgb), 0.05)", marginBottom: "5px" }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-main)", fontWeight: n.read ? "400" : "500" }}>{n.message}</p>
                        <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>{new Date(n.createdAt).toLocaleString()}</p>
                        {n.link && (
                          <button onClick={() => { navigate(n.link); setShowNotifications(false); }} style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "0.8rem", cursor: "pointer", padding: 0, marginTop: "5px" }}>View</button>
                        )}
                      </div>
                      {!n.read && (
                        <button onClick={() => markAsRead(n._id)} style={{ background: "none", border: "none", color: "var(--success)", cursor: "pointer", padding: "0 5px" }} title="Mark as read">
                          <Check size={16} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div
          ref={userMenuRef}
          style={{ position: "relative", display: "flex", alignItems: "center" }}
          onMouseEnter={() => setShowUserMenu(true)}
          onMouseLeave={() => setShowUserMenu(false)}
        >
          <button
            type="button"
            onClick={() => setShowUserMenu((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg-main)",
              padding: "8px 12px",
              borderRadius: "999px",
              cursor: "pointer"
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "var(--primary)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                fontSize: "0.9rem"
              }}
            >
              {(me?.name || me?.email || "U").slice(0, 1).toUpperCase()}
            </div>

            <span style={{ fontWeight: "600", color: "var(--text-main)", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {me?.name || me?.email || "User"}
            </span>

            <ChevronDown size={16} style={{ color: "var(--text-muted)" }} />
          </button>

          {showUserMenu && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 10px)",
                right: 0,
                minWidth: "220px",
                backgroundColor: "var(--bg-main)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-md)",
                overflow: "hidden"
              }}
            >
              <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
                <p style={{ margin: 0, fontWeight: "700", color: "var(--text-main)" }}>{me?.name || "User"}</p>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "2px" }}>{me?.email || ""}</p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 14px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  color: "var(--danger)",
                  fontWeight: "600"
                }}
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

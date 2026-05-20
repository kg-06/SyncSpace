import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import API from "../api/axios";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import Layout from "../components/Layout";
import { useRoles } from "../hooks/useRoles";
import { Plus, Trash2, ArrowLeft, ChevronLeft, ChevronRight, X, MessageSquare, Clock, UserCheck } from "lucide-react";
import { useSocket } from "../context/SocketContext";

export default function Board() {
  const { workspaceId, id } = useParams();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);
  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState({});

  const { isLead, isMember, userId } = useRoles(workspace);
  const socket = useSocket();

  // Scroll states and ref
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Modal states and ref
  const [activeTask, setActiveTask] = useState(null);
  const activeTaskRef = useRef(null);
  const [commentText, setCommentText] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [modalPriority, setModalPriority] = useState("");
  const [modalAssignedTo, setModalAssignedTo] = useState([]);

  // Create task modal states
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [createTaskColumnId, setCreateTaskColumnId] = useState(null);
  const [createTaskTitle, setCreateTaskTitle] = useState("");
  const [createTaskDescription, setCreateTaskDescription] = useState("");
  const [createTaskPriority, setCreateTaskPriority] = useState("medium");
  const [createTaskAssignedTo, setCreateTaskAssignedTo] = useState([]);

  useEffect(() => {
    activeTaskRef.current = activeTask;
  }, [activeTask]);

  const fetchData = async () => {
    try {
      const wsRes = await API.get(`/workspaces/${workspaceId}`);
      setWorkspace(wsRes.data);

      const boardRes = await API.get(`/boards/${id}`);
      setBoard(boardRes.data);

      const colRes = await API.get(`/columns/board/${id}`);
      setColumns(colRes.data);

      const tasksMap = {};
      let freshActiveTask = null;
      for (let col of colRes.data) {
        const taskRes = await API.get(`/tasks/column/${col._id}`);
        tasksMap[col._id] = taskRes.data;
        if (activeTaskRef.current) {
          const found = taskRes.data.find(t => t._id === activeTaskRef.current._id);
          if (found) freshActiveTask = found;
        }
      }
      setTasks(tasksMap);
      if (freshActiveTask) {
        setActiveTask(freshActiveTask);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [workspaceId, id]);

  useEffect(() => {
    if (socket) {
      const handleRefresh = (payload) => {
        if (payload.boardId === id) {
          fetchData();
        }
      };
      const handleRemoved = (payload) => {
        if (payload.workspaceId === workspaceId) {
          alert("You have been removed from this workspace.");
          navigate("/dashboard");
        }
      };
      socket.on("refresh_board", handleRefresh);
      socket.on("workspace_removed", handleRemoved);
      return () => {
        socket.off("refresh_board", handleRefresh);
        socket.off("workspace_removed", handleRemoved);
      };
    }
  }, [socket, id, workspaceId, navigate]);

  // Scroll functionality
  const checkForScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkForScroll);
      window.addEventListener("resize", checkForScroll);
      checkForScroll();
    }
    return () => {
      if (el) {
        el.removeEventListener("scroll", checkForScroll);
      }
      window.removeEventListener("resize", checkForScroll);
    };
  }, [columns, tasks]);

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  // Modal Handlers
  const openTaskModal = (task) => {
    setActiveTask(task);
    setModalDescription(task.description || "");
    setModalPriority(task.priority || "medium");
    setModalAssignedTo(task.assignedTo ? task.assignedTo.map(u => u._id || u) : []);
    setCommentText("");
  };

  const handleUpdateTask = async () => {
    if (!activeTask) return;
    try {
      await API.put(`/tasks/${activeTask._id}`, {
        description: modalDescription,
        priority: modalPriority,
        assignedTo: modalAssignedTo
      });
      alert("Task updated successfully!");
      await fetchData();
      setActiveTask(null);
    } catch (err) {
      alert("Error updating task: " + (err.response?.data?.message || err.message));
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !activeTask) return;
    try {
      const { data } = await API.post(`/tasks/${activeTask._id}/comments`, {
        text: commentText
      });
      setActiveTask(data);
      setCommentText("");
      fetchData();
    } catch (err) {
      alert("Error adding comment: " + (err.response?.data?.message || err.message));
    }
  };

  const handleMarkForReview = async () => {
    if (!activeTask) return;
    try {
      const { data } = await API.post(`/tasks/${activeTask._id}/mark-review`);
      setActiveTask(data);
      fetchData();
      alert("Task marked for review!");
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  const handleReviewTask = async () => {
    if (!activeTask) return;
    try {
      const { data } = await API.post(`/tasks/${activeTask._id}/review`);
      setActiveTask(data);
      fetchData();
      alert("Task reviewed!");
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  const createColumn = async () => {
    const title = prompt("Enter column name");
    if (!title) return;

    try {
      const { data } = await API.post("/columns", { title, boardId: id });
      setColumns([...columns, data]);
      setTasks((prev) => ({ ...prev, [data._id]: [] }));
    } catch {
      alert("Error creating column");
    }
  };

  const deleteColumn = async (columnId) => {
    if (!window.confirm("Are you sure you want to delete this column and all its tasks?")) return;
    try {
      await API.delete(`/columns/${columnId}`);
      setColumns(columns.filter(c => c._id !== columnId));
      const newTasks = { ...tasks };
      delete newTasks[columnId];
      setTasks(newTasks);
    } catch {
      alert("Error deleting column");
    }
  };

  const createTask = (columnId) => {
    setCreateTaskColumnId(columnId);
    setCreateTaskTitle("");
    setCreateTaskDescription("");
    setCreateTaskPriority("medium");
    setCreateTaskAssignedTo([]);
    setIsCreatingTask(true);
  };

  const handleCreateTaskSubmit = async () => {
    if (!createTaskTitle.trim()) {
      alert("Task title is required");
      return;
    }
    if (createTaskAssignedTo.length === 0) {
      alert("At least one assignee is required");
      return;
    }
    try {
      await API.post("/tasks", {
        title: createTaskTitle,
        description: createTaskDescription,
        priority: createTaskPriority,
        assignedTo: createTaskAssignedTo,
        columnId: createTaskColumnId
      });
      setIsCreatingTask(false);
      fetchData();
    } catch (err) {
      alert("Error creating task: " + (err.response?.data?.message || err.message));
    }
  };

  const deleteTask = async (taskId, columnId) => {
    if (!window.confirm("Delete task?")) return;
    try {
      await API.delete(`/tasks/${taskId}`);
      fetchData();
    } catch {
      alert("Error deleting task");
    }
  };

  const handleDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceColId = source.droppableId;
    const targetColId = destination.droppableId;
    const taskId = result.draggableId;

    if (sourceColId === targetColId && source.index === destination.index) return;

    const sourceCol = [...(tasks[sourceColId] || [])];
    const destCol = sourceColId === targetColId ? sourceCol : [...(tasks[targetColId] || [])];
    
    const [movedTask] = sourceCol.splice(source.index, 1);
    destCol.splice(destination.index, 0, movedTask);

    setTasks((prev) => ({
      ...prev,
      [sourceColId]: sourceCol,
      [targetColId]: destCol
    }));

    try {
      if (sourceColId !== targetColId) {
        await API.put(`/tasks/${taskId}/move`, {
          sourceColumnId: sourceColId,
          targetColumnId: targetColId
        });
      }
      fetchData();
    } catch {
      alert("Move failed. State might be out of sync. Please refresh.");
    }
  };

  if (!board) return <Layout><p>Loading...</p></Layout>;

  return (
    <Layout>
      <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "2rem" }}>
        <button onClick={() => navigate(`/workspace/${workspaceId}`)} style={{ padding: "8px", borderRadius: "50%", backgroundColor: "var(--secondary)", color: "var(--text-main)" }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: "1.8rem", fontWeight: "700" }}>{board.title}</h1>
      </div>

      <div style={{ position: "relative" }}>
        {/* Horizontal scroll helpers (glassmorphism style) */}
        {showLeftArrow && (
          <button 
            onClick={() => handleScroll("left")}
            style={{
              position: "absolute",
              left: "-15px",
              top: "150px",
              zIndex: 10,
              background: "rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(6px)",
              border: "1px solid var(--border)",
              borderRadius: "50%",
              width: "44px",
              height: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--shadow-md)",
              cursor: "pointer",
              color: "var(--text-main)",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
              e.currentTarget.style.backgroundColor = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
            }}
          >
            <ChevronLeft size={22} />
          </button>
        )}

        {showRightArrow && (
          <button 
            onClick={() => handleScroll("right")}
            style={{
              position: "absolute",
              right: "-15px",
              top: "150px",
              zIndex: 10,
              background: "rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(6px)",
              border: "1px solid var(--border)",
              borderRadius: "50%",
              width: "44px",
              height: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--shadow-md)",
              cursor: "pointer",
              color: "var(--text-main)",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
              e.currentTarget.style.backgroundColor = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
            }}
          >
            <ChevronRight size={22} />
          </button>
        )}

        <div 
          ref={scrollRef}
          className="no-scrollbar"
          style={{ display: "flex", gap: "20px", overflowX: "auto", paddingBottom: "20px", minHeight: "calc(100vh - 200px)" }}
        >
          <DragDropContext onDragEnd={handleDragEnd}>
            {columns.map((col) => (
              <div key={col._id} style={{ minWidth: "300px", width: "300px", backgroundColor: "var(--secondary)", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", height: "max-content", maxHeight: "100%" }}>
                <div style={{ padding: "15px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, backgroundColor: "var(--secondary)", zIndex: 1, borderTopLeftRadius: "var(--radius-lg)", borderTopRightRadius: "var(--radius-lg)" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "var(--primary)" }}></span>
                    {col.title} <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: "normal" }}>{tasks[col._id]?.length || 0}</span>
                  </h3>
                  {isLead && (
                    <button onClick={() => deleteColumn(col._id)} style={{ color: "var(--text-muted)" }}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <Droppable droppableId={col._id} isDropDisabled={!isMember}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        flex: 1,
                        padding: "15px",
                        overflowY: "auto",
                        backgroundColor: snapshot.isDraggingOver ? "rgba(99, 102, 241, 0.05)" : "transparent",
                        transition: "background-color 0.2s ease"
                      }}
                    >
                      {(() => {
                        const priorityWeight = { high: 3, medium: 2, low: 1 };
                        const sortedTasks = [...(tasks[col._id] || [])].sort((a, b) => {
                          const wA = priorityWeight[a.priority] || 2;
                          const wB = priorityWeight[b.priority] || 2;
                          return wB - wA;
                        });
                        return sortedTasks.map((task, index) => {
                          const canMove = task.assignedTo && task.assignedTo.length > 0
                            ? task.assignedTo.some(u => (u._id || u) === userId) || (task.assignedBy?._id || task.assignedBy) === userId
                            : true;

                          return (
                            <Draggable key={task._id} draggableId={task._id} index={index} isDragDisabled={!isMember || !canMove}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="card"
                                  onClick={() => openTaskModal(task)}
                                  style={{
                                    padding: "15px",
                                    marginBottom: "10px",
                                    backgroundColor: "white",
                                    boxShadow: snapshot.isDragging ? "var(--shadow-lg)" : "var(--shadow-sm)",
                                    transform: snapshot.isDragging ? "rotate(2deg)" : "none",
                                    cursor: "pointer",
                                    ...provided.draggableProps.style
                                  }}
                                >
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <p style={{ fontSize: "0.95rem", fontWeight: "500", color: "var(--text-main)", margin: 0 }}>{task.title}</p>
                                    {(isLead || (task.assignedBy?._id || task.assignedBy) === userId) && (
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteTask(task._id, col._id);
                                        }} 
                                        style={{ color: "var(--text-muted)", padding: "2px" }}
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    )}
                                  </div>

                                  {/* Assignee Badges */}
                                  {task.assignedTo && task.assignedTo.length > 0 && (
                                    <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "5px" }}>
                                      {task.assignedTo.map(u => (
                                        <span 
                                          key={u._id || u} 
                                          style={{ 
                                            fontSize: "0.7rem", 
                                            backgroundColor: "rgba(99, 102, 241, 0.1)", 
                                            color: "var(--primary)", 
                                            padding: "2px 6px", 
                                            borderRadius: "4px",
                                            fontWeight: "500"
                                          }}
                                        >
                                          {u.name || u.email}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {/* Review Badges */}
                                  {task.reviewStatus === "pending" && (
                                    <div style={{ marginTop: "8px", fontSize: "0.75rem", color: "var(--warning)", fontWeight: "600" }}>
                                      Pending Review ⏳
                                    </div>
                                  )}
                                  {task.reviewStatus === "reviewed" && task.reviewedBy && (
                                    <div style={{ marginTop: "8px", fontSize: "0.75rem", color: "var(--success)", fontWeight: "600" }}>
                                      Reviewed by: {task.reviewedBy.name || task.reviewedBy.email} ✅
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          );
                        });
                      })()}
                      {provided.placeholder}
                      
                      {isMember && (
                        <button
                          onClick={() => createTask(col._id)}
                          style={{
                            width: "100%", padding: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: "var(--text-muted)", fontWeight: "500", borderRadius: "var(--radius-md)", border: "1px dashed var(--border)", marginTop: "10px"
                          }}
                        >
                          <Plus size={16} /> Add Task
                        </button>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
            
            {isLead && (
              <div style={{ minWidth: "300px", width: "300px" }}>
                <button
                  onClick={createColumn}
                  style={{
                    width: "100%", padding: "15px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: "var(--text-main)", fontWeight: "600", borderRadius: "var(--radius-lg)", border: "1px dashed var(--border)", backgroundColor: "transparent"
                  }}
                >
                  <Plus size={18} /> Add Column
                </button>
              </div>
            )}
          </DragDropContext>
        </div>
      </div>

      {/* Task Details Modal */}
      {activeTask && (
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
          onClick={() => setActiveTask(null)}
        >
          <div 
            style={{
              backgroundColor: "white",
              borderRadius: "var(--radius-xl)",
              width: "650px",
              maxWidth: "95vw",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "2rem",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              position: "relative",
              border: "1px solid rgba(255, 255, 255, 0.2)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ fontSize: "1.4rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "4px" }}>
                  {activeTask.title}
                </h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
                  In Column: {columns.find(c => c._id === activeTask.column)?.title || "Unknown"}
                </p>
              </div>
              <button 
                onClick={() => setActiveTask(null)}
                style={{
                  background: "var(--secondary)",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--border)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--secondary)"}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Description */}
              <div>
                <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "600", marginBottom: "8px" }}>
                  Description
                </label>
                <textarea
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  disabled={!isMember}
                  placeholder="Add a detailed description..."
                  style={{
                    width: "100%",
                    minHeight: "80px",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    fontFamily: "inherit",
                    fontSize: "0.9rem",
                    outline: "none",
                    resize: "vertical"
                  }}
                />
              </div>

              {/* Settings: Priority, Assigned By */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "600", marginBottom: "8px" }}>
                    Priority
                  </label>
                  <select
                    value={modalPriority}
                    onChange={(e) => setModalPriority(e.target.value)}
                    disabled={!isMember}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border)",
                      fontSize: "0.9rem"
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "600", marginBottom: "8px" }}>
                    Assigned By
                  </label>
                  <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", padding: "8px 0" }}>
                    {activeTask.assignedBy?.name || activeTask.assignedBy?.email || "Unassigned"}
                  </div>
                </div>
              </div>

              {/* Assignees Selection (Multi-select Checklist) */}
              <div>
                <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "600", marginBottom: "8px" }}>
                  Assign Task To (Select Members)
                </label>
                {isMember ? (
                  (() => {
                    const isCreator = activeTask && (
                      activeTask.assignedBy?._id === userId ||
                      activeTask.assignedBy === userId ||
                      !activeTask.assignedBy
                    );
                    return (
                      <div>
                        <div 
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "10px",
                            maxHeight: "120px",
                            overflowY: "auto",
                            padding: "10px",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-md)",
                            opacity: isCreator ? 1 : 0.7,
                            pointerEvents: isCreator ? "auto" : "none"
                          }}
                        >
                          {(workspace?.members?.filter(m => m.status === "accepted") || []).map((m) => {
                            const user = m.user;
                            if (!user) return null;
                            const isChecked = modalAssignedTo.includes(user._id);
                            return (
                              <label 
                                key={user._id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  fontSize: "0.85rem",
                                  cursor: isCreator ? "pointer" : "default",
                                  backgroundColor: isChecked ? "rgba(99, 102, 241, 0.08)" : "var(--secondary)",
                                  padding: "6px 12px",
                                  borderRadius: "16px",
                                  border: isChecked ? "1px solid var(--primary)" : "1px solid transparent",
                                  transition: "all 0.15s"
                                }}
                              >
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={!isCreator}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setModalAssignedTo([...modalAssignedTo, user._id]);
                                    } else {
                                      setModalAssignedTo(modalAssignedTo.filter(id => id !== user._id));
                                    }
                                  }}
                                  style={{ cursor: isCreator ? "pointer" : "default" }}
                                />
                                {user.name || user.email}
                              </label>
                            );
                          })}
                        </div>
                        {!isCreator && (
                          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px", margin: 0 }}>
                            * Only the task creator ({activeTask.assignedBy?.name || activeTask.assignedBy?.email || "Unknown"}) can modify assignees.
                          </p>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                    {activeTask.assignedTo && activeTask.assignedTo.length > 0 ? (
                      activeTask.assignedTo.map(u => (
                        <span key={u._id} style={{ fontSize: "0.8rem", backgroundColor: "var(--secondary)", padding: "4px 8px", borderRadius: "12px" }}>
                          {u.name || u.email}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>None</span>
                    )}
                  </div>
                )}
              </div>

              {/* Review Section */}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "15px" }}>
                <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "600", marginBottom: "8px" }}>
                  Review Status
                </label>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    {activeTask.reviewStatus === "none" && (
                      <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Clock size={16} /> Not submitted for review yet.
                      </span>
                    )}
                    {activeTask.reviewStatus === "pending" && (
                      <span style={{ fontSize: "0.9rem", color: "var(--warning)", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Clock size={16} /> Pending Review ⏳
                      </span>
                    )}
                    {activeTask.reviewStatus === "reviewed" && (
                      <span style={{ fontSize: "0.9rem", color: "var(--success)", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                        <UserCheck size={16} /> Reviewed by {activeTask.reviewedBy?.name || activeTask.reviewedBy?.email} ✅
                      </span>
                    )}
                  </div>

                  <div>
                    {/* Mark for review: current user is one of the assignees, and task is not pending or reviewed */}
                    {activeTask.reviewStatus === "none" && 
                     activeTask.assignedTo?.some(u => (u._id || u) === userId) && (
                      <button 
                        onClick={handleMarkForReview}
                        className="btn-primary"
                        style={{ padding: "6px 12px", fontSize: "0.85rem" }}
                      >
                        Mark for Review
                      </button>
                    )}

                    {/* Review task: current user is NOT an assignee, and status is pending */}
                    {activeTask.reviewStatus === "pending" && 
                     !activeTask.assignedTo?.some(u => (u._id || u) === userId) && (
                      <button 
                        onClick={handleReviewTask}
                        className="btn-primary"
                        style={{ padding: "6px 12px", fontSize: "0.85rem", backgroundColor: "var(--success)" }}
                      >
                        Review Task
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "15px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.9rem", fontWeight: "600", marginBottom: "8px" }}>
                  <MessageSquare size={16} /> Comments ({activeTask.comments?.length || 0})
                </label>

                {/* Comment List */}
                <div 
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    maxHeight: "150px",
                    overflowY: "auto",
                    marginBottom: "10px",
                    paddingRight: "5px"
                  }}
                >
                  {activeTask.comments && activeTask.comments.length > 0 ? (
                    activeTask.comments.map((comment, index) => (
                      <div key={index} style={{ padding: "10px", backgroundColor: "var(--secondary)", borderRadius: "var(--radius-md)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span style={{ fontSize: "0.8rem", fontWeight: "600" }}>
                            {comment.user?.name || comment.user?.email || "Unknown Member"}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p style={{ fontSize: "0.85rem", margin: 0, color: "var(--text-main)" }}>{comment.text}</p>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic", margin: 0 }}>
                      No comments yet. Start the conversation!
                    </p>
                  )}
                </div>

                {/* Comment Input */}
                {isMember && (
                  <div style={{ display: "flex", gap: "10px" }}>
                    <textarea 
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      rows={1}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border)",
                        fontFamily: "inherit",
                        fontSize: "0.85rem",
                        outline: "none",
                        resize: "none"
                      }}
                    />
                    <button 
                      onClick={handleAddComment}
                      className="btn-primary"
                      style={{ padding: "8px 15px", fontSize: "0.85rem" }}
                    >
                      Send
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            {isMember && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "15px", marginTop: "10px" }}>
                <div>
                  {(isLead || (activeTask.assignedBy?._id || activeTask.assignedBy) === userId) && (
                    <button
                      onClick={async () => {
                        if (window.confirm("Are you sure you want to delete this task?")) {
                          await deleteTask(activeTask._id, activeTask.column);
                          setActiveTask(null);
                        }
                      }}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "var(--radius-md)",
                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                        color: "var(--danger)",
                        fontSize: "0.9rem",
                        fontWeight: "600",
                        border: "none",
                        cursor: "pointer"
                      }}
                    >
                      Delete Task
                    </button>
                  )}
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button 
                    onClick={() => setActiveTask(null)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--secondary)",
                      color: "var(--text-main)",
                      fontSize: "0.9rem",
                      fontWeight: "500"
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpdateTask}
                    className="btn-primary"
                    style={{
                      padding: "8px 16px",
                      fontSize: "0.9rem",
                      fontWeight: "500"
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {isCreatingTask && (
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
          onClick={() => setIsCreatingTask(false)}
        >
          <div 
            style={{
              backgroundColor: "white",
              borderRadius: "var(--radius-xl)",
              width: "600px",
              maxWidth: "95vw",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "2rem",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              position: "relative",
              border: "1px solid rgba(255, 255, 255, 0.2)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ fontSize: "1.4rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "4px" }}>
                  Create New Task
                </h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
                  In Column: {columns.find(c => c._id === createTaskColumnId)?.title || "Unknown"}
                </p>
              </div>
              <button 
                onClick={() => setIsCreatingTask(false)}
                style={{
                  background: "var(--secondary)",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--border)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--secondary)"}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Title */}
              <div>
                <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "600", marginBottom: "8px" }}>
                  Task Title *
                </label>
                <input
                  type="text"
                  value={createTaskTitle}
                  onChange={(e) => setCreateTaskTitle(e.target.value)}
                  placeholder="Enter task title..."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    fontFamily: "inherit",
                    fontSize: "0.9rem",
                    outline: "none"
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "600", marginBottom: "8px" }}>
                  Description
                </label>
                <textarea
                  value={createTaskDescription}
                  onChange={(e) => setCreateTaskDescription(e.target.value)}
                  placeholder="Add a detailed description..."
                  style={{
                    width: "100%",
                    minHeight: "80px",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    fontFamily: "inherit",
                    fontSize: "0.9rem",
                    outline: "none",
                    resize: "vertical"
                  }}
                />
              </div>

              {/* Priority */}
              <div>
                <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "600", marginBottom: "8px" }}>
                  Priority
                </label>
                <select
                  value={createTaskPriority}
                  onChange={(e) => setCreateTaskPriority(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    fontSize: "0.9rem"
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              {/* Assignees (Compulsory - select at least one) */}
              <div>
                <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "600", marginBottom: "8px" }}>
                  Assign Task To * (Select at least one member)
                </label>
                <div 
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                    maxHeight: "120px",
                    overflowY: "auto",
                    padding: "10px",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)"
                  }}
                >
                  {(workspace?.members?.filter(m => m.status === "accepted") || []).map((m) => {
                    const user = m.user;
                    if (!user) return null;
                    const isChecked = createTaskAssignedTo.includes(user._id);
                    return (
                      <label 
                        key={user._id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "0.85rem",
                          cursor: "pointer",
                          backgroundColor: isChecked ? "rgba(99, 102, 241, 0.08)" : "var(--secondary)",
                          padding: "6px 12px",
                          borderRadius: "16px",
                          border: isChecked ? "1px solid var(--primary)" : "1px solid transparent",
                          transition: "all 0.15s"
                        }}
                      >
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCreateTaskAssignedTo([...createTaskAssignedTo, user._id]);
                            } else {
                              setCreateTaskAssignedTo(createTaskAssignedTo.filter(id => id !== user._id));
                            }
                          }}
                          style={{ cursor: "pointer" }}
                        />
                        {user.name || user.email}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid var(--border)", paddingTop: "15px", marginTop: "10px" }}>
              <button 
                onClick={() => setIsCreatingTask(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--secondary)",
                  color: "var(--text-main)",
                  fontSize: "0.9rem",
                  fontWeight: "500"
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateTaskSubmit}
                className="btn-primary"
                style={{
                  padding: "8px 16px",
                  fontSize: "0.9rem",
                  fontWeight: "500"
                }}
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api/axios";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import Layout from "../components/Layout";
import { useRoles } from "../hooks/useRoles";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { useSocket } from "../context/SocketContext";

export default function Board() {
  const { workspaceId, id } = useParams();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);
  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState({});

  const { isLead, isMember } = useRoles(workspace);
  const socket = useSocket();

  const fetchData = async () => {
    try {
      const wsRes = await API.get(`/workspaces/${workspaceId}`);
      setWorkspace(wsRes.data);

      const boardRes = await API.get(`/boards/${id}`);
      setBoard(boardRes.data);

      const colRes = await API.get(`/columns/board/${id}`);
      setColumns(colRes.data);

      const tasksMap = {};
      for (let col of colRes.data) {
        const taskRes = await API.get(`/tasks/column/${col._id}`);
        tasksMap[col._id] = taskRes.data;
      }
      setTasks(tasksMap);
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
      socket.on("refresh_board", handleRefresh);
      return () => socket.off("refresh_board", handleRefresh);
    }
  }, [socket, id]);

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

  const createTask = async (columnId) => {
    const title = prompt("Enter task title");
    if (!title) return;

    try {
      const { data } = await API.post("/tasks", { title, columnId });
      setTasks((prev) => ({
        ...prev,
        [columnId]: [...(prev[columnId] || []), data]
      }));
    } catch {
      alert("Error creating task");
    }
  };

  const deleteTask = async (taskId, columnId) => {
    if (!window.confirm("Delete task?")) return;
    try {
      await API.delete(`/tasks/${taskId}`);
      setTasks((prev) => ({
        ...prev,
        [columnId]: prev[columnId].filter(t => t._id !== taskId)
      }));
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
      // Assuming backend has a way to update order within a column, otherwise just moving between columns.
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

      <div style={{ display: "flex", gap: "20px", overflowX: "auto", paddingBottom: "20px", minHeight: "calc(100vh - 200px)" }}>
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
                    {tasks[col._id]?.map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index} isDragDisabled={!isMember}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="card"
                            style={{
                              padding: "15px",
                              marginBottom: "10px",
                              backgroundColor: "white",
                              boxShadow: snapshot.isDragging ? "var(--shadow-lg)" : "var(--shadow-sm)",
                              transform: snapshot.isDragging ? "rotate(2deg)" : "none",
                              ...provided.draggableProps.style
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <p style={{ fontSize: "0.95rem", fontWeight: "500", color: "var(--text-main)", margin: 0 }}>{task.title}</p>
                              {isLead && (
                                <button onClick={() => deleteTask(task._id, col._id)} style={{ color: "var(--text-muted)", padding: "2px" }}>
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
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
    </Layout>
  );
}
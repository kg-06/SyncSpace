import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import boardRoutes from "./routes/boardRoutes.js";
import columnRoutes from "./routes/columnRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";

dotenv.config();

const app = express();

// Connect database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api/boards", boardRoutes);
app.use("/api/columns", columnRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search", searchRoutes);

app.get("/", (req, res) => {
  res.send("SyncSpace API running 🚀");
});


const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
  }
});

// User socket map to keep track of connected users
const userSockets = new Map();

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  
  socket.on("register", (userId) => {
    userSockets.set(userId, socket.id);
  });

  socket.on("disconnect", () => {
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
    console.log("User disconnected:", socket.id);
  });
});

app.set("io", io);
app.set("userSockets", userSockets);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
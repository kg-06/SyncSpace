# 🚀 SyncSpace

SyncSpace is a **collaborative project management web application** built using the MERN stack. It allows teams to organize their work using **Kanban boards**, manage tasks, assign roles, and collaborate efficiently in real time.

---

# 📌 Overview

SyncSpace helps teams:
- Organize projects into workspaces
- Manage tasks visually using boards and columns
- Assign tasks to multiple users
- Track progress through workflow stages
- Collaborate with role-based access control

---

# 🧠 Project Workflow

SyncSpace follows a hierarchical structure:

```
User
  ↓
Workspace (Team)
  ↓
Board (Project)
  ↓
Column (Workflow Stage)
  ↓
Task (Work Item)
```

### Example Workflow

```
Workspace: Dev Team
  ├── Board: Sprint 1
       ├── Column: Todo
       ├── Column: In Progress
       ├── Column: Review
       └── Column: Done
```

Tasks move across columns as work progresses.

---

# ⚙️ Tech Stack

## Frontend (Planned)
- React.js
- Axios
- React Router
- Socket.io Client

## Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication

## Tools
- Git & GitHub
- Nodemon
- Postman

---

# 🗂️ Database Schema Design

## 👤 User

```js
{
  name: String,
  email: String,
  password: String
}
```

---

## 🏢 Workspace

```js
{
  name: String,
  owner: ObjectId (User),
  members: [
    {
      user: ObjectId (User),
      role: "lead" | "member"
    }
  ],
  boards: [ObjectId (Board)]
}
```

---

## 📋 Board

```js
{
  title: String,
  workspace: ObjectId (Workspace),
  columns: [ObjectId (Column)]
}
```

---

## 📊 Column

```js
{
  title: String,
  board: ObjectId (Board),
  tasks: [ObjectId (Task)]
}
```

---

## 🧩 Task

```js
{
  title: String,
  description: String,
  assignedTo: [ObjectId (User)],
  reviewedBy: ObjectId (User),
  column: ObjectId (Column),
  priority: "low" | "medium" | "high",
  dueDate: Date
}
```

---

# 🔐 Authentication & Authorization

- JWT-based authentication
- Protected routes using middleware
- Role-based access:
  - **Lead** → manage workspace, boards, members
  - **Member** → manage tasks

---

# 🔗 API Endpoints

## 🔑 Auth

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
```

---

## 🏢 Workspace

```
POST   /api/workspaces
GET    /api/workspaces
GET    /api/workspaces/:workspaceId
DELETE /api/workspaces/:workspaceId
```

### Members

```
POST   /api/workspaces/:workspaceId/members
DELETE /api/workspaces/:workspaceId/members/:userId
PATCH  /api/workspaces/:workspaceId/members/:userId
POST   /api/workspaces/:workspaceId/leave
```

---

## 📋 Board

```
POST   /api/boards
GET    /api/boards/workspace/:workspaceId
GET    /api/boards/:boardId
PUT    /api/boards/:boardId
DELETE /api/boards/:boardId
```

---

## 📊 Column

```
POST   /api/columns
GET    /api/columns/board/:boardId
PUT    /api/columns/:columnId
DELETE /api/columns/:columnId
PUT    /api/columns/reorder
```

---

## 🧩 Task

```
POST   /api/tasks
GET    /api/tasks/column/:columnId
PUT    /api/tasks/:taskId
DELETE /api/tasks/:taskId
PUT    /api/tasks/:taskId/move
```

---

# 🖥️ How to Run Locally

## 1️⃣ Clone Repository

```bash
git clone https://github.com/kg-06/SyncSpace
cd syncspace
```

---

## 2️⃣ Setup Backend

```bash
cd server
npm install
```

---

## 3️⃣ Create `.env` File

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/syncspace OR Your Mongodb Atlas URI
JWT_SECRET=your_secret_key
```

---

## 4️⃣ Run Backend

```bash
npm run dev
```

Server will run at:

```
http://localhost:5000
```

---

## 5️⃣ Test APIs

Use:
- Postman
- Thunder Client

---

# 🧪 Features Implemented

- User authentication (JWT)
- Workspace management
- Role-based access control
- Board creation and management
- Column (Kanban stages)
- Task creation and assignment
- Task movement between columns
- Full REST API

---

# 🔮 Future Scope

- 🔄 Real-time updates using Socket.io
- 💬 Task comments & discussions
- 📎 File attachments in tasks
- 📊 Activity logs (audit trail)
- 📧 Email invitations to workspace
- 🔔 Notifications system
- 🎯 Drag-and-drop UI (React)
- 📱 Mobile responsiveness

---

# 👥 Contributors

- Keshav Garg  
- Kashvi Chuchra  
- Harshita Sharma  

---

# 💡 Summary

SyncSpace is a **full-stack collaborative system** that mimics real-world tools like Trello and Jira, implementing:

- scalable backend architecture  
- role-based authorization  
- hierarchical data modeling  
- real-world workflow management  

---
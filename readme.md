# 🚀 SyncSpace

SyncSpace is a **collaborative project management web application** (MERN) that helps teams manage work using **Workspaces → Boards → Columns → Tasks**, with **real-time updates**, **role-based access control**, and **notifications**.

---

## 📌 Overview

SyncSpace helps teams:
- Organize projects into **Workspaces**
- Split work into **Boards**
- Track progress through **Kanban Columns**
- Create and move **Tasks**
- Invite teammates and collaborate with **RBAC**
- Get **real-time** updates and **notifications**

---

## ✅ Features Implemented

### Authentication & Security
- **JWT authentication**
- **Email OTP verification** on registration
- **Forgot Password Flow**: Request a 6-digit OTP code to the registered email to securely reset passwords.
- Protected APIs with auth middleware

### Workspaces
- Create workspace
- View workspaces you belong to
- Invite members by email
- Accept invite
- Manage members (lead/owner)
  - Remove member (sends a real-time notification that redirects the removed user instantly)
  - Change member role
- Leave workspace
- **Owner can delete workspace**

### Boards
- Create board inside a workspace
- View boards in a workspace
- View a board
- Update board (rename)
- Delete board
  - UI provides **delete option for leads/owners**
- **Glassmorphic Column Navigation**: Beautiful left/right helper buttons to navigate boards seamlessly, replacing raw browser scrollbars.

### Kanban Columns
- Create/update/delete columns
- Reorder columns

### Tasks & Comments
- **Compulsory Assignee**: Creating a task requires assigning it to at least one active workspace member.
- **Creator-Only Assignment updates**: Only the original task creator has permission to modify assignees.
- **Priority-Based Sorting**: Tasks are automatically arranged inside columns in descending order of priority (`High -> Medium -> Low`).
- **Creator/Lead Deletion**: Tasks can be deleted by workspace leads/owners or by the original task creator.
- **Comments Thread**: Workspace members can add comments on tasks, visible to everyone in real time.
- **Review System**: Assigned members can mark tasks for review. Other members can perform the review and mark it complete; the reviewer's name is dynamically displayed on the card.
- **Move Permissions**: Only assignees or the task creator can move tasks to other columns.

### Real-time Collaboration (Socket.IO)
- **User-Specific Socket Rooms**: All client sockets join rooms named after their user IDs, guaranteeing instant synchronization and notifications across multiple open tabs or windows.
- **Real-time refresh** for board/workspace changes so users don’t need to reload.
- Real-time activity/invitation **notifications**.

### Search
- Global search across workspaces/boards/tasks

---

## 🔐 Roles & Permissions

- **Owner** (workspace creator)
  - All permissions
  - **Can delete workspace**
- **Lead**
  - Board/column management
  - Member invitations/management
  - **Can delete boards**
- **Member**
  - Board viewing
  - Task interactions (create, comment, move if assigned/created, review if not assigned)

---

## ⚙️ Tech Stack

### Frontend
- React (Vite)
- Axios
- React Router
- Socket.IO Client
- Drag & drop: `@hello-pangea/dnd`

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT auth + RBAC middleware
- Socket.IO (User-room based architecture)
- Email: **SendGrid** (`@sendgrid/mail`)

---

## 🔗 API Endpoints (Full List)

Base URL: `http://localhost:5000/api`

### 🔑 Auth (`/auth`)
```
POST   /api/auth/register         (register + send OTP)
POST   /api/auth/verify-otp       (verify OTP, returns token)
POST   /api/auth/resend-otp       (resend OTP)
POST   /api/auth/forgot-password  (forgot password OTP request)
POST   /api/auth/reset-password   (reset password verification)
POST   /api/auth/login
GET    /api/auth/me
```

### 🏢 Workspaces (`/workspaces`)
```
POST   /api/workspaces
GET    /api/workspaces
GET    /api/workspaces/:workspaceId
DELETE /api/workspaces/:workspaceId
POST   /api/workspaces/:workspaceId/leave
POST   /api/workspaces/:workspaceId/accept-invite
```

#### Workspace Members
```
POST   /api/workspaces/:workspaceId/members              (invite)
DELETE /api/workspaces/:workspaceId/members/:userId      (remove)
PATCH  /api/workspaces/:workspaceId/members/:userId      (update role)
```

### 📋 Boards (`/boards`)
```
POST   /api/boards
GET    /api/boards/workspace/:workspaceId
GET    /api/boards/:boardId
PUT    /api/boards/:boardId
DELETE /api/boards/:boardId
```

### 📊 Columns (`/columns`)
```
POST   /api/columns
GET    /api/columns/board/:boardId
PUT    /api/columns/:columnId
DELETE /api/columns/:columnId
PUT    /api/columns/reorder
```

### 🧩 Tasks (`/tasks`)
```
POST   /api/tasks                     (requires assignee, assigns creator as assignedBy)
GET    /api/tasks/column/:columnId    (returns tasks sorted High -> Medium -> Low)
PUT    /api/tasks/:taskId             (updates details; assignee checklist creator-only)
DELETE /api/tasks/:taskId             (creator/lead only)
PUT    /api/tasks/:taskId/move        (assignee/creator only)
POST   /api/tasks/:taskId/comments    (add task comment)
POST   /api/tasks/:taskId/mark-review (assignee only)
POST   /api/tasks/:taskId/review      (non-assignee member only)
```

### 🔔 Notifications (`/notifications`)
```
GET    /api/notifications
PUT    /api/notifications/read-all
PUT    /api/notifications/:id/read
```

### 🔎 Search (`/search`)
```
GET    /api/search?q=yourQuery
```

---

## 🖥️ How to Run Locally

### 1) Backend
```bash
cd server
npm install
```

Create `server/.env`:
```
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
SENDGRID_API_KEY=your_sendgrid_api_key
```

Run backend:
```bash
npm run dev
```

### 2) Frontend
```bash
cd client
npm install
npm run dev
```

Frontend:
```
http://localhost:5173
```

Backend:
```
http://localhost:5000
```

---

## 🔮 Future Scope

- File attachments in tasks
- Activity logs / audit trail per workspace/board
- Due dates & reminders
- More granular permissions (per-board roles)
- Mobile-first UI polish

---

## 👥 Contributors

- Keshav Garg
- Kashvi Chuchra
- Harshita Sharma

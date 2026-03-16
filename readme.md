# SyncSpace

SyncSpace is a collaborative project management web application that allows teams to organize and track work using Kanban boards. It helps teams manage tasks, collaborate in shared workspaces, and visualize project progress.

The application is built using the **MERN Stack (MongoDB, Express.js, React.js, Node.js)**.

---

# Project Workflow

SyncSpace follows a hierarchical workflow that organizes projects in a structured way.

```
User
  ↓
Workspace
  ↓
Board
  ↓
Column
  ↓
Task
```

---

# 1. User Authentication

Users can create an account and log in to the system.

### Workflow

- User registers an account
- User logs in with email and password
- Server generates a JWT token
- Token is used to access protected routes

---

# 2. Workspace Creation

A Workspace represents a team or organization.

Example:

```
Workspace: SyncSpace Dev Team
```

Users can:

- create a workspace
- join a workspace
- collaborate with other members

---

# 3. Boards

Inside each workspace, users can create Boards.

Boards represent projects.

Example:

```
Board: Sprint Planning
```

Each board contains columns that represent stages of work.

---

# 4. Columns

Columns represent different stages of task progress.

Example columns:

- Todo
- In Progress
- Review
- Done

Tasks move from one column to another as work progresses.

---

# 5. Tasks

Tasks represent individual work items.

Each task contains:

- title
- description
- assigned user
- priority
- due date
- column reference

Example task:

```
Title: Design Login Page
Assigned To: Kashvi
Priority: High
```

---

# Database Models

The project uses the following MongoDB collections.

## User

Stores user information.

Fields:

- name
- email
- password
- workspaces

---

## Workspace

Represents a team space.

Fields:

- name
- owner
- members
- boards

---

## Board

Represents a project board.

Fields:

- title
- workspace
- columns

---

## Column

Represents stages in a Kanban board.

Fields:

- title
- board
- tasks

---

## Task

Represents work items.

Fields:

- title
- description
- assignedTo
- column
- priority
- dueDate

---

# API Endpoints

All APIs follow a REST structure.

### Base URL

```
/api
```

---

# Authentication Routes

### Register User

```
POST /api/auth/register
```

Body:

```json
{
  "name": "User Name",
  "email": "user@email.com",
  "password": "password"
}
```

### Login User

```
POST /api/auth/login
```

Body:

```json
{
  "email": "user@email.com",
  "password": "password"
}
```

---

# Workspace Routes

### Create Workspace

```
POST /api/workspaces
```

### Get User Workspaces

```
GET /api/workspaces
```

### Add Member to Workspace

```
POST /api/workspaces/:workspaceId/members
```

---

# Board Routes

### Create Board

```
POST /api/boards
```

### Get Boards of Workspace

```
GET /api/boards/:workspaceId
```

### Delete Board

```
DELETE /api/boards/:boardId
```

---

# Column Routes

### Create Column

```
POST /api/columns
```

### Get Columns of Board

```
GET /api/columns/:boardId
```

---

# Task Routes

### Create Task

```
POST /api/tasks
```

### Update Task

```
PUT /api/tasks/:taskId
```

### Move Task to Another Column

```
PUT /api/tasks/:taskId/move
```

### Delete Task

```
DELETE /api/tasks/:taskId
```

---

# Tech Stack

## Frontend

- React.js
- React Router
- Axios
- Socket.io Client

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication

## Tools

- Git
- GitHub
- Nodemon

---

# Features Implemented (MVP)

- User authentication (register/login)
- Workspace creation
- Board creation
- Column management
- Task creation
- Task assignment
- Move tasks between columns
- REST API backend

---

# Future Features

These features may be added in future versions.

## Real-Time Collaboration

Using Socket.io

- live task updates
- real-time board sync

## Task Comments

Users can discuss tasks.

## Activity Logs

Example logs:

- User X created task
- User Y moved task to Done

## Email Invitations

Invite users to workspaces via email.

## Notifications

- task assigned notifications
- deadline reminders

## Drag and Drop Tasks

Using libraries like:

- react-beautiful-dnd

<<<<<<< HEAD
---

# Project Setup

### Clone the repository

```bash
git clone <repo-url>
```

### Install Backend Dependencies

```bash
=======
Project Setup
Clone the repository
git clone <https://github.com/kg-06/SyncSpace.git>
Install Backend Dependencies
>>>>>>> a843bdc786cabbcb722e2892ce81ed2f72fb7e74
cd server
npm install
```

### Run Backend

```bash
npm run dev
```

### Install Frontend Dependencies

```bash
cd client
npm install
```

### Run Frontend

```bash
npm run dev
```

---

# Contributors

 
- Keshav Garg
- Kashvi Chuchra
- Harshita Sharma
=======
 
 

import Workspace from "../models/Workspace.js";
import Board from "../models/Board.js";
import Column from "../models/Column.js";
import Task from "../models/Task.js";


//CHECK IF USER IS MEMBER OF WORKSPACE

export const isMember = async (req, res, next) => {
  try {
    let workspaceId = req.params?.workspaceId || req.body?.workspaceId;
    let boardId = req.params?.boardId || req.body?.boardId;
    let columnId = req.params?.columnId || req.body?.columnId;
    let taskId = req.params?.taskId || req.body?.taskId;

    if (!workspaceId && boardId) {
      const board = await Board.findById(boardId);

      if (!board) {
        return res.status(404).json({ message: "Board not found" });
      }

      workspaceId = board.workspace;
    }

    if (!workspaceId && columnId) {
      const column = await Column.findById(columnId);

      if (!column) {
        return res.status(404).json({ message: "Column not found" });
      }

      const board = await Board.findById(column.board);

      if (!board) {
        return res.status(404).json({ message: "Board not found" });
      }

      workspaceId = board.workspace;
    }
    if (!workspaceId && taskId) {
      const task = await Task.findById(taskId);
      if (!task) return res.status(404).json({ message: "Task not found" });

      const column = await Column.findById(task.column);
      const board = await Board.findById(column.board);

      workspaceId = board.workspace;
    }

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const member = workspace.members.find(
      (m) => m.user && m.user.toString() === req.user._id.toString()
    );

    const isOwner = workspace.owner && workspace.owner.toString() === req.user._id.toString();

    if (!member && !isOwner) {
      return res.status(403).json({ message: "Not a workspace member" });
    }

    // attach role for later use
    req.workspaceRole = member ? member.role : "owner";

    next();

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//lead only middleware

export const isLead = async (req, res, next) => {
  try {
    let workspaceId = req.params?.workspaceId || req.body?.workspaceId;
    let boardId = req.params?.boardId || req.body?.boardId;
    let columnId = req.params?.columnId || req.body?.columnId;
    let taskId = req.params?.taskId || req.body?.taskId;

    if (!workspaceId && boardId) {
        const board = await Board.findById(boardId);
        if (!board) return res.status(404).json({ message: "Board not found" });
        workspaceId = board.workspace;
    }
    if (!workspaceId && columnId) {
      const column = await Column.findById(columnId);

      if (!column) {
        return res.status(404).json({ message: "Column not found" });
      }

      const board = await Board.findById(column.board);

      if (!board) {
        return res.status(404).json({ message: "Board not found" });
      }

      workspaceId = board.workspace;
    }
    if (!workspaceId && taskId) {
      const task = await Task.findById(taskId);
      if (!task) return res.status(404).json({ message: "Task not found" });

      const column = await Column.findById(task.column);
      const board = await Board.findById(column.board);

      workspaceId = board.workspace;
    }

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // owner always allowed
    if (workspace.owner && workspace.owner.toString() === req.user._id.toString()) {
      return next();
    }

    const member = workspace.members.find(
      (m) => m.user && m.user.toString() === req.user._id.toString()
    );

    if (!member || member.role !== "lead") {
      return res.status(403).json({ message: "Only leads allowed" });
    }

    next();

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
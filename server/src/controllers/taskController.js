import Task from "../models/Task.js";
import Column from "../models/Column.js";
import { notifyUsers, getWorkspaceRecipients } from "../utils/notify.js";
import Board from "../models/Board.js";
import { emitToWorkspace } from "../utils/socketEmit.js";
import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";

//task controller

export const createTask = async (req, res) => {
  try {
    const { title, description, columnId, assignedTo, priority } = req.body;

    if (!assignedTo || !Array.isArray(assignedTo) || assignedTo.length === 0) {
      return res.status(400).json({ message: "At least one assignee is required to create a task" });
    }

    const column = await Column.findById(columnId);

    if (!column) {
      return res.status(404).json({ message: "Column not found" });
    }

    const task = await Task.create({
      title,
      description,
      column: columnId,
      assignedTo: assignedTo,
      assignedBy: req.user._id,
      priority
    });

    // push task into column
    column.tasks.push(task._id);
    await column.save();

    const board = await Board.findById(column.board).populate("workspace");
    if (board) {
      const workspaceId = board.workspace._id || board.workspace;
      const workspaceName = board.workspace.name || "Workspace";
      
      const recipients = await getWorkspaceRecipients(workspaceId, req.user._id);
      await notifyUsers(
        recipients,
        "ACTIVITY",
        `New task "${task.title}" was added in board "${board.title}"`,
        workspaceId,
        `/workspace/${workspaceId}/board/${board._id}`,
        req
      );

      // Send assignment notifications/emails to assignees
      if (assignedTo && assignedTo.length > 0) {
        for (const userId of assignedTo) {
          const assignee = await User.findById(userId);
          if (assignee) {
            const message = `You have been assigned to the task "${task.title}" in workspace "${workspaceName}" (Board: "${board.title}")`;
            
            // Database and socket notification
            await notifyUsers(
              [assignee._id],
              "ACTIVITY",
              message,
              workspaceId,
              `/workspace/${workspaceId}/board/${board._id}`,
              req
            );

            // Email
            await sendEmail({
              to: assignee.email,
              subject: `Task Assigned: ${task.title}`,
              text: message
            });
          }
        }
      }

      await emitToWorkspace(workspaceId, "refresh_board", { boardId: board._id.toString() }, req);
    }

    res.status(201).json(task);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

//get task by column

export const getTasksByColumn = async (req, res) => {
  try {
    const { columnId } = req.params;

    const tasks = await Task.find({ column: columnId })
      .populate("assignedTo", "name email")
      .populate("reviewedBy", "name email")
      .populate("assignedBy", "name email")
      .populate("comments.user", "name email");

    const priorityWeight = { high: 3, medium: 2, low: 1 };
    tasks.sort((a, b) => {
      const wA = priorityWeight[a.priority] || 2;
      const wB = priorityWeight[b.priority] || 2;
      return wB - wA;
    });

    res.json(tasks);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//update task

export const updateTask = async (req, res) => {
  try {
    const { title, description, assignedTo, priority, reviewedBy, reviewStatus } = req.body;

    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const oldTitle = task.title;
    const oldAssignees = (task.assignedTo || []).map(id => id.toString());

    task.title = title || task.title;
    task.description = description !== undefined ? description : task.description;
    task.priority = priority || task.priority;
    task.reviewedBy = reviewedBy !== undefined ? reviewedBy : task.reviewedBy;
    task.reviewStatus = reviewStatus !== undefined ? reviewStatus : task.reviewStatus;

    let newlyAssigned = [];
    if (assignedTo !== undefined) {
      if (task.assignedBy && task.assignedBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Only the creator of the task can change assignees" });
      }
      if (!Array.isArray(assignedTo) || assignedTo.length === 0) {
        return res.status(400).json({ message: "At least one assignee is required for the task" });
      }

      const newAssignees = (assignedTo || []).map(id => id.toString());
      newlyAssigned = newAssignees.filter(id => !oldAssignees.includes(id));
      task.assignedTo = assignedTo;
      if (!task.assignedBy) {
        task.assignedBy = req.user._id;
      }
    }

    await task.save();

    const column = await Column.findById(task.column);
    const board = await Board.findById(column?.board).populate("workspace");
    
    if (board) {
      const workspaceId = board.workspace._id || board.workspace;
      const workspaceName = board.workspace.name || "Workspace";
      
      const recipients = await getWorkspaceRecipients(workspaceId, req.user._id);

      if (oldTitle !== task.title || assignedTo) {
        let msg = `Task "${oldTitle}" was updated`;
        if (oldTitle !== task.title) msg = `Task "${oldTitle}" was renamed to "${task.title}"`;
        else if (assignedTo) msg = `Task "${task.title}" assignments were updated`;

        await notifyUsers(
          recipients,
          "ACTIVITY",
          msg,
          workspaceId,
          `/workspace/${workspaceId}/board/${board._id}`,
          req
        );
      }

      // Notify newly assigned members
      if (newlyAssigned.length > 0) {
        for (const userId of newlyAssigned) {
          const assignee = await User.findById(userId);
          if (assignee) {
            const message = `You have been assigned to the task "${task.title}" in workspace "${workspaceName}" (Board: "${board.title}")`;
            
            // Database & Socket
            await notifyUsers(
              [assignee._id],
              "ACTIVITY",
              message,
              workspaceId,
              `/workspace/${workspaceId}/board/${board._id}`,
              req
            );

            // Email
            await sendEmail({
              to: assignee.email,
              subject: `Task Assigned: ${task.title}`,
              text: message
            });
          }
        }
      }

      await emitToWorkspace(workspaceId, "refresh_board", { boardId: board._id.toString() }, req);
    }

    res.json(task);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//delete task

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Only the task creator (assignedBy) or a workspace lead/owner can delete this task
    const isCreator = task.assignedBy && task.assignedBy.toString() === req.user._id.toString();
    const isLeadOrOwner = req.workspaceRole === "lead" || req.workspaceRole === "owner";

    if (!isCreator && !isLeadOrOwner) {
      return res.status(403).json({ message: "Only the task creator or workspace leads can delete this task" });
    }

    // remove from column
    const column = await Column.findByIdAndUpdate(task.column, {
      $pull: { tasks: task._id }
    });

    await task.deleteOne();

    if (column) {
      const board = await Board.findById(column.board);
      if (board) {
        const recipients = await getWorkspaceRecipients(board.workspace, req.user._id);
        await notifyUsers(
          recipients,
          "ACTIVITY",
          `Task "${task.title}" was deleted`,
          board.workspace,
          `/workspace/${board.workspace}/board/${board._id}`,
          req
        );

        await emitToWorkspace(board.workspace, "refresh_board", { boardId: board._id.toString() }, req);
      }
    }

    res.json({ message: "Task deleted" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//move task

export const moveTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { sourceColumnId, targetColumnId } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Permission check: if task is assigned, only assignee or assigner can move it
    if (task.assignedTo && task.assignedTo.length > 0) {
      const isAssignee = task.assignedTo.some((id) => id.toString() === req.user._id.toString());
      const isAssigner = task.assignedBy?.toString() === req.user._id.toString();
      if (!isAssignee && !isAssigner) {
        return res.status(403).json({ message: "Only the assignees or the person who assigned this task can move it" });
      }
    }

    // remove from source column
    await Column.findByIdAndUpdate(sourceColumnId, {
      $pull: { tasks: taskId }
    });

    // add to target column
    await Column.findByIdAndUpdate(targetColumnId, {
      $push: { tasks: taskId }
    });

    // update task's column reference
    task.column = targetColumnId;
    await task.save();

    const targetCol = await Column.findById(targetColumnId);
    if (targetCol) {
      const board = await Board.findById(targetCol.board);
      if (board) {
        const recipients = await getWorkspaceRecipients(board.workspace, req.user._id);
        await notifyUsers(
          recipients,
          "ACTIVITY",
          `Task "${task.title}" was moved to column "${targetCol.title}"`,
          board.workspace,
          `/workspace/${board.workspace}/board/${board._id}`,
          req
        );

        await emitToWorkspace(board.workspace, "refresh_board", { boardId: board._id.toString() }, req);
      }
    }

    res.json({ message: "Task moved successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add comment to task
export const addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.comments.push({
      text,
      user: req.user._id,
      createdAt: new Date()
    });

    await task.save();

    // Populate comments to return full information
    const updatedTask = await Task.findById(taskId)
      .populate("assignedTo", "name email")
      .populate("reviewedBy", "name email")
      .populate("assignedBy", "name email")
      .populate("comments.user", "name email");

    const column = await Column.findById(task.column);
    if (column) {
      const board = await Board.findById(column.board);
      if (board) {
        // Send real-time notification to all workspace members
        const recipients = await getWorkspaceRecipients(board.workspace, req.user._id);
        await notifyUsers(
          recipients,
          "ACTIVITY",
          `${req.user.name || req.user.email} commented on task "${task.title}"`,
          board.workspace,
          `/workspace/${board.workspace}/board/${board._id}`,
          req
        );

        await emitToWorkspace(board.workspace, "refresh_board", { boardId: board._id.toString() }, req);
      }
    }

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark task for review
export const markForReview = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Verify current user is one of the assignees
    const isAssignee = task.assignedTo.some(id => id.toString() === req.user._id.toString());
    if (!isAssignee) {
      return res.status(403).json({ message: "Only an assignee can mark this task for review" });
    }

    task.reviewStatus = "pending";
    await task.save();

    const updatedTask = await Task.findById(taskId)
      .populate("assignedTo", "name email")
      .populate("reviewedBy", "name email")
      .populate("assignedBy", "name email")
      .populate("comments.user", "name email");

    const column = await Column.findById(task.column);
    if (column) {
      const board = await Board.findById(column.board);
      if (board) {
        // Notify other workspace members that the task is ready for review
        const recipients = await getWorkspaceRecipients(board.workspace, req.user._id);
        await notifyUsers(
          recipients,
          "ACTIVITY",
          `Task "${task.title}" is ready for review`,
          board.workspace,
          `/workspace/${board.workspace}/board/${board._id}`,
          req
        );

        await emitToWorkspace(board.workspace, "refresh_board", { boardId: board._id.toString() }, req);
      }
    }

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Review task
export const reviewTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Verify current user is NOT one of the assignees
    const isAssignee = task.assignedTo.some(id => id.toString() === req.user._id.toString());
    if (isAssignee) {
      return res.status(400).json({ message: "Assignees cannot review their own task" });
    }

    task.reviewStatus = "reviewed";
    task.reviewedBy = req.user._id;
    await task.save();

    const updatedTask = await Task.findById(taskId)
      .populate("assignedTo", "name email")
      .populate("reviewedBy", "name email")
      .populate("assignedBy", "name email")
      .populate("comments.user", "name email");

    const column = await Column.findById(task.column);
    if (column) {
      const board = await Board.findById(column.board);
      if (board) {
        // Notify assignee and assigner
        const notifyTargets = [];
        if (task.assignedBy && task.assignedBy.toString() !== req.user._id.toString()) {
          notifyTargets.push(task.assignedBy.toString());
        }
        task.assignedTo.forEach(id => {
          if (id.toString() !== req.user._id.toString() && !notifyTargets.includes(id.toString())) {
            notifyTargets.push(id.toString());
          }
        });

        if (notifyTargets.length > 0) {
          await notifyUsers(
            notifyTargets,
            "ACTIVITY",
            `Task "${task.title}" has been reviewed by ${req.user.name || req.user.email}`,
            board.workspace,
            `/workspace/${board.workspace}/board/${board._id}`,
            req
          );
        }

        await emitToWorkspace(board.workspace, "refresh_board", { boardId: board._id.toString() }, req);
      }
    }

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
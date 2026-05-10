import Task from "../models/Task.js";
import Column from "../models/Column.js";
import { notifyUsers, getWorkspaceRecipients } from "../utils/notify.js";
import Board from "../models/Board.js";
import { emitToWorkspace } from "../utils/socketEmit.js";

//task controller

export const createTask = async (req, res) => {
  try {
    const { title, description, columnId, assignedTo, priority } = req.body;

    const column = await Column.findById(columnId);

    if (!column) {
      return res.status(404).json({ message: "Column not found" });
    }

    const task = await Task.create({
      title,
      description,
      column: columnId,
      assignedTo: assignedTo || [],
      priority
    });

    // push task into column
    column.tasks.push(task._id);
    await column.save();

    const board = await Board.findById(column.board);
    if (board) {
      const recipients = await getWorkspaceRecipients(board.workspace, req.user._id);
      await notifyUsers(
        recipients,
        "ACTIVITY",
        `New task "${task.title}" was added in board "${board.title}"`,
        board.workspace,
        `/workspace/${board.workspace}/board/${board._id}`,
        req
      );

      await emitToWorkspace(board.workspace, "refresh_board", { boardId: board._id.toString() }, req);
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
      .populate("assignedTo", "name email");

    res.json(tasks);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//update task

export const updateTask = async (req, res) => {
  try {
    const { title, description, assignedTo, priority, reviewedBy } = req.body;

    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const oldTitle = task.title;
    task.title = title || task.title;
    task.description = description || task.description;
    task.assignedTo = assignedTo || task.assignedTo;
    task.priority = priority || task.priority;
    task.reviewedBy = reviewedBy || task.reviewedBy;

    await task.save();

    if (oldTitle !== task.title || assignedTo) {
      const column = await Column.findById(task.column);
      const board = await Board.findById(column?.board);
      if (board) {
        const recipients = await getWorkspaceRecipients(board.workspace, req.user._id);
        
        let msg = `Task "${oldTitle}" was updated`;
        if (oldTitle !== task.title) msg = `Task "${oldTitle}" was renamed to "${task.title}"`;
        else if (assignedTo) msg = `Task "${task.title}" assignments were updated`;

        await notifyUsers(
          recipients,
          "ACTIVITY",
          msg,
          board.workspace,
          `/workspace/${board.workspace}/board/${board._id}`,
          req
        );
      }
    }

    {
      const column = await Column.findById(task.column);
      const board = await Board.findById(column?.board);
      if (board) {
        await emitToWorkspace(board.workspace, "refresh_board", { boardId: board._id.toString() }, req);
      }
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
import Task from "../models/Task.js";
import Column from "../models/Column.js";

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

    task.title = title || task.title;
    task.description = description || task.description;
    task.assignedTo = assignedTo || task.assignedTo;
    task.priority = priority || task.priority;
    task.reviewedBy = reviewedBy || task.reviewedBy;

    await task.save();

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
    await Column.findByIdAndUpdate(task.column, {
      $pull: { tasks: task._id }
    });

    await task.deleteOne();

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

    res.json({ message: "Task moved successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
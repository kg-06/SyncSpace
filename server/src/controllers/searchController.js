import Workspace from "../models/Workspace.js";
import Board from "../models/Board.js";
import Task from "../models/Task.js";

export const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ workspaces: [], boards: [], tasks: [] });
    }

    const userId = req.user._id;

    // Find all workspaces where user is member or owner
    const accessibleWorkspaces = await Workspace.find({
      $or: [
        { owner: userId },
        { "members.user": userId, "members.status": "accepted" }
      ]
    });

    const workspaceIds = accessibleWorkspaces.map(ws => ws._id);

    // Filter accessible workspaces by query
    const workspaces = accessibleWorkspaces.filter(ws => 
      ws.name.toLowerCase().includes(q.toLowerCase())
    );

    // Find boards inside accessible workspaces matching query
    const boards = await Board.find({
      workspace: { $in: workspaceIds },
      title: { $regex: q, $options: "i" }
    });

    // Find tasks matching query. Note: tasks belong to columns, which belong to boards.
    // Instead of complex population match, just find matching tasks, then filter if they belong to accessible workspace.
    // Since task -> column -> board -> workspace, it's easier to find tasks and populate up to verify workspace.
    const tasks = await Task.find({
      title: { $regex: q, $options: "i" }
    }).populate({
      path: "column",
      populate: {
        path: "board",
        select: "workspace"
      }
    });

    const accessibleTasks = tasks.filter(task => {
      const wsId = task.column?.board?.workspace?.toString();
      return wsId && workspaceIds.some(id => id.toString() === wsId);
    });

    res.json({
      workspaces,
      boards,
      tasks: accessibleTasks.map(t => ({
        _id: t._id,
        title: t.title,
        workspaceId: t.column?.board?.workspace,
        boardId: t.column?.board?._id
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

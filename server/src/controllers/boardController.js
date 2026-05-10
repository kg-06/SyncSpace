import Board from "../models/Board.js";
import Workspace from "../models/Workspace.js";
import { notifyUsers, getWorkspaceRecipients } from "../utils/notify.js";
import { emitToWorkspace } from "../utils/socketEmit.js";

//CREATE BOARD

export const createBoard = async (req, res) => {
  try {
    const { title, workspaceId } = req.body;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const board = await Board.create({
      title,
      workspace: workspaceId
    });

    // push board into workspace
    workspace.boards.push(board._id);
    await workspace.save();

    const recipients = await getWorkspaceRecipients(workspace._id, req.user._id);

    await notifyUsers(
      recipients,
      "ACTIVITY",
      `New board "${board.title}" was created in "${workspace.name}"`,
      workspace._id,
      `/workspace/${workspace._id}/board/${board._id}`,
      req
    );

    await emitToWorkspace(workspace._id, "refresh_workspace", { workspaceId: workspace._id.toString() }, req);
    await emitToWorkspace(workspace._id, "refresh_board", { boardId: board._id.toString() }, req);

    res.status(201).json(board);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

//get all boards in workspace

export const getBoardsByWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const boards = await Board.find({ workspace: workspaceId });

    res.json(boards);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


//get single board

export const getBoardById = async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId)
      .populate("columns");

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    res.json(board);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//delete board

export const deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    // remove board from workspace
    const workspace = await Workspace.findByIdAndUpdate(board.workspace, {
      $pull: { boards: board._id }
    });

    await board.deleteOne();

    if (workspace) {
      const recipients = await getWorkspaceRecipients(workspace._id, req.user._id);

      await notifyUsers(
        recipients,
        "ACTIVITY",
        `Board "${board.title}" was deleted from "${workspace.name}"`,
        workspace._id,
        `/workspace/${workspace._id}`,
        req
      );

      await emitToWorkspace(workspace._id, "refresh_workspace", { workspaceId: workspace._id.toString() }, req);
    }

    res.json({ message: "Board deleted" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//update board

export const updateBoard = async (req, res) => {
  try {
    const { title } = req.body;

    const board = await Board.findById(req.params.boardId);

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    const oldTitle = board.title;
    board.title = title || board.title;

    await board.save();

    if (oldTitle !== board.title) {
      const workspace = await Workspace.findById(board.workspace);
      if (workspace) {
        const recipients = await getWorkspaceRecipients(workspace._id, req.user._id);

        await notifyUsers(
          recipients,
          "ACTIVITY",
          `Board "${oldTitle}" was renamed to "${board.title}"`,
          workspace._id,
          `/workspace/${workspace._id}/board/${board._id}`,
          req
        );

        await emitToWorkspace(workspace._id, "refresh_workspace", { workspaceId: workspace._id.toString() }, req);
        await emitToWorkspace(workspace._id, "refresh_board", { boardId: board._id.toString() }, req);
      }
    }

    res.json(board);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


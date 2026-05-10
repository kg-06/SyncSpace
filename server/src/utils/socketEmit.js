import Workspace from "../models/Workspace.js";

export const emitToWorkspace = async (workspaceId, eventName, payload, req) => {
  try {
    const io = req.app.get("io");
    const userSockets = req.app.get("userSockets");

    if (!io || !userSockets) return;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return;

    // Build list of all user IDs in the workspace (owner + members)
    const userIds = workspace.members
      .filter(m => m.status === "accepted")
      .map(m => m.user.toString());

    if (workspace.owner) {
      const ownerId = workspace.owner.toString();
      if (!userIds.includes(ownerId)) {
        userIds.push(ownerId);
      }
    }

    // Emit event to their sockets
    userIds.forEach(userId => {
      // Don't emit back to the sender
      if (req.user && req.user._id.toString() === userId) return;

      const socketId = userSockets.get(userId);
      if (socketId) {
        io.to(socketId).emit(eventName, payload);
      }
    });

  } catch (err) {
    console.error("Error emitting to workspace:", err);
  }
};

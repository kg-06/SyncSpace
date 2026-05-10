import Notification from "../models/Notification.js";
import Workspace from "../models/Workspace.js";

export const getWorkspaceRecipients = async (workspaceId, reqUserId) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) return [];
  const recipients = workspace.members
    .filter(m => m.status === "accepted" && m.user.toString() !== reqUserId.toString())
    .map(m => m.user);
  if (workspace.owner && workspace.owner.toString() !== reqUserId.toString()) {
    recipients.push(workspace.owner);
  }
  return recipients;
};

export const notifyUsers = async (userIds, type, message, workspaceId = null, link = null, req = null) => {
  try {
    const notifications = userIds.map((userId) => ({
      user: userId,
      type,
      message,
      workspace: workspaceId,
      link
    }));

    const createdNotifications = await Notification.insertMany(notifications);

    // If request has io and userSockets, send real-time
    if (req) {
      const io = req.app.get("io");
      const userSockets = req.app.get("userSockets");

      if (io && userSockets) {
        createdNotifications.forEach((notification) => {
          const socketId = userSockets.get(notification.user.toString());
          if (socketId) {
            io.to(socketId).emit("notification", notification);
          }
        });
      }
    }
  } catch (err) {
    console.error("Error creating notifications:", err);
  }
};

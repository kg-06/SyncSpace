import mongoose from "mongoose";
import Workspace from "../models/Workspace.js";
import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";
import { notifyUsers } from "../utils/notify.js";
import { emitToWorkspace } from "../utils/socketEmit.js";


// CREATE WORKSPACE

export const createWorkspace = async (req, res) => {
  try {
    const { name } = req.body;

    const userId = req.user._id;;

    const workspace = await Workspace.create({
      name,
      owner: userId,
      members: [
        {
          user: userId,
          role: "lead"
        }
      ]
    });

    res.status(201).json(workspace);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

//get user workspaces

export const getUserWorkspaces = async (req, res) => {
  try {
    const userId = req.user?._id; // later from auth

    const workspaces = await Workspace.find({
      "members.user": userId
    }).populate("members.user", "name email");

    res.json(workspaces);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//get single workspace

export const getWorkspaceById = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId)
      .populate("members.user", "name email");

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    res.json(workspace);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//delete workspace

export const deleteWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // only owner can delete
    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await workspace.deleteOne();

    res.json({ message: "Workspace deleted" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//add member

export const addMember = async (req, res) => {
  try {
    const { email, role } = req.body;

    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const userToInvite = await User.findOne({ email });
    if (!userToInvite) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = userToInvite._id.toString();

    // prevent duplicate members
    const alreadyExists = workspace.members.find(
      (m) => m.user.toString() === userId
    );

    if (alreadyExists) {
      return res.status(400).json({ message: "User already a member or pending invite" });
    }

    workspace.members.push({
      user: userId,
      role: role || "member",
      status: "pending"
    });

    await workspace.save();

    // Send Email
    await sendEmail({
      to: userToInvite.email,
      subject: `Invitation to join workspace: ${workspace.name}`,
      text: `You have been invited to join the workspace "${workspace.name}". Please log in to your SyncSpace account to accept the invitation.`,
    });

    await notifyUsers(
      [userId],
      "INVITATION",
      `You have been invited to join the workspace "${workspace.name}"`,
      workspace._id,
      null,
      req
    );

    res.json(workspace);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//accept invite
export const acceptInvite = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user._id;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const member = workspace.members.find((m) => m.user.toString() === userId.toString());
    if (!member) {
      return res.status(400).json({ message: "No invitation found for this workspace" });
    }

    if (member.status === "accepted") {
      return res.status(400).json({ message: "Invitation already accepted" });
    }

    member.status = "accepted";
    await workspace.save();

    // Notify owner
    await notifyUsers(
      [workspace.owner],
      "ACTIVITY",
      `${req.user.name || req.user.email} accepted the invitation to join "${workspace.name}"`,
      workspace._id,
      `/workspace/${workspace._id}`,
      req
    );

    await emitToWorkspace(workspace._id, "refresh_workspace", { workspaceId: workspace._id.toString() }, req);

    res.json({ message: "Invitation accepted", workspace });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//remove member

export const removeMember = async (req, res) => {
  try {
    const { userId } = req.params;

    const workspace = await Workspace.findById(req.params.workspaceId);

    workspace.members = workspace.members.filter(
      (m) => m.user.toString() !== userId
    );

    await workspace.save();

    await emitToWorkspace(workspace._id, "refresh_workspace", { workspaceId: workspace._id.toString() }, req);

    res.json({ message: "Member removed" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//update member role

export const updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body;

    const workspace = await Workspace.findById(req.params.workspaceId);

    const member = workspace.members.find(
      (m) => m.user.toString() === req.params.userId
    );

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    member.role = role;

    await workspace.save();

    await emitToWorkspace(workspace._id, "refresh_workspace", { workspaceId: workspace._id.toString() }, req);

    res.json(workspace);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//leave workspace

export const leaveWorkspace = async (req, res) => {
  try {
    const userId = req.user._id;

    const workspace = await Workspace.findById(req.params.workspaceId);

    workspace.members = workspace.members.filter(
      (m) => m.user.toString() !== userId.toString()
    );

    await workspace.save();

    res.json({ message: "Left workspace" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
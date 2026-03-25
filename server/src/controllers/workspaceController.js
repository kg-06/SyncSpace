import mongoose from "mongoose";
import Workspace from "../models/Workspace.js";


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
    const { userId, role } = req.body;

    const workspace = await Workspace.findById(req.params.workspaceId);

    // prevent duplicate members
    const alreadyExists = workspace.members.find(
      (m) => m.user.toString() === userId
    );

    if (alreadyExists) {
      return res.status(400).json({ message: "User already a member" });
    }

    workspace.members.push({
      user: userId,
      role: role || "member"
    });

    await workspace.save();

    res.json(workspace);

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
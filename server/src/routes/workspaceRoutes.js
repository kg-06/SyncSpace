import express from "express";
import {
  createWorkspace,
  deleteWorkspace,
  getUserWorkspaces,
  getWorkspaceById,
  addMember,
  removeMember,
  updateMemberRole,
  leaveWorkspace
} from "../controllers/workspaceController.js";

import { protect } from "../middleware/authMiddleware.js";
import { isMember, isLead } from "../middleware/roleMiddleware.js";



const router = express.Router();
router.use(protect);


// WORKSPACE ROUTES

// create workspace
router.post("/", createWorkspace);

// get all workspaces of logged-in user
router.get("/", getUserWorkspaces);

// get single workspace
router.get("/:workspaceId",isMember, getWorkspaceById);

// delete workspace (owner only)
router.delete("/:workspaceId", isLead,deleteWorkspace);



// MEMBER MANAGEMENT


// add member
router.post("/:workspaceId/members",isLead ,addMember);

// remove member
router.delete("/:workspaceId/members/:userId", isLead,removeMember);

// update member role
router.patch("/:workspaceId/members/:userId", isLead,updateMemberRole);

// leave workspace
router.post("/:workspaceId/leave", isMember, leaveWorkspace);

export default router;
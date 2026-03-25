import express from "express";
import {
  createTask,
  getTasksByColumn,
  updateTask,
  deleteTask,
  moveTask
} from "../controllers/taskController.js";

import { protect } from "../middleware/authMiddleware.js";
import { isMember, isLead } from "../middleware/roleMiddleware.js";
const router = express.Router();
router.use(protect);

router.post("/", isMember,createTask);
router.get("/column/:columnId",isMember, getTasksByColumn);
router.put("/:taskId", isMember,updateTask);
router.delete("/:taskId",isLead, deleteTask);
router.put("/:taskId/move",isMember, moveTask);

export default router;
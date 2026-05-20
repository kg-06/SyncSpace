import express from "express";
import {
  createTask,
  getTasksByColumn,
  updateTask,
  deleteTask,
  moveTask,
  addComment,
  markForReview,
  reviewTask
} from "../controllers/taskController.js";

import { protect } from "../middleware/authMiddleware.js";
import { isMember, isLead } from "../middleware/roleMiddleware.js";
const router = express.Router();
router.use(protect);

router.post("/", isMember,createTask);
router.get("/column/:columnId",isMember, getTasksByColumn);
router.put("/:taskId", isMember,updateTask);
router.delete("/:taskId", isMember, deleteTask);
router.put("/:taskId/move",isMember, moveTask);
router.post("/:taskId/comments", isMember, addComment);
router.post("/:taskId/mark-review", isMember, markForReview);
router.post("/:taskId/review", isMember, reviewTask);

export default router;
import express from "express";
import {
  createBoard,
  getBoardsByWorkspace,
  getBoardById,
  deleteBoard,
  updateBoard
} from "../controllers/boardController.js";

import { protect } from "../middleware/authMiddleware.js";
import { isMember, isLead } from "../middleware/roleMiddleware.js";

const router = express.Router();
router.use(protect);

router.post("/", isLead,createBoard);
router.get("/workspace/:workspaceId", isMember,getBoardsByWorkspace);
router.get("/:boardId",isMember, getBoardById);
router.delete("/:boardId",isLead, deleteBoard);
router.put("/:boardId",isLead, updateBoard);

export default router;
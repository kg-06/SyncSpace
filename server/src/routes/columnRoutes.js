import express from "express";
import {
  createColumn,
  getColumnsByBoard,
  updateColumn,
  deleteColumn,
  reorderColumns
} from "../controllers/columnController.js";

import { protect } from "../middleware/authMiddleware.js";
import { isMember, isLead } from "../middleware/roleMiddleware.js";

const router = express.Router();
router.use(protect);

router.post("/",isLead, createColumn);
router.get("/board/:boardId", isMember,getColumnsByBoard);
router.put("/:columnId", isLead,updateColumn);
router.delete("/:columnId",isLead, deleteColumn);
router.put("/reorder", isLead,reorderColumns);

export default router;
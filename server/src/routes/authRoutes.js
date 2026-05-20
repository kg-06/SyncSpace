import express from "express";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  verifyEmailOtp,
  resendEmailOtp,
  forgotPassword,
  resetPassword
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-otp", verifyEmailOtp);
router.post("/resend-otp", resendEmailOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// protected route
router.get("/me", protect, getCurrentUser);

export default router;
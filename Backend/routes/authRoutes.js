import express from "express";
import AuthController from "../controllers/Auth.controller.js";

const router = express.Router();

// Login route
router.post("/login", AuthController.login);

// Sign Up route
router.post("/signup", AuthController.signUp);

// Activate account route
router.post("/activate", AuthController.activateAccount);

// Send reset password code
router.post("/send-reset-password", AuthController.sendResetPasswordCode);

// Reset password
router.put("/reset-password", AuthController.resetPassword);
router.post("/resend-otp", AuthController.resendOTP);

router.post("/refresh", AuthController.refresh);
export default router;

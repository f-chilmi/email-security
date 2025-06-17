import { Router } from "express";
import AuthController from "../controllers/AuthController";
import {
  validateLogin,
  validateRegister,
  handleValidationErrors,
} from "../middleware/validation";
import { authenticateToken } from "../middleware/auth";

const router = Router();
const authController = new AuthController();

router.post(
  "/register",
  validateRegister,
  handleValidationErrors,
  authController.register.bind(authController)
);
router.post(
  "/login",
  validateLogin,
  handleValidationErrors,
  authController.login.bind(authController)
);
router.get(
  "/profile",
  authenticateToken,
  authController.getProfile.bind(authController)
);
router.post(
  "/verify",
  authenticateToken,
  authController.verifyToken.bind(authController)
);

export default router;

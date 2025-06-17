import { Router } from "express";
import TestController from "../controllers/TestController";
import {
  validateTestRequest,
  handleValidationErrors,
} from "../middleware/validation";

const router = Router();
const testController = new TestController();

router.post(
  "/run",
  validateTestRequest,
  handleValidationErrors,
  testController.runTests.bind(testController)
);
router.get("/sessions", testController.getUserSessions.bind(testController));
router.get(
  "/sessions/:sessionId",
  testController.getSessionById.bind(testController)
);
router.get(
  "/sessions/:sessionId/results",
  testController.getSessionResults.bind(testController)
);
router.post(
  "/sessions/:sessionId/retry",
  testController.retryFailedTests.bind(testController)
);

export default router;

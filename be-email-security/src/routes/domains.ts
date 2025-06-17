import { Router } from "express";
import DomainController from "../controllers/DomainController";
import {
  validateDomain,
  handleValidationErrors,
} from "../middleware/validation";

const router = Router();
const domainController = new DomainController();

router.get("/", domainController.getUserDomains.bind(domainController));
router.post(
  "/",
  validateDomain,
  handleValidationErrors,
  domainController.addDomain.bind(domainController)
);
router.get("/:id", domainController.getDomainById.bind(domainController));
router.delete("/:id", domainController.deleteDomain.bind(domainController));
router.get(
  "/:id/tests",
  domainController.getDomainTests.bind(domainController)
);

export default router;

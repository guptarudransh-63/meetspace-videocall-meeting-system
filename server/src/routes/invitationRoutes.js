import { Router } from "express";
import {
  createInvitations,
  getInvitations,
  downloadIcs,
  inviteSchema
} from "../controllers/invitationController.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
const router = Router();
router.post("/:id/invite", requireAuth, validateBody(inviteSchema), createInvitations);
router.get("/:id/invitations", requireAuth, getInvitations);
router.get("/:id/ics", optionalAuth, downloadIcs);
var stdin_default = router;
export {
  stdin_default as default
};

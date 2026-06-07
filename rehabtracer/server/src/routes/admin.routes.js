import { Router } from "express";

import {
    activateUser,
    approveDoctor,
    deactivateUser,
    getActivityLogs,
    getAllUsers,
    getPlatformStats,
} from "../controllers/admin.controller.js";

import {
    checkRole,
    verifyToken,
} from "../middleware/auth.middleware.js";

const router = Router();

// ================= ADMIN PROTECTION =================
router.use(
  verifyToken,
  checkRole("admin")
);

// ================= ROUTES =================
router.get(
  "/stats",
  getPlatformStats
);

router.get(
  "/users",
  getAllUsers
);

router.get(
  "/activity-logs",
  getActivityLogs
);

router.patch(
  "/doctors/:id/approve",
  approveDoctor
);

router.patch(
  "/users/:id/deactivate",
  deactivateUser
);

router.patch(
  "/users/:id/activate",
  activateUser
);

export default router;
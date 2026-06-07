import express from "express";

import {
    createRequest,
    deleteRequest,
    getAllRequests,
    getMyRequests,
    getSingleRequest,
    updateRequestStatus,
} from "../controllers/request.controller.js";

import {
    authorize,
    protect,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// ================= CREATE REQUEST =================
// Patient creates rehab/support request
router.post(
  "/",
  protect,
  authorize("patient"),
  createRequest
);

// ================= GET MY REQUESTS =================
// Patient fetches own requests
router.get(
  "/my-requests",
  protect,
  authorize("patient"),
  getMyRequests
);

// ================= GET ALL REQUESTS =================
// Doctor/Admin fetches all requests
router.get(
  "/",
  protect,
  authorize("doctor", "admin"),
  getAllRequests
);

// ================= GET SINGLE REQUEST =================
router.get(
  "/:id",
  protect,
  authorize("doctor", "admin", "patient"),
  getSingleRequest
);

// ================= UPDATE REQUEST STATUS =================
// Doctor/Admin accepts/rejects request
router.patch(
  "/:id/status",
  protect,
  authorize("doctor", "admin"),
  updateRequestStatus
);

// ================= DELETE REQUEST =================
router.delete(
  "/:id",
  protect,
  authorize("admin", "patient"),
  deleteRequest
);

export default router;
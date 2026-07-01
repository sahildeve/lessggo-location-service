import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { getNotifications, getNotificationCount } from "../controllers/notification.controller.js";

const router = Router();

router.get("/",       protect, getNotifications);      // fetch + delete
router.get("/count",  protect, getNotificationCount);  // sirf count

export default router;
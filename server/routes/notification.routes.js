
const express = require("express");
const router = express.Router();

const {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead
} = require("../controllers/notification.controller");

const { protect } = require("../middleware/auth.middleware");

// All notification routes require login
router.use(protect);

// Get logged-in user's notifications
router.get("/", getNotifications);

// Mark all notifications as read
router.patch("/read-all", markAllNotificationsRead);

// Mark one notification as read
router.patch("/:id/read", markNotificationRead);

module.exports = router;

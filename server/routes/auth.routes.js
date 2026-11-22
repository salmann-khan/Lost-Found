
const express = require("express");
const router = express.Router();

const {
    signup,
    login,
    logout
} = require("../controllers/auth.controller");

const { getMe } = require("../controllers/user.controller");
const { protect } = require("../middleware/auth.middleware");

// Register a new student.
router.post("/signup", signup);

// Login an existing student.
router.post("/login", login);

// Logout the current user.
router.post("/logout", logout);

// Get currently logged-in user information.
router.get("/me", protect, getMe);

module.exports = router;

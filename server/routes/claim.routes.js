const express = require("express");
const router = express.Router();

const {
    createClaim,
    getMyClaims,
    getReceivedClaims,
    getAllClaims,
    reviewClaim,
    confirmClaimReceipt
} = require("../controllers/claim.controller");

const { protect } = require("../middleware/auth.middleware");

// Check whether the logged-in user is an administrator.
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Administrator access required."
        });
    }

    next();
};

// Student submits an ownership claim.
router.post("/", protect, createClaim);

// Student views claims they submitted.
router.get("/my", protect, getMyClaims);

// Original finder views claims received for their found items.
router.get("/received", protect, getReceivedClaims);

// Admin can view all submitted claims.
router.get("/admin", protect, requireAdmin, getAllClaims);

// Only the original finder can approve or reject a claim.
router.patch("/:id/review", protect, reviewClaim);

// Only the claimant can confirm that they received the item.
router.patch("/:id/confirm-received", protect, confirmClaimReceipt);

module.exports = router;
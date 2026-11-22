
const express = require("express");
const router = express.Router();

const {
    getItems,
    getItemById,
    createItem
} = require("../controllers/item.controller");

const { protect } = require("../middleware/auth.middleware");
const uploadItemImage = require("../middleware/upload.middleware");

// Browse active items.
router.get("/", getItems);

// Get details of one item.
router.get("/:id", getItemById);

// Create a lost or found report with an optional picture.
router.post(
    "/",
    protect,
    uploadItemImage,
    createItem
);

module.exports = router;

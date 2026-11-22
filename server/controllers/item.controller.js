
const mongoose = require("mongoose");
const Item = require("../models/Item");
const { findMatches } = require("../services/matching.service");

// GET: Browse and filter active items.
// Also returns live homepage statistics.
const getItems = async (req, res) => {
    try {
        const {
            search = "",
            category = "",
            type = ""
        } = req.query;

        const filter = {
            status: "active"
        };

        if (category) {
            filter.category = category;
        }

        if (type) {
            if (!["lost", "found"].includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid item type."
                });
            }

            filter.type = type;
        }

        if (search.trim()) {
            const safeSearch = search.trim().replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            filter.$or = [
                { title: { $regex: safeSearch, $options: "i" } },
                { description: { $regex: safeSearch, $options: "i" } },
                { location: { $regex: safeSearch, $options: "i" } }
            ];
        }

        const [
            items,
            totalReported,
            recovered,
            activeLost,
            activeFound
        ] = await Promise.all([
            Item.find(filter)
                .select("-__v")
                .populate("reportedBy", "fullName")
                .sort({ createdAt: -1 })
                .limit(50),

            Item.countDocuments({}),

            Item.countDocuments({
                status: "returned"
            }),

            Item.countDocuments({
                status: "active",
                type: "lost"
            }),

            Item.countDocuments({
                status: "active",
                type: "found"
            })
        ]);

        res.status(200).json({
            success: true,
            count: items.length,
            items,
            stats: {
                totalReported,
                recovered,
                activeLost,
                activeFound
            }
        });

    } catch (error) {
        console.error("Get items error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load items."
        });
    }
};


// GET: Retrieve one item using its MongoDB ID.
const getItemById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid item ID."
            });
        }

        const item = await Item.findOne({
            _id: id,
            status: "active"
        })
            .select("-__v")
            .populate("reportedBy", "fullName");

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Item not found or is no longer available."
            });
        }

        res.status(200).json({
            success: true,
            item
        });

    } catch (error) {
        console.error("Get item details error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load item details."
        });
    }
};


// POST: Create a lost or found item report.
const createItem = async (req, res) => {
    try {
        const {
            title,
            category,
            description,
            location,
            date
        } = req.body;

        const type = req.body.type || "lost";

        if (
            !title?.trim() ||
            !category ||
            !description?.trim() ||
            !location?.trim() ||
            !date
        ) {
            return res.status(400).json({
                success: false,
                message: "Please complete all required fields."
            });
        }

        if (!["lost", "found"].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid report type."
            });
        }

        const allowedCategories = [
            "Electronics",
            "Bags",
            "Books",
            "Clothing",
            "Accessories",
            "Other"
        ];

        if (!allowedCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: "Please select a valid category."
            });
        }

        const itemDate = new Date(date);

        if (Number.isNaN(itemDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid date."
            });
        }

        if (itemDate > new Date()) {
            return res.status(400).json({
                success: false,
                message: "The report date cannot be in the future."
            });
        }

        // Save the permanent Cloudinary image URL.
        const imageUrl = req.file
            ? req.file.cloudinaryUrl
            : "";

        const item = await Item.create({
            title: title.trim(),
            category,
            description: description.trim(),
            location: location.trim(),
            date: itemDate,
            type,
            status: "active",
            imageUrl,
            reportedBy: req.user._id
        });

        // Find possible matches in the opposite report category.
        const matches = await findMatches(item);

        res.status(201).json({
            success: true,
            message: type === "found"
                ? "Your found item has been reported successfully."
                : "Your lost item has been reported successfully.",
            item,
            matchCount: matches.length,
            matches
        });

    } catch (error) {
        console.error("Create item error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to submit your report. Please try again."
        });
    }
};

module.exports = {
    getItems,
    getItemById,
    createItem
};

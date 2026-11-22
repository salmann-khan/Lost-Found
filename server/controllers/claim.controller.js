const mongoose = require("mongoose");
const Claim = require("../models/Claim");
const Item = require("../models/Item");
const Notification = require("../models/Notification");

// Create an in-app notification without interrupting the main action.
async function createClaimNotification({
    recipient,
    sender,
    item,
    title,
    message
}) {
    try {
        await Notification.create({
            recipient,
            sender: sender || null,
            item: item || null,
            type: "general",
            title,
            message
        });
    } catch (error) {
        console.error("Claim notification error:", error.message);
    }
}


// POST: Student submits an ownership claim.
const createClaim = async (req, res) => {
    try {
        const { itemId, reason, identifyingDetails } = req.body;

        if (
            !itemId ||
            typeof reason !== "string" ||
            typeof identifyingDetails !== "string" ||
            !reason.trim() ||
            !identifyingDetails.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Please complete all claim fields."
            });
        }

        if (
            reason.trim().length > 1000 ||
            identifyingDetails.trim().length > 1500
        ) {
            return res.status(400).json({
                success: false,
                message: "Claim details exceed the allowed character limit."
            });
        }

        if (!mongoose.isValidObjectId(itemId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid item ID."
            });
        }

        const item = await Item.findById(itemId);

        if (!item || item.status !== "active") {
            return res.status(404).json({
                success: false,
                message: "This item is no longer available for claiming."
            });
        }

        if (item.type !== "found") {
            return res.status(400).json({
                success: false,
                message: "You can only claim items reported as found."
            });
        }

        if (item.reportedBy.toString() === req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You cannot claim an item you reported yourself."
            });
        }

        const existingClaim = await Claim.findOne({
            item: itemId,
            claimant: req.user._id,
            status: "pending"
        });

        if (existingClaim) {
            return res.status(409).json({
                success: false,
                message: "You already have a pending claim for this item."
            });
        }

        const claim = await Claim.create({
            item: itemId,
            claimant: req.user._id,
            reason: reason.trim(),
            identifyingDetails: identifyingDetails.trim()
        });

        await createClaimNotification({
            recipient: item.reportedBy,
            sender: req.user._id,
            item: item._id,
            title: "New ownership claim",
            message: `${req.user.fullName || "A student"} has submitted an ownership claim for "${item.title}". Please review the request.`
        });

        return res.status(201).json({
            success: true,
            message: "Your ownership claim has been submitted. The original finder will review it.",
            claim
        });

    } catch (error) {
        console.error("Create claim error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to submit your claim."
        });
    }
};


// GET: Student views their own submitted claims.
const getMyClaims = async (req, res) => {
    try {
        const claims = await Claim.find({
            claimant: req.user._id
        })
            .populate("item", "title category imageUrl location type status")
            .populate("reviewedBy", "fullName")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: claims.length,
            claims
        });

    } catch (error) {
        console.error("Get my claims error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load your claims."
        });
    }
};


// GET: Finder views claims submitted for their found items.
const getReceivedClaims = async (req, res) => {
    try {
        const reportedItems = await Item.find({
            reportedBy: req.user._id
        }).select("_id");

        const itemIds = reportedItems.map(item => item._id);

        const claims = await Claim.find({
            item: { $in: itemIds }
        })
            .populate("item", "title category imageUrl location type status")
            .populate("claimant", "fullName")
            .populate("reviewedBy", "fullName")
            .sort({ createdAt: -1 });

        const pendingCount = claims.filter(
            claim => claim.status === "pending"
        ).length;

        return res.status(200).json({
            success: true,
            count: claims.length,
            pendingCount,
            claims
        });

    } catch (error) {
        console.error("Get received claims error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load received claims."
        });
    }
};


// GET: Admin views all claims.
const getAllClaims = async (req, res) => {
    try {
        const claims = await Claim.find()
            .populate("item", "title category imageUrl location type status")
            .populate("claimant", "fullName email")
            .populate("reviewedBy", "fullName")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: claims.length,
            claims
        });

    } catch (error) {
        console.error("Get all claims error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load claims."
        });
    }
};


// PATCH: Only the original finder can approve or reject a claim.
const reviewClaim = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reviewNote = "" } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid claim ID."
            });
        }

        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Choose approved or rejected."
            });
        }

        if (
            typeof reviewNote !== "string" ||
            reviewNote.length > 1000
        ) {
            return res.status(400).json({
                success: false,
                message: "Review note must be 1000 characters or fewer."
            });
        }

        const claim = await Claim.findById(id);

        if (!claim) {
            return res.status(404).json({
                success: false,
                message: "Claim not found."
            });
        }

        const item = await Item.findById(claim.item);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "The associated item could not be found."
            });
        }

        // Only the original finder can review this claim.
        if (item.reportedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only the original finder can review this claim."
            });
        }

        if (claim.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "This claim has already been reviewed."
            });
        }

        if (item.type !== "found" || item.status !== "active") {
            return res.status(409).json({
                success: false,
                message: "This item is no longer available for claim approval."
            });
        }

        // Reserve the item when the finder approves the claim.
        if (status === "approved") {
            const updatedItem = await Item.findOneAndUpdate(
                {
                    _id: item._id,
                    reportedBy: req.user._id,
                    type: "found",
                    status: "active"
                },
                {
                    $set: { status: "claimed" }
                },
                { new: true }
            );

            if (!updatedItem) {
                return res.status(409).json({
                    success: false,
                    message: "This item has already been claimed or is no longer available."
                });
            }
        }

        claim.status = status;
        claim.reviewNote = reviewNote.trim();
        claim.reviewedBy = req.user._id;
        claim.reviewedAt = new Date();

        try {
            await claim.save();
        } catch (saveError) {
            // Restore availability if the claim could not be saved.
            if (status === "approved") {
                await Item.updateOne(
                    {
                        _id: item._id,
                        status: "claimed"
                    },
                    {
                        $set: { status: "active" }
                    }
                );
            }

            throw saveError;
        }

        await createClaimNotification({
            recipient: claim.claimant,
            sender: req.user._id,
            item: item._id,
            title: status === "approved"
                ? "Your ownership claim was approved"
                : "Your ownership claim was rejected",
            message: status === "approved"
                ? `Your claim for "${item.title}" was approved by the original finder. Please arrange a safe handover and confirm receipt afterward. ${reviewNote.trim()}`
                : `Your claim for "${item.title}" was rejected by the original finder. ${reviewNote.trim()}`
        });

        const populatedClaim = await Claim.findById(claim._id)
            .populate("item", "title category imageUrl location type status")
            .populate("claimant", "fullName")
            .populate("reviewedBy", "fullName");

        return res.status(200).json({
            success: true,
            message: status === "approved"
                ? "Claim approved. Arrange a safe handover."
                : "Claim rejected.",
            claim: populatedClaim
        });

    } catch (error) {
        console.error("Review claim error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to review this claim."
        });
    }
};


// PATCH: Claimant confirms that they physically received the item.
const confirmClaimReceipt = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid claim ID."
            });
        }

        const claim = await Claim.findOne({
            _id: id,
            claimant: req.user._id
        });

        if (!claim) {
            return res.status(404).json({
                success: false,
                message: "Claim not found or you are not authorized to confirm it."
            });
        }

        if (claim.status !== "approved") {
            return res.status(400).json({
                success: false,
                message: "Only approved claims can be confirmed as received."
            });
        }

        if (claim.confirmedReceivedAt) {
            return res.status(409).json({
                success: false,
                message: "You have already confirmed receipt of this item."
            });
        }

        const item = await Item.findOneAndUpdate(
            {
                _id: claim.item,
                type: "found",
                status: "claimed"
            },
            {
                $set: { status: "returned" }
            },
            { new: true }
        );

        if (!item) {
            return res.status(409).json({
                success: false,
                message: "This item is no longer awaiting handover confirmation."
            });
        }

        claim.confirmedReceivedAt = new Date();

        try {
            await claim.save();
        } catch (saveError) {
            // Roll back the item status if saving the confirmation fails.
            await Item.updateOne(
                {
                    _id: item._id,
                    status: "returned"
                },
                {
                    $set: { status: "claimed" }
                }
            );

            throw saveError;
        }

        // Notify the original finder that the item was received.
        await createClaimNotification({
            recipient: item.reportedBy,
            sender: req.user._id,
            item: item._id,
            title: "Item successfully returned",
            message: `The claimant has confirmed receiving "${item.title}". This item is now marked as returned.`
        });

        return res.status(200).json({
            success: true,
            message: "Receipt confirmed. This item is now marked as recovered.",
            confirmedReceivedAt: claim.confirmedReceivedAt,
            itemStatus: item.status
        });

    } catch (error) {
        console.error("Confirm claim receipt error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to confirm item receipt."
        });
    }
};


module.exports = {
    createClaim,
    getMyClaims,
    getReceivedClaims,
    getAllClaims,
    reviewClaim,
    confirmClaimReceipt
};
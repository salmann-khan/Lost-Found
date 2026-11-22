const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema(
    {
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Item",
            required: true
        },

        claimant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        reason: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000
        },

        identifyingDetails: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1500
        },

        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending"
        },

        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        reviewNote: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: ""
        },

        reviewedAt: {
            type: Date,
            default: null
        },

        confirmedReceivedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Claim", claimSchema);
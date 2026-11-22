const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
    {
        lostItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Item",
            required: true
        },

        foundItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Item",
            required: true
        },

        lostReporter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        foundReporter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        score: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },

        status: {
            type: String,
            enum: [
                "potential",
                "confirmed",
                "rejected",
                "resolved"
            ],
            default: "potential"
        },

        notificationsSent: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

// Prevent duplicate records for the same lost/found pair.
matchSchema.index(
    {
        lostItem: 1,
        foundItem: 1
    },
    {
        unique: true
    }
);

module.exports = mongoose.model("Match", matchSchema);
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Item",
            default: null
        },

        matchedItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Item",
            default: null
        },

        type: {
            type: String,
            enum: [
                "new_match",
                "item_claimed",
                "item_returned",
                "general"
            ],
            default: "general"
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        message: {
            type: String,
            required: true,
            trim: true
        },

        matchScore: {
            type: Number,
            min: 0,
            max: 100,
            default: null
        },

        isRead: {
            type: Boolean,
            default: false
        },

        emailSent: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

// Efficiently retrieve a student's notifications.
notificationSchema.index({
    recipient: 1,
    createdAt: -1
});

module.exports = mongoose.model(
    "Notification",
    notificationSchema
);
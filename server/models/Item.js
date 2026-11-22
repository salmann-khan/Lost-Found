
const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        category: {
            type: String,
            required: true,
            enum: [
                "Electronics",
                "Bags",
                "Books",
                "Clothing",
                "Accessories",
                "Other"
            ]
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000
        },
        location: {
            type: String,
            required: true,
            trim: true
        },
        date: {
            type: Date,
            required: true
        },
        type: {
            type: String,
            required: true,
            enum: ["lost", "found"]
        },
        status: {
            type: String,
            enum: ["active", "claimed", "returned"],
            default: "active"
        },
        imageUrl: {
            type: String,
            default: ""
        },
        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);

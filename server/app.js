
const express = require("express");
const path = require("path");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

// Import API routes
const authRoutes = require("./routes/auth.routes");
const itemRoutes = require("./routes/item.routes");
const claimRoutes = require("./routes/claim.routes");
const notificationRoutes = require("./routes/notification.routes");
const chatbotRoutes = require("./routes/chatbot.routes");

const app = express();

// ==========================================
// SECURITY AND BODY MIDDLEWARE
// ==========================================

app.use(helmet());

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ==========================================
// STATIC FILES
// ==========================================

// Serve frontend files
app.use(express.static(path.join(__dirname, "../client")));

// Serve uploaded item pictures
app.use(
    "/uploads",
    express.static(path.join(__dirname, "../uploads"))
);

// ==========================================
// API ROUTES
// ==========================================

// Authentication routes
app.use("/api/auth", authRoutes);

// Lost and found item routes
app.use("/api/items", itemRoutes);

// Ownership claim routes
app.use("/api/claims", claimRoutes);

// Notification routes
app.use("/api/notifications", notificationRoutes);

// AI chatbot routes
app.use("/api/chatbot", chatbotRoutes);

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "FindIt API is running"
    });
});

// ==========================================
// API NOT FOUND HANDLER
// ==========================================

app.use("/api", (req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found."
    });
});

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use((error, req, res, next) => {
    console.error("Server error:", error);

    if (res.headersSent) {
        return next(error);
    }

    res.status(error.status || 500).json({
        success: false,
        message: error.message || "Internal server error."
    });
});

module.exports = app;

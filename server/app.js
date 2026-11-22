
const express = require("express");
const path = require("path");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/database");

const authRoutes = require("./routes/auth.routes");
const itemRoutes = require("./routes/item.routes");
const claimRoutes = require("./routes/claim.routes");
const notificationRoutes = require("./routes/notification.routes");
const chatbotRoutes = require("./routes/chatbot.routes");

const app = express();

app.use(helmet());
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, "../client")));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Connect to MongoDB before handling API requests.
app.use("/api", async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        next(error);
    }
});

app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chatbot", chatbotRoutes);

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "FindIt API is running"
    });
});

app.use("/api", (req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found."
    });
});

app.use((error, req, res, next) => {
    console.error("Server error:", error);

    if (res.headersSent) return next(error);

    res.status(error.status || 500).json({
        success: false,
        message: error.message || "Internal server error."
    });
});

module.exports = app;

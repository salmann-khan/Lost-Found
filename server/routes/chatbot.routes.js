
const express = require("express");
const rateLimit = require("express-rate-limit");

const {
    chatWithFindIt
} = require("../controllers/chatbot.controller");

const router = express.Router();

const chatbotLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many chatbot requests. Please try again later."
    }
});

router.post("/", chatbotLimiter, chatWithFindIt);

module.exports = router;

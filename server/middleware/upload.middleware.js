const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const uploadDirectory = path.join(
    __dirname,
    "../../uploads/items"
);

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        cb(null, `${crypto.randomUUID()}${extension}`);
    }
});

const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
];

const fileFilter = (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only JPG, PNG, and WebP images are allowed."));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

// Handle upload errors and return JSON responses.
const uploadItemImage = (req, res, next) => {
    upload.single("image")(req, res, (error) => {
        if (error) {
            let message = error.message;

            if (error.code === "LIMIT_FILE_SIZE") {
                message = "Image size must not exceed 5 MB.";
            }

            return res.status(400).json({
                success: false,
                message
            });
        }

        next();
    });
};

module.exports = uploadItemImage;
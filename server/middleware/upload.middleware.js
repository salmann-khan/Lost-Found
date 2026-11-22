
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPG, PNG, and WebP images are allowed."));
        }
    },
    limits: {
        fileSize: 4 * 1024 * 1024
    }
});

const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "findit/items",
                resource_type: "image"
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        stream.end(buffer);
    });
};

const uploadItemImage = (req, res, next) => {
    upload.single("image")(req, res, async (error) => {
        if (error) {
            let message = error.message;

            if (error.code === "LIMIT_FILE_SIZE") {
                message = "Image size must not exceed 4 MB.";
            }

            return res.status(400).json({
                success: false,
                message
            });
        }

        if (!req.file) return next();

        try {
            const result = await uploadToCloudinary(req.file.buffer);
            req.file.cloudinaryUrl = result.secure_url;
            next();
        } catch (uploadError) {
            console.error("Cloudinary upload error:", uploadError);

            return res.status(500).json({
                success: false,
                message: "Unable to upload image. Please try again."
            });
        }
    });
};

module.exports = uploadItemImage;

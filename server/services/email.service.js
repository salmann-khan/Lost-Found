const transporter = require("../config/mail");

const APP_URL = (
    process.env.APP_URL || "http://localhost:5000"
).replace(/\/$/, "");

// Send a potential-match email to a student.
const sendMatchEmail = async ({
    recipientName,
    recipientEmail,
    reporterName,
    item,
    matchScore,
    matchedItemId
}) => {
    try {
        if (
            !recipientEmail ||
            !item ||
            !matchedItemId
        ) {
            throw new Error("Required email information is missing.");
        }

        const itemUrl =
            `${APP_URL}/pages/item-details.html?id=${encodeURIComponent(matchedItemId)}`;

        const safeName = escapeHtml(recipientName || "Student");
        const safeReporter = escapeHtml(reporterName || "Another student");
        const safeTitle = escapeHtml(item.title || "Reported item");
        const safeCategory = escapeHtml(item.category || "Other");
        const safeLocation = escapeHtml(item.location || "Not specified");
        const safeDescription = escapeHtml(
            item.description || "No description provided."
        );

        const score = Math.max(
            0,
            Math.min(100, Number(matchScore) || 0)
        );

        const subject = "FindIt: A possible match has been found!";

        const text = `
Hello ${recipientName || "Student"},

Good news! FindIt has identified a possible match for your reported item.

Possible matching item:
Item: ${item.title || "Reported item"}
Category: ${item.category || "Other"}
Description: ${item.description || "Not provided"}
Location: ${item.location || "Not specified"}

Reported by: ${reporterName || "Another student"}
Match score: ${score}%

This is only a potential match, not confirmation of ownership.

Review the report here:
${itemUrl}

Regards,
FindIt Team
        `.trim();

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FindIt - Possible Match</title>
</head>
<body style="margin:0;padding:30px 15px;background:#f5f3ff;font-family:Arial,sans-serif;color:#28243d;">

    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(40,36,61,0.08);">

        <div style="background:linear-gradient(120deg,#6558dc,#8c76ff);padding:30px;text-align:center;color:white;">
            <h1 style="margin:0;font-size:28px;">FindIt</h1>
            <p style="margin:10px 0 0;font-size:14px;">
                Campus Lost & Found
            </p>
        </div>

        <div style="padding:30px;">

            <h2 style="margin-top:0;color:#28243d;">
                A possible match was found!
            </h2>

            <p>Hello ${safeName},</p>

            <p style="line-height:1.7;color:#666;">
                Good news! FindIt has identified an item that may match
                your lost or found report.
            </p>

            <div style="background:#f5f2ff;border-radius:12px;padding:20px;margin:22px 0;">

                <p style="margin:0 0 12px;color:#6558dc;font-weight:bold;">
                    MATCHING ITEM DETAILS
                </p>

                <p><strong>Item:</strong> ${safeTitle}</p>
                <p><strong>Category:</strong> ${safeCategory}</p>
                <p><strong>Description:</strong> ${safeDescription}</p>
                <p><strong>Location:</strong> ${safeLocation}</p>
                <p><strong>Reported by:</strong> ${safeReporter}</p>

                <div style="margin-top:18px;">
                    <strong>Match score: ${score}%</strong>

                    <div style="height:9px;background:#e4defe;border-radius:20px;margin-top:8px;overflow:hidden;">
                        <div style="height:9px;width:${score}%;background:#6558dc;border-radius:20px;"></div>
                    </div>
                </div>

            </div>

            <p style="font-size:13px;color:#777;line-height:1.7;">
                Please remember that this is only a potential match.
                Review the item details before making an ownership claim.
            </p>

            <div style="text-align:center;margin:28px 0;">
                <a href="${itemUrl}"
                   style="display:inline-block;background:#6558dc;color:#ffffff;text-decoration:none;padding:14px 25px;border-radius:10px;font-weight:bold;">
                    View Matching Item
                </a>
            </div>

            <p style="font-size:13px;color:#777;">
                For privacy, contact details are not shared in this email.
                Please use the FindIt platform to continue.
            </p>

        </div>

        <div style="background:#faf9ff;padding:20px;text-align:center;color:#888;font-size:12px;">
            FindIt — Helping students reconnect with their belongings.
        </div>

    </div>

</body>
</html>
        `;

        const result = await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: recipientEmail,
            subject,
            text,
            html
        });

        console.log(
            `Match email sent to ${recipientEmail}: ${result.messageId}`
        );

        return {
            success: true,
            messageId: result.messageId
        };

    } catch (error) {
        console.error("Match email error:", error.message);

        return {
            success: false,
            message: error.message
        };
    }
};


// Escape user-provided text before inserting it into HTML.
function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

module.exports = {
    sendMatchEmail
};
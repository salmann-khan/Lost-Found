const User = require("../models/User");
const Match = require("../models/Match");
const Notification = require("../models/Notification");
const { sendMatchEmail } = require("./email.service");

// Send in-app and email notifications to both students.
const createMatchNotifications = async (newItem, matches) => {
    const results = [];

    try {
        if (!newItem || !Array.isArray(matches) || matches.length === 0) {
            return results;
        }

        // Get the student who submitted the new report.
        const newReporter = await User.findById(newItem.reportedBy)
            .select("fullName email")
            .lean();

        if (!newReporter) {
            console.error("New item reporter could not be found.");
            return results;
        }

        for (const match of matches) {
            try {
                const existingItem = match.item;

                if (!existingItem || !existingItem.reportedBy) {
                    continue;
                }

                // Identify which report is lost and which is found.
                const lostItem =
                    newItem.type === "lost" ? newItem : existingItem;

                const foundItem =
                    newItem.type === "found" ? newItem : existingItem;

                // Identify the two students.
                const lostReporter =
                    newItem.type === "lost"
                        ? newReporter
                        : existingItem.reportedBy;

                const foundReporter =
                    newItem.type === "found"
                        ? newReporter
                        : existingItem.reportedBy;

                if (
                    !lostReporter ||
                    !foundReporter ||
                    !lostReporter._id ||
                    !foundReporter._id
                ) {
                    continue;
                }

                // Save the match. The unique database index prevents duplicates.
                let savedMatch;

                try {
                    savedMatch = await Match.create({
                        lostItem: lostItem._id,
                        foundItem: foundItem._id,
                        lostReporter: lostReporter._id,
                        foundReporter: foundReporter._id,
                        score: match.score,
                        status: "potential"
                    });
                } catch (error) {
                    if (error.code === 11000) {
                        console.log("Duplicate match skipped.");
                        continue;
                    }

                    throw error;
                }

                // Create an in-app notification for the student who lost the item.
                const lostNotification = await Notification.create({
                    recipient: lostReporter._id,
                    sender: foundReporter._id,
                    item: lostItem._id,
                    matchedItem: foundItem._id,
                    type: "new_match",
                    title: "Possible found item match!",
                    message:
                        `${foundReporter.fullName} reported a found item ` +
                        `that may match your lost ${lostItem.title}.`,
                    matchScore: match.score
                });

                // Create an in-app notification for the student who found the item.
                const foundNotification = await Notification.create({
                    recipient: foundReporter._id,
                    sender: lostReporter._id,
                    item: foundItem._id,
                    matchedItem: lostItem._id,
                    type: "new_match",
                    title: "Someone may be looking for this item!",
                    message:
                        `${lostReporter.fullName} reported a lost item ` +
                        `that may match your found ${foundItem.title}.`,
                    matchScore: match.score
                });

                // Email the student who reported the lost item.
                const lostEmailResult = await sendMatchEmail({
                    recipientName: lostReporter.fullName,
                    recipientEmail: lostReporter.email,
                    reporterName: foundReporter.fullName,
                    item: foundItem,
                    matchScore: match.score,
                    matchedItemId: foundItem._id
                });

                // Email the student who reported the found item.
                const foundEmailResult = await sendMatchEmail({
                    recipientName: foundReporter.fullName,
                    recipientEmail: foundReporter.email,
                    reporterName: lostReporter.fullName,
                    item: lostItem,
                    matchScore: match.score,
                    matchedItemId: lostItem._id
                });

                // Record the email delivery results.
                await Promise.all([
                    Notification.findByIdAndUpdate(
                        lostNotification._id,
                        { emailSent: lostEmailResult.success }
                    ),
                    Notification.findByIdAndUpdate(
                        foundNotification._id,
                        { emailSent: foundEmailResult.success }
                    )
                ]);

                // Update the match record.
                await Match.findByIdAndUpdate(
                    savedMatch._id,
                    {
                        notificationsSent:
                            lostEmailResult.success &&
                            foundEmailResult.success
                    }
                );

                results.push({
                    matchId: savedMatch._id,
                    score: match.score,
                    lostEmailSent: lostEmailResult.success,
                    foundEmailSent: foundEmailResult.success
                });

                console.log(
                    `Match notifications processed: ${match.score}%`
                );

            } catch (error) {
                console.error(
                    "Individual match notification error:",
                    error.message
                );
            }
        }

        return results;

    } catch (error) {
        console.error(
            "Match notification service error:",
            error.message
        );

        return results;
    }
};

module.exports = {
    createMatchNotifications
};
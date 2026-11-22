const Item = require("../models/Item");
const { createMatchNotifications } = require("./notification.service");

// Convert text into comparable words.
const normalizeText = (text = "") => {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(word => word.length > 1);
};

// Calculate similarity between two pieces of text.
const calculateTextSimilarity = (textA, textB) => {
    const wordsA = new Set(normalizeText(textA));
    const wordsB = new Set(normalizeText(textB));

    if (wordsA.size === 0 || wordsB.size === 0) {
        return 0;
    }

    const commonWords = [...wordsA].filter(word =>
        wordsB.has(word)
    );

    const totalWords = new Set([...wordsA, ...wordsB]);

    return commonWords.length / totalWords.size;
};

// Calculate date similarity.
const calculateDateSimilarity = (dateA, dateB) => {
    const firstDate = new Date(dateA);
    const secondDate = new Date(dateB);

    const difference = Math.abs(
        firstDate.getTime() - secondDate.getTime()
    );

    const differenceInDays =
        difference / (1000 * 60 * 60 * 24);

    // Full score on the same date, gradually decreasing over 30 days.
    return Math.max(0, 1 - differenceInDays / 30);
};

// Calculate overall matching score.
const calculateMatchScore = (newItem, existingItem) => {

    // Category: 20%
    const categoryScore =
        newItem.category === existingItem.category ? 20 : 0;

    // Item name: 25%
    const titleSimilarity = calculateTextSimilarity(
        newItem.title,
        existingItem.title
    );

    const titleScore = titleSimilarity * 25;

    // Description: 25%
    const descriptionSimilarity = calculateTextSimilarity(
        newItem.description,
        existingItem.description
    );

    const descriptionScore = descriptionSimilarity * 25;

    // Location: 15%
    const locationSimilarity = calculateTextSimilarity(
        newItem.location,
        existingItem.location
    );

    const locationScore = locationSimilarity * 15;

    // Date: 15%
    const dateSimilarity = calculateDateSimilarity(
        newItem.date,
        existingItem.date
    );

    const dateScore = dateSimilarity * 15;

    const totalScore =
        categoryScore +
        titleScore +
        descriptionScore +
        locationScore +
        dateScore;

    return Math.round(totalScore);
};

// Find possible matches in the opposite report category.
const findMatches = async (newItem) => {
    try {
        const oppositeType =
            newItem.type === "lost" ? "found" : "lost";

        const existingItems = await Item.find({
            type: oppositeType,
            status: "active",
            reportedBy: { $ne: newItem.reportedBy },
            _id: { $ne: newItem._id }
        })
            .select("-__v")
            .populate("reportedBy", "fullName email")
            .sort({ createdAt: -1 })
            .limit(200)
            .lean();

        const matches = existingItems
            .map(existingItem => {
                const score = calculateMatchScore(
                    newItem,
                    existingItem
                );

                return {
                    item: existingItem,
                    score,
                    matchLevel:
                        score >= 80
                            ? "Strong match"
                            : score >= 60
                                ? "Possible match"
                                : "Low similarity"
                };
            })
            .filter(match => match.score >= 60)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        // Automatically notify both students about potential matches.
        if (matches.length > 0) {
            await createMatchNotifications(newItem, matches);
        }

        return matches;

    } catch (error) {
        console.error("Matching service error:", error);
        return [];
    }
};

module.exports = {
    findMatches,
    calculateMatchScore
};
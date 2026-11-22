
document.addEventListener("DOMContentLoaded", () => {
    const claimForm = document.getElementById("claim-form");

    const loadingMessage = document.getElementById("loading-message");
    const errorMessage = document.getElementById("error-message");
    const errorText = document.getElementById("error-text");

    const itemSummary = document.getElementById("item-summary");
    const summaryImage = document.getElementById("summary-image");
    const summaryPlaceholder = document.getElementById("summary-placeholder");
    const summaryTitle = document.getElementById("summary-title");
    const summaryCategory = document.getElementById("summary-category");

    const reasonInput = document.getElementById("claim-reason");
    const identifyingInput = document.getElementById("identifying-details");

    const submitButton = document.getElementById("submit-claim");
    const successMessage = document.getElementById("success-message");
    const submitError = document.getElementById("submit-error");

    const params = new URLSearchParams(window.location.search);
    const itemId = params.get("itemId");

    let currentItem = null;
    let claimSubmitted = false;
    let feedbackPromise = null;

    function showFeedback(text, type = "success") {
        if (window.FindItFeedback) {
            window.FindItFeedback.show(text, type);
            return;
        }

        if (!feedbackPromise) {
            feedbackPromise = new Promise((resolve, reject) => {
                const script = document.createElement("script");
                script.src = "../js/feedback.js";
                script.onload = resolve;
                script.onerror = reject;
                document.body.appendChild(script);
            });
        }

        feedbackPromise
            .then(() => window.FindItFeedback.show(text, type))
            .catch(error => console.error("Feedback system failed to load:", error));
    }

    function showError(message) {
        loadingMessage.hidden = true;
        itemSummary.hidden = true;
        claimForm.hidden = true;
        errorMessage.hidden = false;
        errorText.textContent = message;
        showFeedback(message, "error");
    }

    async function loadItem() {
        if (!itemId) {
            showError("No item was selected. Please choose an item from Browse Items.");
            return;
        }

        try {
            const response = await fetch(
                `/api/items/${encodeURIComponent(itemId)}`
            );

            const data = await response.json();

            if (!response.ok || !data.success || !data.item) {
                throw new Error(
                    data.message || "Unable to load the selected item."
                );
            }

            currentItem = data.item;

            if (currentItem.type !== "found") {
                throw new Error(
                    "Only items reported as found can receive ownership claims."
                );
            }

            summaryTitle.textContent = currentItem.title || "Untitled item";
            summaryCategory.textContent = currentItem.category || "Other";

            if (currentItem.imageUrl) {
                summaryImage.addEventListener("load", () => {
                    summaryImage.hidden = false;
                    summaryPlaceholder.hidden = true;
                }, { once: true });

                summaryImage.addEventListener("error", () => {
                    summaryImage.hidden = true;
                    summaryPlaceholder.hidden = false;
                }, { once: true });

                summaryImage.src = currentItem.imageUrl;
            }

            loadingMessage.hidden = true;
            errorMessage.hidden = true;
            itemSummary.hidden = false;
            claimForm.hidden = false;

        } catch (error) {
            console.error("Claim item loading error:", error);
            showError(error.message || "Unable to load item information.");
        }
    }

    claimForm.addEventListener("submit", async event => {
        event.preventDefault();

        if (!currentItem || claimSubmitted) {
            return;
        }

        const reason = reasonInput.value.trim();
        const identifyingDetails = identifyingInput.value.trim();

        if (!reason || !identifyingDetails) {
            submitError.textContent = "Please complete both fields.";
            submitError.hidden = false;
            showFeedback("Please complete both fields.", "error");
            return;
        }

        submitError.hidden = true;
        successMessage.hidden = true;

        submitButton.disabled = true;
        submitButton.textContent = "Submitting claim...";

        try {
            const response = await fetch("/api/claims", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    itemId: currentItem._id,
                    reason,
                    identifyingDetails
                })
            });

            const data = await response.json();

            if (response.status === 401) {
                window.location.href = "login.html";
                return;
            }

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to submit your claim."
                );
            }

            claimSubmitted = true;

            successMessage.hidden = false;
            claimForm.reset();

            reasonInput.disabled = true;
            identifyingInput.disabled = true;

            submitButton.textContent = "Claim Submitted";
            submitButton.disabled = true;

            showFeedback(
                "Your ownership claim has been submitted successfully!",
                "success"
            );

        } catch (error) {
            console.error("Claim submission error:", error);

            submitError.textContent =
                error.message || "Something went wrong. Please try again.";

            submitError.hidden = false;

            showFeedback(submitError.textContent, "error");

            submitButton.disabled = false;
            submitButton.textContent = "Submit Ownership Claim →";
        }
    });

    loadItem();
});

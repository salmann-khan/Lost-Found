
document.addEventListener("DOMContentLoaded", () => {
    const foundItemForm = document.getElementById("foundItemForm");
    const formMessage = document.getElementById("formMessage");
    const successMessage = document.getElementById("successMessage");
    const submitButton = document.getElementById("submitButton");
    const dateInput = document.getElementById("date");

    const imageInput = document.getElementById("itemImage");
    const imagePreview = document.getElementById("imagePreview");
    const previewContainer = document.getElementById("imagePreviewContainer");
    const imageFileName = document.getElementById("imageFileName");
    const removeImageButton = document.getElementById("removeImageButton");

    let previewUrl = null;
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

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maximumFileSize = 5 * 1024 * 1024;

    const today = new Date();
    const localToday = new Date(
        today.getTime() - today.getTimezoneOffset() * 60000
    ).toISOString().split("T")[0];

    dateInput.max = localToday;
    dateInput.value = localToday;

    function showMessage(text, type) {
        formMessage.textContent = text;
        formMessage.className = `form-message ${type}`;
        formMessage.hidden = false;

        if (type === "error") {
            showFeedback(text, "error");
        }
    }

    function clearPreview() {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            previewUrl = null;
        }

        imageInput.value = "";
        imagePreview.src = "";
        imageFileName.textContent = "";
        previewContainer.hidden = true;
    }

    function displayMatches(matches) {
        const oldResults = document.getElementById("match-results");
        if (oldResults) oldResults.remove();

        const section = document.createElement("section");
        section.id = "match-results";
        section.style.cssText = `
            margin: 24px 0;
            padding: 20px;
            background: #f5f3ff;
            border: 1px solid #e5ddff;
            border-radius: 14px;
        `;

        const heading = document.createElement("h3");
        heading.textContent = matches.length
            ? "Possible matching lost items"
            : "No possible matches yet";
        heading.style.cssText = "margin: 0 0 12px; color: #5141b8;";
        section.appendChild(heading);

        if (!matches.length) {
            const note = document.createElement("p");
            note.textContent =
                "Your report is saved. FindIt will check for a possible match when someone reports a lost item.";
            note.style.cssText = "line-height: 1.6; margin: 0;";
            section.appendChild(note);
        }

        matches.forEach(match => {
            const item = match.item;
            if (!item) return;

            const card = document.createElement("article");
            card.style.cssText = `
                background: white;
                border: 1px solid #e8e4f5;
                border-radius: 12px;
                padding: 16px;
                margin-top: 12px;
            `;

            const title = document.createElement("h4");
            title.textContent = item.title || "Matching item";
            title.style.cssText = "margin: 0 0 8px;";

            const score = document.createElement("p");
            score.textContent = `Match score: ${match.score}% — ${match.matchLevel}`;
            score.style.cssText = `
                color: #5141b8;
                font-weight: 700;
                margin: 8px 0;
            `;

            const details = document.createElement("p");
            details.textContent =
                `${item.category || "Other"} · ${item.location || "Location unavailable"}`;
            details.style.cssText = "margin: 8px 0; color: #666;";

            const description = document.createElement("p");
            description.textContent = item.description || "";
            description.style.cssText = "margin: 8px 0; line-height: 1.5;";

            const link = document.createElement("a");
            link.href = `item-details.html?id=${encodeURIComponent(item._id)}`;
            link.textContent = "View matching item →";
            link.style.cssText = `
                display: inline-block;
                margin-top: 8px;
                color: #6558dc;
                font-weight: 700;
                text-decoration: none;
            `;

            card.append(title, score, details, description, link);
            section.appendChild(card);
        });

        const browseLink = successMessage.querySelector(".browse-link");

        if (browseLink) {
            successMessage.insertBefore(section, browseLink);
        } else {
            successMessage.appendChild(section);
        }
    }

    imageInput.addEventListener("change", () => {
        const file = imageInput.files[0];

        if (!file) {
            clearPreview();
            return;
        }

        if (!allowedTypes.includes(file.type)) {
            clearPreview();
            showMessage("Please select a JPG, PNG, or WebP image.", "error");
            return;
        }

        if (file.size > maximumFileSize) {
            clearPreview();
            showMessage("Image size must not exceed 5 MB.", "error");
            return;
        }

        if (previewUrl) URL.revokeObjectURL(previewUrl);

        previewUrl = URL.createObjectURL(file);
        imagePreview.src = previewUrl;
        imageFileName.textContent = file.name;
        previewContainer.hidden = false;
        formMessage.hidden = true;
    });

    removeImageButton.addEventListener("click", () => {
        clearPreview();
        formMessage.hidden = true;
    });

    foundItemForm.addEventListener("submit", async event => {
        event.preventDefault();
        formMessage.hidden = true;

        const itemData = {
            title: document.getElementById("itemName").value.trim(),
            category: document.getElementById("category").value,
            description: document.getElementById("description").value.trim(),
            location: document.getElementById("location").value.trim(),
            date: dateInput.value
        };

        if (
            !itemData.title ||
            !itemData.category ||
            !itemData.description ||
            !itemData.location ||
            !itemData.date
        ) {
            showMessage("Please complete all required fields.", "error");
            return;
        }

        const selectedImage = imageInput.files[0];

        if (selectedImage && !allowedTypes.includes(selectedImage.type)) {
            showMessage("Please select a JPG, PNG, or WebP image.", "error");
            return;
        }

        if (selectedImage && selectedImage.size > maximumFileSize) {
            showMessage("Image size must not exceed 5 MB.", "error");
            return;
        }

        const formData = new FormData();
        formData.append("title", itemData.title);
        formData.append("category", itemData.category);
        formData.append("description", itemData.description);
        formData.append("location", itemData.location);
        formData.append("date", itemData.date);
        formData.append("type", "found");

        if (selectedImage) {
            formData.append("image", selectedImage);
        }

        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";

        try {
            const response = await fetch("/api/items", {
                method: "POST",
                credentials: "include",
                body: formData
            });

            const result = await response.json();

            if (response.status === 401 || response.status === 403) {
                window.location.href = "login.html";
                return;
            }

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to submit your report.");
            }

            showFeedback("Your found item has been reported successfully!", "success");

            console.log("Matching API response:", result);

            foundItemForm.hidden = true;
            successMessage.hidden = false;

            displayMatches(Array.isArray(result.matches) ? result.matches : []);

            clearPreview();

        } catch (error) {
            console.error("Found item submission error:", error);
            showMessage(
                error.message || "Something went wrong. Please try again.",
                "error"
            );
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Submit Found Report <span>→</span>';
        }
    });
});

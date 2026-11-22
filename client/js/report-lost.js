
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("lost-item-form");
    const submitButton = document.getElementById("submit-btn");
    const message = document.getElementById("form-message");
    const successPanel = document.getElementById("success-panel");

    const dateInput = document.getElementById("date");
    const imageInput = document.getElementById("item-image");
    const imagePreview = document.getElementById("image-preview");
    const previewContainer = document.getElementById("image-preview-container");
    const fileName = document.getElementById("image-file-name");
    const removeImageButton = document.getElementById("remove-image-btn");

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
    const localToday = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");

    dateInput.max = localToday;

    function showMessage(text, type) {
        message.textContent = text;
        message.className = `form-message ${type}`;
        message.hidden = false;

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
        fileName.textContent = "";
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
            ? "Possible matching found items"
            : "No possible matches yet";
        heading.style.cssText = "margin: 0 0 12px; color: #5141b8;";
        section.appendChild(heading);

        if (!matches.length) {
            const note = document.createElement("p");
            note.textContent =
                "Your report is saved. FindIt will have another opportunity to find a match when someone reports a found item.";
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

        const browseLink = successPanel.querySelector(".browse-button");

        if (browseLink) {
            successPanel.insertBefore(section, browseLink);
        } else {
            successPanel.appendChild(section);
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
        fileName.textContent = file.name;
        previewContainer.hidden = false;
        message.hidden = true;
    });

    removeImageButton.addEventListener("click", () => {
        clearPreview();
        message.hidden = true;
    });

    form.addEventListener("submit", async event => {
        event.preventDefault();
        message.hidden = true;

        const title = document.getElementById("title").value.trim();
        const category = document.getElementById("category").value;
        const description = document.getElementById("description").value.trim();
        const location = document.getElementById("location").value.trim();
        const date = dateInput.value;

        if (!title || !category || !description || !location || !date) {
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
        formData.append("title", title);
        formData.append("category", category);
        formData.append("description", description);
        formData.append("location", location);
        formData.append("date", date);
        formData.append("type", "lost");

        if (selectedImage) {
            formData.append("image", selectedImage);
        }

        submitButton.disabled = true;
        submitButton.textContent = "Submitting report...";

        try {
            const response = await fetch("/api/items", {
                method: "POST",
                credentials: "include",
                body: formData
            });

            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                window.location.href = "login.html";
                return;
            }

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to submit your report.");
            }

            showFeedback("Your lost item has been reported successfully!", "success");

            console.log("Matching API response:", data);

            form.hidden = true;
            successPanel.hidden = false;

            displayMatches(Array.isArray(data.matches) ? data.matches : []);

            clearPreview();

        } catch (error) {
            console.error("Report submission error:", error);
            showMessage(
                error.message || "Something went wrong. Please try again.",
                "error"
            );
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML =
                'Submit Lost Item Report <span class="button-arrow">→</span>';
        }
    });
});

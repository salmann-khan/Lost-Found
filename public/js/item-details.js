
document.addEventListener("DOMContentLoaded", () => {
    const loadingMessage = document.getElementById("loading-message");
    const errorMessage = document.getElementById("error-message");
    const errorText = document.getElementById("error-text");
    const itemContent = document.getElementById("item-content");

    const itemImage = document.getElementById("item-image");
    const imagePlaceholder = document.getElementById("image-placeholder");

    const itemType = document.getElementById("item-type");
    const itemCategory = document.getElementById("item-category");
    const itemTitle = document.getElementById("item-title");
    const itemDescription = document.getElementById("item-description");
    const itemLocation = document.getElementById("item-location");
    const itemDate = document.getElementById("item-date");
    const itemReporter = document.getElementById("item-reporter");
    const claimButton = document.getElementById("claim-button");

    let currentItem = null;

    function showError(message) {
        loadingMessage.hidden = true;
        itemContent.hidden = true;
        errorMessage.hidden = false;
        errorText.textContent = message;
    }

    function formatDate(dateValue) {
        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "Date unavailable";
        }

        return date.toLocaleDateString("en-PK", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }

    function displayItemImage(imageUrl) {
        imagePlaceholder.hidden = false;
        itemImage.hidden = true;
        itemImage.classList.remove("is-loaded");

        if (!imageUrl) return;

        itemImage.addEventListener("load", () => {
            itemImage.hidden = false;
            itemImage.classList.add("is-loaded");
            imagePlaceholder.hidden = true;
        }, { once: true });

        itemImage.addEventListener("error", () => {
            itemImage.hidden = true;
            imagePlaceholder.hidden = false;
            itemImage.removeAttribute("src");
        }, { once: true });

        itemImage.src = imageUrl;
    }

    async function loadItemDetails() {
        const params = new URLSearchParams(window.location.search);
        const itemId = params.get("id");

        if (!itemId) {
            showError("No item ID was provided. Please select an item from Browse Items.");
            return;
        }

        try {
            const response = await fetch(
                `/api/items/${encodeURIComponent(itemId)}`
            );

            const data = await response.json();

            if (!response.ok || !data.success || !data.item) {
                throw new Error(data.message || "Unable to find this item.");
            }

            const item = data.item;
            currentItem = item;

            itemType.textContent =
                item.type === "found" ? "FOUND ITEM" : "LOST ITEM";

            itemType.className =
                `details-type ${item.type === "found" ? "found" : "lost"}`;

            itemCategory.textContent = item.category || "Other";
            itemTitle.textContent = item.title || "Untitled item";
            itemDescription.textContent =
                item.description || "No description provided.";

            itemLocation.textContent = item.location || "Not specified";
            itemDate.textContent = formatDate(item.date);

            itemReporter.textContent =
                item.reportedBy?.fullName || "University member";

            displayItemImage(item.imageUrl);

            if (item.type === "found") {
                claimButton.disabled = false;
                claimButton.textContent = "Start Ownership Claim →";
            } else {
                claimButton.disabled = true;
                claimButton.textContent = "Claims are for found items";
            }

            loadingMessage.hidden = true;
            errorMessage.hidden = true;
            itemContent.hidden = false;

        } catch (error) {
            console.error("Item details error:", error);
            showError(error.message || "Unable to load item details.");
        }
    }

    claimButton.addEventListener("click", () => {
        if (!currentItem || currentItem.type !== "found") return;

        window.location.href =
            `claim.html?itemId=${encodeURIComponent(currentItem._id)}`;
    });

    loadItemDetails();
});

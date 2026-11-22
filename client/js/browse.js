
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("search-input");
    const categoryFilter = document.getElementById("category-filter");
    const typeFilter = document.getElementById("type-filter");

    const itemsContainer = document.getElementById("items-container");
    const loadingMessage = document.getElementById("loading-message");
    const emptyMessage = document.getElementById("empty-message");
    const errorMessage = document.getElementById("error-message");
    const resultsCount = document.getElementById("results-count");
    const retryButton = document.getElementById("retry-btn");

    let searchTimer;

    function createElement(tag, className, text) {
        const element = document.createElement(tag);
        element.className = className;

        if (text !== undefined) {
            element.textContent = text;
        }

        return element;
    }

    function formatDate(dateValue) {
        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "Date unavailable";
        }

        return date.toLocaleDateString("en-PK", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }

    function createItemImage(item) {
        const wrapper = createElement("div", "item-image-wrapper");

        const image = document.createElement("img");
        image.className = "item-image";
        image.alt = item.title
            ? `Picture of ${item.title}`
            : "Reported item picture";
        image.loading = "eager";

        const placeholder = createElement(
            "div",
            "item-image-placeholder",
            "📦"
        );

        if (item.imageUrl) {
            image.addEventListener("load", () => {
                image.classList.add("is-loaded");
                placeholder.hidden = true;
            });

            image.addEventListener("error", () => {
                image.classList.remove("is-loaded");
                placeholder.hidden = false;
                console.error("Unable to load image:", item.imageUrl);
            });

            wrapper.append(image, placeholder);
            image.src = item.imageUrl;
        } else {
            image.style.display = "none";
            wrapper.append(image, placeholder);
        }

        return wrapper;
    }

    function createItemCard(item) {
        const card = createElement("article", "item-card");

        card.tabIndex = 0;
        card.setAttribute("role", "link");
        card.setAttribute(
            "aria-label",
            `View details for ${item.title || "reported item"}`
        );

        const imageArea = createItemImage(item);

        const top = createElement("div", "item-card-top");

        const category = createElement(
            "span",
            "item-category",
            item.category || "Other"
        );

        const type = createElement(
            "span",
            `item-type ${item.type === "found" ? "found" : "lost"}`,
            item.type === "found" ? "Found" : "Lost"
        );

        top.append(category, type);

        const title = createElement(
            "h3",
            "",
            item.title || "Untitled item"
        );

        const description = createElement(
            "p",
            "item-description",
            item.description || "No description provided."
        );

        const details = createElement("div", "item-details");

        const location = createElement("p", "item-detail");
        location.append(
            createElement("strong", "", "Location: "),
            document.createTextNode(item.location || "Not specified")
        );

        const date = createElement("p", "item-detail");
        date.append(
            createElement("strong", "", "Date: "),
            document.createTextNode(formatDate(item.date))
        );

        const reporter = createElement("p", "item-detail");
        reporter.append(
            createElement("strong", "", "Reported by: "),
            document.createTextNode(
                item.reportedBy?.fullName || "University member"
            )
        );

        const viewDetails = createElement(
            "span",
            "view-details-link",
            "View item details →"
        );

        details.append(location, date, reporter);

        card.append(
            imageArea,
            top,
            title,
            description,
            details,
            viewDetails
        );

        function openDetails() {
            if (!item._id) {
                console.error("Item ID is missing:", item);
                return;
            }

            window.location.href =
                `item-details.html?id=${encodeURIComponent(item._id)}`;
        }

        card.addEventListener("click", openDetails);

        card.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openDetails();
            }
        });

        return card;
    }

    async function loadItems() {
        loadingMessage.hidden = false;
        emptyMessage.hidden = true;
        errorMessage.hidden = true;

        itemsContainer.replaceChildren();
        resultsCount.textContent = "Loading...";

        const params = new URLSearchParams();

        const search = searchInput.value.trim();
        const category = categoryFilter.value;
        const type = typeFilter.value;

        if (search) params.set("search", search);
        if (category) params.set("category", category);
        if (type) params.set("type", type);

        try {
            const response = await fetch(
                `/api/items?${params.toString()}`
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to load items."
                );
            }

            const items = data.items || [];

            loadingMessage.hidden = true;

            resultsCount.textContent =
                `${items.length} ${items.length === 1 ? "item" : "items"}`;

            if (items.length === 0) {
                emptyMessage.hidden = false;
                return;
            }

            const fragment = document.createDocumentFragment();

            items.forEach((item) => {
                fragment.appendChild(createItemCard(item));
            });

            itemsContainer.appendChild(fragment);

        } catch (error) {
            console.error("Browse items error:", error);

            loadingMessage.hidden = true;
            resultsCount.textContent = "";
            errorMessage.hidden = false;
        }
    }

    searchInput.addEventListener("input", () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(loadItems, 350);
    });

    categoryFilter.addEventListener("change", loadItems);
    typeFilter.addEventListener("change", loadItems);
    retryButton.addEventListener("click", loadItems);

    loadItems();
});

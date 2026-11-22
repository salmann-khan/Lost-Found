
const claimsList = document.getElementById("claimsList");
const filterButtons = document.querySelectorAll(".filter-btn");
const refreshButton = document.getElementById("refreshClaims");

let allClaims = [];
let activeFilter = "all";
let confirmingClaimId = null;

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function formatDate(dateValue) {
    if (!dateValue) return "Date unavailable";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "Date unavailable";

    return date.toLocaleDateString("en-PK", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

// Custom FindIt confirmation modal
function showConfirmModal({
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    danger = false
}) {
    return new Promise(resolve => {
        const overlay = document.createElement("div");
        overlay.className = "findit-modal-overlay";

        overlay.innerHTML = `
            <div class="findit-confirm-modal"
                 role="dialog"
                 aria-modal="true"
                 aria-labelledby="findit-modal-title">

                <div class="findit-modal-icon ${danger ? "danger" : ""}">
                    ${danger ? "!" : "?"}
                </div>

                <h2 id="findit-modal-title">${escapeHTML(title)}</h2>
                <p>${escapeHTML(message)}</p>

                <div class="findit-modal-actions">
                    <button type="button"
                            class="findit-modal-cancel">
                        ${escapeHTML(cancelText)}
                    </button>

                    <button type="button"
                            class="findit-modal-confirm ${danger ? "danger" : ""}">
                        ${escapeHTML(confirmText)}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.style.overflow = "hidden";

        const cancelButton = overlay.querySelector(".findit-modal-cancel");
        const confirmButton = overlay.querySelector(".findit-modal-confirm");

        function close(result) {
            overlay.remove();
            document.body.style.overflow = "";
            document.removeEventListener("keydown", handleKeydown);
            resolve(result);
        }

        function handleKeydown(event) {
            if (event.key === "Escape") close(false);
        }

        cancelButton.addEventListener("click", () => close(false));
        confirmButton.addEventListener("click", () => close(true));

        overlay.addEventListener("click", event => {
            if (event.target === overlay) close(false);
        });

        document.addEventListener("keydown", handleKeydown);

        confirmButton.focus();
    });
}

function showClaimFeedback(message, type = "success") {
    if (window.FindItFeedback?.show) {
        window.FindItFeedback.show(message, type);
    } else {
        const overlay = document.createElement("div");
        overlay.className = "findit-modal-overlay";

        overlay.innerHTML = `
            <div class="findit-confirm-modal">
                <div class="findit-modal-icon ${type === "error" ? "danger" : ""}">
                    ${type === "error" ? "!" : "✓"}
                </div>
                <h2>${type === "error" ? "Something went wrong" : "Success"}</h2>
                <p>${escapeHTML(message)}</p>
                <div class="findit-modal-actions">
                    <button type="button" class="findit-modal-confirm">
                        OK
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.style.overflow = "hidden";

        overlay.querySelector("button").addEventListener("click", () => {
            overlay.remove();
            document.body.style.overflow = "";
        });
    }
}

function updateStats(claims) {
    document.getElementById("totalClaims").textContent = claims.length;

    document.getElementById("pendingClaims").textContent =
        claims.filter(claim => claim.status === "pending").length;

    document.getElementById("approvedClaims").textContent =
        claims.filter(claim => claim.status === "approved").length;

    document.getElementById("rejectedClaims").textContent =
        claims.filter(claim => claim.status === "rejected").length;
}

function renderClaims() {
    const filteredClaims = activeFilter === "all"
        ? allClaims
        : allClaims.filter(claim => claim.status === activeFilter);

    if (!filteredClaims.length) {
        claimsList.innerHTML = `
            <p class="empty-message">
                No ${activeFilter === "all" ? "" : activeFilter} claims found.
            </p>
        `;
        return;
    }

    claimsList.innerHTML = filteredClaims.map(claim => {
        const item = claim.item || {};

        const status = ["pending", "approved", "rejected"].includes(claim.status)
            ? claim.status
            : "pending";

        const isRecovered = Boolean(claim.confirmedReceivedAt) ||
            item.status === "returned";

        const image = item.imageUrl
            ? `<img class="claim-image" src="${escapeHTML(item.imageUrl)}" alt="Claimed item" onerror="this.style.display='none'">`
            : `<div class="claim-image"></div>`;

        const reviewerName = claim.reviewedBy?.fullName || "Finder";

        let statusContent = `
            <span class="status-badge status-${status}">
                ${status}
            </span>
        `;

        if (isRecovered) {
            statusContent = `
                <span class="status-badge status-approved">
                    Recovered ✓
                </span>
            `;
        }

        let actionContent = "";

        if (status === "approved" && !isRecovered) {
            actionContent = `
                <div class="receipt-confirmation">
                    <p>
                        Your claim was approved. Confirm after you physically
                        receive the item.
                    </p>

                    <button
                        type="button"
                        class="confirm-received-btn"
                        data-claim-id="${escapeHTML(claim._id)}"
                        ${confirmingClaimId === claim._id ? "disabled" : ""}
                    >
                        ${confirmingClaimId === claim._id
                            ? "Confirming..."
                            : "✓ Confirm Item Received"}
                    </button>
                </div>
            `;
        }

        if (isRecovered) {
            actionContent = `
                <p class="recovered-message">
                    ✓ You confirmed receiving this item on
                    ${formatDate(claim.confirmedReceivedAt || claim.updatedAt)}.
                </p>
            `;
        }

        return `
            <article class="claim-card">
                ${image}

                <div class="claim-content">
                    <div class="claim-top">
                        <div>
                            <h3>${escapeHTML(item.title || "Unknown item")}</h3>
                            <p class="claim-date">
                                Submitted: ${formatDate(claim.createdAt)}
                            </p>
                        </div>

                        ${statusContent}
                    </div>

                    <p class="claim-meta">
                        ${escapeHTML(item.category || "Uncategorized")}
                        ${item.location ? ` · ${escapeHTML(item.location)}` : ""}
                    </p>

                    <p class="claim-reason">
                        <strong>Your reason:</strong>
                        ${escapeHTML(claim.reason || "Not provided")}
                    </p>

                    ${
                        status !== "pending"
                            ? `
                                <p class="claim-meta">
                                    Reviewed by: ${escapeHTML(reviewerName)}
                                    ${claim.reviewedAt
                                        ? ` · ${formatDate(claim.reviewedAt)}`
                                        : ""}
                                </p>

                                <div class="review-note">
                                    <strong>Finder's response</strong>
                                    ${escapeHTML(claim.reviewNote || "No review note provided.")}
                                </div>
                            `
                            : `
                                <p class="claim-meta">
                                    Waiting for the finder to review your claim.
                                </p>
                            `
                    }

                    ${actionContent}
                </div>
            </article>
        `;
    }).join("");
}

async function confirmItemReceived(claimId) {
    if (confirmingClaimId) return;

    const confirmed = await showConfirmModal({
        title: "Confirm item received?",
        message: "Have you physically received this item from the finder? Confirming will mark it as recovered.",
        confirmText: "Yes, I received it",
        cancelText: "Not yet"
    });

    if (!confirmed) return;

    confirmingClaimId = claimId;
    renderClaims();

    try {
        const response = await fetch(
            `/api/claims/${encodeURIComponent(claimId)}/confirm-received`,
            {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        const data = await response.json();

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok || data.success === false) {
            throw new Error(data.message || "Unable to confirm receipt.");
        }

        showClaimFeedback(
            "Item successfully recovered! Thank you for using FindIt.",
            "success"
        );

        await loadClaims();

    } catch (error) {
        console.error("Confirm receipt error:", error);

        showClaimFeedback(
            error.message || "Something went wrong. Please try again.",
            "error"
        );

    } finally {
        confirmingClaimId = null;
        renderClaims();
    }
}

async function loadClaims() {
    claimsList.innerHTML = `
        <p class="loading-message">Loading your claims...</p>
    `;

    refreshButton.disabled = true;

    try {
        const response = await fetch("/api/claims/my", {
            method: "GET",
            credentials: "include",
            headers: {
                "Accept": "application/json"
            }
        });

        const data = await response.json();

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok || data.success === false) {
            throw new Error(data.message || "Unable to load your claims.");
        }

        allClaims = Array.isArray(data.claims) ? data.claims : [];

        updateStats(allClaims);
        renderClaims();

    } catch (error) {
        console.error("My claims error:", error);

        claimsList.innerHTML = `
            <p class="error-message">
                ${escapeHTML(error.message || "Something went wrong. Please try again.")}
            </p>
        `;
    } finally {
        refreshButton.disabled = false;
    }
}

claimsList.addEventListener("click", event => {
    const button = event.target.closest(".confirm-received-btn");

    if (!button) return;

    confirmItemReceived(button.dataset.claimId);
});

filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        filterButtons.forEach(item => item.classList.remove("active"));
        button.classList.add("active");

        activeFilter = button.dataset.filter;
        renderClaims();
    });
});

refreshButton.addEventListener("click", loadClaims);

loadClaims();

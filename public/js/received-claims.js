
document.addEventListener("DOMContentLoaded", () => {
    const claimsList = document.getElementById("claims-list");

    const loadingState = document.getElementById("claims-loading");
    const errorState = document.getElementById("claims-error");
    const errorText = document.getElementById("claims-error-text");
    const emptyState = document.getElementById("claims-empty");

    const totalCount = document.getElementById("total-count");
    const pendingCount = document.getElementById("pending-count");
    const approvedCount = document.getElementById("approved-count");
    const rejectedCount = document.getElementById("rejected-count");

    const refreshButton = document.getElementById("refresh-claims");
    const retryButton = document.getElementById("retry-claims");

    const filterButtons = document.querySelectorAll(".filter-button");

    const reviewModal = document.getElementById("review-modal");
    const closeModalButton = document.getElementById("close-review-modal");

    const modalTitle = document.getElementById("modal-title");
    const modalItemTitle = document.getElementById("modal-item-title");
    const modalClaimant = document.getElementById("modal-claimant");
    const modalReason = document.getElementById("modal-reason");
    const modalIdentifyingDetails =
        document.getElementById("modal-identifying-details");

    const reviewNote = document.getElementById("review-note");
    const reviewError = document.getElementById("review-error");

    const approveButton = document.getElementById("approve-claim");
    const rejectButton = document.getElementById("reject-claim");

    let claims = [];
    let activeFilter = "all";
    let selectedClaim = null;
    let loadingClaims = false;
    let reviewingClaim = false;

    function formatDate(dateValue) {
        if (!dateValue) return "Date unavailable";

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "Date unavailable";
        }

        return date.toLocaleString("en-PK", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        });
    }

    function showError(message) {
        loadingState.hidden = true;
        emptyState.hidden = true;
        claimsList.replaceChildren();

        errorState.hidden = false;
        errorText.textContent = message;
    }

    function updateStatistics() {
        totalCount.textContent = claims.length;

        pendingCount.textContent = claims.filter(
            claim => claim.status === "pending"
        ).length;

        approvedCount.textContent = claims.filter(
            claim => claim.status === "approved"
        ).length;

        rejectedCount.textContent = claims.filter(
            claim => claim.status === "rejected"
        ).length;
    }

    function createClaimCard(claim) {
        const card = document.createElement("article");
        card.className = "claim-card";

        const item = claim.item || {};
        const claimant = claim.claimant || {};

        const header = document.createElement("div");
        header.className = "claim-card-header";

        const information = document.createElement("div");
        information.className = "claim-item-information";

        const imageContainer = document.createElement("div");
        imageContainer.className = "claim-item-image";

        if (item.imageUrl) {
            const image = document.createElement("img");

            image.src = item.imageUrl;
            image.alt = item.title || "Claimed item";

            image.addEventListener("error", () => {
                image.replaceWith(document.createTextNode("📦"));
            }, { once: true });

            imageContainer.appendChild(image);
        } else {
            imageContainer.textContent = "📦";
        }

        const itemInformation = document.createElement("div");

        const itemTitle = document.createElement("h3");
        itemTitle.textContent = item.title || "Unknown item";

        const claimantName = document.createElement("p");
        claimantName.textContent =
            `Claimant: ${claimant.fullName || "Student"}`;

        itemInformation.appendChild(itemTitle);
        itemInformation.appendChild(claimantName);

        information.appendChild(imageContainer);
        information.appendChild(itemInformation);

        const status = document.createElement("span");
        status.className = `claim-status ${claim.status}`;
        status.textContent = claim.status;

        header.appendChild(information);
        header.appendChild(status);

        const divider = document.createElement("div");
        divider.className = "claim-card-divider";

        const details = document.createElement("div");
        details.className = "claim-card-details";

        const categoryDetail = document.createElement("div");

        const categoryLabel = document.createElement("span");
        categoryLabel.className = "claim-detail-label";
        categoryLabel.textContent = "Category";

        const categoryValue = document.createElement("div");
        categoryValue.className = "claim-detail-value";
        categoryValue.textContent = item.category || "Other";

        categoryDetail.appendChild(categoryLabel);
        categoryDetail.appendChild(categoryValue);

        const dateDetail = document.createElement("div");

        const dateLabel = document.createElement("span");
        dateLabel.className = "claim-detail-label";
        dateLabel.textContent = "Submitted on";

        const dateValue = document.createElement("div");
        dateValue.className = "claim-detail-value";
        dateValue.textContent = formatDate(claim.createdAt);

        dateDetail.appendChild(dateLabel);
        dateDetail.appendChild(dateValue);

        details.appendChild(categoryDetail);
        details.appendChild(dateDetail);

        const footer = document.createElement("div");
        footer.className = "claim-card-footer";

        const submittedDate = document.createElement("span");
        submittedDate.className = "claim-date";
        submittedDate.textContent = "Ownership verification request";

        footer.appendChild(submittedDate);

        if (claim.status === "pending") {
            const reviewButton = document.createElement("button");

            reviewButton.type = "button";
            reviewButton.className = "review-claim-button";
            reviewButton.textContent = "Review claim →";

            reviewButton.addEventListener("click", () => {
                openReviewModal(claim);
            });

            footer.appendChild(reviewButton);
        } else {
            const reviewedLabel = document.createElement("span");

            reviewedLabel.className = "reviewed-label";
            reviewedLabel.textContent =
                claim.status === "approved"
                    ? "✓ Approved"
                    : "✕ Rejected";

            footer.appendChild(reviewedLabel);
        }

        card.appendChild(header);
        card.appendChild(divider);
        card.appendChild(details);
        card.appendChild(footer);

        return card;
    }

    function renderClaims() {
        claimsList.replaceChildren();

        const filteredClaims = claims.filter(claim => {
            return activeFilter === "all" ||
                claim.status === activeFilter;
        });

        if (filteredClaims.length === 0) {
            emptyState.hidden = false;

            const heading = emptyState.querySelector("h3");
            const message = emptyState.querySelector("p");

            if (claims.length === 0) {
                heading.textContent = "No claims yet";
                message.textContent =
                    "Ownership requests for your found items will appear here.";
            } else {
                heading.textContent = "No matching claims";
                message.textContent =
                    `There are no ${activeFilter} claims at the moment.`;
            }

            return;
        }

        emptyState.hidden = true;

        filteredClaims.forEach(claim => {
            claimsList.appendChild(createClaimCard(claim));
        });
    }

    async function loadClaims() {
        if (loadingClaims) return;

        loadingClaims = true;

        loadingState.hidden = false;
        errorState.hidden = true;
        emptyState.hidden = true;
        claimsList.replaceChildren();

        refreshButton.disabled = true;
        refreshButton.textContent = "Loading...";

        try {
            const response = await fetch("/api/claims/received", {
                method: "GET",
                credentials: "include"
            });

            const data = await response.json();

            if (response.status === 401) {
                window.location.href = "login.html";
                return;
            }

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to load received claims."
                );
            }

            claims = Array.isArray(data.claims) ? data.claims : [];

            updateStatistics();

            loadingState.hidden = true;
            renderClaims();

        } catch (error) {
            console.error("Load received claims error:", error);
            showError(error.message || "Unable to load received claims.");
        } finally {
            loadingClaims = false;

            refreshButton.disabled = false;
            refreshButton.textContent = "↻ Refresh";
        }
    }

    function openReviewModal(claim) {
        if (!claim || claim.status !== "pending" || reviewingClaim) {
            return;
        }

        selectedClaim = claim;

        modalTitle.textContent = "Review ownership claim";
        modalItemTitle.textContent = claim.item?.title || "Unknown item";
        modalClaimant.textContent = claim.claimant?.fullName || "Student";

        modalReason.textContent =
            claim.reason || "No reason provided.";

        modalIdentifyingDetails.textContent =
            claim.identifyingDetails || "No identifying details provided.";

        reviewNote.value = "";
        reviewError.hidden = true;

        approveButton.disabled = false;
        rejectButton.disabled = false;

        reviewModal.hidden = false;
        document.body.style.overflow = "hidden";
    }

    function closeReviewModal() {
        if (reviewingClaim) return;

        reviewModal.hidden = true;
        document.body.style.overflow = "";
        selectedClaim = null;
        reviewError.hidden = true;
    }

    async function submitReview(status) {
        if (!selectedClaim ||
            selectedClaim.status !== "pending" ||
            reviewingClaim) {
            return;
        }

        const message = status === "approved"
            ? "Are you sure you want to approve this ownership claim?"
            : "Are you sure you want to reject this ownership claim?";

        if (!window.confirm(message)) return;

        reviewingClaim = true;

        approveButton.disabled = true;
        rejectButton.disabled = true;

        approveButton.textContent =
            status === "approved" ? "Approving..." : "Approve claim";

        rejectButton.textContent =
            status === "rejected" ? "Rejecting..." : "Reject claim";

        reviewError.hidden = true;

        let reviewSucceeded = false;

        try {
            const response = await fetch(
                `/api/claims/${encodeURIComponent(selectedClaim._id)}/review`,
                {
                    method: "PATCH",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        status,
                        reviewNote: reviewNote.value.trim()
                    })
                }
            );

            const data = await response.json();

            if (response.status === 401) {
                window.location.href = "login.html";
                return;
            }

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to review this claim."
                );
            }

            reviewSucceeded = true;

            reviewModal.hidden = true;
            document.body.style.overflow = "";
            selectedClaim = null;

        } catch (error) {
            console.error("Review claim error:", error);

            reviewError.textContent =
                error.message || "Unable to process this request.";

            reviewError.hidden = false;

        } finally {
            reviewingClaim = false;

            approveButton.disabled = false;
            rejectButton.disabled = false;

            approveButton.textContent = "Approve claim";
            rejectButton.textContent = "Reject claim";
        }

        if (reviewSucceeded) {
            await loadClaims();

            window.alert(
                status === "approved"
                    ? "Ownership claim approved successfully."
                    : "Ownership claim rejected successfully."
            );
        }
    }

    filterButtons.forEach(button => {
        button.addEventListener("click", () => {
            filterButtons.forEach(filter => {
                filter.classList.remove("active");
            });

            button.classList.add("active");
            activeFilter = button.dataset.filter || "all";

            renderClaims();
        });
    });

    refreshButton.addEventListener("click", loadClaims);
    retryButton.addEventListener("click", loadClaims);

    closeModalButton.addEventListener("click", closeReviewModal);

    approveButton.addEventListener("click", () => {
        submitReview("approved");
    });

    rejectButton.addEventListener("click", () => {
        submitReview("rejected");
    });

    reviewModal.addEventListener("click", event => {
        if (event.target === reviewModal) {
            closeReviewModal();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !reviewModal.hidden) {
            closeReviewModal();
        }
    });

    loadClaims();
});

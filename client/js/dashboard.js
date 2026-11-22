
document.addEventListener("DOMContentLoaded", async () => {

    const welcomeName = document.getElementById("welcome-name");
    const userName = document.getElementById("user-name");
    const logoutButton = document.getElementById("logout-btn");

    const notificationButton = document.getElementById("notification-btn");
    const notificationCount = document.getElementById("notification-count");
    const notificationPanel = document.getElementById("notification-panel");
    const notificationList = document.getElementById("notification-list");
    const notificationSummary = document.getElementById("notification-summary");
    const markAllReadButton = document.getElementById("mark-all-read-btn");


    // ==========================================
    // DASHBOARD ANIMATIONS
    // ==========================================

    const interactionStyles = document.createElement("style");

    interactionStyles.textContent = `
        .action-card {
            transform-style: preserve-3d;
            will-change: transform, background;
        }

        .action-card .action-icon {
            transform-origin: center;
        }

        .action-card.icon-bounce .action-icon {
            animation: finditIconBounce 0.55s ease;
        }

        @keyframes finditIconBounce {
            0% { transform: translateY(0) scale(1); }
            35% { transform: translateY(-12px) scale(1.13) rotate(-8deg); }
            65% { transform: translateY(2px) scale(0.96); }
            100% { transform: translateY(0) scale(1); }
        }

        @keyframes finditCardPress {
            0% { transform: scale(1); }
            50% { transform: scale(0.97); }
            100% { transform: scale(1); }
        }

        .action-card.card-pressed {
            animation: finditCardPress 0.25s ease;
        }

        .dashboard-page {
            background-size: 200% 200%;
            animation: finditBackground 16s ease infinite;
        }

        @keyframes finditBackground {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }

        @media (max-width: 700px) {
            .action-card {
                transform: none !important;
            }
        }
    `;

    document.head.appendChild(interactionStyles);


    // ==========================================
    // INTERACTIVE DASHBOARD CARDS
    // ==========================================

    const cards = document.querySelectorAll(".action-card");

    cards.forEach((card) => {

        const icon = card.querySelector(".action-icon");

        card.addEventListener("pointerenter", () => {

            card.classList.remove("icon-bounce");

            void card.offsetWidth;

            card.classList.add("icon-bounce");
        });

        card.addEventListener("pointermove", (event) => {

            if (event.pointerType === "touch") return;

            const rect = card.getBoundingClientRect();

            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateY = ((x - centerX) / centerX) * 5;
            const rotateX = ((centerY - y) / centerY) * 5;

            card.style.transform = `
                perspective(900px)
                translateY(-7px)
                rotateX(${rotateX}deg)
                rotateY(${rotateY}deg)
            `;

            let glowColor = "108, 99, 255";

            if (card.classList.contains("lost-card")) {
                glowColor = "255, 184, 77";
            } else if (card.classList.contains("found-card")) {
                glowColor = "39, 201, 154";
            }

            card.style.background = `
                radial-gradient(
                    circle 180px at ${x}px ${y}px,
                    rgba(${glowColor}, 0.12),
                    #FFFFFF 85%
                )
            `;

            if (icon) {

                const iconX = (x - centerX) * 0.035;
                const iconY = (y - centerY) * 0.035;

                icon.style.transform = `
                    translate(${iconX}px, ${iconY - 4}px)
                    rotate(-5deg)
                    scale(1.08)
                `;
            }
        });

        card.addEventListener("pointerleave", () => {

            card.style.transform = "";
            card.style.background = "";

            if (icon) {
                icon.style.transform = "";
            }

            card.classList.remove("icon-bounce");
        });

        card.addEventListener("click", () => {

            card.classList.remove("card-pressed");

            void card.offsetWidth;

            card.classList.add("card-pressed");

            setTimeout(() => {
                card.classList.remove("card-pressed");
            }, 300);
        });

    });


    // ==========================================
    // LOAD LOGGED-IN USER
    // ==========================================

    try {

        const response = await fetch("/api/auth/me", {
            method: "GET",
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok || !data.success || !data.user) {
            window.location.href = "login.html";
            return;
        }

        const fullName = data.user.fullName || "Student";
        const firstName = fullName.trim().split(" ")[0];

        welcomeName.textContent = firstName;
        userName.textContent = fullName;

    } catch (error) {

        console.error("Dashboard loading error:", error);

        window.location.href = "login.html";
        return;
    }


    // ==========================================
    // NOTIFICATION HELPERS
    // ==========================================

    let notifications = [];
    let unreadCount = 0;
    let notificationRequestRunning = false;


    // Format notification date
    function formatNotificationDate(dateValue) {

        if (!dateValue) return "";

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) return "";

        return date.toLocaleString([], {
            day: "numeric",
            month: "short",
            hour: "numeric",
            minute: "2-digit"
        });
    }


    // Update unread badge and bell animation
    function updateNotificationBadge() {

        if (unreadCount > 0) {

            notificationCount.hidden = false;

            notificationCount.textContent =
                unreadCount > 99 ? "99+" : unreadCount;

        } else {

            notificationCount.hidden = true;
            notificationCount.textContent = "0";
        }

        // Keep the bell ringing while unread notifications exist
        notificationButton.classList.toggle(
            "has-unread",
            unreadCount > 0
        );

        notificationSummary.textContent =
            unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                : "You're all caught up.";
    }


    // Create one notification element safely
    function createNotificationElement(notification) {

        const card = document.createElement("article");

        card.className = "notification-item";

        if (!notification.isRead) {
            card.classList.add("unread");
        }

        const top = document.createElement("div");
        top.className = "notification-item-top";

        const title = document.createElement("h4");
        title.textContent = notification.title || "FindIt Notification";

        const status = document.createElement("span");
        status.className = "notification-status";
        status.textContent = notification.isRead ? "Read" : "New";

        top.appendChild(title);
        top.appendChild(status);

        const message = document.createElement("p");
        message.className = "notification-message";
        message.textContent = notification.message || "";

        const details = document.createElement("div");
        details.className = "notification-details";

        if (
            notification.matchScore !== null &&
            notification.matchScore !== undefined
        ) {

            const score = document.createElement("span");

            score.className = "notification-score";
            score.textContent = `${notification.matchScore}% match`;

            details.appendChild(score);
        }

        const date = document.createElement("span");

        date.className = "notification-date";
        date.textContent = formatNotificationDate(notification.createdAt);

        details.appendChild(date);

        card.appendChild(top);
        card.appendChild(message);
        card.appendChild(details);

        // Open matching item
        const matchedItem = notification.matchedItem;
        const item = notification.item;

        const targetItem =
            matchedItem && matchedItem._id
                ? matchedItem
                : item;

        if (targetItem && targetItem._id) {

            const viewLink = document.createElement("a");

            viewLink.className = "notification-view-link";
            viewLink.textContent = "View matching item →";

            viewLink.href =
                `item-details.html?id=${encodeURIComponent(targetItem._id)}`;

            viewLink.addEventListener("click", async () => {

                if (!notification.isRead) {
                    await markNotificationRead(notification._id);
                }
            });

            card.appendChild(viewLink);
        }

        return card;
    }


    // Render notifications
    function renderNotifications() {

        notificationList.replaceChildren();

        if (notifications.length === 0) {

            const empty = document.createElement("div");

            empty.className = "notification-empty";

            const icon = document.createElement("div");
            icon.textContent = "🔔";

            const heading = document.createElement("h4");
            heading.textContent = "No notifications yet";

            const message = document.createElement("p");
            message.textContent =
                "Potential matches and updates will appear here.";

            empty.appendChild(icon);
            empty.appendChild(heading);
            empty.appendChild(message);

            notificationList.appendChild(empty);

            markAllReadButton.disabled = true;

            return;
        }

        markAllReadButton.disabled = unreadCount === 0;

        notifications.forEach((notification) => {

            const element =
                createNotificationElement(notification);

            notificationList.appendChild(element);
        });
    }


    // ==========================================
    // FETCH NOTIFICATIONS
    // ==========================================

    async function loadNotifications() {

        if (notificationRequestRunning) return;

        notificationRequestRunning = true;

        try {

            const response = await fetch("/api/notifications", {
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
                    data.message || "Unable to load notifications."
                );
            }

            notifications = Array.isArray(data.notifications)
                ? data.notifications
                : [];

            unreadCount = Number(data.unreadCount) || 0;

            updateNotificationBadge();
            renderNotifications();

        } catch (error) {

            console.error("Notification loading error:", error);

            notificationList.textContent =
                "Unable to load notifications. Please try again.";

        } finally {

            notificationRequestRunning = false;
        }
    }


    // ==========================================
    // MARK ONE NOTIFICATION AS READ
    // ==========================================

    async function markNotificationRead(notificationId) {

        if (!notificationId) return false;

        try {

            const response = await fetch(
                `/api/notifications/${encodeURIComponent(notificationId)}/read`,
                {
                    method: "PATCH",
                    credentials: "include"
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to mark notification as read."
                );
            }

            const notification = notifications.find(
                item => item._id === notificationId
            );

            if (notification && !notification.isRead) {

                notification.isRead = true;

                unreadCount = Math.max(0, unreadCount - 1);

                updateNotificationBadge();
                renderNotifications();
            }

            return true;

        } catch (error) {

            console.error("Mark notification read error:", error);

            return false;
        }
    }


    // ==========================================
    // MARK ALL NOTIFICATIONS AS READ
    // ==========================================

    async function markAllNotificationsRead() {

        if (unreadCount === 0) return;

        markAllReadButton.disabled = true;
        markAllReadButton.textContent = "Updating...";

        try {

            const response = await fetch(
                "/api/notifications/read-all",
                {
                    method: "PATCH",
                    credentials: "include"
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to update notifications."
                );
            }

            notifications.forEach(notification => {
                notification.isRead = true;
            });

            unreadCount = 0;

            updateNotificationBadge();
            renderNotifications();

        } catch (error) {

            console.error("Mark all read error:", error);

            alert("Unable to mark notifications as read. Please try again.");

        } finally {

            markAllReadButton.textContent = "Mark all read";
            markAllReadButton.disabled = unreadCount === 0;
        }
    }


    // ==========================================
    // NOTIFICATION DROPDOWN
    // ==========================================

    notificationButton.addEventListener("click", async () => {

        const isOpen = !notificationPanel.hidden;

        notificationPanel.hidden = isOpen;

        notificationButton.setAttribute(
            "aria-expanded",
            String(!isOpen)
        );

        if (!isOpen) {
            await loadNotifications();
        }
    });


    // Close dropdown when clicking outside
    document.addEventListener("click", (event) => {

        const wrapper = document.querySelector(".notification-wrapper");

        if (
            wrapper &&
            !wrapper.contains(event.target) &&
            !notificationPanel.hidden
        ) {

            notificationPanel.hidden = true;

            notificationButton.setAttribute(
                "aria-expanded",
                "false"
            );
        }
    });


    // Mark all as read button
    markAllReadButton.addEventListener(
        "click",
        markAllNotificationsRead
    );


    // ==========================================
    // INITIAL NOTIFICATION LOAD
    // ==========================================

    await loadNotifications();


    // Refresh notification count every 30 seconds
    const notificationRefresh = setInterval(
        loadNotifications,
        30000
    );


    // Stop polling if page is being closed
    window.addEventListener("beforeunload", () => {
        clearInterval(notificationRefresh);
    });


    // ==========================================
    // LOGOUT
    // ==========================================

    if (logoutButton) {

        logoutButton.addEventListener("click", async () => {

            logoutButton.disabled = true;
            logoutButton.textContent = "Logging out...";

            try {

                await fetch("/api/auth/logout", {
                    method: "POST",
                    credentials: "include"
                });

            } catch (error) {

                console.error("Logout error:", error);
            }

            window.location.href = "login.html";
        });
    }

});

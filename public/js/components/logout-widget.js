
(() => {
    if (window.__finditLogoutInitialized) return;
    window.__finditLogoutInitialized = true;

    async function initializeLogoutWidget() {
        if (document.getElementById("findit-logout-widget")) return;

        // Hide navbar Logout buttons.
        function hideNavbarLogout() {
            const elements = document.querySelectorAll(
                "header nav a, header nav button, header .navbar a, header .navbar button, header .nav-actions a, header .nav-actions button"
            );

            elements.forEach(element => {
                const text = element.textContent.trim().toLowerCase();

                if (text === "logout" || text === "log out") {
                    element.hidden = true;
                    element.style.display = "none";
                }
            });

            ["logout-btn", "home-logout-btn"].forEach(id => {
                const button = document.getElementById(id);

                if (button) {
                    button.hidden = true;
                    button.style.display = "none";
                }
            });
        }

        hideNavbarLogout();

        // Verify login status.
        try {
            const response = await fetch("/api/auth/me", {
                credentials: "include",
                cache: "no-store"
            });

            if (!response.ok) return;

            const data = await response.json();

            if (!data.success || !data.user) return;

        } catch (error) {
            console.error("Login verification failed:", error);
            return;
        }

        hideNavbarLogout();

        // Create floating logout widget.
        const widget = document.createElement("div");
        widget.id = "findit-logout-widget";

        widget.innerHTML = `
            <button
                type="button"
                class="findit-bear-button"
                aria-label="Open logout confirmation"
                title="Logout"
            >🧸</button>

            <button
                type="button"
                class="findit-logout-button"
            >↪ Logout</button>
        `;

        document.body.appendChild(widget);

        // Add styles.
        const style = document.createElement("style");
        style.id = "findit-logout-styles";

        style.textContent = `
            #findit-logout-widget {
                position: fixed;
                bottom: 22px;
                left: 22px;
                z-index: 9998;
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px 12px;
                background: rgba(255,255,255,.96);
                border: 1px solid #eee9ff;
                border-radius: 18px;
                box-shadow: 0 5px 22px rgba(35,25,80,.15);
                font-family: Arial, sans-serif;
            }

            #findit-logout-widget button {
                border: none;
                cursor: pointer;
                flex-shrink: 0;
            }

            #findit-logout-widget .findit-bear-button {
                width: 42px;
                height: 42px;
                border-radius: 50%;
                background: #f0edff;
                font-size: 23px;
                animation: findit-bear-float 2.5s ease-in-out infinite;
                will-change: transform;
            }

            #findit-logout-widget .findit-bear-button:hover {
                background: #e5dfff;
            }

            #findit-logout-widget .findit-logout-button {
                padding: 12px 17px;
                border-radius: 12px;
                background: #6255d8;
                color: white;
                font-size: 13px;
                font-weight: 700;
                transition: background .2s ease, transform .2s ease;
            }

            #findit-logout-widget .findit-logout-button:hover {
                background: #5043c2;
                transform: translateY(-2px);
            }

            #findit-logout-widget button:disabled {
                opacity: .6;
                cursor: wait;
            }

            @keyframes findit-bear-float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-7px); }
            }

            /* CUSTOM LOGOUT MODAL */

            #findit-logout-modal {
                position: fixed;
                inset: 0;
                z-index: 100000;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 20px;
                background: rgba(24, 20, 48, .55);
                backdrop-filter: blur(5px);
                font-family: Arial, sans-serif;
            }

            #findit-logout-modal.active {
                display: flex;
                animation: findit-modal-fade .2s ease;
            }

            .findit-modal-card {
                width: 100%;
                max-width: 390px;
                padding: 32px 26px;
                text-align: center;
                background: #ffffff;
                border: 1px solid #eee9ff;
                border-radius: 24px;
                box-shadow: 0 20px 65px rgba(25, 18, 65, .25);
                animation: findit-modal-pop .25s ease;
            }

            .findit-modal-bear {
                width: 76px;
                height: 76px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 18px;
                border-radius: 50%;
                background: #f0edff;
                font-size: 42px;
            }

            .findit-modal-card h2 {
                margin: 0 0 10px;
                color: #28243d;
                font-size: 23px;
                font-weight: 800;
            }

            .findit-modal-card p {
                margin: 0 0 26px;
                color: #77748b;
                font-size: 14px;
                line-height: 1.7;
            }

            .findit-modal-actions {
                display: flex;
                gap: 12px;
            }

            .findit-modal-actions button {
                flex: 1;
                padding: 13px 12px;
                border: none;
                border-radius: 12px;
                font-size: 13px;
                font-weight: 700;
                cursor: pointer;
                transition: .2s ease;
            }

            .findit-cancel-button {
                background: #f1eff8;
                color: #6255d8;
            }

            .findit-cancel-button:hover {
                background: #e7e3f5;
            }

            .findit-confirm-button {
                background: #6255d8;
                color: white;
            }

            .findit-confirm-button:hover {
                background: #5043c2;
                transform: translateY(-2px);
            }

            .findit-modal-actions button:disabled {
                opacity: .6;
                cursor: wait;
                transform: none;
            }

            @keyframes findit-modal-fade {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes findit-modal-pop {
                from {
                    opacity: 0;
                    transform: scale(.92) translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }

            @media (max-width: 480px) {
                #findit-logout-widget {
                    left: 12px;
                    bottom: 14px;
                    padding: 6px 9px;
                }

                #findit-logout-widget .findit-bear-button {
                    width: 38px;
                    height: 38px;
                }

                .findit-modal-card {
                    padding: 28px 20px;
                }
            }

            @media (prefers-reduced-motion: reduce) {
                #findit-logout-widget .findit-bear-button,
                #findit-logout-modal,
                .findit-modal-card {
                    animation: none;
                }
            }
        `;

        document.head.appendChild(style);

        // Create custom confirmation modal.
        const modal = document.createElement("div");
        modal.id = "findit-logout-modal";

        modal.innerHTML = `
            <div
                class="findit-modal-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="findit-modal-title"
                aria-describedby="findit-modal-message"
            >
                <div class="findit-modal-bear">🧸</div>

                <h2 id="findit-modal-title">
                    Logging Out?
                </h2>

                <p id="findit-modal-message">
                    Are you sure you want to log out of FindIt?
                    We hope to see you again!
                </p>

                <div class="findit-modal-actions">
                    <button
                        type="button"
                        class="findit-cancel-button"
                    >Cancel</button>

                    <button
                        type="button"
                        class="findit-confirm-button"
                    >Yes, Logout</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const bearButton = widget.querySelector(".findit-bear-button");
        const logoutButton = widget.querySelector(".findit-logout-button");
        const cancelButton = modal.querySelector(".findit-cancel-button");
        const confirmButton = modal.querySelector(".findit-confirm-button");
        const modalCard = modal.querySelector(".findit-modal-card");

        // Open modal.
        function openLogoutModal() {
            modal.classList.add("active");
            cancelButton.focus();
        }

        // Close modal.
        function closeLogoutModal() {
            if (confirmButton.disabled) return;

            modal.classList.remove("active");
            bearButton.focus();
        }

        bearButton.addEventListener("click", openLogoutModal);
        logoutButton.addEventListener("click", openLogoutModal);

        cancelButton.addEventListener("click", closeLogoutModal);

        // Close when clicking outside the popup.
        modal.addEventListener("click", event => {
            if (event.target === modal) {
                closeLogoutModal();
            }
        });

        // Close with Escape key.
        document.addEventListener("keydown", event => {
            if (
                event.key === "Escape" &&
                modal.classList.contains("active")
            ) {
                closeLogoutModal();
            }
        });

        // Confirm logout.
        confirmButton.addEventListener("click", async () => {
            confirmButton.disabled = true;
            cancelButton.disabled = true;
            bearButton.disabled = true;
            logoutButton.disabled = true;

            confirmButton.textContent = "Logging out...";

            try {
                const response = await fetch("/api/auth/logout", {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        Accept: "application/json"
                    }
                });

                if (!response.ok) {
                    throw new Error("Logout request failed.");
                }

                window.location.replace("/pages/login.html");

            } catch (error) {
                console.error("FindIt logout error:", error);

                alert("Unable to log out. Please try again.");

                confirmButton.disabled = false;
                cancelButton.disabled = false;
                bearButton.disabled = false;
                logoutButton.disabled = false;

                confirmButton.textContent = "Yes, Logout";
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeLogoutWidget
        );
    } else {
        initializeLogoutWidget();
    }
})();

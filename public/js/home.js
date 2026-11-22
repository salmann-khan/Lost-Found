
(() => {
    if (window.__finditHomeInitialized) return;
    window.__finditHomeInitialized = true;

    document.addEventListener("DOMContentLoaded", () => {

        // ==========================================
        // NAVIGATION
        // ==========================================

        const loginLink = document.getElementById("login-link");
        const signupLink = document.getElementById("signup-link");
        const dashboardLink = document.getElementById("dashboard-link");
        const logoutButton = document.getElementById("home-logout-btn");

        const searchInput = document.querySelector(".hero-search input");
        const searchButton = document.querySelector(".hero-search button");
        const chatbotButton = document.getElementById("chatbot-button");

        function setVisible(element, visible) {
            if (!element) return;
            element.hidden = !visible;
            element.style.display = visible ? "" : "none";
        }

        function showGuestNavigation() {
            setVisible(loginLink, true);
            setVisible(signupLink, true);
            setVisible(dashboardLink, false);
            setVisible(logoutButton, false);
        }

        function showLoggedInNavigation() {
            setVisible(loginLink, false);
            setVisible(signupLink, false);
            setVisible(dashboardLink, true);
            setVisible(logoutButton, true);
        }

        async function checkLoginStatus() {
            try {
                const response = await fetch("/api/auth/me", {
                    credentials: "include",
                    cache: "no-store"
                });

                const data = await response.json();

                if (response.ok && data.success && data.user) {
                    showLoggedInNavigation();
                } else {
                    showGuestNavigation();
                }
            } catch (error) {
                console.error("Login check failed:", error);
                showGuestNavigation();
            }
        }

        // ==========================================
        // LOGOUT
        // ==========================================

        if (logoutButton) {
            logoutButton.addEventListener("click", async () => {
                try {
                    const response = await fetch("/api/auth/logout", {
                        method: "POST",
                        credentials: "include"
                    });

                    if (!response.ok) {
                        throw new Error("Logout failed.");
                    }

                    window.location.reload();

                } catch (error) {
                    console.error(error);
                    alert("Unable to log out. Please try again.");
                }
            });
        }

        // ==========================================
        // HOMEPAGE SEARCH
        // ==========================================

        function performSearch() {
            if (!searchInput) return;

            const search = searchInput.value.trim();

            window.location.href = search
                ? "/pages/browse.html?search=" + encodeURIComponent(search)
                : "/pages/browse.html";
        }

        if (searchButton) {
            searchButton.addEventListener("click", performSearch);
        }

        if (searchInput) {
            searchInput.addEventListener("keydown", event => {
                if (event.key === "Enter") {
                    performSearch();
                }
            });
        }

        // ==========================================
        // FINDIT AI CHATBOT
        // ==========================================

        let chatbotLoadPromise = null;

        function loadChatbotStyles() {
            const cssPath = "/css/components/chatbot.css";
            const cssUrl = new URL(cssPath, window.location.origin).href;

            const existingLink = [...document.querySelectorAll(
                'link[rel="stylesheet"]'
            )].find(link => link.href === cssUrl);

            if (existingLink) {
                return Promise.resolve();
            }

            return new Promise((resolve, reject) => {
                const link = document.createElement("link");

                link.rel = "stylesheet";
                link.href = cssPath;

                link.onload = resolve;

                link.onerror = () => reject(
                    new Error("Could not load the chatbot stylesheet.")
                );

                document.head.appendChild(link);
            });
        }

        function loadChatbotScript() {
            if (window.FindItChatbot) {
                window.FindItChatbot.init();
                return Promise.resolve();
            }

            return new Promise((resolve, reject) => {
                const script = document.createElement("script");

                script.src = "/js/components/chatbot.js";

                script.onload = () => {
                    if (window.FindItChatbot) {
                        window.FindItChatbot.init();
                        resolve();
                    } else {
                        reject(
                            new Error("Chatbot failed to initialize.")
                        );
                    }
                };

                script.onerror = () => reject(
                    new Error("Could not load the chatbot script.")
                );

                document.body.appendChild(script);
            });
        }

        async function openFindItChatbot() {
            if (!chatbotLoadPromise) {
                chatbotLoadPromise = (async () => {
                    await loadChatbotStyles();
                    await loadChatbotScript();
                })().catch(error => {
                    chatbotLoadPromise = null;
                    throw error;
                });
            }

            try {
                await chatbotLoadPromise;

                const chatbotToggle = document.querySelector(
                    "#findit-chatbot .chatbot-toggle"
                );

                const chatWindow = document.querySelector(
                    "#findit-chatbot .chatbot-window"
                );

                if (!chatbotToggle || !chatWindow) {
                    throw new Error("Chatbot interface was not created.");
                }

                if (!chatWindow.classList.contains("open")) {
                    chatbotToggle.click();
                }

            } catch (error) {
                console.error("Unable to open FindIt Assistant:", error);

                alert(
                    "FindIt Assistant could not be loaded. Please refresh the page and try again."
                );
            }
        }

        if (chatbotButton) {
            chatbotButton.addEventListener("click", openFindItChatbot);
        }

        // ==========================================
        // INTERACTIVE HOMEPAGE STYLES
        // ==========================================

        function addHomepageStyles() {
            if (document.getElementById("findit-home-items-styles")) {
                return;
            }

            const style = document.createElement("style");
            style.id = "findit-home-items-styles";

            style.textContent = `
                .home-items-section {
                    padding: 75px 8%;
                    background: #FFFFFF;
                    position: relative;
                    overflow: hidden;
                }

                .home-items-section.found-section {
                    background: linear-gradient(135deg,#F5F2FF,#FFF8F0);
                }

                .home-items-heading {
                    max-width: 720px;
                    margin: 0 auto 35px;
                    text-align: center;
                }

                .home-items-heading > span {
                    display: inline-block;
                    padding: 9px 16px;
                    border-radius: 30px;
                    background: #EEEAFE;
                    color: #6558DC;
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 1.5px;
                    margin-bottom: 14px;
                }

                .home-items-heading h2 {
                    font-family: 'Poppins',sans-serif;
                    font-size: clamp(28px,4vw,40px);
                    color: #28243D;
                    margin-bottom: 12px;
                }

                .home-items-heading p {
                    color: #77748B;
                    font-size: 14px;
                    line-height: 1.8;
                }

                .home-explore-toolbar {
                    max-width: 1250px;
                    margin: 0 auto 32px;
                    padding: 18px;
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    justify-content: space-between;
                    gap: 15px;
                    background: #FFFFFF;
                    border: 1px solid #EEEAF8;
                    border-radius: 17px;
                    box-shadow: 0 5px 18px rgba(53,42,100,.05);
                }

                .home-filter-tabs {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .home-filter-btn,
                .home-tool-btn {
                    border: 1px solid #E8E4F5;
                    background: #FFFFFF;
                    color: #6558DC;
                    padding: 10px 16px;
                    border-radius: 10px;
                    font-size: 12px;
                    font-weight: 800;
                    cursor: pointer;
                    transition: .2s ease;
                }

                .home-filter-btn {
                    color: #77748B;
                }

                .home-filter-btn:hover,
                .home-tool-btn:hover {
                    background: #F0EDFF;
                    color: #6558DC;
                }

                .home-filter-btn.active {
                    background: #6C63FF;
                    border-color: #6C63FF;
                    color: #FFFFFF;
                    box-shadow: 0 4px 12px rgba(108,99,255,.2);
                }

                .home-explore-search {
                    flex: 1;
                    min-width: 180px;
                    max-width: 300px;
                    padding: 11px 14px;
                    border: 1px solid #E8E4F5;
                    border-radius: 10px;
                    outline: none;
                    color: #28243D;
                    font-size: 13px;
                    background: #FAF9FF;
                }

                .home-explore-search:focus {
                    border-color: #8C76FF;
                    box-shadow: 0 0 0 3px rgba(108,99,255,.1);
                }

                .home-toolbar-actions {
                    display: flex;
                    gap: 8px;
                }

                .home-tool-btn:disabled {
                    opacity: .5;
                    cursor: wait;
                }

                .home-items-grid {
                    display: grid;
                    grid-template-columns: repeat(3,minmax(0,1fr));
                    gap: 23px;
                    max-width: 1250px;
                    margin: 0 auto;
                }

                .home-item-card {
                    background: #FFFFFF;
                    border-radius: 20px;
                    overflow: hidden;
                    border: 1px solid #EEEAF8;
                    box-shadow: 0 5px 18px rgba(53,42,100,.055);
                    min-width: 0;
                    animation: finditCardEnter .45s ease both;
                    transition: transform .25s ease,box-shadow .25s ease;
                }

                .home-item-card:hover {
                    transform: translateY(-6px);
                    box-shadow: 0 14px 28px rgba(53,42,100,.12);
                }

                @keyframes finditCardEnter {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .home-item-image-wrap {
                    height: 205px;
                    background: linear-gradient(135deg,#EEEAFE,#FFF0E1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    position: relative;
                }

                .home-item-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform .4s ease;
                }

                .home-item-card:hover .home-item-image {
                    transform: scale(1.05);
                }

                .home-item-placeholder {
                    font-size: 60px;
                }

                .home-item-type {
                    position: absolute;
                    top: 14px;
                    left: 14px;
                    padding: 8px 13px;
                    border-radius: 30px;
                    background: #FFF0D9;
                    color: #A35B00;
                    font-size: 10px;
                    font-weight: 900;
                    letter-spacing: 1px;
                }

                .home-item-type.found {
                    background: #DDF8E9;
                    color: #16734B;
                }

                .home-item-info {
                    padding: 21px;
                }

                .home-item-category {
                    display: inline-block;
                    background: #F0EDFF;
                    color: #6558DC;
                    padding: 7px 11px;
                    border-radius: 8px;
                    font-size: 10px;
                    font-weight: 900;
                    text-transform: uppercase;
                }

                .home-item-title {
                    font-family: 'Poppins',sans-serif;
                    font-size: 19px;
                    color: #28243D;
                    margin: 12px 0 8px;
                    overflow-wrap: anywhere;
                }

                .home-item-description {
                    font-size: 13px;
                    line-height: 1.7;
                    color: #77748B;
                    min-height: 44px;
                    overflow-wrap: anywhere;
                }

                .home-item-meta {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    padding: 15px 0;
                    margin-top: 12px;
                    border-top: 1px solid #F0EDF6;
                    color: #77748B;
                    font-size: 12px;
                }

                .home-item-details-link {
                    display: flex;
                    justify-content: center;
                    padding: 13px;
                    border-radius: 12px;
                    background: linear-gradient(120deg,#6C63FF,#8C76FF);
                    color: #FFFFFF;
                    text-decoration: none;
                    font-size: 13px;
                    font-weight: 800;
                    transition: .2s ease;
                }

                .home-item-details-link:hover {
                    background: #5148D8;
                    transform: translateY(-2px);
                }

                .home-item-card[hidden],
                .home-items-section[hidden] {
                    display: none !important;
                }

                .home-items-message {
                    grid-column: 1/-1;
                    padding: 45px 20px;
                    text-align: center;
                    background: #FFFFFF;
                    border: 1px dashed #D8D1F4;
                    border-radius: 20px;
                    color: #77748B;
                    line-height: 1.8;
                }

                .home-items-message strong {
                    display: block;
                    color: #28243D;
                    font-size: 18px;
                    margin-bottom: 8px;
                }

                .home-items-footer {
                    text-align: center;
                    margin-top: 32px;
                }

                .home-items-footer a {
                    display: inline-block;
                    padding: 13px 23px;
                    border: 1px solid #DED9F8;
                    border-radius: 12px;
                    background: #FFFFFF;
                    color: #6558DC;
                    font-weight: 800;
                    font-size: 13px;
                    text-decoration: none;
                    transition: .2s ease;
                }

                .home-items-footer a:hover {
                    background: #6558DC;
                    color: #FFFFFF;
                }

                .home-results-count {
                    max-width: 1250px;
                    margin: 0 auto 18px;
                    color: #77748B;
                    font-size: 12px;
                    text-align: right;
                }

                .home-surprise-message {
                    position: fixed;
                    bottom: 95px;
                    right: 25px;
                    z-index: 150;
                    max-width: 280px;
                    padding: 15px 19px;
                    border-radius: 14px;
                    background: #28243D;
                    color: #FFFFFF;
                    box-shadow: 0 8px 25px rgba(0,0,0,.15);
                    font-size: 13px;
                    animation: finditCardEnter .25s ease;
                }

                .stats .stat-number {
                    font-variant-numeric: tabular-nums;
                    display: inline-block;
                }

                @media(max-width:900px) {
                    .home-items-grid {
                        grid-template-columns: repeat(2,minmax(0,1fr));
                    }
                }

                @media(max-width:600px) {
                    .home-items-section {
                        padding: 55px 6%;
                    }

                    .home-items-grid {
                        grid-template-columns: 1fr;
                    }

                    .home-explore-toolbar {
                        align-items: stretch;
                    }

                    .home-explore-search {
                        max-width: none;
                        width: 100%;
                    }

                    .home-toolbar-actions {
                        width: 100%;
                    }

                    .home-tool-btn {
                        flex: 1;
                    }

                    .home-item-image-wrap {
                        height: 215px;
                    }
                }

                @media(prefers-reduced-motion:reduce) {
                    .home-item-card,
                    .home-item-image,
                    .home-item-details-link {
                        animation: none;
                        transition: none;
                    }
                }
            `;

            document.head.appendChild(style);
        }

        // ==========================================
        // CREATE HOMEPAGE ITEM SECTIONS
        // ==========================================

        function createItemSections() {
            let container = document.getElementById("home-live-items");

            if (container) return container;

            const hero = document.querySelector(".hero");
            if (!hero) return null;

            container = document.createElement("div");
            container.id = "home-live-items";

            container.innerHTML = `
                <section class="home-items-section" id="home-explore">

                    <div class="home-items-heading">
                        <span>YOUR CAMPUS LOST & FOUND</span>
                        <h2>Explore What's Happening ✨</h2>
                        <p>
                            Maybe someone's found what you're looking for.
                            Explore recent reports from your campus.
                        </p>
                    </div>

                    <div class="home-explore-toolbar">

                        <div class="home-filter-tabs">
                            <button class="home-filter-btn active"
                                    type="button"
                                    data-filter="all">✨ All Items</button>

                            <button class="home-filter-btn"
                                    type="button"
                                    data-filter="lost">🔍 Lost</button>

                            <button class="home-filter-btn"
                                    type="button"
                                    data-filter="found">🎉 Found</button>
                        </div>

                        <input
                            class="home-explore-search"
                            id="home-explore-search"
                            type="search"
                            placeholder="Search items, categories, locations..."
                            aria-label="Search reported items"
                        >

                        <div class="home-toolbar-actions">
                            <button class="home-tool-btn"
                                    type="button"
                                    id="home-surprise-btn">🎲 Surprise Me</button>

                            <button class="home-tool-btn"
                                    type="button"
                                    id="home-refresh-btn">↻ Refresh</button>
                        </div>

                    </div>

                    <div class="home-results-count"
                         id="home-results-count"
                         aria-live="polite">Loading reports...</div>

                    <section id="home-lost-section">
                        <div class="home-items-heading">
                            <span>LOOKING FOR SOMETHING?</span>
                            <h2>Recently Lost Items</h2>
                        </div>

                        <div class="home-items-grid" id="home-lost-items">
                            <div class="home-items-message">
                                Loading lost items...
                            </div>
                        </div>

                        <div class="home-items-footer">
                            <a href="/pages/browse.html?type=lost">
                                Explore All Lost Items →
                            </a>
                        </div>
                    </section>

                    <section class="home-items-section found-section"
                             id="home-found-section"
                             style="margin-top:65px;border-radius:24px;">

                        <div class="home-items-heading">
                            <span>HELP SOMEONE RECONNECT</span>
                            <h2>Recently Found Items</h2>
                            <p>
                                These items have been reported by
                                members of your university community.
                            </p>
                        </div>

                        <div class="home-items-grid" id="home-found-items">
                            <div class="home-items-message">
                                Loading found items...
                            </div>
                        </div>

                        <div class="home-items-footer">
                            <a href="/pages/browse.html?type=found">
                                Explore All Found Items →
                            </a>
                        </div>
                    </section>

                </section>
            `;

            hero.insertAdjacentElement("afterend", container);
            return container;
        }

        // ==========================================
        // CREATE ITEM CARDS
        // ==========================================

        function createItemCard(item, type, index) {
            const card = document.createElement("article");

            card.className = "home-item-card";
            card.dataset.type = type;

            card.dataset.search = [
                item.title,
                item.category,
                item.location,
                item.description
            ].filter(Boolean).join(" ").toLowerCase();

            card.style.animationDelay = (index * 0.08) + "s";

            const imageWrap = document.createElement("div");
            imageWrap.className = "home-item-image-wrap";

            const placeholder = document.createElement("div");
            placeholder.className = "home-item-placeholder";
            placeholder.textContent = "📦";

            imageWrap.appendChild(placeholder);

            if (item.imageUrl) {
                const image = document.createElement("img");

                image.className = "home-item-image";
                image.alt = item.title || "Reported item";
                image.loading = "lazy";

                image.addEventListener("load", () => {
                    placeholder.remove();
                });

                image.addEventListener("error", () => {
                    image.remove();
                });

                let imageUrl = item.imageUrl;

                if (
                    !imageUrl.startsWith("http://") &&
                    !imageUrl.startsWith("https://") &&
                    !imageUrl.startsWith("/")
                ) {
                    imageUrl = "/" + imageUrl;
                }

                image.src = imageUrl;
                imageWrap.appendChild(image);
            }

            const badge = document.createElement("span");

            badge.className =
                "home-item-type " + (type === "found" ? "found" : "lost");

            badge.textContent =
                type === "found" ? "✓ FOUND ITEM" : "⌕ LOST ITEM";

            imageWrap.appendChild(badge);

            const info = document.createElement("div");
            info.className = "home-item-info";

            const category = document.createElement("span");
            category.className = "home-item-category";
            category.textContent = item.category || "Other";

            const title = document.createElement("h3");
            title.className = "home-item-title";
            title.textContent = item.title || "Untitled item";

            const description = document.createElement("p");
            description.className = "home-item-description";
            description.textContent =
                item.description || "No description available.";

            const meta = document.createElement("div");
            meta.className = "home-item-meta";

            const location = document.createElement("span");
            location.textContent =
                "📍 " + (item.location || "Location not specified");

            const date = document.createElement("span");
            const dateValue = new Date(item.date);

            date.textContent = Number.isNaN(dateValue.getTime())
                ? "📅 Date unavailable"
                : "📅 " + dateValue.toLocaleDateString("en-PK", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                });

            meta.append(location, date);

            const link = document.createElement("a");
            link.className = "home-item-details-link";
            link.textContent = "View Item Details →";

            link.href =
                "/pages/item-details.html?id=" +
                encodeURIComponent(item._id);

            info.append(category, title, description, meta, link);
            card.append(imageWrap, info);

            return card;
        }

        // ==========================================
        // FILTER INTERACTIONS
        // ==========================================

        let activeFilter = "all";

        function applyFilters() {
            const query = (
                document.getElementById("home-explore-search")?.value || ""
            ).trim().toLowerCase();

            const lostCards = [
                ...document.querySelectorAll("#home-lost-items .home-item-card")
            ];

            const foundCards = [
                ...document.querySelectorAll("#home-found-items .home-item-card")
            ];

            const allCards = [...lostCards, ...foundCards];

            allCards.forEach(card => {
                const typeMatches =
                    activeFilter === "all" ||
                    card.dataset.type === activeFilter;

                const textMatches =
                    !query || card.dataset.search.includes(query);

                card.hidden = !(typeMatches && textMatches);
            });

            const lostSection = document.getElementById("home-lost-section");
            const foundSection = document.getElementById("home-found-section");

            if (lostSection) {
                lostSection.hidden = activeFilter === "found";
            }

            if (foundSection) {
                foundSection.hidden = activeFilter === "lost";
            }

            const visibleCount = allCards.filter(
                card => !card.hidden
            ).length;

            const count = document.getElementById("home-results-count");

            if (count) {
                count.textContent = query
                    ? visibleCount + " matching item(s) found"
                    : visibleCount + " recent item(s) displayed";
            }

            [lostCards, foundCards].forEach(cards => {
                const visible = cards.filter(card => !card.hidden);

                const empty =
                    cards.length === 0 ||
                    (visible.length === 0 && query);

                const parent = cards[0]?.parentElement;

                if (!parent) return;

                let message = parent.querySelector(".home-filter-empty");

                if ((empty && activeFilter !== "all") || (empty && query)) {
                    if (!message) {
                        message = document.createElement("div");
                        message.className =
                            "home-items-message home-filter-empty";

                        message.textContent =
                            "No matching items. Try another search.";

                        parent.appendChild(message);
                    }
                } else if (message) {
                    message.remove();
                }
            });
        }

        function setupFilters() {
            const buttons = document.querySelectorAll(".home-filter-btn");

            buttons.forEach(button => {
                button.addEventListener("click", () => {
                    activeFilter = button.dataset.filter;

                    buttons.forEach(item => {
                        item.classList.toggle("active", item === button);
                    });

                    applyFilters();
                });
            });

            const search = document.getElementById("home-explore-search");

            if (search) {
                search.addEventListener("input", applyFilters);
            }
        }

        // ==========================================
        // SURPRISE ME
        // ==========================================

        function showSurpriseMessage(message) {
            let toast = document.getElementById("home-surprise-message");

            if (toast) toast.remove();

            toast = document.createElement("div");
            toast.id = "home-surprise-message";
            toast.className = "home-surprise-message";
            toast.textContent = message;

            document.body.appendChild(toast);

            window.setTimeout(() => {
                toast.remove();
            }, 2500);
        }

        function setupSurpriseButton() {
            const button = document.getElementById("home-surprise-btn");

            if (!button) return;

            button.addEventListener("click", () => {
                const visibleCards = [
                    ...document.querySelectorAll(
                        ".home-item-card:not([hidden])"
                    )
                ];

                if (visibleCards.length === 0) {
                    showSurpriseMessage(
                        "No items to explore yet. Try another filter!"
                    );
                    return;
                }

                const randomIndex = Math.floor(
                    Math.random() * visibleCards.length
                );

                const selectedCard = visibleCards[randomIndex];

                selectedCard.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

                selectedCard.animate(
                    [
                        { transform: "scale(1)" },
                        { transform: "scale(1.035)" },
                        { transform: "scale(1)" }
                    ],
                    {
                        duration: 650,
                        easing: "ease-in-out"
                    }
                );

                showSurpriseMessage("🎉 Here's something to explore!");
            });
        }

        // ==========================================
        // LIVE HOMEPAGE STATISTICS
        // ==========================================

        let homepageStatsUpdated = false;

        function animateStatValue(element, targetValue) {
            if (!element) return;

            const target = Math.max(0, Number(targetValue) || 0);

            const prefersReducedMotion = window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches;

            element.classList.add("stat-number");
            element.dataset.target = String(target);

            if (prefersReducedMotion) {
                element.textContent = target.toLocaleString();
                return;
            }

            const duration = 1100;
            const startTime = performance.now();

            function updateCounter(currentTime) {
                const progress = Math.min(
                    (currentTime - startTime) / duration,
                    1
                );

                const easedProgress = 1 - Math.pow(1 - progress, 4);
                const currentValue = Math.floor(target * easedProgress);

                element.textContent = currentValue.toLocaleString();

                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                } else {
                    element.textContent = target.toLocaleString();
                }
            }

            requestAnimationFrame(updateCounter);
        }

        function updateHomepageStats(stats) {
            if (!stats || typeof stats !== "object") return;

            const statsSection = document.querySelector(".stats");
            if (!statsSection) return;

            const cards = [...statsSection.children];

            if (cards.length < 4) {
                console.warn(
                    "Homepage statistics section needs four statistic cards."
                );
                return;
            }

            const values = [
                {
                    value: stats.totalReported,
                    label: "Items Reported"
                },
                {
                    value: stats.recovered,
                    label: "Items Recovered"
                },
                {
                    value: stats.activeLost,
                    label: "Active Lost Reports"
                },
                {
                    value: stats.activeFound,
                    label: "Active Found Reports"
                }
            ];

            values.forEach((stat, index) => {
                const card = cards[index];
                const number = card.querySelector("h2");
                const label = card.querySelector("p");

                if (label) {
                    label.textContent = stat.label;
                }

                if (number) {
                    number.textContent = "0";
                    animateStatValue(number, stat.value);
                }
            });

            homepageStatsUpdated = true;
        }

        // ==========================================
        // LOAD ITEMS
        // ==========================================

        function showItemsMessage(container, heading, message) {
            if (!container) return;

            const box = document.createElement("div");
            box.className = "home-items-message";

            const title = document.createElement("strong");
            title.textContent = heading;

            const paragraph = document.createElement("p");
            paragraph.textContent = message;

            box.append(title, paragraph);
            container.replaceChildren(box);
        }

        async function loadItems(type, containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;

            try {
                const response = await fetch(
                    "/api/items?type=" + encodeURIComponent(type),
                    { cache: "no-store" }
                );

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(
                        data.message || "Unable to load items."
                    );
                }

                if (!homepageStatsUpdated && data.stats) {
                    updateHomepageStats(data.stats);
                }

                const items = Array.isArray(data.items)
                    ? data.items
                    : [];

                if (items.length === 0) {
                    showItemsMessage(
                        container,
                        type === "lost"
                            ? "No lost items yet"
                            : "No found items yet",
                        "New reports will appear here when students submit them."
                    );
                    return;
                }

                const fragment = document.createDocumentFragment();

                items.slice(0, 3).forEach((item, index) => {
                    fragment.appendChild(
                        createItemCard(item, type, index)
                    );
                });

                container.replaceChildren(fragment);

            } catch (error) {
                console.error(
                    "Unable to load " + type + " items:",
                    error
                );

                showItemsMessage(
                    container,
                    "Something went wrong",
                    "Please refresh the page and try again."
                );
            }
        }

        // ==========================================
        // REFRESH HOMEPAGE ITEMS
        // ==========================================

        async function refreshHomepageItems() {
            const button = document.getElementById("home-refresh-btn");

            if (button) {
                button.disabled = true;
                button.textContent = "↻ Loading...";
            }

            await Promise.all([
                loadItems("lost", "home-lost-items"),
                loadItems("found", "home-found-items")
            ]);

            applyFilters();

            if (button) {
                button.disabled = false;
                button.textContent = "↻ Refresh";
            }
        }

        // ==========================================
        // INITIALIZE EXPLORE MODE
        // ==========================================

        function initializeExploreMode() {
            addHomepageStyles();

            const sections = createItemSections();
            if (!sections) return;

            setupFilters();
            setupSurpriseButton();

            const refreshButton =
                document.getElementById("home-refresh-btn");

            if (refreshButton) {
                refreshButton.addEventListener(
                    "click",
                    refreshHomepageItems
                );
            }

            refreshHomepageItems();
        }

        // ==========================================
        // INITIALIZE HOMEPAGE
        // ==========================================

        checkLoginStatus();
        initializeExploreMode();

    });
})();


(() => {
    if (window.FindItChatbot) return;

    const script = document.currentScript;

    // Load chatbot CSS automatically.
    if (script && script.src) {
        const cssUrl = new URL(
            "../../css/components/chatbot.css",
            script.src
        ).href;

        if (!document.querySelector(
            'link[href="' + cssUrl + '"]'
        )) {
            const stylesheet = document.createElement("link");
            stylesheet.rel = "stylesheet";
            stylesheet.href = cssUrl;
            document.head.appendChild(stylesheet);
        }
    }

    const API_URL = "/api/chatbot";

    let messages = [];
    let isLoading = false;

    function initializeChatbot() {
        if (document.getElementById("findit-chatbot")) return;

        const widget = document.createElement("div");
        widget.id = "findit-chatbot";

        widget.innerHTML = `
            <button class="chatbot-toggle"
                    type="button"
                    aria-label="Open FindIt Assistant"
                    aria-expanded="false">

                <span class="robot-icon">🤖</span>
                <span class="robot-sparkle sparkle-one">✦</span>
                <span class="robot-sparkle sparkle-two">✧</span>
            </button>

            <section class="chatbot-window"
                     role="dialog"
                     aria-label="FindIt AI Assistant">

                <header class="chatbot-header">

                    <div class="chatbot-brand">

                        <div class="chatbot-avatar">
                            <span>🤖</span>
                        </div>

                        <div>
                            <h3>FindIt Assistant</h3>

                            <div class="chatbot-status">
                                <span class="status-dot"></span>
                                Your friendly AI helper
                            </div>
                        </div>

                    </div>

                    <button class="chatbot-close"
                            type="button"
                            aria-label="Close chat">
                        ×
                    </button>

                </header>

                <div class="chatbot-messages"
                     aria-live="polite">

                    <div class="chatbot-welcome">

                        <div class="welcome-robot">🤖</div>

                        <h4>Hey there! 👋</h4>

                        <p>
                            I'm your FindIt Assistant.
                            I'm here to help you find lost items
                            and answer your questions!
                        </p>

                        <div class="chatbot-suggestions">

                            <button class="chatbot-suggestion"
                                    type="button"
                                    data-question="How do I report a lost item?">
                                🔍 How do I report a lost item?
                            </button>

                            <button class="chatbot-suggestion"
                                    type="button"
                                    data-question="How can I report a found item?">
                                📦 How do I report a found item?
                            </button>

                            <button class="chatbot-suggestion"
                                    type="button"
                                    data-question="How do I submit an ownership claim?">
                                📝 How do I submit a claim?
                            </button>

                            <button class="chatbot-suggestion"
                                    type="button"
                                    data-question="How does FindIt match lost and found items?">
                                💜 How does item matching work?
                            </button>

                        </div>
                    </div>

                </div>

                <form class="chatbot-input-area">

                    <textarea
                        class="chatbot-input"
                        rows="1"
                        maxlength="1000"
                        placeholder="Ask your little robot..."
                        aria-label="Your message"
                        required
                    ></textarea>

                    <button class="chatbot-send"
                            type="submit"
                            aria-label="Send message">
                        ➤
                    </button>

                </form>

                <div class="chatbot-footer">
                    Made with 💜 by FindIt AI
                </div>

            </section>
        `;

        document.body.appendChild(widget);

        const toggleButton = widget.querySelector(".chatbot-toggle");
        const closeButton = widget.querySelector(".chatbot-close");
        const chatWindow = widget.querySelector(".chatbot-window");
        const messagesContainer = widget.querySelector(".chatbot-messages");
        const input = widget.querySelector(".chatbot-input");
        const form = widget.querySelector(".chatbot-input-area");
        const sendButton = widget.querySelector(".chatbot-send");
        const suggestions = widget.querySelectorAll(".chatbot-suggestion");

        function openChat() {
            chatWindow.classList.add("open");
            toggleButton.setAttribute("aria-expanded", "true");
            input.focus();
        }

        function closeChat() {
            chatWindow.classList.remove("open");
            toggleButton.setAttribute("aria-expanded", "false");
            toggleButton.focus();
        }

        function scrollToBottom() {
            messagesContainer.scrollTop =
                messagesContainer.scrollHeight;
        }

        function addMessage(role, content) {
            const message = document.createElement("div");

            message.className = `chat-message ${role}`;

            const bubble = document.createElement("div");
            bubble.className = "chat-bubble";
            bubble.textContent = content;

            message.appendChild(bubble);
            messagesContainer.appendChild(message);

            scrollToBottom();
        }

        function showTyping() {
            const typing = document.createElement("div");

            typing.className = "chat-message bot";
            typing.id = "findit-chat-typing";

            typing.innerHTML = `
                <div class="typing-indicator"
                     aria-label="Assistant is typing">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            `;

            messagesContainer.appendChild(typing);
            scrollToBottom();
        }

        function hideTyping() {
            document.getElementById(
                "findit-chat-typing"
            )?.remove();
        }

        async function sendMessage(text) {
            const message = text.trim();

            if (!message || isLoading) return;
            if (message.length > 1000) return;

            isLoading = true;

            input.disabled = true;
            sendButton.disabled = true;

            addMessage("user", message);

            messages.push({
                role: "user",
                content: message
            });

            showTyping();

            try {
                const response = await fetch(API_URL, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({
                        messages
                    })
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(
                        data.message || "Unable to get an AI response."
                    );
                }

                if (typeof data.reply !== "string") {
                    throw new Error(
                        "Invalid response from assistant."
                    );
                }

                messages.push({
                    role: "assistant",
                    content: data.reply
                });

                addMessage("bot", data.reply);

            } catch (error) {
                console.error("FindIt chatbot error:", error);

                addMessage(
                    "bot",
                    error.message ||
                    "Sorry, I couldn't connect. Please try again."
                );

                messages.pop();

            } finally {
                hideTyping();

                isLoading = false;

                input.disabled = false;
                sendButton.disabled = false;

                input.focus();
            }
        }

        toggleButton.addEventListener("click", () => {
            if (chatWindow.classList.contains("open")) {
                closeChat();
            } else {
                openChat();
            }
        });

        closeButton.addEventListener("click", closeChat);

        form.addEventListener("submit", event => {
            event.preventDefault();

            const text = input.value.trim();

            if (!text || isLoading) return;

            input.value = "";
            input.style.height = "auto";

            sendMessage(text);
        });

        input.addEventListener("keydown", event => {
            if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.isComposing
            ) {
                event.preventDefault();
                form.requestSubmit();
            }
        });

        input.addEventListener("input", () => {
            input.style.height = "auto";

            input.style.height =
                Math.min(input.scrollHeight, 90) + "px";
        });

        suggestions.forEach(button => {
            button.addEventListener("click", () => {
                sendMessage(button.dataset.question || "");
            });
        });

        document.addEventListener("keydown", event => {
            if (
                event.key === "Escape" &&
                chatWindow.classList.contains("open")
            ) {
                closeChat();
            }
        });
    }

    window.FindItChatbot = {
        init: initializeChatbot
    };

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeChatbot
        );
    } else {
        initializeChatbot();
    }
})();

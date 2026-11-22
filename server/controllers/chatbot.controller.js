
const OLLAMA_URL =
    process.env.OLLAMA_URL || "http://127.0.0.1:11434";

const OLLAMA_MODEL =
    process.env.OLLAMA_MODEL || "llama3.2:1b";

const SYSTEM_PROMPT = `
You are FindIt Assistant, the AI assistant for FindIt,
a university-only lost-and-found platform.

Your responsibilities:
1. Explain how FindIt works.
2. Guide students through reporting lost and found items.
3. Explain how item matching works.
4. Explain how to submit and track ownership claims.
5. Explain pending, approved, rejected and recovered statuses.
6. Help users understand notifications and account features.

Important FindIt rules:
- Students can report lost and found items.
- FindIt can identify possible matches between reports.
- Students can submit ownership claims for found items.
- The original finder reviews the claim.
- Once approved, the claimant confirms physical receipt.
- An item is considered recovered after receipt is confirmed.

Rules:
- Be polite, professional and helpful.
- Keep answers short and easy to understand.
- Prefer numbered steps when explaining processes.
- Never claim you searched the FindIt database.
- Never invent item listings, users, claims or notifications.
- You cannot access private student information.
- Never ask for passwords, OTPs or private credentials.
- If you do not know something, say so honestly.
`;

function cleanMessages(messages) {
    if (!Array.isArray(messages)) {
        return null;
    }

    return messages
        .filter(message => {
            return (
                message &&
                ["user", "assistant"].includes(message.role) &&
                typeof message.content === "string" &&
                message.content.trim().length > 0
            );
        })
        .slice(-6)
        .map(message => ({
            role: message.role,
            content: message.content.trim().slice(0, 700)
        }));
}

async function chatWithFindIt(req, res) {
    try {
        const messages = cleanMessages(req.body.messages);

        if (!messages || messages.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please enter a message to start chatting."
            });
        }

        if (messages[messages.length - 1].role !== "user") {
            return res.status(400).json({
                success: false,
                message: "Your latest message must be from the user."
            });
        }

        const controller = new AbortController();

        const timeout = setTimeout(() => {
            controller.abort();
        }, 60000);

        let response;

        try {
            response = await fetch(`${OLLAMA_URL}/api/chat`, {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    model: OLLAMA_MODEL,

                    messages: [
                        {
                            role: "system",
                            content: SYSTEM_PROMPT
                        },
                        ...messages
                    ],

                    stream: false,

                    // Keep the model loaded for faster future requests.
                    keep_alive: "10m",

                    options: {
                        num_ctx: 1024,
                        num_predict: 100,
                        temperature: 0.3
                    }
                }),

                signal: controller.signal
            });
        } finally {
            clearTimeout(timeout);
        }

        if (!response.ok) {
            console.error(
                "Ollama API error:",
                response.status
            );

            return res.status(503).json({
                success: false,
                message: "The AI assistant is temporarily unavailable."
            });
        }

        const data = await response.json();

        const reply = data.message?.content?.trim();

        if (!reply) {
            return res.status(502).json({
                success: false,
                message: "The AI assistant could not generate a response."
            });
        }

        return res.status(200).json({
            success: true,
            reply
        });

    } catch (error) {
        console.error("FindIt chatbot error:", error);

        if (error.name === "AbortError") {
            return res.status(504).json({
                success: false,
                message: "The AI response took too long. Please try again."
            });
        }

        return res.status(503).json({
            success: false,
            message: "Unable to connect to the AI assistant. Please try again."
        });
    }
}

module.exports = {
    chatWithFindIt
};

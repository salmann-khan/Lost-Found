
const API_URL = "/api/auth";

// ======================================
// DISPLAY SUCCESS AND ERROR MESSAGES
// ======================================

function showMessage(message, success = false) {
    let messageBox = document.getElementById("authMessage");

    if (!messageBox) {
        messageBox = document.createElement("div");
        messageBox.id = "authMessage";

        const form = document.querySelector("#loginForm, #signupForm");

        if (form) {
            form.prepend(messageBox);
        }
    }

    if (!messageBox) return;

    messageBox.textContent = message;
    messageBox.style.padding = "12px";
    messageBox.style.marginBottom = "15px";
    messageBox.style.borderRadius = "10px";
    messageBox.style.fontSize = "14px";
    messageBox.style.lineHeight = "1.5";
    messageBox.style.background = success ? "#dcfce7" : "#ffe4e6";
    messageBox.style.color = success ? "#166534" : "#9f1239";
}

// ======================================
// SHOW / HIDE PASSWORD
// ======================================

function setupPasswordToggles() {
    document.querySelectorAll(".toggle-password").forEach(button => {
        if (button.dataset.listenerAdded === "true") return;

        button.dataset.listenerAdded = "true";

        button.addEventListener("click", () => {
            const targetId = button.dataset.target;
            const passwordInput = document.getElementById(targetId);

            if (!passwordInput) return;

            const isHidden = passwordInput.type === "password";

            passwordInput.type = isHidden ? "text" : "password";
            button.textContent = isHidden ? "Hide" : "Show";

            button.setAttribute(
                "aria-label",
                isHidden ? "Hide password" : "Show password"
            );
        });
    });
}

// ======================================
// LOGIN
// ======================================

async function handleLogin(event) {
    event.preventDefault();

    const loginForm = event.currentTarget;

    const email = loginForm.querySelector('[name="email"]').value.trim();
    const password = loginForm.querySelector('[name="password"]').value;

    if (!email || !password) {
        return showMessage("Please enter your email and password.");
    }

    const submitButton = loginForm.querySelector(
        'button[type="submit"], input[type="submit"]'
    );

    try {
        if (submitButton) submitButton.disabled = true;

        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Login failed.");
        }

        showMessage("Login successful! Redirecting to your dashboard...", true);

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 800);

    } catch (error) {
        showMessage(error.message || "Something went wrong.");

        if (submitButton) submitButton.disabled = false;
    }
}

// ======================================
// SIGNUP
// ======================================

async function handleSignup(event) {
    event.preventDefault();

    const signupForm = event.currentTarget;

    const fullName = signupForm.querySelector('[name="fullName"]').value.trim();
    const email = signupForm.querySelector('[name="email"]').value.trim();
    const password = signupForm.querySelector('[name="password"]').value;
    const confirmPassword = signupForm.querySelector('[name="confirmPassword"]').value;

    const terms = signupForm.querySelector('[name="terms"]');

    if (!fullName || !email || !password || !confirmPassword) {
        return showMessage("Please complete all required fields.");
    }

    if (password !== confirmPassword) {
        return showMessage("Your passwords do not match.");
    }

    if (
        password.length < 8 ||
        !/[A-Za-z]/.test(password) ||
        !/[0-9]/.test(password)
    ) {
        return showMessage(
            "Password must contain at least 8 characters, including a letter and a number."
        );
    }

    if (terms && !terms.checked) {
        return showMessage("Please accept the terms to continue.");
    }

    const submitButton = signupForm.querySelector(
        'button[type="submit"], input[type="submit"]'
    );

    try {
        if (submitButton) submitButton.disabled = true;

        const response = await fetch(`${API_URL}/signup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                fullName,
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Signup failed.");
        }

        showMessage("Account created successfully! Redirecting...", true);

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 800);

    } catch (error) {
        showMessage(error.message || "Something went wrong.");

        if (submitButton) submitButton.disabled = false;
    }
}

// ======================================
// INITIALIZE AUTHENTICATION
// ======================================

document.addEventListener("DOMContentLoaded", () => {
    setupPasswordToggles();

    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }

    if (signupForm) {
        signupForm.addEventListener("submit", handleSignup);
    }
});


(function () {
    if (window.FindItFeedback) return;

    const style = document.createElement("style");

    style.textContent = `
        #findit-feedback-container {
            position: fixed;
            inset: 0;
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(23, 20, 55, 0.48);
            backdrop-filter: blur(7px);
            -webkit-backdrop-filter: blur(7px);
            opacity: 0;
            visibility: hidden;
            transition: opacity .3s ease, visibility .3s ease;
        }

        #findit-feedback-container.show {
            opacity: 1;
            visibility: visible;
        }

        .findit-feedback-popup {
            position: relative;
            width: min(430px, 100%);
            padding: 38px 28px 30px;
            border-radius: 26px;
            background: #ffffff;
            text-align: center;
            overflow: hidden;
            box-shadow: 0 25px 80px rgba(20, 15, 70, .25);
            transform: translateY(25px) scale(.85);
            transition: transform .4s cubic-bezier(.2,.8,.2,1);
        }

        #findit-feedback-container.show .findit-feedback-popup {
            transform: translateY(0) scale(1);
        }

        .findit-popup-glow {
            position: absolute;
            width: 230px;
            height: 230px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(112, 98, 238, .13), transparent 70%);
            top: -120px;
            left: 50%;
            transform: translateX(-50%);
            pointer-events: none;
        }

        .findit-sticker-area {
            position: relative;
            width: 180px;
            height: 145px;
            margin: 0 auto 15px;
        }

        .findit-main-sticker {
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 105px;
            height: 105px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 65px;
            border-radius: 35px;
            background: #e9e7ff;
            box-shadow: 0 10px 25px rgba(98, 85, 220, .16);
            animation: finditStickerBounce 1.4s ease-in-out infinite;
        }

        .findit-floating-sticker {
            position: absolute;
            font-size: 29px;
            animation: finditStickerFloat 2s ease-in-out infinite;
        }

        .findit-sticker-one {
            top: 5px;
            left: 5px;
        }

        .findit-sticker-two {
            top: 12px;
            right: 5px;
            animation-delay: .4s;
        }

        .findit-sticker-three {
            bottom: 0;
            left: 20px;
            animation-delay: .7s;
        }

        .findit-sticker-four {
            bottom: 0;
            right: 20px;
            animation-delay: .2s;
        }

        .findit-feedback-popup.success .findit-main-sticker {
            background: #e2f8ec;
        }

        .findit-feedback-popup.error .findit-main-sticker {
            background: #ffe7ec;
        }

        .findit-feedback-popup.warning .findit-main-sticker {
            background: #fff3d8;
        }

        .findit-feedback-label {
            display: inline-block;
            padding: 7px 13px;
            border-radius: 30px;
            background: #eeeaff;
            color: #6255d8;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 1.5px;
            margin-bottom: 12px;
        }

        .findit-feedback-popup.success .findit-feedback-label {
            background: #e2f8ec;
            color: #21875d;
        }

        .findit-feedback-popup.error .findit-feedback-label {
            background: #ffe7ec;
            color: #c83f5a;
        }

        .findit-feedback-popup.warning .findit-feedback-label {
            background: #fff3d8;
            color: #a66c12;
        }

        .findit-feedback-title {
            color: #292653;
            font-size: 25px;
            font-weight: 800;
            margin: 0 0 10px;
        }

        .findit-feedback-message {
            color: #77758c;
            font-size: 14px;
            line-height: 1.7;
            margin: 0 auto 23px;
            max-width: 310px;
            overflow-wrap: anywhere;
        }

        .findit-feedback-button {
            width: 100%;
            padding: 14px 20px;
            border: none;
            border-radius: 12px;
            background: linear-gradient(135deg, #7165e8, #5549c5);
            color: white;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 7px 18px rgba(91, 79, 200, .23);
            transition: transform .2s ease;
        }

        .findit-feedback-button:hover {
            transform: translateY(-2px);
        }

        .findit-feedback-popup.error .findit-feedback-button {
            background: linear-gradient(135deg, #ed7185, #cf435e);
        }

        .findit-confetti {
            position: absolute;
            top: -20px;
            font-size: 19px;
            pointer-events: none;
            animation: finditConfettiFall 2.2s ease-in forwards;
        }

        @keyframes finditStickerBounce {
            0%, 100% { transform: translateX(-50%) rotate(-4deg) scale(1); }
            50% { transform: translateX(-50%) rotate(4deg) scale(1.08); }
        }

        @keyframes finditStickerFloat {
            0%, 100% { transform: translateY(0) rotate(-8deg); }
            50% { transform: translateY(-12px) rotate(10deg); }
        }

        @keyframes finditConfettiFall {
            0% {
                transform: translateY(-10px) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(450px) rotate(360deg);
                opacity: 0;
            }
        }

        @media (max-width: 480px) {
            .findit-feedback-popup {
                padding: 30px 20px 24px;
            }

            .findit-feedback-title {
                font-size: 22px;
            }
        }

        @media (prefers-reduced-motion: reduce) {
            .findit-feedback-popup,
            .findit-main-sticker,
            .findit-floating-sticker,
            .findit-confetti {
                animation: none;
                transition: none;
            }
        }
    `;

    document.head.appendChild(style);

    const container = document.createElement("div");
    container.id = "findit-feedback-container";
    container.setAttribute("aria-live", "assertive");
    container.setAttribute("aria-atomic", "true");

    document.body.appendChild(container);

    let closeTimer = null;
    let currentPopup = null;

    const settings = {
        success: {
            icon: "🎉",
            stickers: ["🎊", "⭐", "🎈", "✨"],
            label: "SUCCESS!",
            title: "Great Job!"
        },
        error: {
            icon: "😕",
            stickers: ["💔", "⚠️", "❌", "💭"],
            label: "OOPS!",
            title: "Something went wrong"
        },
        warning: {
            icon: "🤔",
            stickers: ["⚡", "💡", "⭐", "❗"],
            label: "ATTENTION",
            title: "Please check"
        }
    };

    function closePopup() {
        clearTimeout(closeTimer);
        container.classList.remove("show");

        setTimeout(() => {
            if (!container.classList.contains("show")) {
                container.innerHTML = "";
                currentPopup = null;
            }
        }, 350);
    }

    function createConfetti(popup) {
        const pieces = ["🎉", "✨", "⭐", "🎊", "💜", "🎈"];

        for (let i = 0; i < 22; i++) {
            const piece = document.createElement("span");
            piece.className = "findit-confetti";
            piece.textContent = pieces[i % pieces.length];
            piece.style.left = `${Math.random() * 100}%`;
            piece.style.animationDelay = `${Math.random() * 0.8}s`;
            popup.appendChild(piece);

            setTimeout(() => piece.remove(), 3200);
        }
    }

    function show(message, type = "success", duration = 3500) {
        clearTimeout(closeTimer);
        container.innerHTML = "";

        const config = settings[type] || settings.success;

        const popup = document.createElement("div");
        popup.className = `findit-feedback-popup ${type}`;
        popup.setAttribute("role", "alert");

        const glow = document.createElement("div");
        glow.className = "findit-popup-glow";

        const stickerArea = document.createElement("div");
        stickerArea.className = "findit-sticker-area";

        const mainSticker = document.createElement("div");
        mainSticker.className = "findit-main-sticker";
        mainSticker.textContent = config.icon;

        stickerArea.appendChild(mainSticker);

        config.stickers.forEach((sticker, index) => {
            const element = document.createElement("span");
            element.className = `findit-floating-sticker findit-sticker-${["one", "two", "three", "four"][index]}`;
            element.textContent = sticker;
            stickerArea.appendChild(element);
        });

        const label = document.createElement("div");
        label.className = "findit-feedback-label";
        label.textContent = config.label;

        const title = document.createElement("h2");
        title.className = "findit-feedback-title";
        title.textContent = type === "success"
            ? "Successfully Done!"
            : config.title;

        const messageText = document.createElement("p");
        messageText.className = "findit-feedback-message";
        messageText.textContent = message;

        const button = document.createElement("button");
        button.className = "findit-feedback-button";
        button.type = "button";
        button.textContent = "Got it!";
        button.addEventListener("click", closePopup);

        popup.append(
            glow,
            stickerArea,
            label,
            title,
            messageText,
            button
        );

        container.appendChild(popup);
        currentPopup = popup;

        if (type === "success") {
            createConfetti(popup);
        }

        requestAnimationFrame(() => {
            container.classList.add("show");
        });

        if (duration > 0) {
            closeTimer = setTimeout(closePopup, duration);
        }

        return popup;
    }

    container.addEventListener("click", event => {
        if (event.target === container) {
            closePopup();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && currentPopup) {
            closePopup();
        }
    });

    window.FindItFeedback = { show, close: closePopup };
})();

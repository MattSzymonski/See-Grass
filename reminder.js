(async () => {
    const { showArrow, arrowDirection, reminderLength, playSoundOnStart, soundOnStart, customBackgroundUrl } = await chrome.storage.local.get([
        "showArrow",
        "arrowDirection",
        "reminderLength",
        "playSoundOnStart",
        "soundOnStart",
        "customBackgroundUrl"
    ]);

    const DEBUG_REMINDER_LENGTH = 0; // Set to 0 for production, or number of seconds for testing

    // Set custom background if provided
    if (customBackgroundUrl) {
        document.body.style.backgroundImage = `url('${customBackgroundUrl}')`;
    }

    // Show arrow if enabled
    if (showArrow) {
        const arrowContainer = document.getElementById("arrow-container");
        const arrow = document.createElement("div");
        arrow.className = "arrow";
        arrow.setAttribute("data-dir", arrowDirection || "up");
        arrow.textContent = "➜";
        arrowContainer.appendChild(arrow);
    }

    // Play sound on start if enabled (not system notification sound)
    if (playSoundOnStart && soundOnStart !== "system") {
        const audio = new Audio(chrome.runtime.getURL(`sounds/${soundOnStart}.mp3`));
        audio.volume = 0.8;
        audio.play().catch(err => console.warn("Audio play failed:", err));
    }

    // Countdown logic
    let remaining = DEBUG_REMINDER_LENGTH ? DEBUG_REMINDER_LENGTH : reminderLength;
    const timerEl = document.getElementById("timer");
    timerEl.textContent = remaining;

    const countdown = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
            clearInterval(countdown);
            window.close();
            return;
        }
        timerEl.style.opacity = "0.3";
        setTimeout(() => {
            timerEl.textContent = remaining;
            timerEl.style.opacity = "1";
        }, 150);
    }, 1000);

    // Close button
    document.getElementById("closeBtn").addEventListener("click", () => {
        clearInterval(countdown);
        window.close();
    });

    // Auto-close after reminder length
    setTimeout(() => {
        clearInterval(countdown);
        window.close();
    }, remaining * 1000);
})();

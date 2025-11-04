(async () => {
    const { showArrow, arrowDirection, reminderLength, playSoundOnStart, soundOnStart, playSoundOnEnd, soundOnEnd } = await chrome.storage.local.get([
        "showArrow",
        "arrowDirection",
        "reminderLength",
        "playSoundOnStart",
        "soundOnStart",
        "playSoundOnEnd",
        "soundOnEnd"
    ]);

    const DEBUG_REMINDER_LENGTH = 0; // Set to 0 for production, or number of seconds for testing

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

    // Function to play end sound
    function playEndSound() {
        if (playSoundOnEnd && soundOnEnd !== "system") {
            const audio = new Audio(chrome.runtime.getURL(`sounds/${soundOnEnd}.mp3`));
            audio.volume = 0.8;
            audio.play().catch(err => console.warn("End audio play failed:", err));
        }
    }

    const countdown = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
            clearInterval(countdown);
            playEndSound();
            setTimeout(() => window.close(), 100); // Small delay to let sound start
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
        playEndSound();
        setTimeout(() => window.close(), 100); // Small delay to let sound start
    });

    // Auto-close after reminder length
    setTimeout(() => {
        clearInterval(countdown);
        playEndSound();
        setTimeout(() => window.close(), 100); // Small delay to let sound start
    }, remaining * 1000);
})();

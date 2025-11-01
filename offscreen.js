// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "PLAY_SOUND") {
        const audio = new Audio(chrome.runtime.getURL(`sounds/${message.sound}.mp3`));
        audio.volume = 0.8;
        audio.play().catch(err => console.warn("Audio play failed:", err));
    }
});

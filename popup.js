const countdownDisplay = document.getElementById("countdown");

let remainingTime = 0;
let timerInterval;

// Update countdown display
function updateCountdownDisplay() {
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  countdownDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Continuously update the countdown from storage
function startCountdownLoop() {
  if (timerInterval) clearInterval(timerInterval);

  // Immediately update countdown on start
  (async () => {
    const data = await chrome.storage.local.get(["nextReminderTime"]);
    if (!data.nextReminderTime) return;
    const now = Date.now();
    remainingTime = Math.max(0, Math.floor((data.nextReminderTime - now) / 1000));
    updateCountdownDisplay();
  })();

  timerInterval = setInterval(async () => {
    const data = await chrome.storage.local.get(["nextReminderTime"]);
    if (!data.nextReminderTime) return;
    const now = Date.now();
    remainingTime = Math.max(0, Math.floor((data.nextReminderTime - now) / 1000));
    updateCountdownDisplay();
  }, 1000);
}

// Open setting button
document.getElementById("settingsButton").addEventListener("click", () => {
  console.log(`Opening settings`);
  chrome.runtime.openOptionsPage();
});

// Run countdown loop
document.addEventListener("DOMContentLoaded", startCountdownLoop);
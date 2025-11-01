// Load saved settings when page opens
document.addEventListener("DOMContentLoaded", async () => {
  const {
    reminderInterval,
    reminderLength,
    disableWhenScreenSharing,
    showSystemNotification,
    playSound,
    sound,
    showArrow,
    arrowDirection,
  } = await chrome.storage.local.get([
    "reminderInterval",
    "reminderLength",
    "disableWhenScreenSharing",
    "showSystemNotification",
    "playSound",
    "sound",
    "showArrow",
    "arrowDirection",
  ]);

  // Set form values (with defaults)
  document.getElementById("reminderInterval").value = reminderInterval ?? 20;
  document.getElementById("reminderLength").value = reminderLength ?? 10;
  document.getElementById("disableWhenScreenSharing").checked = disableWhenScreenSharing ?? true;
  document.getElementById("showSystemNotification").checked = showSystemNotification ?? false;
  document.getElementById("playSound").checked = playSound ?? false;
  document.getElementById("sound").value = sound ?? "system";
  document.getElementById("showArrow").checked = showArrow ?? false;
  document.getElementById("arrowDirection").value = arrowDirection ?? "up";
});

// Save settings and reset timer
document.getElementById("save").addEventListener("click", async () => {
  const reminderInterval = Number(
    document.getElementById("reminderInterval").value
  );
  const reminderLength = Number(
    document.getElementById("reminderLength").value
  );
  const disableWhenScreenSharing = document.getElementById(
    "disableWhenScreenSharing"
  ).checked;
  const showSystemNotification = document.getElementById(
    "showSystemNotification"
  ).checked;
  const playSound = document.getElementById("playSound").checked;
  const sound = document.getElementById("sound").value;
  const showArrow = document.getElementById("showArrow").checked;
  const arrowDirection = document.getElementById("arrowDirection").value;

  // Store all settings
  await chrome.storage.local.set({
    reminderInterval,
    reminderLength,
    disableWhenScreenSharing,
    showSystemNotification,
    playSound,
    sound,
    showArrow,
    arrowDirection,
  });

  console.log("[See Grass] Settings saved:", {
    reminderInterval,
    reminderLength,
    disableWhenScreenSharing,
    showSystemNotification,
    playSound,
    sound,
    showArrow,
    arrowDirection,
  });

  // Reset the reminder timer in background
  chrome.runtime.sendMessage({
    type: "RESET_TIMER",
    intervalMs: reminderInterval * 60 * 1000, // convert minutes → ms
  });

  // Optional notification / feedback
  showSavedPopup();
});

// --- Helper: Small popup confirmation ---
function showSavedPopup() {
  const popup = document.createElement("div");
  popup.textContent = "Settings saved & timer reset!";
  Object.assign(popup.style, {
    position: "fixed",
    bottom: "30px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#399742",
    color: "white",
    padding: "10px 20px",
    borderRadius: "8px",
    fontSize: "14px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
    opacity: "0",
    transition: "opacity 0.3s ease",
    zIndex: "9999",
  });
  document.body.appendChild(popup);
  requestAnimationFrame(() => (popup.style.opacity = "1"));
  setTimeout(() => {
    popup.style.opacity = "0";
    setTimeout(() => popup.remove(), 500);
  }, 1500);
}

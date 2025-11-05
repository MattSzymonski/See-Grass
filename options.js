// Load saved settings when page opens
document.addEventListener("DOMContentLoaded", async () => {
  const {
    reminderInterval,
    reminderLength,
    customBackgroundUrl,
    showReminderPage,
    disableWhenScreenSharing,
    showSystemNotification,
    playSoundOnStart,
    soundOnStart,
    playSoundOnEnd,
    soundOnEnd,
    showArrow,
    arrowDirection,
  } = await chrome.storage.local.get([
    "reminderInterval",
    "reminderLength",
    "customBackgroundUrl",
    "showReminderPage",
    "disableWhenScreenSharing",
    "showSystemNotification",
    "playSoundOnStart",
    "soundOnStart",
    "playSoundOnEnd",
    "soundOnEnd",
    "showArrow",
    "arrowDirection",
  ]);

  // Set form values (with defaults)
  document.getElementById("reminderInterval").value = reminderInterval ?? 20;
  document.getElementById("reminderLength").value = reminderLength ?? 10;
  document.getElementById("customBackgroundUrl").value = customBackgroundUrl ?? "";
  document.getElementById("showReminderPage").checked = showReminderPage ?? true;
  document.getElementById("disableWhenScreenSharing").checked = disableWhenScreenSharing ?? true;
  document.getElementById("showSystemNotification").checked = showSystemNotification ?? true;
  document.getElementById("playSoundOnStart").checked = playSoundOnStart ?? true;
  document.getElementById("soundOnStart").value = soundOnStart ?? "system";
  document.getElementById("playSoundOnEnd").checked = playSoundOnEnd ?? false;
  document.getElementById("soundOnEnd").value = soundOnEnd ?? "system";
  document.getElementById("showArrow").checked = showArrow ?? false;
  document.getElementById("arrowDirection").value = arrowDirection ?? "right";

  // Setup toggle visibility handlers
  const showReminderPageCheckbox = document.getElementById("showReminderPage");
  const customBackgroundOption = document.getElementById("customBackgroundOption");
  const showArrowOption = document.getElementById("showArrowOption");
  const playSoundOnStartCheckbox = document.getElementById("playSoundOnStart");
  const soundOnStartOption = document.getElementById("soundOnStartOption");
  const playSoundOnEndCheckbox = document.getElementById("playSoundOnEnd");
  const soundOnEndOption = document.getElementById("soundOnEndOption");
  const showArrowCheckbox = document.getElementById("showArrow");
  const arrowDirectionOption = document.getElementById("arrowDirectionOption");

  // Function to toggle reminder page sub-options visibility
  function toggleReminderPageOptions() {
    const isVisible = showReminderPageCheckbox.checked;
    customBackgroundOption.style.display = isVisible ? "flex" : "none";
    showArrowOption.style.display = isVisible ? "flex" : "none";
    if (isVisible && showArrowCheckbox.checked) {
      arrowDirectionOption.style.display = "flex";
    } else {
      arrowDirectionOption.style.display = "none";
    }
  }

  // Function to toggle sound on start dropdown visibility
  function toggleSoundOnStartOption() {
    soundOnStartOption.style.display = playSoundOnStartCheckbox.checked ? "flex" : "none";
  }

  // Function to toggle sound on end dropdown visibility
  function toggleSoundOnEndOption() {
    soundOnEndOption.style.display = playSoundOnEndCheckbox.checked ? "flex" : "none";
  }

  // Function to toggle arrow direction dropdown visibility
  function toggleArrowDirectionOption() {
    if (showReminderPageCheckbox.checked && showArrowCheckbox.checked) {
      arrowDirectionOption.style.display = "flex";
    } else {
      arrowDirectionOption.style.display = "none";
    }
  }

  // Set initial visibility
  toggleReminderPageOptions();
  toggleSoundOnStartOption();
  toggleSoundOnEndOption();
  toggleArrowDirectionOption();

  // Add event listeners
  showReminderPageCheckbox.addEventListener("change", toggleReminderPageOptions);
  playSoundOnStartCheckbox.addEventListener("change", toggleSoundOnStartOption);
  playSoundOnEndCheckbox.addEventListener("change", toggleSoundOnEndOption);
  showArrowCheckbox.addEventListener("change", toggleArrowDirectionOption);
});

// Save settings and reset timer
document.getElementById("save").addEventListener("click", async () => {
  const reminderInterval = Number(
    document.getElementById("reminderInterval").value
  );
  const reminderLength = Number(
    document.getElementById("reminderLength").value
  );
  const customBackgroundUrl = document.getElementById("customBackgroundUrl").value.trim();
  const showReminderPage = document.getElementById("showReminderPage").checked;
  const disableWhenScreenSharing = document.getElementById(
    "disableWhenScreenSharing"
  ).checked;
  const showSystemNotification = document.getElementById(
    "showSystemNotification"
  ).checked;
  const playSoundOnStart = document.getElementById("playSoundOnStart").checked;
  const soundOnStart = document.getElementById("soundOnStart").value;
  const playSoundOnEnd = document.getElementById("playSoundOnEnd").checked;
  const soundOnEnd = document.getElementById("soundOnEnd").value;
  const showArrow = document.getElementById("showArrow").checked;
  const arrowDirection = document.getElementById("arrowDirection").value;

  // Store all settings
  await chrome.storage.local.set({
    reminderInterval,
    reminderLength,
    customBackgroundUrl,
    showReminderPage,
    disableWhenScreenSharing,
    showSystemNotification,
    playSoundOnStart,
    soundOnStart,
    playSoundOnEnd,
    soundOnEnd,
    showArrow,
    arrowDirection,
  });

  console.log("[See Grass] Settings saved:", {
    reminderInterval,
    reminderLength,
    customBackgroundUrl,
    showReminderPage,
    disableWhenScreenSharing,
    showSystemNotification,
    playSoundOnStart,
    soundOnStart,
    playSoundOnEnd,
    soundOnEnd,
    showArrow,
    arrowDirection,
  });

  // Close reminder tab if it's open
  const { reminderTabId } = await chrome.storage.local.get("reminderTabId");
  if (reminderTabId) {
    try {
      await chrome.tabs.remove(reminderTabId);
      console.log("[See Grass] Closed reminder tab on settings save.");
    } catch (err) {
      console.warn("[See Grass] Could not close reminder tab:", err);
    }
  }

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

// --- Debug button: Trigger reminder in 5 seconds ---
document.getElementById("debugButton").addEventListener("click", () => {
  chrome.runtime.sendMessage({
    type: "RESET_TIMER",
    intervalMs: 5000, // 5 seconds
  });

  // Show debug confirmation
  const popup = document.createElement("div");
  popup.textContent = "Reminder in 5 seconds";
  Object.assign(popup.style, {
    position: "fixed",
    bottom: "30px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#d37f00ff",
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
  }, 2000);
});

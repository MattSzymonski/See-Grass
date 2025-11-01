const DEFAULT_INTERVAL_MIN = 20;
const DEBUG_INTERVAL_SEC = 10;



// --- Helper: Set reminder timer ---
async function setReminderTimer(intervalMs) {
  const nextReminderTime = Date.now() + (DEBUG_INTERVAL_SEC ? DEBUG_INTERVAL_SEC * 1000 : intervalMs);
  await chrome.storage.local.set({ nextReminderTime });

  await chrome.alarms.clear("eyeSaverReminder");
  chrome.alarms.create("eyeSaverReminder", { when: nextReminderTime });

  console.log(`[See Grass] Reminder set for ${new Date(nextReminderTime).toLocaleTimeString()}`);
}

// --- Helper: Check if screen sharing is active in any Meet tab ---
async function isScreenSharingActive() {
  const meetTabs = await chrome.tabs.query({ url: "*://meet.google.com/*" });
  if (meetTabs.length === 0) {
    console.log("[See Grass] No Google Meet tabs found.");
    return false;
  }

  for (const tab of meetTabs) {
    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const section = document.querySelector('section[aria-label="Presentation"]');
          if (!section) return false;
          const spans = Array.from(section.querySelectorAll("span"));
          return spans.some(s => s.textContent?.trim() === "Stop presenting");
        },
      });

      if (result?.result) {
        console.log(`[See Grass] Screen sharing detected in Meet tab ${tab.id}`);
        return true;
      }
    } catch (err) {
      console.warn(`[See Grass] Failed to inspect Meet tab ${tab.id}:`, err);
    }
  }

  console.log("[See Grass] No active presentation found in Meet tabs.");
  return false;
}

// --- Alarm trigger ---
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "eyeSaverReminder") return;

  const {
    reminderInterval,
    reminderLength,
    disableWhenScreenSharing,
    lastActiveTab,
  } = await chrome.storage.local.get([
    "reminderInterval",
    "reminderLength",
    "disableWhenScreenSharing",
    "lastActiveTab",
  ]);

  // Convert user interval (minutes → ms)
  const intervalMs = DEBUG_INTERVAL_SEC ? DEBUG_INTERVAL_SEC * 1000 : (reminderInterval ?? DEFAULT_INTERVAL_MIN) * 60 * 1000;

  // --- Check screen sharing only if user enabled the setting ---
  if (disableWhenScreenSharing) {
    const isSharing = await isScreenSharingActive();
    if (isSharing) {
      console.log("[See Grass] Skipping reminder — screen sharing detected (and disableWhenScreenSharing is enabled).");
      await setReminderTimer(intervalMs);
      return;
    }
  }

  // --- Otherwise show reminder overlay ---
  
  
  const tab = await chrome.tabs.get(lastActiveTab.id);
  const url = tab.url || "";
  const canInjectOverlay = !url.startsWith("chrome://") && !url.startsWith("chrome://extensions/") && !url.startsWith("chrome-extension://") && !url.startsWith("devtools://");
  if (canInjectOverlay) {
    await chrome.windows.update(lastActiveTab.windowId, { focused: true });
    await chrome.tabs.update(lastActiveTab.id, { active: true });
    await chrome.scripting.executeScript({
      target: { tabId: lastActiveTab.id },
      files: ["overlay.js"],
    });
    console.log("[See Grass] Injected overlay.");
  }

  // Customize message 
  // Fix bluring
  // Count resignations?
  // Focus on browser (or open new tab)
  // Export and import settings (json)
  // Icon with eye?
  // Count 15 sec of inactivity (start after 5 seconds, end after reminder length)?

  const {
    showSystemNotification,
    playSound,
    sound
  } = await chrome.storage.local.get([
    "showSystemNotification",
    "playSound",
    "sound"
  ]);

  // --- Show notification with sound ---
  if (showSystemNotification) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: chrome.runtime.getURL("icons/icon128-grass.png"),
      title: "🌿 Time to See Some Grass",
      message: "Look away from the screen for a few seconds!",
      silent: !(playSound === true && sound === "system")
    });
  }

  // --- Play custom sound ---
  
  if (playSound === true && sound !== "system") {
    chrome.tabs.query({}, (tabs) => {
      // Find the first tab we can safely inject into
      const validTab = tabs.find(tab => {
        const url = tab.url || "";
        const isValid =
          url.startsWith("http://") ||
          url.startsWith("https://") ||
          url.startsWith("file://") ||
          url.startsWith("about:blank"); // optional fallback
        console.log("[See Grass] Checked tab:", url, "→", isValid ? "✅ valid" : "❌ invalid");
        return isValid;
      });

      if (!validTab || !validTab.id) {
        console.warn("[See Grass] No suitable tab found to play sound.");
        return;
      }

      console.log("[See Grass] Playing custom sound in tab:", validTab.url);
      chrome.scripting.executeScript({
        target: { tabId: validTab.id },
        func: (sound) => {
          const audio = new Audio(chrome.runtime.getURL(`sounds/${sound}.mp3`));
          audio.volume = 0.8;
          audio.play().catch(err => console.warn("Audio play failed:", err));
        },
        args: [sound],
      });
    });
  }

  // --- Schedule next reminder ---
  await setReminderTimer(intervalMs);
});

// --- Track currently active tab ---
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  await chrome.storage.local.set({
    lastActiveTab: { id: tab.id, windowId: tab.windowId },
  });
});

// --- Listen for manual reset ---
chrome.runtime.onMessage.addListener(async (message) => {
  if (message.type === "RESET_TIMER") {
    await setReminderTimer(message.intervalMs);
  }
});

// --- On startup ---
chrome.runtime.onStartup.addListener(async () => {
  const { reminderInterval } = await chrome.storage.local.get("reminderInterval");
  const intervalMs = DEBUG_INTERVAL_SEC ? DEBUG_INTERVAL_SEC * 1000 : (reminderInterval ?? DEFAULT_INTERVAL_MIN) * 60 * 1000;
  await setReminderTimer(intervalMs);
});

// --- On install ---
chrome.runtime.onInstalled.addListener(async () => {
  const { reminderInterval } = await chrome.storage.local.get("reminderInterval");
  const intervalMs = DEBUG_INTERVAL_SEC ? DEBUG_INTERVAL_SEC * 1000 : (reminderInterval ?? DEFAULT_INTERVAL_MIN) * 60 * 1000;
  await setReminderTimer(intervalMs);
});

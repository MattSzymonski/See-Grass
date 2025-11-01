const DEFAULT_INTERVAL_MIN = 20;
const DEBUG_INTERVAL_SEC = 10;

// --- Helper: Setup offscreen document for audio playback ---
async function setupOffscreenDocument() {
  // Check if offscreen document already exists
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL('offscreen.html')]
  });

  if (existingContexts.length > 0) {
    return; // Already exists
  }

  // Create offscreen document
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['AUDIO_PLAYBACK'],
    justification: 'Play reminder sound when reminder page is disabled'
  });
}

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
    showReminderPage,
    disableWhenScreenSharing,
    lastActiveTab,
  } = await chrome.storage.local.get([
    "reminderInterval",
    "reminderLength",
    "showReminderPage",
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

  // --- Open reminder page if enabled ---
  if (showReminderPage ?? true) {
    // Store the current active tab before opening reminder
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (currentTab) {
      await chrome.storage.local.set({ tabBeforeReminder: currentTab.id });
    }

    // Open reminder in new tab
    const reminderUrl = chrome.runtime.getURL("reminder.html");
    const newTab = await chrome.tabs.create({ url: reminderUrl, active: true });

    // Store reminder tab ID so we can switch back after it closes
    await chrome.storage.local.set({ reminderTabId: newTab.id });

    // Unminimize and bring window to front
    if (lastActiveTab && lastActiveTab.windowId) {
      const window = await chrome.windows.get(lastActiveTab.windowId);
      if (window.state === "minimized") {
        await chrome.windows.update(lastActiveTab.windowId, { state: "normal" });
      }
      // drawAttention brings the window to the top and makes it flash in the taskbar
      await chrome.windows.update(lastActiveTab.windowId, { focused: true, drawAttention: true });
    }

    console.log("[See Grass] Opened reminder tab and brought browser to front.");
  } else {
    console.log("[See Grass] Reminder page disabled, showing notification/sound only.");
  }

  // Customize message 
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

  // --- Play custom sound when reminder page is disabled ---
  // (When reminder page is shown, the sound is played by reminder.js)
  if (!(showReminderPage ?? true) && playSound && sound !== "system") {
    await setupOffscreenDocument();
    chrome.runtime.sendMessage({ type: "PLAY_SOUND", sound: sound });
    console.log("[See Grass] Playing custom sound via offscreen document.");
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

// --- Switch back to previous tab when reminder tab closes ---
chrome.tabs.onRemoved.addListener(async (tabId) => {
  const { reminderTabId, tabBeforeReminder } = await chrome.storage.local.get([
    "reminderTabId",
    "tabBeforeReminder"
  ]);

  // If the closed tab is the reminder tab
  if (tabId === reminderTabId && tabBeforeReminder) {
    try {
      // Switch back to the tab that was active before the reminder
      await chrome.tabs.update(tabBeforeReminder, { active: true });
      console.log("[See Grass] Switched back to previous tab.");
    } catch (err) {
      console.warn("[See Grass] Could not switch back to previous tab:", err);
    }

    // Clean up stored IDs
    await chrome.storage.local.remove(["reminderTabId", "tabBeforeReminder"]);
  }
});

// --- Listen for manual reset ---
chrome.runtime.onMessage.addListener(async (message) => {
  if (message.type === "RESET_TIMER") {
    await setReminderTimer(message.intervalMs);
  }
});

// --- Initialize timer function ---
async function initializeTimer() {
  const { reminderInterval } = await chrome.storage.local.get("reminderInterval");
  const intervalMs = DEBUG_INTERVAL_SEC ? DEBUG_INTERVAL_SEC * 1000 : (reminderInterval ?? DEFAULT_INTERVAL_MIN) * 60 * 1000;
  await setReminderTimer(intervalMs);
  console.log("[See Grass] Timer initialized.");
}

// --- On startup ---
chrome.runtime.onStartup.addListener(async () => {
  await initializeTimer();
});

// --- On install ---
chrome.runtime.onInstalled.addListener(async () => {
  await initializeTimer();
});

// --- Initialize timer immediately when service worker loads ---
initializeTimer();

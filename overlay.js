(async () => {
  const { showArrow, arrowDirection, reminderLength } = await chrome.storage.local.get([
    "showArrow",
    "arrowDirection",
    "reminderLength",
  ]);

  // Remove old overlay if exists
  document.getElementById("see-grass-overlay")?.remove();

  // Create overlay
  const overlay = document.createElement("div");
  overlay.id = "see-grass-overlay";
  overlay.innerHTML = `
    <div id="see-grass-bg"></div>
     ${showArrow ? `
      <div style="position: absolute; transform: translateY(-200px);">
        <div class="see-grass-arrow" data-dir="${arrowDirection}">➜</div>
      </div>` : ""}
    <div class="see-grass-content">
     
      <div>🌿 Time to See Some Grass 🌿</div>
      <div class="see-grass-sub">Look away for a few seconds and rest your eyes</div>
      <div class="see-grass-timer-wrap">
        Closing in <span id="see-grass-timer">${reminderLength}</span>s
      </div>
      <button id="see-grass-close" class="see-grass-button">I'm refreshed!</button>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => (overlay.style.opacity = "1"));

  // Styles
  const styleTag = document.createElement("style");
  styleTag.textContent = `
    #see-grass-overlay {
      position: fixed;
      inset: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 100vw;
      height: 100vh;
      color: #ececec;
      font-size: 2rem;
      font-family: sans-serif;
      z-index: 999999;
      opacity: 0;
      transition: opacity 0.3s ease;
      user-select: none;
      pointer-events: all;
    }

    #see-grass-bg {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, #808080ad, #2727278c);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 0;
      pointer-events: all;
    }

    .see-grass-content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
    }

    .see-grass-sub {
      font-size: 1rem;
      margin-top: 10px;
    }

    .see-grass-timer-wrap {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 1rem;
      margin-top: 32px;
      opacity: 0.8;
    }

    .see-grass-button {
      margin-top: 20px;
      padding: 12px 20px;
      font-size: 1rem;
      border: none;
      border-radius: 8px;
      background: #399742;
      color: white;
      cursor: pointer;
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
      transition: background 0.2s ease;
    }

    .see-grass-button:hover { background: #54aa55; }
    .see-grass-button:active { background: #35853d; }

    .see-grass-arrow {
      font-size: 4rem;
      margin-bottom: 20px;df
      display: inline-block;
      animation: pingpong 1.8s infinite ease-in-out;
      transform: rotate(var(--rotate, 0deg));
    }

    .see-grass-arrow[data-dir="up"] { --rotate: -90deg; }
    .see-grass-arrow[data-dir="down"] { --rotate: 90deg; }
    .see-grass-arrow[data-dir="left"] { --rotate: 180deg; }

    @keyframes pingpong {
      0%, 100% { transform: rotate(var(--rotate)) translate(-10px, 0); }
      50% { transform: rotate(var(--rotate)) translate(15px, 0); }
    }

    #see-grass-timer {
      transition: opacity 0.4s ease;
    }
  `;
  document.head.appendChild(styleTag);

  // Countdown logic
  let remaining = reminderLength;
  const timerEl = overlay.querySelector("#see-grass-timer");
  const fadeDuration = 300;

  function updateTimer(newVal) {
    if (!timerEl) return;
    timerEl.style.opacity = "0.2";
    setTimeout(() => {
      timerEl.textContent = newVal;
      timerEl.style.opacity = "1";
    }, fadeDuration);
  }

  const countdown = setInterval(() => {
    remaining--;
    if (remaining <= 0) clearInterval(countdown);
    updateTimer(remaining);
  }, 1000);

  // Close button
  overlay.querySelector("#see-grass-close")?.addEventListener("click", () => {
    clearInterval(countdown);
    overlay.style.opacity = "0";
    setTimeout(() => overlay.remove(), 500);
  });

  // Auto-hide
  setTimeout(() => {
    clearInterval(countdown);
    if (document.body.contains(overlay)) {
      overlay.style.opacity = "0";
      setTimeout(() => overlay.remove(), 500);
    }
  }, reminderLength * 1000);
})();

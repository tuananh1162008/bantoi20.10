(() => {
  const player = document.getElementById("music-player");
  const title = document.getElementById("music-title");
  const status = document.getElementById("music-status");
  const playButton = document.getElementById("music-play");
  const toggleButton = document.getElementById("music-toggle");
  const volumeInput = document.getElementById("music-volume");
  const volumeValue = document.getElementById("music-volume-value");
  const trackSelect = document.getElementById("music-track");

  if (
    !player ||
    !title ||
    !status ||
    !playButton ||
    !toggleButton ||
    !(volumeInput instanceof HTMLInputElement) ||
    !volumeValue ||
    !(trackSelect instanceof HTMLSelectElement)
  ) {
    throw new Error("Không thể khởi tạo trình phát nhạc: thiếu thành phần giao diện.");
  }

  const channel = "scene-three-music";
  let isPlaying = false;

  function sendCommand(action, value) {
    if (!window.parent || window.parent === window) {
      status.textContent = "Không kết nối được nhạc nền";
      return;
    }
    window.parent.postMessage({ channel, type: "command", action, value }, "*");
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window.parent || !event.data || event.data.channel !== channel || event.data.type !== "state") return;
    const { paused, volume, error, tracks, currentTrack } = event.data;
    if (Array.isArray(tracks)) {
      trackSelect.replaceChildren(...tracks.map((track, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = track.name;
        return option;
      }));
      trackSelect.disabled = tracks.length === 0;
    }
    if (Number.isInteger(currentTrack) && currentTrack >= 0 && currentTrack < trackSelect.options.length) {
      trackSelect.value = String(currentTrack);
      title.textContent = trackSelect.options[currentTrack].textContent || "Nhạc nền 20/10";
    }
    if (typeof paused === "boolean") {
      isPlaying = !paused;
      playButton.textContent = isPlaying ? "Ⅱ" : "▶";
      playButton.setAttribute("aria-label", isPlaying ? "Tạm dừng nhạc" : "Phát nhạc");
      status.textContent = error || (isPlaying ? "Đang phát nhạc nền" : "Đã tạm dừng");
    }
    if (Number.isFinite(volume)) {
      const percent = Math.round(volume * 100);
      volumeInput.value = String(percent);
      volumeValue.textContent = `${percent}%`;
    }
  });

  volumeInput.addEventListener("input", () => {
    const volume = Number(volumeInput.value);
    volumeValue.textContent = `${volume}%`;
    sendCommand("volume", volume / 100);
  });

  playButton.addEventListener("click", () => sendCommand(isPlaying ? "pause" : "play"));
  trackSelect.addEventListener("change", () => sendCommand("track", Number(trackSelect.value)));

  toggleButton.addEventListener("click", () => {
    const isExpanded = toggleButton.getAttribute("aria-expanded") === "true";
    toggleButton.setAttribute("aria-expanded", String(!isExpanded));
    toggleButton.setAttribute("aria-label", isExpanded ? "Mở trình phát" : "Thu gọn trình phát");
    toggleButton.textContent = isExpanded ? "+" : "−";
    player.classList.toggle("is-collapsed", isExpanded);
  });

  title.textContent = "Nhạc nền 20/10";
  status.textContent = "Đang kết nối nhạc nền…";
  sendCommand("state");
})();

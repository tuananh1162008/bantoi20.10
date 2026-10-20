/**
 * Envelope + Letter — logic sau quả cầu ảnh (từ cricle)
 */
(function () {
  var envelopeOverlay = document.getElementById("envelope-overlay");
  var letterStage = document.getElementById("letter-stage");
  var letterTrigger = document.getElementById("letter-trigger");
  var letterForm = document.querySelector(".wrapperLetterForm");
  var letterCloseBtn = document.getElementById("letter-close-btn");
  var sceneThreeBtn = document.getElementById("scene-three-btn");
  var sceneThreeShell = document.getElementById("scene-three-shell");
  var sceneThreeFrame = document.getElementById("scene-three-frame");
  var titleEl = document.querySelector(".textLetter h2");
  var contentEl = document.getElementById("letter-content-text");
  var titleTimer = null;
  var contentTimer = null;
  var openTimer = null;
  var musicTracks = [
    {
      name: "1021",
      src: "./images/audio/1021.MP3",
      type: "audio/mpeg"
    },
    {
      name: "Duniverse - Đại Hải Trình",
      src: "./images/audio/Duniverse - Đại Hải Trình [Lyric] [dMdRepqxFBU].mp3",
      type: "audio/mpeg"
    },
    {
      name: "có hẹn với thanh xuân - MONSTAR",
      src: "./images/audio/có hẹn với thanh xuân - MONSTAR official music video.mp3",
      type: "audio/mpeg"
    },
    {
      name: "ĐẠI LỘ MẶT TRỜI - CHILLIES",
      src: "./images/audio/ĐẠI LỘ MẶT TRỜI - CHILLIES (Official Music Video).mp3",
      type: "audio/mp4"
    },
    {
      name: "HOÀNG DŨNG - ĐÔI MƯƠI",
      src: "./images/audio/HOÀNG DŨNG - ĐÔI MƯƠI OFFICIAL AUDIO.mp3",
      type: "audio/mpeg"
    },
    {
      name: "Hoàng Dũng - Chờ Anh Nhé",
      src: "./images/audio/Hoàng Dũng - Chờ Anh Nhé (feat. Hoàng Rob) - (320 Kbps).mp3",
      type: "audio/mpeg"
    },
    {
      name: "Nàng Thơ - Hoàng Dũng",
      src: "./images/audio/Nàng Thơ Hoàng Dũng Official MV.mp3",
      type: "audio/mpeg"
    },
    {
      name: "Ngọt Mạc Mai Sương - Đá tan",
      src: "./images/audio/Ngọt Mạc Mai Sương - Đá tan.mp3",
      type: "audio/mpeg"
    },
    {
      name: "Nguyễn Hùng - Ở Trong Khu Rừng Cảm Ơn Người Đã Thức Cùng Tôi",
      src: "./images/audio/Nguyễn Hùng - Ở Trong Khu Rừng Cảm Ơn Người Đã Thức Cùng Tôi OST Official Visualizer.mp3",
      type: "audio/mpeg"
    },
    {
      name: "SON TUNG M-TP x TYGA - COME MY WAY",
      src: "./images/audio/SON TUNG M-TP x TYGA COME MY WAY OFFICIAL MUSIC VIDEO.mp3",
      type: "audio/mpeg"
    },
    {
      name: "Từ Đầu",
      src: "./images/audio/Từ Đầu [Nr8gWRPPBwQ].mp3",
      type: "audio/mpeg"
    },
    {
      name: "スパークル original ver. -Your name.",
      src: "./images/audio/スパークル original ver. -Your name. Music Video edition- 予告編 from new album「人間開花」初回盤DVD.mp3",
      type: "audio/mp4"
    },
    {
      name: "ヒグチアイ 悪魔の子",
      src: "./images/audio/ヒグチアイ 悪魔の子 (アニメスペシャルVer.) Ai Higuchi “Akuma no Ko” Anime Special Ver.mp3",
      type: "audio/mp4"
    }
  ];
  var currentMusicTrack = 0;

  function setBackgroundPhotosActive(active) {
    window.__letterPhotosActive = active;
    if (window.setBackgroundPhotosActive) {
      window.setBackgroundPhotosActive(active);
    }
  }

  function sendMusicState() {
    if (!sceneThreeFrame || !sceneThreeFrame.contentWindow || !window.__sceneThreeActive) return;
    var audio = document.getElementById("audio");
    if (!audio) return;
    sceneThreeFrame.contentWindow.postMessage({
      channel: "scene-three-music",
      type: "state",
      paused: audio.paused,
      volume: audio.volume,
      tracks: musicTracks.map(function (track) { return { name: track.name }; }),
      currentTrack: currentMusicTrack,
      error: audio.error ? "Không tải được nhạc nền" : ""
    }, "*");
  }

  function handleSceneMusicMessage(event) {
    if (!sceneThreeFrame || event.source !== sceneThreeFrame.contentWindow || !event.data ||
        event.data.channel !== "scene-three-music" || event.data.type !== "command") return;
    var audio = document.getElementById("audio");
    if (!audio) return;
    var action = event.data.action;
    if (action === "state") {
      sendMusicState();
    } else if (action === "pause") {
      audio.pause();
    } else if (action === "play") {
      var playback = audio.play();
      if (playback && typeof playback.catch === "function") {
        playback.catch(function (error) {
          if (error.name !== "AbortError") {
            sceneThreeFrame.contentWindow.postMessage({
              channel: "scene-three-music",
              type: "state",
              paused: true,
              volume: audio.volume,
              error: "Nhấn ▶ để phát nhạc nền"
            }, "*");
          }
        });
      }
    } else if (action === "volume" && Number.isFinite(event.data.value)) {
      audio.volume = Math.max(0, Math.min(1, event.data.value));
    } else if (action === "track" && Number.isInteger(event.data.value) &&
        event.data.value >= 0 && event.data.value < musicTracks.length) {
      currentMusicTrack = event.data.value;
      var track = musicTracks[currentMusicTrack];
      var source = audio.querySelector("source");
      if (!source) {
        source = document.createElement("source");
        audio.appendChild(source);
      }
      source.src = track.src;
      source.type = track.type;
      audio.loop = true;
      audio.load();
      var trackPlayback = audio.play();
      if (trackPlayback && typeof trackPlayback.catch === "function") {
        trackPlayback.catch(function (error) {
          if (error.name !== "AbortError") {
            sceneThreeFrame.contentWindow.postMessage({
              channel: "scene-three-music",
              type: "state",
              paused: true,
              volume: audio.volume,
              tracks: musicTracks.map(function (item) { return { name: item.name }; }),
              currentTrack: currentMusicTrack,
              error: error.name === "NotAllowedError" ? "Nhấn ▶ để phát nhạc" : "Không phát được bài này"
            }, "*");
          }
        });
      }
    } else {
      return;
    }
    sendMusicState();
  }

  window.addEventListener("message", handleSceneMusicMessage);
  ["play", "pause", "volumechange", "error"].forEach(function (eventName) {
    var audio = document.getElementById("audio");
    if (audio) audio.addEventListener(eventName, sendMusicState);
  });

  var fallbackTitle = "Gửi Dương, My, Vân và Phương";
  var fallbackMessage =
    "Nhân tiết 20/10, xin gửi tới Dương, My, Vân và Phương đôi lời chúc tựa gió thoảng hương hoa ✿ Nguyện chúc các nàng dung nhan như ngọc, cốt cách thanh tao, tâm tựa hồ thu, đời tựa áng thơ ✿ Mong năm tháng dịu dàng nâng niu từng giấc mộng, nhân duyên thuận ý, phúc lộc đầy nhà, một đời an nhiên tự tại, chẳng vướng ưu phiền ✿ Chúc các nàng mãi là những đóa hoa thanh quý giữa cõi nhân gian, đi đến đâu cũng lưu hương, ghé nơi nào cũng gặp điều lành ✿ 🌹";

  window.showEnvelope = function () {
    if (envelopeOverlay) envelopeOverlay.classList.add("show");
    if (letterStage) {
      letterStage.classList.remove("opening");
      letterStage.classList.add("show");
      letterStage.setAttribute("aria-hidden", "false");
    }
  };

  window.hideEnvelope = function () {
    if (envelopeOverlay) envelopeOverlay.classList.remove("show");
    if (letterStage) {
      letterStage.classList.remove("show", "opening");
      letterStage.setAttribute("aria-hidden", "true");
    }
  };

  function openLetterForm() {
    if (!letterStage || !letterForm) return;
    letterStage.classList.add("opening");
    openTimer = setTimeout(function () {
      window.hideEnvelope();
      letterForm.classList.add("show");
      letterForm.setAttribute("aria-hidden", "false");
      setBackgroundPhotosActive(true);
      startLetterText();
    }, 520);
  }

  function getLetterTitle() {
    if (window.Heartlove && window.Heartlove.data && window.Heartlove.data.titleMessage) {
      return window.Heartlove.data.titleMessage;
    }
    if (window.dataChristmasTree && window.dataChristmasTree.data && window.dataChristmasTree.data.title) {
      return window.dataChristmasTree.data.title;
    }
    return fallbackTitle;
  }

  function getLetterMessage() {
    if (window.Heartlove && window.Heartlove.data && window.Heartlove.data.popupMessage) {
      return window.Heartlove.data.popupMessage;
    }
    return fallbackMessage;
  }

  function clearTypewriterTimers() {
    if (titleTimer) clearTimeout(titleTimer);
    if (contentTimer) clearTimeout(contentTimer);
    if (openTimer) clearTimeout(openTimer);
    titleTimer = null;
    contentTimer = null;
    openTimer = null;
  }

  function typeText(el, value, speed, done) {
    var index = 0;
    function tick() {
      if (index < value.length) {
        el.textContent += value.charAt(index);
        index++;
        var timer = setTimeout(tick, speed);
        if (el === titleEl) titleTimer = timer;
        else contentTimer = timer;
      } else if (done) {
        done();
      }
    }
    tick();
  }

  function startLetterText() {
    if (!titleEl || !contentEl) return;
    clearTypewriterTimers();
    if (sceneThreeBtn) sceneThreeBtn.hidden = true;
    titleEl.textContent = "";
    contentEl.textContent = "";
    typeText(titleEl, getLetterTitle(), 75, function () {
      contentTimer = setTimeout(function () {
        typeText(contentEl, getLetterMessage(), 28, function () {
          if (sceneThreeBtn) sceneThreeBtn.hidden = false;
        });
      }, 250);
    });
  }

  function continueToSceneThree() {
    clearTypewriterTimers();
    setBackgroundPhotosActive(false);
    if (!sceneThreeShell || !sceneThreeFrame) {
      throw new Error("Không thể mở bối cảnh 3: thiếu khung giao diện.");
    }
    if (letterForm) {
      letterForm.classList.remove("show");
      letterForm.setAttribute("aria-hidden", "true");
    }
    if (window.hideEnvelope) window.hideEnvelope();
    if (!sceneThreeFrame.src) {
      sceneThreeFrame.src = sceneThreeFrame.dataset.src;
    }
    window.__sceneThreeActive = true;
    sceneThreeShell.classList.add("show");
    sceneThreeShell.setAttribute("aria-hidden", "false");
    sendMusicState();
  }

  function closeLetter() {
    clearTypewriterTimers();
    setBackgroundPhotosActive(false);
    if (letterForm) {
      letterForm.classList.remove("show");
      letterForm.setAttribute("aria-hidden", "true");
    }
    if (window.resetToSphere) window.resetToSphere();
  }

  if (letterTrigger) {
    letterTrigger.addEventListener("click", function (e) {
      e.stopPropagation();
      openLetterForm();
    });
    letterTrigger.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLetterForm();
      }
    });
  }

  if (letterCloseBtn) {
    letterCloseBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      closeLetter();
    });
  }

  if (sceneThreeBtn) {
    sceneThreeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      continueToSceneThree();
    });
  }

  if (letterForm) {
    letterForm.addEventListener("click", function (e) {
      if (e.target === letterForm) closeLetter();
    });
  }
})();

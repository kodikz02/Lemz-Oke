
const songs = [
  ["Dancing in the Moonlight", "Demo Artist"],
  ["Midnight Memories", "Demo Artist"],
  ["Neon Heartbeat", "Demo Artist"],
  ["Forever Tonight", "Demo Artist"],
  ["Starlight Serenade", "Demo Artist"],
  ["Sing It Together", "Demo Artist"]
];

// Sample timestamped lyrics for interface testing.
// Times are in seconds. These are original demo lines,
// not the actual lyrics of commercial songs.
const demoLyrics = [
  [
    [0, "Dancing underneath the moonlight"],
    [4, "Feel the rhythm, feel the night"],
    [8, "Every moment shining bright"],
    [12, "Keep on dancing till daylight"]
  ],
  [
    [0, "Memories beneath the stars"],
    [4, "Dreaming of how close we are"],
    [8, "Hear the music in the night"],
    [12, "Everything will be alright"]
  ],
  [
    [0, "Neon colors fill the sky"],
    [4, "Feel the heartbeat rising high"],
    [8, "Let the music lead the way"],
    [12, "We can dance the night away"]
  ],
  [
    [0, "Stay with me until the dawn"],
    [4, "Sing together, carry on"],
    [8, "Every dream is shining bright"],
    [12, "Hold this feeling through the night"]
  ],
  [
    [0, "Starlight shining from above"],
    [4, "Sing a song of hope and love"],
    [8, "Let the melody take flight"],
    [12, "We will shine into the night"]
  ],
  [
    [0, "Everybody sing along"],
    [4, "Come together through this song"],
    [8, "Raise your voices, let them ring"],
    [12, "Tonight we all can sing"]
  ]
];

let queue = [];
let current = -1;
let playing = false;

let lyricElapsed = 0;
let lyricStartedAt = 0;
let lyricTimer = null;

const $ = id => document.getElementById(id);

// ----------------------------------------
// SONG SEARCH AND RESERVATION
// ----------------------------------------

function renderChoices() {
  const q = $("search").value.toLowerCase();

  $("choices").innerHTML = songs
    .map((song, index) => ({ song, index }))
    .filter(item =>
      item.song.join(" ").toLowerCase().includes(q)
    )
    .map(item => `
      <div class="song">
        <div>
          <b>${item.song[0]}</b>
          <span>${item.song[1]}</span>
        </div>
        <button data-add="${item.index}" type="button">
          ＋ ADD
        </button>
      </div>
    `)
    .join("") || '<p class="empty">No demo songs found.</p>';

  document.querySelectorAll("[data-add]").forEach(button => {
    button.onclick = () => {
      queue.push(songs[Number(button.dataset.add)]);

      if (current < 0) {
        current = 0;
        lyricElapsed = 0;
      }

      renderQueue();
      showCurrent();
    };
  });
}

// ----------------------------------------
// SONG QUEUE
// ----------------------------------------

function renderQueue() {
  $("count").textContent = queue.length;

  $("queue").innerHTML = queue.length
    ? queue.map((song, index) => `
        <li>
          <span style="color:var(--cyan)">
            ${(index + 1).toString().padStart(2, "0")}
           　${song[0]}
            <small style="display:block;margin-top:5px">
              ${song[1]}
            </small>
          </span>
          <button
            class="remove"
            data-remove="${index}"
            type="button"
            aria-label="Remove ${song[0]}"
          >×</button>
        </li>
      `).join("")
    : '<li class="empty">Your queue is waiting for its first star ✨</li>';

  document.querySelectorAll("[data-remove]").forEach(button => {
    button.onclick = () => {
      const removedIndex = Number(button.dataset.remove);

      queue.splice(removedIndex, 1);

      if (queue.length === 0) {
        current = -1;
        playing = false;
        lyricElapsed = 0;
      } else if (removedIndex < current) {
        current--;
      } else if (removedIndex === current) {
        current = Math.min(current, queue.length - 1);
        lyricElapsed = 0;
      }

      renderQueue();
      showCurrent();
    };
  });

  $("ticker").textContent = queue.length
    ? "　" + queue
        .map(song => `${song[0]} — ${song[1]}　✦　`)
        .join("")
        .repeat(3)
    : "No songs reserved yet — add a song to start the party! ✦";
}

// ----------------------------------------
// TIMESTAMPED LYRICS
// ----------------------------------------

function stopLyrics() {
  if (lyricTimer !== null) {
    clearInterval(lyricTimer);
    lyricTimer = null;
  }
}

function getTimedLyrics() {
  if (current < 0 || !queue[current]) {
    return [];
  }

  const selectedSong = queue[current];

  // Find the sample lyrics matching the selected song.
  const songIndex = songs.findIndex(song =>
    song[0] === selectedSong[0] &&
    song[1] === selectedSong[1]
  );

  return demoLyrics[songIndex] || demoLyrics[0];
}

function renderLyrics() {
  const currentLyric = $("currentLyric");
  const nextLyric = $("nextLyric");

  // Allow the app to load even if the lyrics HTML
  // has not yet been added.
  if (!currentLyric || !nextLyric) return;

  if (current < 0 || !queue[current]) {
    currentLyric.textContent = "Your lyrics will appear here";
    nextLyric.textContent = "Choose a demo song to begin";
    return;
  }

  const lines = getTimedLyrics();

  let activeIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i][0] <= lyricElapsed) {
      activeIndex = i;
    } else {
      break;
    }
  }

  if (activeIndex < 0) {
    currentLyric.textContent = "♪ Get ready to sing ♪";
    nextLyric.textContent = lines[0]?.[1] || "";
    return;
  }

  currentLyric.textContent = lines[activeIndex][1];

  nextLyric.textContent =
    lines[activeIndex + 1]?.[1] || "♪ Demo lyrics complete ♪";
}

function startLyrics() {
  stopLyrics();

  if (!playing) {
    renderLyrics();
    return;
  }

  // Continue from the saved position after resuming.
  lyricStartedAt = Date.now() - lyricElapsed * 1000;

  const updateLyrics = () => {
    lyricElapsed = (Date.now() - lyricStartedAt) / 1000;

    renderLyrics();
  };

  updateLyrics();

  // Refresh the display frequently so timestamp changes
  // are shown close to their intended time.
  lyricTimer = setInterval(updateLyrics, 100);
}

// ----------------------------------------
// CURRENT SONG AND PLAYBACK CONTROLS
// ----------------------------------------

function showCurrent() {
  if (current < 0 || !queue[current]) {
    $("title").innerHTML = 'Welcome to <em>Lemz-Oke</em>';
    $("artist").textContent =
      "Choose a demo song or reserve one from the list.";

    $("state").textContent = "READY";
    $("play").textContent = "▶ PLAY DEMO";

    stopLyrics();
    renderLyrics();
    return;
  }

  const song = queue[current];

  $("title").textContent = song[0];
  $("artist").textContent = song[1] + " · demo queue item";

  $("state").textContent = playing
    ? "DEMO PLAYING"
    : "PAUSED";

  $("play").textContent = playing
    ? "Ⅱ PAUSE DEMO"
    : "▶ PLAY DEMO";

  startLyrics();
}

// Search songs.
$("search").oninput = renderChoices;

// Play or pause.
$("play").onclick = () => {
  if (!queue.length) {
    queue.push(songs[0]);
    current = 0;
    lyricElapsed = 0;
  } else if (current < 0) {
    current = 0;
    lyricElapsed = 0;
  }

  playing = !playing;

  renderQueue();
  showCurrent();
};

// Next song.
$("next").onclick = () => {
  if (!queue.length) return;

  current = current < 0
    ? 0
    : (current + 1) % queue.length;

  lyricElapsed = 0;
  playing = true;

  showCurrent();
};

// Previous song.
$("prev").onclick = () => {
  if (!queue.length) return;

  current = current < 0
    ? 0
    : Math.max(0, current - 1);

  lyricElapsed = 0;

  showCurrent();
};

// Clear the queue.
$("clear").onclick = () => {
  queue = [];
  current = -1;
  playing = false;
  lyricElapsed = 0;

  stopLyrics();
  renderQueue();
  showCurrent();
};

// ----------------------------------------
// INITIALIZE
// ----------------------------------------

renderChoices();
renderQueue();
showCurrent();

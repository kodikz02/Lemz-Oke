const fs = require("fs");
const html = fs.readFileSync("index.html", "utf8");
const js = fs.readFileSync("js/app.js", "utf8");

console.log("=== LEMZ-OKE DIAGNOSTIC ===");
console.log("Lyrics HTML IDs:", {
  currentLyric: html.includes('id="currentLyric"'),
  nextLyric: html.includes('id="nextLyric"')
});
console.log("JS handlers/functions:", {
  renderLyrics: js.includes("function renderLyrics()"),
  startLyrics: js.includes("function startLyrics()"),
  playHandler: js.includes('$("play").onclick'),
  lyricsTimer: js.includes("setInterval(updateLyrics, 100)")
});
console.log("Script reference:", html.includes('src="js/app.js"'));
console.log("JS starts with:", JSON.stringify(js.slice(0, 50)));

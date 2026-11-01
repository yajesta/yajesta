(function () {
  var headline = document.getElementById("spotify-headline");
  var detail = document.getElementById("spotify-detail");
  var widget = document.getElementById("spotify-widget");
  if (!headline || !widget) return;

  fetch("https://oscarkalid.com/api/now-playing")
    .then(function (response) { return response.ok ? response.json() : null; })
    .then(function (data) {
      if (!data || !data.title) return;
      headline.textContent = data.title;
      if (detail) {
        var bits = [];
        if (data.isPlaying) bits.push("Playing");
        else bits.push("Last played");
        if (data.artist) bits.push(data.artist);
        detail.textContent = bits.join(" · ");
      }
      var art = document.getElementById("spotify-art");
      if (art && data.albumArt) {
        art.src = data.albumArt;
        art.alt = "Cover for " + data.title;
        art.hidden = false;
      }
      var link = document.getElementById("spotify-link");
      if (link && data.songUrl) link.href = data.songUrl;
      else if (link) link.hidden = true;
      var eq = document.getElementById("spotify-eq");
      if (eq) eq.hidden = !data.isPlaying;
      widget.hidden = false;
    })
    .catch(function () {});
})();

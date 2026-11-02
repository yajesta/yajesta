(function () {
  var phases = [
    [0, [13, 19, 36], [28, 38, 65], [89, 89, 103]],
    [5, [48, 58, 92], [113, 109, 148], [176, 142, 142]],
    [8, [42, 86, 139], [101, 132, 179], [150, 163, 183]],
    [13, [37, 79, 127], [88, 121, 177], [136, 155, 180]],
    [18, [32, 78, 118], [82, 106, 160], [139, 107, 109]],
    [20.5, [13, 19, 36], [28, 38, 65], [89, 89, 103]],
    [24, [13, 19, 36], [28, 38, 65], [89, 89, 103]]
  ];
  var lift = [0.57, 0.61, 0.69];
  var place = { latitude: 52.24, longitude: 0, timezone: "UTC", known: true };
  var timer = 0;
  var snapToken = 0;

  try {
    place.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch (error) {
    place.timezone = "UTC";
  }

  try {
    place.longitude = clamp(-new Date().getTimezoneOffset() / 4, -180, 180);
  } catch (error) {
    place.longitude = 0;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function wrapHour(hour) {
    return ((hour % 24) + 24) % 24;
  }

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function localClock(now) {
    var parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: place.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23"
    }).formatToParts(now);
    var map = {};
    for (var i = 0; i < parts.length; i++) map[parts[i].type] = parts[i].value;
    var hour = +map.hour;
    if (hour === 24) hour = 0;
    return {
      year: +map.year,
      month: +map.month,
      date: +map.day,
      hour: hour,
      minute: +map.minute,
      second: +map.second
    };
  }

  function daylight(hour, clock) {
    if (!place.known) {
      return { day: hour >= 6 && hour < 20, sunrise: 6, sunset: 20, length: 14 };
    }
    var local = Date.UTC(clock.year, clock.month - 1, clock.date, clock.hour, clock.minute, clock.second);
    var offset = (local - Math.floor(Date.now() / 1000) * 1000) / 60000;
    var ordinal = (Date.UTC(clock.year, clock.month - 1, clock.date) - Date.UTC(clock.year, 0, 1)) / 86400000 + 1;
    var angle = (2 * Math.PI / 365) * (ordinal - 1 + (hour - 12) / 24);
    var equation = 229.18 * (
      0.000075 +
      0.001868 * Math.cos(angle) -
      0.032077 * Math.sin(angle) -
      0.014615 * Math.cos(2 * angle) -
      0.040849 * Math.sin(2 * angle)
    );
    var declination = 0.006918 -
      0.399912 * Math.cos(angle) +
      0.070257 * Math.sin(angle) -
      0.006758 * Math.cos(2 * angle) +
      0.000907 * Math.sin(2 * angle) -
      0.002697 * Math.cos(3 * angle) +
      0.00148 * Math.sin(3 * angle);
    var latitude = place.latitude * Math.PI / 180;
    var denominator = Math.cos(latitude) * Math.cos(declination);
    var ratio = denominator === 0
      ? 0
      : (Math.sin(-0.833 * Math.PI / 180) - Math.sin(latitude) * Math.sin(declination)) / denominator;
    var half = Math.acos(clamp(ratio, -1, 1)) * 12 / Math.PI;
    var noon = 12 - (equation + 4 * place.longitude - offset) / 60;
    var length = clamp(2 * half, 0.02, 23.98);
    var sunrise = wrapHour(noon - half);
    return {
      day: wrapHour(hour - sunrise) < length,
      sunrise: sunrise,
      sunset: wrapHour(noon + half),
      length: length
    };
  }

  function mix(from, to, amount) {
    return [
      Math.round(from[0] + (to[0] - from[0]) * amount),
      Math.round(from[1] + (to[1] - from[1]) * amount),
      Math.round(from[2] + (to[2] - from[2]) * amount)
    ];
  }

  function linear(channel) {
    channel = channel / 255;
    return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  }

  function contrastRatio(fg, bg) {
    var left = 0.2126 * linear(fg[0]) + 0.7152 * linear(fg[1]) + 0.0722 * linear(fg[2]);
    var right = 0.2126 * linear(bg[0]) + 0.7152 * linear(bg[1]) + 0.0722 * linear(bg[2]);
    return (Math.max(left, right) + 0.05) / (Math.min(left, right) + 0.05);
  }

  function readableNight(color) {
    var ink = [244, 246, 251];
    var next = color;
    var guard = 0;
    while (contrastRatio(ink, next) < 5.1 && guard < 12) {
      next = [
        Math.round(next[0] * 0.94),
        Math.round(next[1] * 0.94),
        Math.round(next[2] * 0.94)
      ];
      guard += 1;
    }
    return next;
  }

  function skyColors(decimal, day) {
    var index = 0;
    for (var i = 0; i < phases.length - 1; i++) {
      if (decimal >= phases[i][0] && decimal < phases[i + 1][0]) {
        index = i;
        break;
      }
    }
    var from = phases[index];
    var to = phases[index + 1];
    var progress = clamp((decimal - from[0]) / (to[0] - from[0] || 1), 0, 1);
    var smooth = progress * progress * (3 - 2 * progress);
    var stops = [];
    for (var stop = 1; stop <= 3; stop++) {
      var color = mix(from[stop], to[stop], smooth);
      if (day) {
        for (var channel = 0; channel < 3; channel++) {
          color[channel] = Math.round(color[channel] + (255 - color[channel]) * lift[stop - 1]);
        }
      } else {
        color = readableNight(color);
      }
      stops.push(color);
    }
    var top = "rgb(" + stops[0].join(",") + ")";
    var mid = "rgb(" + stops[1].join(",") + ")";
    var bottom = "rgb(" + stops[2].join(",") + ")";
    var css = day
      ? "radial-gradient(ellipse 34% 22% at 20% 78%,rgba(178,132,148,.2),transparent 100%),radial-gradient(ellipse 24% 27% at 55% 85%,rgba(157,124,128,.18),transparent 100%),radial-gradient(ellipse 25% 24% at 77% 79%,rgba(114,138,190,.2),transparent 100%),linear-gradient(180deg," + top + " 7%," + mid + " 54%," + bottom + " 100%)"
      : "radial-gradient(ellipse 55% 45% at 50% 40%,rgba(7,13,28,.16),transparent 100%),linear-gradient(180deg," + top + " 0%," + top + " 15%," + mid + " 58%," + bottom + " 100%)";
    return { css: css, top: top, mid: mid, bottom: bottom };
  }

  function orbPosition(decimal, sky) {
    var span = sky.day ? sky.length : Math.max(0.5, 24 - sky.length);
    var start = sky.day ? sky.sunrise : sky.sunset;
    var progress = clamp(wrapHour(decimal - start) / span, 0, 1);
    return {
      x: (14 + progress * 72).toFixed(2) + "%",
      y: (68 - Math.sin(progress * Math.PI) * 46).toFixed(2) + "%"
    };
  }

  function paint() {
    var clock;
    try {
      clock = localClock(new Date());
    } catch (error) {
      var now = new Date();
      clock = {
        year: now.getUTCFullYear(),
        month: now.getUTCMonth() + 1,
        date: now.getUTCDate(),
        hour: now.getUTCHours(),
        minute: now.getUTCMinutes(),
        second: now.getUTCSeconds()
      };
    }
    var decimal = clock.hour + clock.minute / 60;
    if (!finite(decimal)) decimal = 12;
    var sky = daylight(decimal, clock);
    var colors = skyColors(decimal, sky.day);
    var orb = orbPosition(decimal, sky);
    var root = document.documentElement;
    var nextMode = sky.day ? "day" : "night";
    var snap = root.dataset.sky !== nextMode;
    if (snap) {
      snapToken += 1;
      root.classList.add("is-sky-instant");
      void root.offsetWidth;
    }
    root.style.setProperty("--stop-0", colors.top);
    root.style.setProperty("--stop-1", colors.mid);
    root.style.setProperty("--stop-2", colors.bottom);
    root.style.setProperty("--sky-top", colors.top);
    root.style.setProperty("--orb-x", orb.x);
    root.style.setProperty("--orb-y", orb.y);
    root.dataset.sky = nextMode;
    if (snap) {
      var token = snapToken;
      void root.offsetWidth;
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          if (token === snapToken) root.classList.remove("is-sky-instant");
        });
      });
    }
    var theme = document.querySelector('meta[name="theme-color"]');
    if (theme) theme.setAttribute("content", colors.top);
  }

  function applyWeather(code, cover) {
    code = +code;
    cover = finite(+cover) ? clamp(+cover, 0, 100) : 60;
    var kind = "cloud";
    var front = Math.min(0.66, 0.4 + cover / 450);
    var back = Math.min(0.4, front * 0.62);
    var orbOpacity = 0.85;
    if (code === 0) {
      kind = "clear";
      front = 0.26;
      back = 0.14;
      orbOpacity = 1;
    } else if (code === 1) {
      kind = cover > 75 ? "cloud" : "clear";
      front = 0.32;
      back = 0.18;
      orbOpacity = 0.95;
    } else if (code === 2) {
      kind = "cloud";
      front = 0.5;
      back = 0.3;
      orbOpacity = 0.7;
    } else if (code === 3) {
      kind = "cloud";
      front = 0.64;
      back = 0.4;
      orbOpacity = 0.38;
    } else if (code === 45 || code === 48) {
      kind = "fog";
      front = 0.42;
      back = 0.28;
      orbOpacity = 0.22;
    } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
      kind = "rain";
      front = 0.68;
      back = 0.42;
      orbOpacity = 0.18;
    } else if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
      kind = "snow";
      front = 0.58;
      back = 0.34;
      orbOpacity = 0.34;
    } else if (code >= 95 && code < 100) {
      kind = "storm";
      front = 0.72;
      back = 0.48;
      orbOpacity = 0.1;
    } else {
      return;
    }
    var root = document.documentElement;
    root.dataset.weather = kind;
    root.style.setProperty("--cloud-opacity", String(front));
    root.style.setProperty("--cloud-back", String(back));
    root.style.setProperty("--orb-opacity", String(orbOpacity));
  }

  function locate() {
    fetch("https://get.geojs.io/v1/ip/geo.json", { credentials: "omit", cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("geo");
        return response.json();
      })
      .then(function (data) {
        var latitude = +data.latitude;
        var longitude = +data.longitude;
        if (!finite(latitude) || !finite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
          throw new Error("geo");
        }
        var timezone = place.timezone;
        if (typeof data.timezone === "string") {
          try {
            Intl.DateTimeFormat("en-GB", { timeZone: data.timezone }).format();
            timezone = data.timezone;
          } catch (error) {
            timezone = place.timezone;
          }
        }
        place.latitude = latitude;
        place.longitude = longitude;
        place.timezone = timezone;
        place.known = true;
        paint();
        var roundedLatitude = Math.round(latitude * 100) / 100;
        var roundedLongitude = Math.round(longitude * 100) / 100;
        return fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=" + roundedLatitude +
          "&longitude=" + roundedLongitude +
          "&current=weather_code,cloud_cover&timezone=auto",
          { credentials: "omit", cache: "no-store" }
        );
      })
      .then(function (response) {
        if (!response || !response.ok) throw new Error("weather");
        return response.json();
      })
      .then(function (data) {
        if (!data || !data.current) return;
        applyWeather(data.current.weather_code, data.current.cloud_cover);
      })
      .catch(function () {});
  }

  function startClock() {
    if (timer) return;
    timer = window.setInterval(paint, 60000);
  }

  function stopClock() {
    if (!timer) return;
    window.clearInterval(timer);
    timer = 0;
  }

  document.addEventListener("visibilitychange", function () {
    var hidden = document.hidden;
    document.documentElement.classList.toggle("is-paused", hidden);
    if (hidden) stopClock();
    else {
      paint();
      startClock();
    }
  });

  paint();

  function arm() {
    window.requestAnimationFrame(function () {
      document.documentElement.classList.add("is-sky-live");
      locate();
      startClock();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arm);
  else arm();
})();

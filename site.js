(function () {
  document.documentElement.classList.add("js");

  function addressText() {
    var parts = ["me", "oscarkalid.com"];
    return parts[0] + String.fromCharCode(64) + parts[1];
  }

  function reducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function markIn(nodes, stagger) {
    var delay = 0;
    for (var i = 0; i < nodes.length; i++) {
      (function (node, wait) {
        var delayClass = "";
        if (stagger && wait && !reducedMotion()) {
          delayClass = "d" + Math.min(8, Math.round(wait / 80));
          node.classList.add(delayClass);
        }
        node.classList.add("is-in");
        function clearDelay(event) {
          if (event && event.propertyName !== "opacity" && event.propertyName !== "transform") return;
          if (delayClass) node.classList.remove(delayClass);
          node.removeEventListener("transitionend", clearDelay);
        }
        node.addEventListener("transitionend", clearDelay);
        window.setTimeout(function () {
          if (delayClass) node.classList.remove(delayClass);
        }, wait + 900);
      })(nodes[i], delay);
      delay += stagger ? 80 : 0;
    }
  }

  function bindEmail(root) {
    var href = "mailto:" + addressText();
    var links = (root || document).querySelectorAll("[data-contact]");
    for (var i = 0; i < links.length; i++) links[i].setAttribute("href", href);
  }

  function bindRise(root) {
    var rise = (root || document).querySelectorAll("[data-rise]");
    if (!rise.length) return;
    if (reducedMotion() || !("IntersectionObserver" in window)) {
      markIn(rise, false);
      return;
    }
    var pending = [];
    var flushTimer = 0;
    var observer = new IntersectionObserver(function (entries) {
      for (var n = 0; n < entries.length; n++) {
        if (!entries[n].isIntersecting) continue;
        pending.push(entries[n].target);
        observer.unobserve(entries[n].target);
      }
      window.clearTimeout(flushTimer);
      flushTimer = window.setTimeout(function () {
        var batch = pending;
        pending = [];
        var ordered = [];
        for (var r = 0; r < rise.length; r++) {
          if (batch.indexOf(rise[r]) !== -1) ordered.push(rise[r]);
        }
        markIn(ordered, true);
      }, 32);
    }, { threshold: 0.14, rootMargin: "0px 0px -6% 0px" });
    for (var j = 0; j < rise.length; j++) observer.observe(rise[j]);
    window.setTimeout(function () {
      var missed = [];
      for (var k = 0; k < rise.length; k++) {
        if (rise[k].classList.contains("is-in")) continue;
        var rect = rise[k].getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight * 0.94) missed.push(rise[k]);
      }
      if (missed.length) markIn(missed, false);
    }, 1600);
  }

  function pagePath(pathname) {
    var path = (pathname || "/").replace(/\/+$/, "");
    if (path === "" || path === "/index.html") return "/";
    if (path === "/games.html" || path === "/roblox" || path === "/roblox.html") return "/games";
    if (path === "/tools.html") return "/tools";
    if (path === "/posts.html") return "/posts";
    if (path === "/about.html") return "/about";
    return path || "/";
  }

  function isTabPath(path) {
    return path === "/" || path === "/games" || path === "/tools" || path === "/posts" || path === "/about";
  }

  function setActiveTab(path) {
    var nav = document.querySelector(".tabs");
    if (!nav) return;
    var links = nav.querySelectorAll("a[href]");
    var reduce = reducedMotion();
    for (var i = 0; i < links.length; i++) {
      (function (link) {
        var on = pagePath(link.getAttribute("href")) === path;
        var was = link.hasAttribute("aria-current");
        var bar = link.querySelector(".tab-underline");
        if (on && !was) {
          if (bar && !reduce) {
            bar.classList.remove("is-exiting", "is-on");
            bar.classList.add("is-entering");
          }
          link.setAttribute("aria-current", "page");
          if (bar && !reduce) {
            bar.offsetWidth;
            window.requestAnimationFrame(function () {
              bar.classList.remove("is-entering");
              bar.classList.add("is-on");
            });
          }
        } else if (!on && was) {
          if (bar && !reduce) {
            bar.classList.remove("is-on", "is-entering");
            bar.classList.add("is-exiting");
            link.removeAttribute("aria-current");
            window.setTimeout(function () {
              bar.classList.remove("is-exiting");
            }, 240);
          } else {
            link.removeAttribute("aria-current");
          }
        }
      })(links[i]);
    }
  }

  function enterPanel(panel) {
    var units = panel.querySelectorAll(".item, .about-unit");
    if (!units.length) units = panel.querySelectorAll(":scope > *");
    var reduce = reducedMotion();
    var rise = panel.querySelectorAll("[data-rise]");
    for (var r = 0; r < rise.length; r++) rise[r].classList.add("is-in");
    if (reduce) {
      panel.classList.remove("is-entering", "is-leaving");
      panel.classList.add("is-shown");
      return;
    }
    panel.classList.remove("is-leaving");
    panel.classList.add("is-entering");
    for (var i = 0; i < units.length; i++) {
      units[i].classList.remove("is-enter-to");
      units[i].classList.add("is-enter-from");
      units[i].style.transitionDelay = "";
    }
    panel.offsetWidth;
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        panel.classList.remove("is-entering");
        panel.classList.add("is-shown");
        for (var i = 0; i < units.length; i++) {
          units[i].style.transitionDelay = i * 0.06 + "s";
          units[i].classList.remove("is-enter-from");
          units[i].classList.add("is-enter-to");
        }
      });
    });
  }


  var STATS_URL = "https://oscarkalid-roblox-stats.doskioscar.workers.dev/";
  var STATS_POLL = 45000;
  var statsTimer = 0;

  function formatCount(value) {
    var n = Math.max(0, Math.floor(Number(value) || 0));
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function parseCount(text) {
    return parseInt(String(text).replace(/,/g, ""), 10) || 0;
  }

  function mountOdometer(el, value, animate) {
    var formatted = formatCount(value);
    el.setAttribute("data-value", String(value));
    el.setAttribute("aria-label", formatted);
    if (reducedMotion()) {
      el.classList.remove("odometer");
      el.textContent = formatted;
      return;
    }
    el.classList.add("odometer");
    el.textContent = "";
    for (var i = 0; i < formatted.length; i++) {
      var ch = formatted.charAt(i);
      if (ch === ",") {
        var comma = document.createElement("span");
        comma.className = "odometer-comma";
        comma.textContent = ",";
        comma.setAttribute("aria-hidden", "true");
        el.appendChild(comma);
        continue;
      }
      var digit = document.createElement("span");
      digit.className = "odometer-digit";
      digit.setAttribute("aria-hidden", "true");
      var reel = document.createElement("span");
      reel.className = "odometer-reel";
      for (var d = 0; d <= 9; d++) {
        var n = document.createElement("span");
        n.textContent = String(d);
        reel.appendChild(n);
      }
      var from = animate ? 0 : parseInt(ch, 10);
      reel.style.transition = animate ? "" : "none";
      reel.style.transform = "translateY(-" + from + "em)";
      digit.appendChild(reel);
      el.appendChild(digit);
      if (animate) {
        (function (reelEl, to) {
          reelEl.offsetWidth;
          window.requestAnimationFrame(function () {
            reelEl.style.transition = "";
            reelEl.style.transform = "translateY(-" + to + "em)";
          });
        })(reel, parseInt(ch, 10));
      }
    }
  }

  function updateOdometer(el, value) {
    var current = parseCount(el.getAttribute("data-value") || el.textContent);
    if (reducedMotion()) {
      el.classList.remove("odometer");
      el.textContent = formatCount(value);
      el.setAttribute("data-value", String(value));
      el.setAttribute("aria-label", formatCount(value));
      return;
    }
    if (!el.classList.contains("odometer")) mountOdometer(el, current, false);
    if (current === value) return;
    var oldFmt = formatCount(current);
    var newFmt = formatCount(value);
    if (oldFmt.length !== newFmt.length) {
      mountOdometer(el, value, true);
      return;
    }
    el.setAttribute("data-value", String(value));
    el.setAttribute("aria-label", newFmt);
    var reels = el.querySelectorAll(".odometer-reel");
    var ri = 0;
    for (var i = 0; i < newFmt.length; i++) {
      var ch = newFmt.charAt(i);
      if (ch === ",") continue;
      if (reels[ri]) reels[ri].style.transform = "translateY(-" + ch + "em)";
      ri += 1;
    }
  }

  function applyGameStats(stats) {
    var nodes = document.querySelectorAll("[data-game]");
    for (var i = 0; i < nodes.length; i++) {
      var game = nodes[i].getAttribute("data-game");
      var row = stats && stats[game];
      if (!row) continue;
      var visits = nodes[i].querySelector('[data-stat="visits"]');
      var favs = nodes[i].querySelector('[data-stat="favourites"]');
      if (visits && typeof row.visits === "number") updateOdometer(visits, row.visits);
      if (favs && typeof row.favourites === "number") updateOdometer(favs, row.favourites);
    }
  }

  function tickStats() {
    if (document.visibilityState !== "visible") return;
    if (!document.querySelector("[data-game]")) return;
    fetch(STATS_URL, { headers: { Accept: "application/json" } })
      .then(function (res) {
        if (!res.ok) throw new Error("stats failed");
        return res.json();
      })
      .then(applyGameStats)
      .catch(function () {});
  }

  function stopStats() {
    if (statsTimer) {
      window.clearInterval(statsTimer);
      statsTimer = 0;
    }
  }

  function startStats() {
    stopStats();
    if (!document.querySelector("[data-game]")) return;
    tickStats();
    statsTimer = window.setInterval(tickStats, STATS_POLL);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") startStats();
    else stopStats();
  });

  function enhanceTabs() {
    if (!window.fetch || !window.DOMParser || !window.history || !history.pushState) return;
    var cache = {};
    var busy = false;
    var pending = null;
    var shown = pagePath(window.location.pathname);

    function load(url) {
      if (cache[url]) {
        return Promise.resolve(cache[url]);
      }
      return fetch(url, { headers: { Accept: "text/html" } }).then(function (res) {
        if (!res.ok) throw new Error("fetch failed");
        return res.text();
      }).then(function (html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        var next = doc.getElementById("panel");
        if (!next) throw new Error("no panel");
        cache[url] = { panel: next, title: doc.title };
        return cache[url];
      });
    }

    function swap(url, push) {
      var dest = new URL(url, window.location.href);
      if (dest.origin !== window.location.origin) return false;
      var path = pagePath(dest.pathname);
      if (!isTabPath(path)) return false;
      var clean = path === "/" ? "/" : path;
      if (path === shown) {
        if (push && dest.href !== window.location.href) history.pushState({ path: path }, "", clean);
        pending = null;
        return true;
      }
      if (busy) {
        pending = { url: dest.href, push: push };
        return true;
      }
      busy = true;
      var panel = document.getElementById("panel");
      if (!panel) {
        busy = false;
        return false;
      }

      setActiveTab(path);
      if (push) history.pushState({ path: path }, "", clean);
      var leaving = reducedMotion() ? Promise.resolve() : new Promise(function (resolve) {
        panel.classList.remove("is-shown", "is-entering");
        panel.classList.add("is-leaving");
        window.setTimeout(resolve, 240);
      });
      Promise.all([load(clean), leaving]).then(function (results) {
        if (pending) {
          var next = pending;
          pending = null;
          busy = false;
          swap(next.url, next.push);
          return;
        }
        var page = results[0];
        var incoming = page.panel.cloneNode(true);
        if (!reducedMotion()) incoming.classList.add("is-entering");
        panel.replaceWith(incoming);
        panel = incoming;
        document.title = page.title || "Oscar Kalid";
        bindEmail(panel);
        window.scrollTo(0, 0);
        enterPanel(panel);
        startStats();
        shown = path;
        busy = false;
        if (pending) {
          var queued = pending;
          pending = null;
          swap(queued.url, queued.push);
        }
      }).catch(function () {
        busy = false;
        pending = null;
        window.location.href = clean;
      });
      return true;
    }

    document.addEventListener("click", function (event) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      var link = event.target && event.target.closest ? event.target.closest("a[href]") : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      var href = link.getAttribute("href");
      if (!href || href.charAt(0) === "#" || href.indexOf("mailto:") === 0) return;
      if (swap(link.href, true)) event.preventDefault();
    });

    window.addEventListener("popstate", function () {
      swap(window.location.href, false);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    bindEmail(document);
    bindRise(document);
    enhanceTabs();
    startStats();
  });
})();

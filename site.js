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
    if (path === "/roblox.html") return "/roblox";
    if (path === "/about.html") return "/about";
    return path || "/";
  }

  function isTabPath(path) {
    return path === "/" || path === "/roblox" || path === "/about";
  }

  function setActiveTab(path) {
    var nav = document.querySelector(".tabs");
    if (!nav) return;
    var links = nav.querySelectorAll("a[href]");
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute("href");
      if (pagePath(href) === path) links[i].setAttribute("aria-current", "page");
      else links[i].removeAttribute("aria-current");
    }
  }

  function enhanceTabs() {
    if (!window.fetch || !window.DOMParser || !window.history || !history.pushState) return;
    var cache = {};
    var busy = false;

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
      var current = pagePath(window.location.pathname);
      var clean = path === "/" ? "/" : path;
      if (path === current) {
        if (push && dest.href !== window.location.href) history.pushState({ path: path }, "", clean);
        return true;
      }
      if (busy) return true;
      busy = true;
      var panel = document.getElementById("panel");
      if (!panel) {
        busy = false;
        return false;
      }

      var leaving = reducedMotion() ? Promise.resolve() : new Promise(function (resolve) {
        panel.classList.add("is-leaving");
        window.setTimeout(resolve, 240);
      });
      Promise.all([load(clean), leaving]).then(function (results) {
        var page = results[0];
        var incoming = page.panel.cloneNode(true);
        incoming.classList.add("is-entering");
        panel.replaceWith(incoming);
        panel = incoming;
        document.title = page.title || "Oscar Kalid";
        setActiveTab(path);
        bindEmail(panel);
        bindRise(panel);
        if (push) history.pushState({ path: path }, "", clean);
        window.scrollTo(0, 0);
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () {
            panel.classList.remove("is-entering");
          });
        });
        busy = false;
      }).catch(function () {
        busy = false;
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
  });
})();

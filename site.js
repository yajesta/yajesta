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

  function bindSectionTabs() {
    var nav = document.querySelector(".tabs");
    if (!nav) return;
    var links = nav.querySelectorAll('a[href^="#"]');
    if (!links.length) return;
    var sections = [];
    for (var i = 0; i < links.length; i++) {
      var id = links[i].getAttribute("href").slice(1);
      var section = document.getElementById(id);
      if (section) sections.push({ link: links[i], section: section });
    }
    if (!sections.length) return;

    function setCurrent(link) {
      for (var i = 0; i < links.length; i++) {
        if (links[i] === link) links[i].setAttribute("aria-current", "page");
        else links[i].removeAttribute("aria-current");
      }
    }

    function update() {
      var chosen = sections[0].link;
      var mark = Math.max(120, window.innerHeight * 0.3);
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].section.getBoundingClientRect().top <= mark) {
          chosen = sections[i].link;
        }
      }
      setCurrent(chosen);
    }

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("hashchange", update);
    update();
  }

  document.addEventListener("DOMContentLoaded", function () {
    var href = "mailto:" + addressText();
    var links = document.querySelectorAll("[data-contact]");
    for (var i = 0; i < links.length; i++) links[i].setAttribute("href", href);

    var rise = document.querySelectorAll("[data-rise]");
    if (reducedMotion() || !("IntersectionObserver" in window)) {
      markIn(rise, false);
    } else {
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

    bindSectionTabs();
  });
})();

(function () {
  document.documentElement.classList.add("js");

  function addressText() {
    var parts = ["me", "oscarkalid.com"];
    return parts[0] + String.fromCharCode(64) + parts[1];
  }

  function contactHref() {
    return "mailto:" + addressText();
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
          delayClass = "d" + Math.min(8, Math.round(wait / 70));
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
      delay += stagger ? 70 : 0;
    }
  }

  function fallbackCopy(text) {
    var area = document.createElement("textarea");
    var selected = document.activeElement;
    area.value = text;
    area.setAttribute("readonly", "");
    area.className = "copy-fallback";
    document.body.appendChild(area);
    area.focus();
    area.select();
    var copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (error) {
      copied = false;
    }
    document.body.removeChild(area);
    if (selected && selected.focus) selected.focus();
    return copied;
  }

  function selectNode(node) {
    if (!node || !window.getSelection) return;
    var selection = window.getSelection();
    if (!selection) return;
    var range = document.createRange();
    range.selectNodeContents(node);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function copyText(token, onSuccess, onFail) {
    function finish(ok) {
      if (ok) onSuccess();
      else onFail();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(token).then(function () {
        finish(true);
      }, function () {
        finish(fallbackCopy(token));
      });
      return;
    }
    finish(fallbackCopy(token));
  }

  function bindCopy(button, token, announcement, onFail) {
    if (!button) return;
    var status = button.querySelector(".copy-status");
    var resetTimer = 0;
    var clearTimer = 0;

    function setStatus(text) {
      if (status) status.textContent = text;
      if (announcement) announcement.textContent = text;
    }

    function showCopied() {
      button.classList.add("is-copied");
      setStatus("Copied");
      window.clearTimeout(resetTimer);
      window.clearTimeout(clearTimer);
      resetTimer = window.setTimeout(function () {
        button.classList.remove("is-copied");
        clearTimer = window.setTimeout(function () {
          if (!button.classList.contains("is-copied")) setStatus("");
        }, reducedMotion() ? 0 : 460);
      }, 1500);
    }

    button.addEventListener("click", function () {
      copyText(token, showCopied, function () {
        button.classList.remove("is-copied");
        setStatus("");
        onFail();
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var href = contactHref();
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

    var more = document.querySelector(".more");
    var wrap = document.querySelector(".extra-wrap");
    if (more && wrap) {
      wrap.setAttribute("inert", "");
      more.hidden = false;
      var settleTimer = 0;
      more.addEventListener("click", function () {
        var open = !wrap.classList.contains("is-open");
        window.clearTimeout(settleTimer);
        if (open) {
          wrap.removeAttribute("inert");
          wrap.classList.add("is-open");
          more.setAttribute("aria-expanded", "true");
          more.textContent = "Show less";
          function focusCard() {
            var card = wrap.querySelector(".card");
            if (card && wrap.classList.contains("is-open")) card.focus();
          }
          function settle(event) {
            if (event && event.target !== wrap) return;
            if (event && event.propertyName !== "grid-template-rows" && event.propertyName !== "opacity") return;
            wrap.classList.add("is-settled");
            wrap.removeEventListener("transitionend", settle);
            focusCard();
          }
          if (reducedMotion()) settle();
          else {
            wrap.addEventListener("transitionend", settle);
            settleTimer = window.setTimeout(function () {
              if (!wrap.classList.contains("is-settled")) {
                wrap.classList.add("is-settled");
                focusCard();
              }
            }, 700);
          }
          return;
        }
        if (document.activeElement && wrap.contains(document.activeElement)) more.focus();
        wrap.classList.remove("is-settled");
        wrap.classList.remove("is-open");
        wrap.setAttribute("inert", "");
        more.setAttribute("aria-expanded", "false");
        more.textContent = "Show more";
      });
    }

    var note = document.querySelector(".mail-note");
    var noteMessage = document.querySelector(".mail-message");
    var noteAddress = document.querySelector(".mail-address");
    var mailLive = document.querySelector(".mail-announcement");

    function revealAddress(message) {
      if (noteMessage) noteMessage.textContent = message || "";
      if (noteAddress) noteAddress.textContent = addressText();
      if (note) note.classList.add("is-open");
      if (mailLive) mailLive.textContent = message ? message + " " + addressText() : addressText();
      window.requestAnimationFrame(function () {
        selectNode(noteAddress);
      });
    }

    bindCopy(document.querySelector(".copy"), "@oscarkalid", document.querySelector(".copy-announcement"), function () {
      selectNode(document.querySelector(".copy-label"));
      var live = document.querySelector(".copy-announcement");
      if (live) live.textContent = "Selected";
    });

    bindCopy(document.querySelector(".copy-address"), addressText(), mailLive, function () {
      revealAddress("Address selected.");
    });

    var mail = document.querySelector("a.email");
    if (mail) {
      mail.addEventListener("click", function () {
        var sawLeave = false;
        function mark() { sawLeave = true; }
        window.addEventListener("blur", mark);
        document.addEventListener("visibilitychange", mark);
        window.setTimeout(function () {
          window.removeEventListener("blur", mark);
          document.removeEventListener("visibilitychange", mark);
          if (sawLeave || document.hidden || !document.hasFocus()) return;
          revealAddress("No mail app opened.");
        }, 900);
      });
    }
  });
})();

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
    var settled = false;
    function finish(ok) {
      if (settled) return;
      settled = true;
      if (ok) onSuccess();
      else onFail();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      var pending = navigator.clipboard.writeText(token);
      if (pending && pending.then) {
        pending.then(function () {
          finish(true);
        }, function () {
          finish(fallbackCopy(token));
        });
        window.setTimeout(function () {
          if (settled) return;
          finish(fallbackCopy(token));
        }, 350);
        return;
      }
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

    var copies = document.querySelectorAll(".copy");
    for (var c = 0; c < copies.length; c++) {
      (function (button) {
        var label = button.querySelector(".copy-label");
        var live = button.parentElement ? button.parentElement.querySelector(".copy-announcement") : null;
        bindCopy(button, label ? label.textContent.trim() : "", live, function () {
          selectNode(label);
          if (live) live.textContent = "Selected";
        });
      })(copies[c]);
    }

    var blocks = document.querySelectorAll(".contact-block");
    for (var b = 0; b < blocks.length; b++) {
      (function (block) {
        var note = block.querySelector(".mail-note");
        var noteMessage = block.querySelector(".mail-message");
        var noteAddress = block.querySelector(".mail-address");
        var mailLive = block.querySelector(".mail-announcement");

        function revealAddress(message) {
          if (noteMessage) noteMessage.textContent = message || "";
          if (noteAddress) noteAddress.textContent = addressText();
          if (note) note.classList.add("is-open");
          if (mailLive) mailLive.textContent = message ? message + " " + addressText() : addressText();
          window.requestAnimationFrame(function () {
            selectNode(noteAddress);
          });
        }

        bindCopy(block.querySelector(".copy-address"), addressText(), mailLive, function () {
          revealAddress("Address selected.");
        });

        var mail = block.querySelector("a.email");
        if (!mail) return;
        mail.addEventListener("click", function () {
          var started = Date.now();
          var sawHidden = false;
          var poll = 0;
          function stop() {
            window.clearInterval(poll);
          }
          poll = window.setInterval(function () {
            var elapsed = Date.now() - started;
            if (document.hidden) {
              sawHidden = true;
              if (elapsed > 12000) stop();
              return;
            }
            if (sawHidden) {
              stop();
              return;
            }
            if (elapsed < 900) return;
            stop();
            revealAddress("No mail app opened.");
          }, 150);
        });
      })(blocks[b]);
    }

    var cues = document.querySelectorAll(".story-cue");
    for (var s = 0; s < cues.length; s++) {
      (function (cue) {
        var story = document.getElementById(cue.getAttribute("aria-controls"));
        if (!story) return;
        story.setAttribute("inert", "");
        var settleTimer = 0;
        cue.addEventListener("click", function () {
          var open = !story.classList.contains("is-open");
          window.clearTimeout(settleTimer);
          if (open) {
            story.removeAttribute("inert");
            story.classList.add("is-open");
            cue.setAttribute("aria-expanded", "true");
            cue.textContent = "Show less";
            function focusStory() {
              if (!story.classList.contains("is-open")) return;
              story.setAttribute("tabindex", "-1");
              story.focus({ preventScroll: true });
            }
            function settle(event) {
              if (event && event.target !== story) return;
              if (event && event.propertyName !== "grid-template-rows" && event.propertyName !== "opacity") return;
              story.removeEventListener("transitionend", settle);
              story.classList.add("is-settled");
              focusStory();
            }
            if (reducedMotion()) settle();
            else {
              story.addEventListener("transitionend", settle);
              settleTimer = window.setTimeout(function () {
                if (!story.classList.contains("is-settled")) {
                  story.classList.add("is-settled");
                  focusStory();
                }
              }, 700);
            }
            return;
          }
          if (document.activeElement && story.contains(document.activeElement)) cue.focus();
          story.classList.remove("is-settled");
          story.classList.remove("is-open");
          story.setAttribute("inert", "");
          cue.setAttribute("aria-expanded", "false");
          cue.textContent = "Read the story";
        });
      })(cues[s]);
    }

    var slider = document.getElementById("sky-hour");
    var readout = document.getElementById("sky-readout");
    var skyNow = document.getElementById("sky-now");

    function formatHour(value) {
      var hour = Math.floor(value);
      var minute = Math.round((value - hour) * 60);
      if (minute === 60) {
        hour += 1;
        minute = 0;
      }
      if (hour >= 24) hour = 0;
      return hour + ":" + (minute < 10 ? "0" : "") + minute;
    }

    function showHour(value) {
      var label = formatHour(value);
      if (readout) readout.textContent = label;
      if (slider) slider.setAttribute("aria-valuetext", label);
    }

    function previewHour(value) {
      document.dispatchEvent(new CustomEvent("oscarkalid-sky", { detail: { hour: value } }));
      showHour(value);
    }

    if (slider) {
      var current = +document.documentElement.dataset.skyHour;
      if (!isFinite(current)) current = new Date().getHours();
      slider.value = String(current);
      showHour(current);
      slider.addEventListener("input", function () {
        previewHour(+slider.value);
      });
    }

    if (skyNow) {
      skyNow.addEventListener("click", function () {
        document.dispatchEvent(new CustomEvent("oscarkalid-sky", { detail: { hour: null } }));
        var now = +document.documentElement.dataset.skyHour;
        if (!isFinite(now)) now = new Date().getHours();
        if (slider) slider.value = String(now);
        showHour(now);
      });
    }

    var kitSave = document.querySelector(".kit-save");
    var kitCancel = document.querySelector(".kit-cancel");
    var kitStatus = document.querySelector(".kit-status");
    var kitTimer = 0;

    function setSaved(on) {
      if (!kitSave) return;
      kitSave.classList.toggle("is-saved", on);
      kitSave.setAttribute("aria-pressed", on ? "true" : "false");
      if (kitStatus) kitStatus.textContent = on ? "Saved" : "";
    }

    if (kitSave) {
      kitSave.addEventListener("click", function () {
        setSaved(true);
        window.clearTimeout(kitTimer);
        kitTimer = window.setTimeout(function () {
          setSaved(false);
        }, 1600);
      });
    }

    if (kitCancel) {
      kitCancel.addEventListener("click", function () {
        window.clearTimeout(kitTimer);
        setSaved(false);
      });
    }
  });
})();

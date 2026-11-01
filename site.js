(function () {
  document.documentElement.classList.add("js");

  function contactHref() {
    var parts = ["me", "oscarkalid.com"];
    return "mailto:" + parts[0] + String.fromCharCode(64) + parts[1];
  }

  document.addEventListener("DOMContentLoaded", function () {
    var href = contactHref();
    var links = document.querySelectorAll("[data-contact]");
    for (var i = 0; i < links.length; i++) links[i].setAttribute("href", href);

    var more = document.querySelector(".more");
    var extras = document.querySelectorAll(".extra");
    if (!more || !extras.length) return;
    more.hidden = false;
    more.addEventListener("click", function () {
      for (var i = 0; i < extras.length; i++) extras[i].classList.add("is-open");
      more.hidden = true;
      var heading = extras[0].querySelector("h3");
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus();
      }
    });
  });
})();

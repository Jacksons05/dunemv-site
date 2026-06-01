/* =========================================================================
   Dune — site script. Thin layer on top of MOTION-STARTER (motion.js owns the
   scroll reveals, marquee, Lenis). This file: nav state, the hero slideshow,
   and the pull-quote carousel. All time-based motion respects reduced-motion.
   ========================================================================= */
(function () {
  "use strict";

  var reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Nav: solid on scroll / off home, mobile drawer toggle ------------- */
  var nav = document.getElementById("nav");
  if (nav) {
    var onHome = nav.hasAttribute("data-home");
    var sync = function () {
      var solid = window.scrollY > 24 || !onHome || nav.classList.contains("is-open");
      nav.classList.toggle("is-solid", solid);
    };
    sync();
    window.addEventListener("scroll", sync, { passive: true });

    var burger = nav.querySelector(".nav__burger");
    if (burger) {
      burger.addEventListener("click", function () {
        var open = nav.classList.toggle("is-open");
        burger.setAttribute("aria-expanded", open ? "true" : "false");
        burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        sync();
      });
    }
  }

  /* ---- Hero slideshow — crossfade through the storefront plates ---------- */
  var slides = document.querySelectorAll(".hero__slide");
  if (slides.length > 1 && !reduce) {
    var i = 0;
    setInterval(function () {
      slides[i].classList.remove("is-active");
      i = (i + 1) % slides.length;
      slides[i].classList.add("is-active");
    }, 5000);
  }

  /* ---- Pull-quote carousel ----------------------------------------------- */
  var stage = document.querySelector(".quotes__stage");
  if (stage) {
    var quotes = stage.querySelectorAll(".quote");
    var dots = document.querySelectorAll(".quotes__dots button");
    var q = 0;
    var timer = null;

    var show = function (n) {
      quotes[q].classList.remove("is-active");
      if (dots[q]) dots[q].setAttribute("aria-pressed", "false");
      q = (n + quotes.length) % quotes.length;
      quotes[q].classList.add("is-active");
      if (dots[q]) dots[q].setAttribute("aria-pressed", "true");
    };

    dots.forEach(function (dot, idx) {
      dot.addEventListener("click", function () {
        show(idx);
        if (timer) { clearInterval(timer); start(); }
      });
    });

    var start = function () {
      if (reduce) return;
      timer = setInterval(function () { show(q + 1); }, 6000);
    };
    start();
  }
})();

/* =========================================================================
   MOTION-STARTER — motion.js
   House motion engine modelled on papertiger.com (GSAP 3.15 + ScrollTrigger +
   SplitText + Lenis) and fancygroceries.com (scroll reveals + marquee).

   Free stack only:
     - GSAP 3.13+        (free incl. SplitText/Flip/Draggable since 2024)
     - ScrollTrigger     (free GSAP plugin)
     - SplitText         (free GSAP plugin)
     - Lenis             (free, darkroomengineering/lenis)

   Load order (see index.html): GSAP core -> ScrollTrigger -> SplitText ->
   Lenis -> this file.

   Declarative API (add attributes in HTML):
     data-split                      -> char/line mask rise + fade (the "fade text")
     data-reveal="left|right|up"     -> slide/translate in on scroll
       data-reveal-stagger="0.08"    -> stagger children instead of the element
     data-scale[="1.15"]             -> scroll-scrubbed zoom on inner img/.ms-img
     data-parallax="0.2"             -> scroll-scrubbed vertical parallax
     data-line                       -> divider draws (scaleX 0->1) on enter
     data-count="700" data-count-suffix="+"  -> number counts up on enter
     .ms-marquee > .ms-marquee__track[data-speed="60"][data-dir="-1"]  -> ticker

   Everything is gated behind prefers-reduced-motion; when reduced, JS bails
   and motion.css shows all content statically.
   ========================================================================= */
(function () {
  "use strict";

  var prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var hasGSAP = typeof window.gsap !== "undefined";
  var ST = window.ScrollTrigger;
  var SplitText = window.SplitText;

  // House easing (GSAP custom not required — power3/expo are the live papertiger eases)
  var EASE = "power3.out";
  var EASE_SCRUB = "none";

  /* ---- Reduced motion or no GSAP: reveal everything, init nothing -------- */
  if (prefersReduced || !hasGSAP) {
    document.querySelectorAll("[data-split]").forEach(function (el) {
      el.style.visibility = "visible";
    });
    return;
  }

  if (ST) gsap.registerPlugin(ST);
  if (SplitText) gsap.registerPlugin(SplitText);

  /* ===================================================================== *
   * 0. SMOOTH SCROLL (Lenis) — drives ScrollTrigger
   * ===================================================================== */
  var lenis = null;
  if (typeof window.Lenis !== "undefined") {
    lenis = new window.Lenis({
      lerp: 0.1, // papertiger value
      smoothWheel: true,
    });
    lenis.on("scroll", function () {
      if (ST) ST.update();
    });
    gsap.ticker.add(function (time) {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
    document.documentElement.classList.add("lenis", "lenis-smooth");
  }

  /* ===================================================================== *
   * 1. FADE TEXT — SplitText line/char mask rise + fade (papertiger)
   *    DOM target: [data-split]. Falls back to a line-by-line manual split
   *    if the SplitText plugin is absent.
   * ===================================================================== */
  function initSplitText() {
    document.querySelectorAll("[data-split]").forEach(function (el) {
      el.style.visibility = "visible";

      var lines;
      if (SplitText) {
        var split = new SplitText(el, {
          type: "lines",
          linesClass: "split-line",
        });
        lines = split.lines;
        // wrap each line in an overflow:hidden mask
        lines.forEach(function (line) {
          var mask = document.createElement("span");
          mask.className = "split-line-mask";
          line.parentNode.insertBefore(mask, line);
          mask.appendChild(line);
        });
      } else {
        // minimal fallback: treat the whole element as one line
        var inner = document.createElement("span");
        inner.className = "split-line";
        inner.innerHTML = el.innerHTML;
        el.innerHTML = "";
        var mask = document.createElement("span");
        mask.className = "split-line-mask";
        mask.appendChild(inner);
        el.appendChild(mask);
        lines = [inner];
      }

      gsap.from(lines, {
        yPercent: 110, // rise from below the mask
        opacity: 0,
        duration: 0.6,
        ease: EASE,
        stagger: 0.08,
        scrollTrigger: { trigger: el, start: "top 85%" },
      });
    });
  }

  /* ===================================================================== *
   * 2. SLIDE-IN FROM LEFT / RIGHT / UP (scroll reveal)
   *    [data-reveal="left|right|up"]; optional data-reveal-stagger on children.
   * ===================================================================== */
  function initReveals() {
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      var staggerAttr = el.getAttribute("data-reveal-stagger");
      var targets = staggerAttr ? el.children : el;

      gsap.to(targets, {
        x: 0,
        y: 0,
        opacity: 1,
        duration: 1.0,
        ease: EASE,
        stagger: staggerAttr ? parseFloat(staggerAttr) : 0,
        scrollTrigger: { trigger: el, start: "top 85%" },
      });
    });
  }

  /* ===================================================================== *
   * 3. SCROLL ZOOM / SCALE (scrubbed) — papertiger hero scale
   *    [data-scale] scales inner img/.ms-img from 1 -> value across its scroll.
   * ===================================================================== */
  function initScale() {
    document.querySelectorAll("[data-scale]").forEach(function (el) {
      var to = parseFloat(el.getAttribute("data-scale")) || 1.15;
      var img = el.querySelector("img, .ms-img") || el;
      gsap.fromTo(
        img,
        { scale: 1 },
        {
          scale: to,
          ease: EASE_SCRUB,
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.5,
          },
        }
      );
    });
  }

  /* ===================================================================== *
   * 3b. PARALLAX (scrubbed vertical) — depth layer
   * ===================================================================== */
  function initParallax() {
    document.querySelectorAll("[data-parallax]").forEach(function (el) {
      var amt = parseFloat(el.getAttribute("data-parallax")) || 0.2;
      gsap.fromTo(
        el,
        { yPercent: -amt * 50 },
        {
          yPercent: amt * 50,
          ease: EASE_SCRUB,
          scrollTrigger: {
            trigger: el.parentElement || el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    });
  }

  /* ===================================================================== *
   * 4. LINE-DRAW dividers — scaleX 0 -> 1 on enter (papertiger c-line)
   * ===================================================================== */
  function initLines() {
    document.querySelectorAll("[data-line]").forEach(function (el) {
      gsap.to(el, {
        scaleX: 1,
        duration: 1.0,
        ease: EASE,
        scrollTrigger: { trigger: el, start: "top 90%" },
      });
    });
  }

  /* ===================================================================== *
   * 5. NUMBER COUNTERS — count up on enter (papertiger data-panel-stats)
   * ===================================================================== */
  function initCounters() {
    document.querySelectorAll("[data-count]").forEach(function (el) {
      var end = parseFloat(el.getAttribute("data-count")) || 0;
      var suffix = el.getAttribute("data-count-suffix") || "";
      var obj = { v: 0 };
      gsap.to(obj, {
        v: end,
        duration: 1.6,
        ease: EASE,
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
        onUpdate: function () {
          el.textContent = Math.round(obj.v) + suffix;
        },
      });
    });
  }

  /* ===================================================================== *
   * 6. MARQUEE — slow ambient ticker (papertiger data-marquee)
   *    .ms-marquee__track[data-speed=px/s][data-dir=-1|1]; track content is
   *    duplicated so the loop is seamless.
   * ===================================================================== */
  function initMarquees() {
    document.querySelectorAll(".ms-marquee__track").forEach(function (track) {
      var speed = parseFloat(track.getAttribute("data-speed")) || 50; // px/sec
      var dir = parseFloat(track.getAttribute("data-dir")) || -1;
      var container = track.closest(".ms-marquee") || track.parentElement;

      // 1) grow the ORIGINAL content until one copy spans the container, so a
      //    half-length loop never exposes empty space (fixes short/rightward rows)
      var orig = track.innerHTML;
      var guard = 0;
      while (track.scrollWidth < container.offsetWidth && guard < 60) {
        track.innerHTML += orig;
        guard++;
      }
      // 2) duplicate that wide set once → two identical halves for a seamless wrap
      track.innerHTML += track.innerHTML;

      var distance = track.scrollWidth / 2; // one half = one full content set
      var duration = distance / speed;

      // dir < 0 scrolls left (0 → -d); dir > 0 scrolls right (-d → 0). Both seamless.
      if (dir > 0) {
        gsap.fromTo(track, { x: -distance }, { x: 0, duration: duration, ease: "none", repeat: -1 });
      } else {
        gsap.fromTo(track, { x: 0 }, { x: -distance, duration: duration, ease: "none", repeat: -1 });
      }
    });
  }

  /* ===================================================================== *
   * 7. PAGE TRANSITIONS — native View Transitions API (free, no Swup)
   *    Cross-document crossfade between same-origin pages. Add to each page's
   *    CSS: @view-transition { navigation: auto; }  (see index.html).
   *    This block only no-ops gracefully where unsupported.
   * ===================================================================== */
  // Nothing to wire in JS for cross-document VT — it is CSS-driven. Kept here
  // as the documented home for any future same-page (SPA) transitions via
  // document.startViewTransition().

  /* ---- boot ------------------------------------------------------------- */
  function init() {
    initSplitText();
    initReveals();
    initScale();
    initParallax();
    initLines();
    initCounters();
    initMarquees();
    if (ST) ST.refresh();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // expose for debugging / manual refresh
  window.MotionStarter = { lenis: lenis, refresh: function () { if (ST) ST.refresh(); } };
})();

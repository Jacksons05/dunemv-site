/*
 * Dune CMS — live editor previews (Islandmark)
 * --------------------------------------------------------------------------
 * Renders an as-you-type preview that mirrors the real site markup + CSS, so
 * the client sees their changes update on every keystroke — no link to click.
 *
 * Decap exposes two globals for preview templates:
 *   window.h           = React.createElement
 *   window.createClass = create-react-class
 * and CMS.registerPreviewStyle() injects the live site's stylesheet into the
 * preview iframe so previews match production.
 *
 * The markup strings below are kept in sync with index.html / journal.html /
 * brands.html. If those pages change structure, update the matching block here.
 */
(function () {
  var h = window.h;
  var createClass = window.createClass;

  // --- Load the real site styling into the preview pane ----------------------
  CMS.registerPreviewStyle("/styles.css");
  CMS.registerPreviewStyle(
    "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600&family=Space+Mono:wght@400;700&display=swap"
  );
  // Let the band backgrounds fill the pane edge-to-edge.
  CMS.registerPreviewStyle(
    "data:text/css;base64," +
      btoa("html,body{margin:0;background:#fff}.cms-preview-pad{min-height:100vh}")
  );

  // --- helpers ---------------------------------------------------------------
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  // Resolve an image path to a URL the preview can show (handles both existing
  // repo paths and freshly-uploaded blobs).
  function asset(getAsset, p) {
    if (!p) return "";
    try {
      return String(getAsset(p));
    } catch (e) {
      return p;
    }
  }
  // Immutable -> plain
  function plain(v) {
    return v && v.toJS ? v.toJS() : v;
  }
  // Render an innerHTML string inside the padded preview wrapper.
  function box(html) {
    return h("div", {
      className: "cms-preview-pad",
      dangerouslySetInnerHTML: { __html: html },
    });
  }

  // ===========================================================================
  // JOURNAL — mirrors a card on journal.html + the markdown body below it
  // ===========================================================================
  var JournalPreview = createClass({
    render: function () {
      var d = this.props.entry.get("data");
      var g = function (k) {
        return plain(d.get(k));
      };
      var img = asset(this.props.getAsset, g("image"));
      var meta = [g("category"), g("season")].filter(Boolean).join(" · ");

      var card =
        '<main><section class="band band--oat"><div class="inner">' +
        '<div class="cards"><article class="card">' +
        (img
          ? '<div class="frame"><img src="' +
            esc(img) +
            '" alt="' +
            esc(g("image_alt")) +
            '" /></div>'
          : "") +
        (meta ? '<p class="kicker brass-ink meta">' + esc(meta) + "</p>" : "") +
        "<h3>" +
        esc(g("title") || "Untitled entry") +
        "</h3>" +
        '<p class="text-night-70">' +
        esc(g("dek")) +
        "</p>" +
        "</article></div></div></section></main>";

      return h("div", { className: "cms-preview-pad" }, [
        h("div", { key: "card", dangerouslySetInnerHTML: { __html: card } }),
        h(
          "div",
          {
            key: "body",
            className: "inner",
            style: {
              maxWidth: "44rem",
              margin: "0 auto",
              padding: "0 1.5rem 4rem",
            },
          },
          this.props.widgetFor("body")
        ),
      ]);
    },
  });

  // ===========================================================================
  // BRANDS — mirrors the brand-entry list build.js writes into brands.html
  // ===========================================================================
  var BrandsPreview = createClass({
    render: function () {
      var brands = plain(this.props.entry.getIn(["data", "brands"])) || [];
      var items = brands
        .map(function (b) {
          b = b || {};
          return (
            '<li class="brand-entry"><h3>' +
            esc(b.name) +
            '</h3><p class="brand-origin">' +
            esc(b.origin) +
            '</p><p class="brand-note">' +
            esc(b.note) +
            "</p></li>"
          );
        })
        .join("");

      return box(
        '<main><section class="band band--oat"><div class="inner">' +
          '<p class="kicker brass-ink">The Brands</p>' +
          "<h2>What we carry.</h2>" +
          '<ul class="brand-list" style="margin-top:2rem">' +
          items +
          "</ul></div></section></main>"
      );
    },
  });

  // ===========================================================================
  // PHOTOS — storefront slideshow, collage, Instagram grid (home page)
  // ===========================================================================
  var PhotosPreview = createClass({
    render: function () {
      var ga = this.props.getAsset;
      var d = this.props.entry.get("data");
      var get = function (k) {
        return plain(d.get(k)) || [];
      };

      var hero = get("hero_slides")
        .map(function (s) {
          s = s || {};
          return (
            '<figure class="coll-card"><div class="frame"><img src="' +
            esc(asset(ga, s.image)) +
            '" alt="' +
            esc(s.alt) +
            '" /></div></figure>'
          );
        })
        .join("");

      var collage = get("collage")
        .map(function (c) {
          c = c || {};
          return (
            '<figure class="coll-card"><div class="frame"><img src="' +
            esc(asset(ga, c.image)) +
            '" alt="' +
            esc(c.alt) +
            '" /></div>' +
            '<figcaption class="kicker brass-ink" style="margin-top:0.9rem">' +
            esc(c.caption) +
            "</figcaption></figure>"
          );
        })
        .join("");

      var ig = get("instagram")
        .map(function (p) {
          p = p || {};
          return (
            '<span class="igtile"><img src="' +
            esc(asset(ga, p.image)) +
            '" alt="' +
            esc(p.alt) +
            '" /><span class="cap kicker">' +
            esc(p.caption) +
            "</span></span>"
          );
        })
        .join("");

      function section(label, title, inner, cls) {
        return (
          '<section class="band band--oat"><div class="inner">' +
          '<div class="shead"><div><p class="kicker brass-ink">' +
          label +
          "</p><h2>" +
          title +
          "</h2></div></div>" +
          '<div class="' +
          cls +
          '">' +
          inner +
          "</div></div></section>"
        );
      }

      return box(
        "<main>" +
          section("Storefront slideshow", "The hero.", hero, "collage") +
          section("A Look Inside", "The room, in pieces.", collage, "collage") +
          section("On Instagram", "@dune.mv", ig, "iggrid") +
          "</main>"
      );
    },
  });

  // ===========================================================================
  // SETTINGS — one collection, three files (home / general / policies)
  // ===========================================================================
  var SettingsPreview = createClass({
    render: function () {
      var d = this.props.entry.get("data");
      var g = function (k) {
        return plain(d.get(k));
      };

      // --- HOME PAGE TEXT (ethos + essentials/packing) ----------------------
      if (d.get("ethos_statement") != null || d.get("ethos_kicker") != null) {
        var paras = (plain(d.get("ethos_paragraphs")) || [])
          .map(function (p) {
            return "<p>" + esc((p || {}).text) + "</p>";
          })
          .join("");
        var packing = (plain(d.get("packing_list")) || [])
          .map(function (it, i) {
            it = it || {};
            var no = String(i + 1);
            if (no.length < 2) no = "0" + no;
            return (
              '<li><span class="packing__no">' +
              no +
              '</span><div><p class="packing__item">' +
              esc(it.item) +
              '</p><p class="packing__note">' +
              esc(it.note) +
              "</p></div></li>"
            );
          })
          .join("");

        return box(
          "<main>" +
            '<section class="band band--oat"><div class="inner--narrow">' +
            '<p class="kicker brass-ink">' +
            esc(g("ethos_kicker")) +
            "</p>" +
            '<h2 class="script-statement" style="margin-top:1.5rem">' +
            esc(g("ethos_statement")) +
            "</h2>" +
            '<div class="text-night-70" style="margin-top:2.25rem;margin-left:auto;max-width:40rem;font-size:1.125rem;display:flex;flex-direction:column;gap:1.25rem">' +
            paras +
            "</div></div></section>" +
            '<section class="band band--night"><div class="inner packing"><div>' +
            '<p class="kicker brass">' +
            esc(g("essentials_kicker")) +
            "</p>" +
            '<h2 style="font-size:clamp(1.5rem,3.2vw,2.2rem);margin-top:0.5rem">' +
            esc(g("essentials_heading")) +
            "</h2>" +
            '<p class="measure text-oat-75" style="margin-top:1.5rem;font-size:1.05rem">' +
            esc(g("essentials_intro")) +
            "</p></div>" +
            '<ol class="packing__list">' +
            packing +
            "</ol></div></section>" +
            '<section class="band band--oat"><div class="inner">' +
            '<p class="kicker brass-ink">Location</p>' +
            "<h2>" +
            esc(g("location_heading")) +
            "</h2>" +
            '<p class="measure text-night-70" style="margin-top:1.5rem">' +
            esc(g("location_text")) +
            "</p></div></section>" +
            "</main>"
        );
      }

      // --- STORE POLICIES (footer terms grid) -------------------------------
      if (d.get("returns") != null || d.get("shipping") != null) {
        return box(
          '<footer class="foot"><div class="foot__terms"><div class="inner">' +
            '<p class="kicker brass">Terms &amp; Store Policies</p>' +
            '<div class="foot__terms-grid">' +
            "<div><h3>Returns &amp; exchanges</h3><p>" +
            esc(g("returns")) +
            "</p></div>" +
            "<div><h3>Shipping</h3><p>" +
            esc(g("shipping")) +
            "</p></div>" +
            "<div><h3>Privacy</h3><p>" +
            esc(g("privacy")) +
            "</p></div>" +
            "</div></div></div></footer>"
        );
      }

      // --- CONTACT & BUSINESS INFO (footer contact block) -------------------
      return box(
        '<footer class="foot"><div class="foot__grid">' +
          "<div>" +
          '<p class="kicker brass">' +
          esc(g("business_name") || "Dune / Man") +
          "</p>" +
          '<p class="text-oat-75 measure" style="margin-top:1rem">' +
          esc(g("tagline")) +
          "</p>" +
          "</div>" +
          "<div>" +
          '<p class="kicker brass">Contact</p>' +
          "<address>" +
          "<span>" +
          esc(g("address_line1")) +
          "<br />" +
          esc(g("address_line2")) +
          "</span>" +
          '<a href="#">' +
          esc(g("phone_display")) +
          "</a>" +
          '<a href="#">' +
          esc(g("email")) +
          "</a>" +
          '<a href="#">' +
          esc(g("instagram_handle")) +
          "</a>" +
          "</address>" +
          "</div></div></footer>"
      );
    },
  });

  // --- register ---------------------------------------------------------------
  CMS.registerPreviewTemplate("journal", JournalPreview);
  CMS.registerPreviewTemplate("brands", BrandsPreview);
  CMS.registerPreviewTemplate("photos", PhotosPreview);
  CMS.registerPreviewTemplate("settings", SettingsPreview);
})();

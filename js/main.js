
(function () {
  "use strict";

  /* ----------------------------- Utilities ----------------------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const on = (el, evt, fn, opts) => el && el.addEventListener(evt, fn, opts);

  const isOnPage = (id) => !!document.getElementById(id);
  const isProductsPage = !!document.querySelector('main .menu-grid');
  const isAboutPage = !!document.querySelector('[data-lightbox]');
  const isContactPage = !!document.querySelector('form[action^="mailto:"]');

  /* ----------------------------- Footer year --------------------------- */
  function setCurrentYear() {
    const y = $("#year");
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ----------------------------- Back to top --------------------------- */
  function initBackToTop() {
    // Create button if it doesn't exist
    let btn = $("#backToTop");
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "backToTop";
      btn.type = "button";
      btn.setAttribute("aria-label", "Back to top");
      btn.textContent = "↑ Top";
      document.body.appendChild(btn);
    }

    const toggle = () => {
      if (window.scrollY > 300) {
        btn.style.display = "inline-block";
      } else {
        btn.style.display = "none";
      }
    };

    on(window, "scroll", toggle, { passive: true });
    on(btn, "click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    toggle();
  }

  /* ----------------------------- Smooth skip-link ---------------------- */
  function initSkipLinks() {
    $$("a[href^='#']").forEach((a) => {
      on(a, "click", (e) => {
        const id = a.getAttribute("href");
        if (!id || id === "#") return;
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
          setTimeout(() => target.removeAttribute("tabindex"), 1000);
        }
      });
    });
  }

  /* ----------------------------- Lightbox (About) ---------------------- */
  function initLightbox() {
    if (!isAboutPage) return;

    // Backdrop
    let backdrop = $(".lb-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.className = "lb-backdrop";
      backdrop.innerHTML = `
        <button class="lb-close" aria-label="Close image">Close ✕</button>
        <img class="lb-image" alt="" />
      `;
      document.body.appendChild(backdrop);
    }
    const imgEl = $(".lb-image", backdrop);
    const closeBtn = $(".lb-close", backdrop);

    function open(src, alt) {
      imgEl.src = src;
      imgEl.alt = alt || "";
      backdrop.classList.add("open");
      closeBtn.focus();
      document.documentElement.style.overflow = "hidden";
    }

    function close() {
      backdrop.classList.remove("open");
      imgEl.src = "";
      document.documentElement.style.overflow = "";
    }

    on(backdrop, "click", (e) => {
      if (e.target === backdrop || e.target === closeBtn) close();
    });
    on(document, "keydown", (e) => {
      if (e.key === "Escape" && backdrop.classList.contains("open")) close();
    });

    $$("[data-lightbox]").forEach((thumb) => {
      on(thumb, "click", () => {
        const src = thumb.getAttribute("data-src") || thumb.src;
        const alt = thumb.getAttribute("alt") || "";
        open(src, alt);
      });
      // Keyboard accessibility
      thumb.setAttribute("tabindex", "0");
      on(thumb, "keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          thumb.click();
        }
      });
    });
  }

  /* ----------------------------- Products search ----------------------- */
  function injectProductsSearchUI() {
    if (!isProductsPage) return;
    if ($("#productSearchForm")) return;

    const container = document.createElement("section");
    container.innerHTML = `
      <form id="productSearchForm" role="search" aria-label="Search products" class="form" style="max-width:720px">
        <label for="q">Search our menu</label>
        <input id="q" name="q" type="search" placeholder="e.g. cupcake, chocolate, sourdough" autocomplete="off" />
        <small class="lead" id="searchHelp">Type to filter products on this page.</small>
        <p class="small" id="searchCount" aria-live="polite"></p>
      </form>
    `;
    const main = $("main.container") || $("main");
    main && main.insertBefore(container, main.children[1]);
  }

  function initProductSearch() {
    if (!isProductsPage) return;

    injectProductsSearchUI();
    const form = $("#productSearchForm");
    const input = $("#q");
    const count = $("#searchCount");

    const cards = $$(".menu-card");
    // add searchable text cache
    const stash = cards.map((card) => ({
      el: card,
      text:
        (card.textContent || "")
          .replace(/\s+/g, " ")
          .trim()
          .toLowerCase() || "",
    }));

    function applyFilter(term) {
      const q = term.trim().toLowerCase();
      let shown = 0;

      stash.forEach(({ el, text }) => {
        const match = !q || text.includes(q);
        el.style.display = match ? "" : "none";
        if (match) shown++;
      });

      // Hide empty sections (if all cards in that section are hidden)
      $$("main section[id]").forEach((section) => {
        const visibleCards = $$(".menu-card", section).filter(
          (c) => c.style.display !== "none"
        );
        section.style.display =
          section.querySelector(".menu-grid") && visibleCards.length === 0
            ? "none"
            : "";
      });

      if (count) {
        count.textContent =
          q.length === 0
            ? ""
            : `${shown} item${shown === 1 ? "" : "s"} match “${term}”`;
      }
    }

    on(form, "submit", (e) => e.preventDefault());
    on(input, "input", () => applyFilter(input.value));
  }

  /* ----------------------------- Contact form -------------------------- */
  function initContactForm() {
    if (!isContactPage) return;

    const form = $('form[action^="mailto:"]');
    const status = $("#formStatus");
    const requiredIds = ["name", "email", "subject", "message", "consent"];

    const errors = {};
    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function showError(input, msg) {
      // Create or update an inline error message
      let err = input.parentElement.querySelector(".field-error");
      if (!err) {
        err = document.createElement("p");
        err.className = "field-error";
        err.style.color = "#b00020";
        err.style.margin = ".35rem 0 0";
        input.parentElement.appendChild(err);
      }
      err.textContent = msg;
      input.setAttribute("aria-invalid", "true");
      errors[input.id] = msg;
    }

    function clearError(input) {
      const err = input.parentElement.querySelector(".field-error");
      if (err) err.remove();
      input.removeAttribute("aria-invalid");
      delete errors[input.id];
    }

    function validate() {
      let ok = true;

      // Honeypot (bot check)
      const hp = $("#company");
      if (hp && hp.value.trim() !== "") {
        setStatus("Spam detection triggered.");
        return false;
      }

      // Name
      const name = $("#name");
      if (name) {
        const v = name.value.trim();
        if (v.length < 2) {
          showError(name, "Please enter your full name.");
          ok = false;
        } else clearError(name);
      }

      // Email
      const email = $("#email");
      if (email) {
        const v = email.value.trim();
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!re.test(v)) {
          showError(email, "Enter a valid email address, e.g. name@example.com.");
          ok = false;
        } else clearError(email);
      }

      // Subject
      const subject = $("#subject");
      if (subject) {
        const v = subject.value.trim();
        if (v.length < 3) {
          showError(subject, "Subject must be at least 3 characters.");
          ok = false;
        } else clearError(subject);
      }

      // Message
      const message = $("#message");
      if (message) {
        const v = message.value.trim();
        if (v.length < 10) {
          showError(message, "Please provide a short message (10+ characters).");
          ok = false;
        } else clearError(message);
      }

      // Consent
      const consent = $("#consent");
      if (consent && !consent.checked) {
        showError(consent, "Please agree so we may contact you.");
        ok = false;
      } else if (consent) clearError(consent);

      // Phone (optional, but validate if present)
      const phone = $("#phone");
      if (phone && phone.value.trim().length) {
        const okPhone = /^\+?[0-9\s\-()]{7,}$/.test(phone.value.trim());
        if (!okPhone) {
          showError(phone, "Phone should be like +27 82 555 0198.");
          ok = false;
        } else clearError(phone);
      }

      setStatus(
        ok
          ? "All good — ready to send."
          : "Please fix the highlighted fields and try again."
      );
      return ok;
    }

    // Live validation
    requiredIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      on(el, "input", validate);
      on(el, "change", validate);
      on(el, "blur", validate);
    });

    on(form, "submit", (e) => {
      if (!validate()) {
        e.preventDefault();
        return;
      }

      // Build a nicer mailto body
      const name = $("#name").value.trim();
      const email = $("#email").value.trim();
      const phone = $("#phone")?.value.trim() || "N/A";
      const subject = $("#subject").value.trim();
      const message = $("#message").value.trim();

      const body =
        `Name: ${name}\n` +
        `Email: ${email}\n` +
        `Phone: ${phone}\n` +
        `\nMessage:\n${message}\n` +
        `\n— Sent from Sweet Haven Bakery contact page`;
      const to = (form.getAttribute("action") || "").replace("mailto:", "");
      const href =
        `mailto:${encodeURIComponent(to)}` +
        `?subject=${encodeURIComponent(subject)}` +
        `&body=${encodeURIComponent(body)}`;

      // Provide immediate UX feedback + open email client
      setStatus("Opening your email app…");
      // Some browsers block window.open on submit; keep default too
      window.open(href, "_blank");
      // Allow default submit to proceed (keeps the simple mailto as fallback)
    });
  }

  /* ----------------------------- Map enhancements ---------------------- */
  function initMaps() {
    if (!isContactPage) return;

    // 1) Make embedded map keyboard-navigable and sized
    const frame = $(".map-embed iframe");
    if (frame) {
      frame.setAttribute("tabindex", "0");
      frame.style.width = "100%";
      frame.style.minHeight = "320px";
      frame.style.border = "0";
      frame.setAttribute("loading", "lazy");
    }

    // 2) Build dynamic directions link using Geolocation (with graceful fallback)
    const btn = document.querySelector(
      'a[href*="https://www.google.com/maps/dir/"]'
    );
    if (!btn) return;

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const url = new URL(btn.href);
          url.searchParams.set("origin", `${latitude},${longitude}`);
          btn.href = url.toString();
          btn.setAttribute("title", "Get directions from your current location");
        },
        () => {
          // silently keep default destination-only directions
        },
        { maximumAge: 60_000, timeout: 8000 }
      );
    }
  }

  /* ----------------------------- Lazyload safety ----------------------- */
  function ensureLazyLoading() {
    $$("img:not([loading])").forEach((img) => img.setAttribute("loading", "lazy"));
    $$("img:not([decoding])").forEach((img) => img.setAttribute("decoding", "async"));
  }

  /* ----------------------------- Init ---------------------------------- */
  function init() {
    setCurrentYear();
    initBackToTop();
    initSkipLinks();
    initLightbox();
    initProductSearch();
    initContactForm();
    initMaps();
    ensureLazyLoading();
  }

  on(document, "DOMContentLoaded", init);
})(); 
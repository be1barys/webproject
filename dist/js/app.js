/* Page controllers. Core calculations live in core.js; editable content in data.js. */
(function () {
  "use strict";
  const D = window.FPL_DATA,
    C = window.FPL_CORE;
  const $id = (id) => document.getElementById(id);
  const escapeHTML = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const money = (n) => "£" + Number(n).toFixed(1) + "m";
  const reduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const duration = reduced ? 0 : 180;
  let toastTimer;
  // localStorage may be unavailable in private browsing or file:// environments.
  function read(key, fallback) {
    try {
      const data = localStorage.getItem("fpl:" + key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }
  function write(key, value) {
    try {
      localStorage.setItem("fpl:" + key, JSON.stringify(value));
      return true;
    } catch {
      toast("Browser storage is unavailable. Changes last for this visit only.");
      return false;
    }
  }
  function toast(message) {
    clearTimeout(toastTimer);
    const element = $id("toast");
    element.textContent = message;
    if (window.jQuery) window.jQuery(element).stop(true, true).fadeIn(duration);
    else element.style.display = "block";
    toastTimer = setTimeout(() => {
      if (window.jQuery) window.jQuery(element).stop(true, true).fadeOut(duration);
      else element.style.display = "none";
    }, 3200);
  }
  function reveal(element) {
    element.hidden = false;
    if (window.jQuery) window.jQuery(element).stop(true, true).hide().fadeIn(duration);
  }
  function storageIds(key, source) {
    const value = read(key, []);
    return Array.isArray(value)
      ? [...new Set(value.filter((id) => source.some((item) => item.id === id)))]
      : [];
  }
  let shortlist = storageIds("shortlist", D.players),
    bookmarks = storageIds("bookmarks", D.articles);
  let plans = read("plans", []);
  if (!Array.isArray(plans)) plans = [];
  plans = plans
    .filter(
      (p) =>
        p &&
        typeof p.id === "string" &&
        typeof p.planName === "string" &&
        !Object.keys(C.validateTransfer(p, D.players)).length,
    )
    .slice(0, 20);
  function updateSavedCount() {
    $id("saved-count").textContent = shortlist.length + bookmarks.length + plans.length;
  }
  updateSavedCount();
  const themeButton = document.querySelector(".theme-toggle");
  function showTheme() {
    const dark = document.documentElement.dataset.theme === "dark";
    themeButton.setAttribute("aria-pressed", String(dark));
    themeButton.textContent = dark ? "Light mode" : "Dark mode";
  }
  themeButton.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    write("theme", next);
    showTheme();
  });
  showTheme();
  function toggleSaved(type, id) {
    const isPlayer = type === "player";
    let list = isPlayer ? shortlist : bookmarks;
    const added = !list.includes(id);
    list = added ? [...list, id] : list.filter((v) => v !== id);
    if (isPlayer) shortlist = list;
    else bookmarks = list;
    const persisted = write(isPlayer ? "shortlist" : "bookmarks", list);
    if (persisted)
      toast(
        added
          ? isPlayer
            ? "Player added to your shortlist."
            : "Article saved to your reading list."
          : "Removed from your saved list.",
      );
    updateSavedCount();
    return added;
  }
  function attachForm(form, validator, onValid) {
    let submitted = false;
    const touched = new Set();
    const controls = [...form.querySelectorAll("input, select")];
    const values = () =>
      Object.fromEntries(
        controls.map((el) => [el.id, el.type === "checkbox" ? el.checked : el.value]),
      );
    function renderErrors(errors, force = false) {
      controls.forEach((el) => {
        const message = force || submitted || touched.has(el.id) ? errors[el.id] || "" : "";
        const feedback = $id(el.id + "-error");
        if (feedback) feedback.textContent = message;
        el.classList.toggle("is-invalid", !!message);
        if (message) el.setAttribute("aria-invalid", "true");
        else el.removeAttribute("aria-invalid");
      });
    }
    ["input", "change"].forEach((event) =>
      form.addEventListener(event, (e) => {
        if (e.target.matches("input, select")) {
          touched.add(e.target.id);
          renderErrors(validator(values()));
        }
      }),
    );
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      submitted = true;
      const data = values(),
        errors = validator(data);
      renderErrors(errors, true);
      if (Object.keys(errors).length) {
        const first = controls.find((el) => errors[el.id]);
        if (first) first.focus();
        return;
      }
      onValid(data);
      form.reset();
    });
    form.addEventListener("reset", () => {
      submitted = false;
      touched.clear();
      renderErrors({});
    });
    return { values, validate: () => renderErrors(validator(values())) };
  }
  // Three distinct jQuery effects: slideToggle for help, fadeIn/fadeOut for feedback,
  // and animate for scroll-to-top. stop(true,true) prevents queued repeat-click effects.
  document.addEventListener("click", (e) => {
    const button = e.target.closest("[data-accordion]");
    if (button) {
      const panel = $id(button.dataset.accordion),
        expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!expanded));
      if (window.jQuery) {
        const target = window.jQuery(panel).stop(true, true);
        if (panel.hidden) {
          panel.hidden = false;
          target.hide();
        }
        target.slideToggle(duration, () => {
          panel.hidden = expanded;
        });
      } else panel.hidden = expanded;
    }
    if (e.target.closest(".back-top")) {
      if (window.jQuery)
        window
          .jQuery("html, body")
          .stop(true)
          .animate({ scrollTop: 0 }, reduced ? 0 : 350);
      else window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
      document.querySelector(".brand").focus({ preventScroll: true });
    }
  });
  const menu = document.querySelector(".menu-toggle");
  menu.addEventListener("click", () => {
    const expanded = menu.getAttribute("aria-expanded") === "true";
    menu.setAttribute("aria-expanded", String(!expanded));
    $id("main-nav").classList.toggle("is-open", !expanded);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.getAttribute("aria-expanded") === "true") {
      menu.setAttribute("aria-expanded", "false");
      $id("main-nav").classList.remove("is-open");
      menu.focus();
    }
  });
  function clubFor(id) {
    return D.clubs.find((club) => club.id === id);
  }
  function jersey(player) {
    return `<svg class="jersey" viewBox="0 0 80 80" aria-hidden="true" focusable="false">
      <path d="M26 10L11 18 3 35 18 43 24 34V72H56V34L62 43 77 35 69 18 54 10C47 18 33 18 26 10Z" fill="currentColor"/>
      <path d="M27 10C29 24 51 24 53 10" fill="none" stroke="#ffffff88" stroke-width="3"/>
      <path d="M24 32V67M56 32V67" stroke="#00000018" stroke-width="3"/>
      <text x="40" y="51" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="19" font-weight="bold">${player.number}</text>
      </svg>`;
  }
  function initDashboard() {
    let savedOnly = false;
    function render() {
      const query = $id("player-search").value.trim().toLowerCase(),
        position = $id("position-filter").value,
        sort = $id("player-sort").value;
      const players = D.players.filter(
        (p) =>
          (!position || p.position === position) &&
          (!savedOnly || shortlist.includes(p.id)) &&
          `${p.name} ${clubFor(p.club).name}`.toLowerCase().includes(query),
      );
      players.sort((a, b) =>
        sort === "price"
          ? a.price - b.price
          : sort === "value"
            ? b.points / b.price - a.points / a.price
            : sort === "name"
              ? a.name.localeCompare(b.name)
              : b.points - a.points,
      );
      $id("player-count").textContent =
        `${players.length} player${players.length === 1 ? "" : "s"} · demo data`;
      $id("player-total").textContent = D.players.length;
      $id("shortlist-total").textContent = shortlist.length;
      $id("plan-total").textContent = plans.length;
      $id("player-grid").innerHTML = players.length
        ? players
            .map((p) => {
              const club = clubFor(p.club),
                saved = shortlist.includes(p.id);
              return `<article class="player-card" style="--club:${club.color};--club-bg:${club.background}">
                <div class="player-card-top">
                <span class="position-tag">${p.position}</span>${jersey(p)}<button class="bookmark" data-player="${p.id}" aria-label="${saved ? "Remove" : "Shortlist"} ${escapeHTML(p.name)}" aria-pressed="${saved}">${saved ? "★" : "☆"}</button>
                </div>
                <div class="player-card-body">
                <h3>${escapeHTML(p.name)}</h3>
                <p class="player-club">${club.name}</p>
                <div class="player-metrics">
                <div>
                <span>PRICE</span>
                <strong>${money(p.price)}</strong>
                </div>
                <div>
                <span>POINTS</span>
                <strong>${p.points}</strong>
                </div>
                <div>
                <span>PTS / £m</span>
                <strong>${(p.points / p.price).toFixed(1)}</strong>
                </div>
                </div>
                <a class="player-link" href="planner.html?in=${p.id}">Plan a move <span aria-hidden="true">↗</span>
                <span class="visually-hidden"> for ${escapeHTML(p.name)}</span>
                </a>
                </div>
                </article>`;
            })
            .join("")
        : '<div class="empty-state"><h3>No players found</h3><p>Try a different name, position, or turn off the shortlist filter.</p></div>';
    }
    $id("player-search").addEventListener("input", render);
    ["position-filter", "player-sort"].forEach((id) => $id(id).addEventListener("change", render));
    $id("shortlist-filter").addEventListener("click", (e) => {
      savedOnly = !savedOnly;
      e.currentTarget.setAttribute("aria-pressed", String(savedOnly));
      render();
    });
    $id("player-grid").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-player]");
      if (!btn) return;
      const id = Number(btn.dataset.player);
      toggleSaved("player", id);
      render();
      const next = document.querySelector(`[data-player="${id}"]`);
      (next || $id("shortlist-filter")).focus();
    });
    render();
  }
  function initPlanner() {
    const form = $id("transfer-form");
    let lastSaved = null;
    function option(player) {
      return `<option value="${player.id}">${escapeHTML(player.name)} · ${player.position} · ${money(player.price)}</option>`;
    }
    $id("playerOut").insertAdjacentHTML("beforeend", D.players.map(option).join(""));
    $id("playerIn").insertAdjacentHTML("beforeend", D.players.map(option).join(""));
    function incomingOptions() {
      const out = D.players.find((p) => p.id === Number($id("playerOut").value));
      [...$id("playerIn").options].forEach((opt) => {
        const player = D.players.find((p) => p.id === Number(opt.value));
        opt.disabled = !!(
          out &&
          player &&
          (out.position !== player.position || out.id === player.id)
        );
      });
      if ($id("playerIn").selectedOptions[0]?.disabled) $id("playerIn").value = "";
    }
    function summary(values) {
      const out = D.players.find((p) => p.id === Number(values.playerOut)),
        incoming = D.players.find((p) => p.id === Number(values.playerIn));
      const result = C.calculateTransfer(values, D.players);
      if (
        !out ||
        !incoming ||
        out.id === incoming.id ||
        out.position !== incoming.position ||
        !result
      ) {
        $id("transfer-summary").innerHTML =
          '<div class="summary-empty"><span>⇄</span><p>Choose two different players in the same position, then enter your bank, selling price and transfer allowance.</p></div>';
        return;
      }
      $id("transfer-summary").innerHTML =
        `<div class="summary-swap">OUT · ${escapeHTML(out.name)}<strong>IN · ${escapeHTML(incoming.name)}</strong>
          </div>
          <div class="summary-row">
          <span>Sell</span>
          <strong>+ ${money(values.sellPrice)}</strong>
          </div>
          <div class="summary-row">
          <span>Buy</span>
          <strong>− ${money(result.buyPrice)}</strong>
          </div>
          <div class="summary-row">
          <span>Net bank change</span>
          <strong>${result.net >= 0 ? "+ " : ""}${money(result.net)}</strong>
          </div>
          <div class="summary-total ${result.remaining < 0 ? "over-budget" : ""}">
          <small>BANK AFTER THIS MOVE</small>
          <strong>${money(result.remaining)}</strong>
          </div>
          <div class="summary-row">
          <span>Total gameweek cost</span>
          <strong>${result.penalty ? "-" + result.penalty : "0"} pts</strong>
          </div>
          <div class="summary-row">
          <span>This swap adds</span>
          <strong>${result.additionalPenalty ? "-" + result.additionalPenalty : "0"} pts</strong>
          </div>${result.remaining < 0 ? '<p class="summary-warning">This move is over budget. Choose a cheaper replacement or revise your available bank.</p>' : ""}`;
    }
    function renderPlans() {
      updateSavedCount();
      $id("export-plans").disabled = plans.length === 0;
      $id("saved-plans").innerHTML = plans.length
        ? plans
            .map((plan) => {
              const out = D.players.find((p) => p.id === Number(plan.playerOut)),
                incoming = D.players.find((p) => p.id === Number(plan.playerIn)),
                result = C.calculateTransfer(plan, D.players);
              return `<article class="saved-card">
                <h3>${escapeHTML(plan.planName)}</h3>
                <p>${escapeHTML(out.name)} → ${escapeHTML(incoming.name)}</p>
                <div class="plan-bank">${money(result.remaining)}<small>remaining bank</small>
                </div>
                <div class="saved-card-bottom">
                <span>${result.penalty ? "-" + result.penalty : "0"} pts total · ${plan.chip === "none" ? "No chip" : plan.chip === "wildcard" ? "Wildcard" : "Free Hit"}</span>
                <button class="text-button danger-text" data-delete-plan="${escapeHTML(plan.id)}" aria-label="Delete ${escapeHTML(plan.planName)}">Delete</button>
                </div>
                </article>`;
            })
            .join("")
        : '<div class="empty-state"><h3>Your next move starts above.</h3><p>Save a transfer plan to compare it here. Try “Load example” to get started.</p></div>';
    }
    const controller = attachForm(
      form,
      (values) => C.validateTransfer(values, D.players),
      (values) => {
        const plan = {
          ...values,
          planName: values.planName.trim(),
          id: Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
        };
        plans = [plan, ...plans].slice(0, 20);
        const persisted = write("plans", plans);
        lastSaved = plan;
        $id("plan-success").textContent = persisted
          ? "Plan saved. The form is cleared and your result remains on the right."
          : "Plan calculated for this visit. Browser storage is unavailable; export it to keep a copy.";
        reveal($id("plan-success"));
        renderPlans();
        summary(plan);
      },
    );
    form.addEventListener("input", () => {
      lastSaved = null;
      $id("plan-success").hidden = true;
      summary(controller.values());
    });
    form.addEventListener("change", (e) => {
      lastSaved = null;
      $id("plan-success").hidden = true;
      if (e.target.id === "playerOut") {
        const out = D.players.find((p) => p.id === Number(e.target.value));
        $id("sellPrice").value = out ? out.price.toFixed(1) : "";
        incomingOptions();
        controller.validate();
      }
      summary(controller.values());
    });
    form.addEventListener("reset", () => {
      setTimeout(() => {
        incomingOptions();
        if (lastSaved) summary(lastSaved);
        else {
          $id("plan-success").hidden = true;
          summary(controller.values());
        }
      }, 0);
    });
    form.querySelector("[type=reset]").addEventListener("click", () => {
      lastSaved = null;
    });
    $id("example-plan").addEventListener("click", () => {
      lastSaved = null;
      form.reset();
      const values = {
        planName: "Saka to Son",
        bank: "1.5",
        playerOut: "5",
        playerIn: "3",
        sellPrice: "10.0",
        freeTransfers: "1",
        usedTransfers: "0",
        chip: "none",
      };
      Object.entries(values).forEach(([id, value]) => ($id(id).value = value));
      incomingOptions();
      summary(values);
      $id("planName").focus();
    });
    $id("saved-plans").addEventListener("click", (e) => {
      const button = e.target.closest("[data-delete-plan]");
      if (!button) return;
      plans = plans.filter((p) => p.id !== button.dataset.deletePlan);
      if (write("plans", plans)) toast("Plan deleted.");
      renderPlans();
      const next = $id("saved-plans").querySelector("button");
      (next || $id("example-plan")).focus();
    });
    $id("export-plans").addEventListener("click", () => {
      if (!plans.length) return;
      const blob = new Blob(
          [
            JSON.stringify(
              { app: "Fantasy Football Planner", data: "illustrative demo", plans },
              null,
              2,
            ),
          ],
          { type: "application/json" },
        ),
        url = URL.createObjectURL(blob),
        link = document.createElement("a");
      link.href = url;
      link.download = "fantasy-football-plans.json";
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast("Your plans export is ready.");
    });
    const requested = Number(new URLSearchParams(location.search).get("in"));
    if (D.players.some((p) => p.id === requested)) $id("playerIn").value = String(requested);
    renderPlans();
  }
  function initFixtures() {
    function render() {
      const query = $id("team-search").value.trim().toLowerCase(),
        venue = $id("venue-filter").value,
        sort = $id("fixture-sort").value;
      const clubs = D.fixtures
        .filter((c) => (c.name + " " + c.id).toLowerCase().includes(query))
        .map((c) => ({ ...c, average: C.fixtureAverage(c.matches, venue) }));
      clubs.sort((a, b) =>
        sort === "name"
          ? a.name.localeCompare(b.name)
          : sort === "hard"
            ? (b.average ?? -1) - (a.average ?? -1)
            : (a.average ?? Infinity) - (b.average ?? Infinity),
      );
      $id("fixture-count").textContent = `${clubs.length} clubs · GW8–GW11`;
      $id("fixture-rows").innerHTML = clubs
        .map(
          (c) =>
            `<tr>
              <th scope="row">
              <span class="club-label" style="--club:${c.color};--club-bg:${c.background}">
              <span class="club-initials" aria-hidden="true">${c.id}</span>
              <span class="club-name">${c.name}</span>
              </span>
              </th>${c.matches.map((m) => `<td>${venue && m.venue !== venue ? '<span class="venue-muted" aria-label="Excluded by venue filter">—</span>' : `<span class="fixture-cell d${m.rating}" aria-label="${clubFor(m.opponent).name}, ${m.venue === "H" ? "home" : "away"}, difficulty ${m.rating}">${m.opponent} (${m.venue})<small>FDR ${m.rating}</small>
              </span>`}</td>`).join("")}<td>${c.average === null ? "—" : c.average.toFixed(1)}</td>
              </tr>`,
        )
        .join("");
      $id("fixture-empty").hidden = clubs.length > 0;
      const ranked = [...clubs]
        .filter((c) => c.average !== null)
        .sort((a, b) => a.average - b.average);
      const best = ranked[0],
        hardest = ranked.at(-1);
      $id("fixture-insights").innerHTML = best
        ? `<div class="insight-card">
          <p class="eyebrow">EASIEST VISIBLE RUN</p>
          <h2>${best.name} <span aria-hidden="true">↗</span>
          </h2>
          <p>${best.average.toFixed(1)} average difficulty across ${best.matches.filter((m) => !venue || m.venue === venue).length} matching fixtures. Use this as a starting point for your shortlist.</p>
          </div>
          <div class="insight-card hard-run">
          <p class="eyebrow">TOUGHEST VISIBLE RUN</p>
          <h2>${hardest.name}</h2>
          <p>${hardest.average.toFixed(1)} average difficulty. Check the individual fixtures before deciding when to make a change.</p>
          </div>`
        : "";
    }
    $id("team-search").addEventListener("input", render);
    ["venue-filter", "fixture-sort"].forEach((id) => $id(id).addEventListener("change", render));
    $id("reset-fixtures").addEventListener("click", () => {
      $id("team-search").value = "";
      $id("venue-filter").value = "";
      $id("fixture-sort").value = "easy";
      render();
    });
    render();
  }
  function initArticles() {
    let savedOnly = false,
      currentArticle = null,
      lastTrigger = null;
    const dialog = $id("article-dialog");
    function render() {
      const query = $id("article-search").value.trim().toLowerCase(),
        category = $id("article-category").value;
      const articles = D.articles.filter(
        (a) =>
          (!category || a.category === category) &&
          (!savedOnly || bookmarks.includes(a.id)) &&
          (a.title + " " + a.summary + " " + a.category).toLowerCase().includes(query),
      );
      $id("article-count").textContent =
        `${articles.length} article${articles.length === 1 ? "" : "s"}`;
      $id("article-grid").innerHTML = articles.length
        ? articles
            .map(
              (a) =>
                `<article class="article-card">
                  <div class="article-art ${a.category.toLowerCase()}" aria-hidden="true">
                  <span class="article-art-number">0${a.id}</span>
                  <span class="article-art-icon">${a.symbol}</span>
                  </div>
                  <div class="article-card-body">
                  <span class="article-tag">${a.category}${bookmarks.includes(a.id) ? " · SAVED" : ""}</span>
                  <h3>${escapeHTML(a.title)}</h3>
                  <p>${escapeHTML(a.summary)}</p>
                  <div class="article-card-bottom">
                  <button class="text-button" data-read="${a.id}" aria-label="Read ${escapeHTML(a.title)}">Read story ↗</button>
                  <small>${a.minutes} min read</small>
                  </div>
                  </div>
                  </article>`,
            )
            .join("")
        : '<div class="empty-state"><h3>No stories found</h3><p>Try another topic or turn off the saved articles filter.</p></div>';
    }
    function updateSave() {
      const saved = bookmarks.includes(currentArticle);
      $id("dialog-save").textContent = saved ? "★ Saved article" : "☆ Save article";
      $id("dialog-save").setAttribute("aria-pressed", String(saved));
    }
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-read]");
      if (!btn) return;
      const a = D.articles.find((article) => article.id === Number(btn.dataset.read));
      if (!a) return;
      currentArticle = a.id;
      lastTrigger = btn;
      $id("dialog-title").textContent = a.title;
      $id("dialog-category").textContent = a.category;
      $id("dialog-meta").textContent =
        `${a.minutes} min read · Fantasy Football Planner · Demo editorial`;
      $id("dialog-body").replaceChildren(
        ...a.body.map((text) => {
          const p = document.createElement("p");
          p.textContent = text;
          return p;
        }),
      );
      updateSave();
      dialog.showModal();
      dialog.scrollTop = 0;
      $id("close-article").focus();
    });
    $id("close-article").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) {
        const box = dialog.getBoundingClientRect();
        if (
          e.clientX < box.left ||
          e.clientX > box.right ||
          e.clientY < box.top ||
          e.clientY > box.bottom
        )
          dialog.close();
      }
    });
    dialog.addEventListener("close", () => {
      if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
      else document.querySelector(`[data-read="${currentArticle}"]`)?.focus();
    });
    $id("dialog-save").addEventListener("click", () => {
      toggleSaved("article", currentArticle);
      updateSave();
      render();
    });
    $id("article-search").addEventListener("input", render);
    $id("article-category").addEventListener("change", render);
    $id("saved-articles-filter").addEventListener("click", (e) => {
      savedOnly = !savedOnly;
      e.currentTarget.setAttribute("aria-pressed", String(savedOnly));
      render();
    });
    $id("readerClub").insertAdjacentHTML(
      "beforeend",
      D.clubs.map((c) => `<option value="${c.id}">${c.name}</option>`).join(""),
    );
    let preferences = read("preferences", null);
    function showPreferences() {
      if (
        preferences &&
        clubFor(preferences.club) &&
        ["Captaincy", "Transfers", "Fixtures", "Strategy"].includes(preferences.topic) &&
        ["Every gameweek", "Every month"].includes(preferences.frequency)
      )
        $id("preference-current").textContent =
          `Your preferences: ${clubFor(preferences.club).name} · ${preferences.topic} · ${preferences.frequency}.`;
    }
    attachForm(
      $id("preference-form"),
      (values) => {
        const errors = C.validatePreferences(values);
        if (!clubFor(values.readerClub)) errors.readerClub = "Choose a club from the list.";
        return errors;
      },
      (values) => {
        preferences = {
          club: values.readerClub,
          topic: values.readerTopic,
          frequency: values.readerFrequency,
        };
        const persisted = write("preferences", preferences);
        showPreferences();
        $id("preference-success").textContent = persisted
          ? "Preferences saved on this browser. The form is cleared. No email has been sent."
          : "Preferences applied for this visit. Browser storage is unavailable. No email has been sent.";
        reveal($id("preference-success"));
      },
    );
    $id("preference-form").addEventListener("input", () => {
      $id("preference-success").hidden = true;
    });
    showPreferences();
    render();
    const requestedArticle = Number(new URLSearchParams(location.search).get("article"));
    if (D.articles.some(a => a.id === requestedArticle)) document.querySelector(`[data-read="${requestedArticle}"]`)?.click();
  }
  function initSaved() {
    const sources = {shortlist: () => shortlist, bookmarks: () => bookmarks, plans: () => plans};
    const empty = (label, link) => `<div class="empty-state"><h3>No ${label} saved yet.</h3><p><a href="${link}">Explore and save your first item →</a></p></div>`;
    const remove = (kind, id, label) => `<button class="text-button danger-text" data-remove-kind="${kind}" data-remove-id="${escapeHTML(id)}" aria-label="Remove ${escapeHTML(label)}">Remove</button>`;
    function render() {
      updateSavedCount();
      const players = D.players.filter(p => shortlist.includes(p.id));
      $id("saved-value").textContent = `${players.length} player${players.length === 1 ? "" : "s"} · Combined demo price ${money(players.reduce((sum,p) => sum + Math.round(p.price * 10), 0) / 10)}`;
      $id("workspace-players").innerHTML = players.map(p => `<article class="saved-card col-12"><h3>${escapeHTML(p.name)}</h3><p>${p.position} · ${escapeHTML(clubFor(p.club).name)} · ${money(p.price)}</p><div class="saved-card-bottom"><a href="planner.html?in=${p.id}">Plan a transfer →</a>${remove("shortlist", p.id, p.name)}</div></article>`).join("") || empty("players", "index.html");
      $id("workspace-articles").innerHTML = D.articles.filter(a => bookmarks.includes(a.id)).map(a => `<article class="saved-card col-12"><h3>${escapeHTML(a.title)}</h3><p>${escapeHTML(a.category)}</p><div class="saved-card-bottom"><a href="articles.html?article=${a.id}">Read article →</a>${remove("bookmarks", a.id, a.title)}</div></article>`).join("") || empty("articles", "articles.html");
      $id("workspace-plans").innerHTML = plans.map(p => { const result = C.calculateTransfer(p,D.players); return `<article class="saved-card col-12"><h3>${escapeHTML(p.planName)}</h3><p>${escapeHTML(D.players.find(x => x.id === Number(p.playerOut)).name)} → ${escapeHTML(D.players.find(x => x.id === Number(p.playerIn)).name)}</p><p>${money(result.remaining)} bank · ${result.penalty} points cost</p>${remove("plans",p.id,p.planName)}</article>`; }).join("") || empty("plans", "planner.html");
      document.querySelectorAll("[data-clear]").forEach(b => b.disabled = !sources[b.dataset.clear]().length);
    }
    document.querySelector("main").addEventListener("click", e => {
      const button = e.target.closest("[data-clear], [data-remove-kind]");
      if (!button) return;
      const kind = button.dataset.clear || button.dataset.removeKind;
      const id = button.dataset.removeId;
      const next = button.dataset.clear ? [] : sources[kind]().filter(item => String(kind === "plans" ? item.id : item) !== id);
      if (kind === "shortlist") shortlist = next;
      else if (kind === "bookmarks") bookmarks = next;
      else plans = next;
      const persisted = write(kind, next);
      render();
      const status = $id("saved-status");
      status.hidden = false;
      status.textContent = persisted ? (button.dataset.clear ? "List cleared." : "Item removed.") : "Removed for this visit only. Browser storage is unavailable.";
      status.tabIndex = -1;
      status.focus();
    });
    render();
  }
  const pages = {
    saved: initSaved,
    index: initDashboard,
    planner: initPlanner,
    fdr: initFixtures,
    articles: initArticles,
  };
  pages[document.body.dataset.page]?.();
})();

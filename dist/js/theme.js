/* Runs before paint so navigation does not flash the wrong theme. */
(function () {
  let theme = "light";
  try { const saved = JSON.parse(localStorage.getItem("fpl:theme"));
    if (saved === "dark" || saved === "light") theme = saved;
    else if (window.matchMedia("(prefers-color-scheme: dark)").matches) theme = "dark";
  } catch { /* Invalid or unavailable storage uses the safe light default. */ }
  document.documentElement.dataset.theme = theme;
})();

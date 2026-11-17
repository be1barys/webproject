/* Pure functions: kept independent of the DOM so financial logic can be tested. */
(function (root) {
  "use strict";
  function numeric(value, min, max, integer = false) {
    if (String(value).trim() === "") return false;
    const n = Number(value);
    return Number.isFinite(n) && n >= min && n <= max && (!integer || Number.isInteger(n));
  }
  function isTenth(value) {
    return Math.abs(Number(value) * 10 - Math.round(Number(value) * 10)) < 1e-7;
  }
  function validateTransfer(values, players) {
    const errors = {};
    const out = players.find((p) => p.id === Number(values.playerOut));
    const incoming = players.find((p) => p.id === Number(values.playerIn));
    if (!values.planName || values.planName.trim().length < 3 || values.planName.trim().length > 40)
      errors.planName = "Use a plan name between 3 and 40 characters.";
    if (!numeric(values.bank, 0, 100) || !isTenth(values.bank))
      errors.bank = "Enter a bank from £0.0m to £100.0m, in steps of £0.1m.";
    if (!out) errors.playerOut = "Choose a player to sell.";
    if (!incoming) errors.playerIn = "Choose a player to buy.";
    else if (out && out.id === incoming.id)
      errors.playerIn = "Choose a different player from the one you are selling.";
    else if (out && out.position !== incoming.position)
      errors.playerIn = "The replacement must play in the same position.";
    if (!numeric(values.sellPrice, 0.1, 20) || !isTenth(values.sellPrice))
      errors.sellPrice = "Enter a selling price from £0.1m to £20.0m, in steps of £0.1m.";
    if (!numeric(values.freeTransfers, 0, 5, true))
      errors.freeTransfers = "Enter a whole number from 0 to 5.";
    if (!numeric(values.usedTransfers, 0, 14, true))
      errors.usedTransfers = "Enter a whole number from 0 to 14.";
    if (!["none", "wildcard", "freehit"].includes(values.chip))
      errors.chip = "Choose one of the available chip options.";
    if (
      incoming &&
      !errors.bank &&
      !errors.sellPrice &&
      Math.round(Number(values.bank) * 10) + Math.round(Number(values.sellPrice) * 10) <
        Math.round(incoming.price * 10)
    )
      errors.bank = "This move is over budget. Add enough bank or choose a cheaper player.";
    return errors;
  }
  function calculateTransfer(values, players) {
    const incoming = players.find((p) => p.id === Number(values.playerIn));
    if (
      !incoming ||
      !numeric(values.bank, 0, 100) ||
      !numeric(values.sellPrice, 0.1, 20) ||
      !numeric(values.freeTransfers, 0, 5, true) ||
      !numeric(values.usedTransfers, 0, 14, true)
    )
      return null;
    // Money is calculated in integer tenths of a million to avoid float errors.
    const remaining =
      (Math.round(Number(values.bank) * 10) +
        Math.round(Number(values.sellPrice) * 10) -
        Math.round(incoming.price * 10)) /
      10;
    const chipActive = values.chip === "wildcard" || values.chip === "freehit";
    const before = chipActive
      ? 0
      : Math.max(0, Number(values.usedTransfers) - Number(values.freeTransfers)) * 4;
    const penalty = chipActive
      ? 0
      : Math.max(0, Number(values.usedTransfers) + 1 - Number(values.freeTransfers)) * 4;
    return {
      remaining,
      penalty,
      additionalPenalty: penalty - before,
      buyPrice: incoming.price,
      net: (Math.round(Number(values.sellPrice) * 10) - Math.round(incoming.price * 10)) / 10,
    };
  }
  function fixtureAverage(matches, venue = "") {
    const shown = matches.filter((m) => !venue || m.venue === venue);
    return shown.length ? shown.reduce((sum, m) => sum + m.rating, 0) / shown.length : null;
  }
  function validatePreferences(values) {
    const errors = {};
    if (
      !values.readerName ||
      values.readerName.trim().length < 2 ||
      values.readerName.trim().length > 50
    )
      errors.readerName = "Enter a name between 2 and 50 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.readerEmail || ""))
      errors.readerEmail = "Enter a valid email address, such as you@example.com.";
    if (!values.readerClub) errors.readerClub = "Choose your favourite club.";
    if (!["Captaincy", "Transfers", "Fixtures", "Strategy"].includes(values.readerTopic))
      errors.readerTopic = "Choose an area of interest.";
    if (!["Every gameweek", "Every month"].includes(values.readerFrequency))
      errors.readerFrequency = "Choose how often you like to read.";
    if (!values.readerConsent)
      errors.readerConsent = "Confirm that preferences can be saved on this browser.";
    return errors;
  }
  root.FPL_CORE = {
    numeric,
    validateTransfer,
    calculateTransfer,
    fixtureAverage,
    validatePreferences,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = root.FPL_CORE;
})(typeof window !== "undefined" ? window : globalThis);

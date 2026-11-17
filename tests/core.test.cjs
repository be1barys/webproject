const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { players, fixtures, articles, clubs } = require("../dist/js/data.js");
const {
  calculateTransfer,
  validateTransfer,
  fixtureAverage,
  validatePreferences,
} = require("../dist/js/core.js");
const example = {
  planName: "Saka to Son",
  playerOut: "5",
  playerIn: "3",
  bank: "1.5",
  sellPrice: "10.0",
  freeTransfers: "1",
  usedTransfers: "0",
  chip: "none",
};
test("Saka to Son leaves £1.7m and no points cost", () => {
  assert.deepEqual(validateTransfer(example, players), {});
  assert.deepEqual(calculateTransfer(example, players), {
    remaining: 1.7,
    penalty: 0,
    additionalPenalty: 0,
    buyPrice: 9.8,
    net: 0.2,
  });
});
test("Money arithmetic uses tenths without floating-point drift", () => {
  assert.equal(calculateTransfer({ ...example, bank: 0, sellPrice: 9.9 }, players).remaining, 0.1);
});
test("Total and incremental penalties are distinct", () => {
  const result = calculateTransfer({ ...example, usedTransfers: 2 }, players);
  assert.equal(result.penalty, 8);
  assert.equal(result.additionalPenalty, 4);
});
test("Banked free transfers cover moves until their quota is exhausted", () => {
  assert.equal(
    calculateTransfer({ ...example, freeTransfers: 5, usedTransfers: 4 }, players).penalty,
    0,
  );
  assert.equal(
    calculateTransfer({ ...example, freeTransfers: 5, usedTransfers: 5 }, players).penalty,
    4,
  );
});
test("Both supported chips remove total and incremental costs", () => {
  for (const chip of ["wildcard", "freehit"]) {
    const result = calculateTransfer(
      { ...example, usedTransfers: 14, freeTransfers: 0, chip },
      players,
    );
    assert.equal(result.penalty, 0);
    assert.equal(result.additionalPenalty, 0);
  }
});
test("Over-budget plans cannot be saved, but have a negative preview", () => {
  const values = { ...example, bank: 0, sellPrice: 5 };
  assert.ok(validateTransfer(values, players).bank);
  assert.equal(calculateTransfer(values, players).remaining, -4.8);
});
test("Same-player and cross-position swaps are rejected", () => {
  assert.match(validateTransfer({ ...example, playerIn: "5" }, players).playerIn, /different/);
  assert.match(validateTransfer({ ...example, playerIn: "1" }, players).playerIn, /same position/);
});
test("Required, range, precision and integer errors are handled", () => {
  for (const value of ["", -1, "NaN", Infinity, 101, "1.55"])
    assert.ok(validateTransfer({ ...example, bank: value }, players).bank);
  for (const value of ["", 0, 20.1, "2.56"])
    assert.ok(validateTransfer({ ...example, sellPrice: value }, players).sellPrice);
  for (const value of ["", -1, 1.5, 6])
    assert.ok(validateTransfer({ ...example, freeTransfers: value }, players).freeTransfers);
  assert.ok(validateTransfer({ ...example, usedTransfers: 15 }, players).usedTransfers);
  assert.ok(validateTransfer({ ...example, planName: "ab" }, players).planName);
});
test("Untrusted player IDs and unknown chips cannot be saved", () => {
  assert.ok(validateTransfer({ ...example, playerIn: "999" }, players).playerIn);
  assert.ok(validateTransfer({ ...example, chip: "anything" }, players).chip);
  assert.equal(calculateTransfer({ ...example, playerIn: 999 }, players), null);
});
test("Twenty players and eight full articles have unique IDs", () => {
  assert.equal(players.length, 20);
  assert.equal(articles.length, 8);
  for (const items of [players, articles, clubs])
    assert.equal(new Set(items.map((x) => x.id)).size, items.length);
  players.forEach((p) => assert.ok(clubs.some((c) => c.id === p.club)));
  articles.forEach((a) => {
    assert.ok(a.body.length >= 3);
    assert.ok(a.minutes > 0);
  });
});
test("Fixture schedule is reciprocal with one opponent per club and week", () => {
  for (const club of fixtures) {
    assert.equal(club.matches.length, 4);
    assert.equal(new Set(club.matches.map((m) => m.opponent)).size, 4);
    for (const match of club.matches) {
      assert.notEqual(match.opponent, club.id);
      const reverse = fixtures
        .find((c) => c.id === match.opponent)
        .matches.find((m) => m.week === match.week);
      assert.equal(reverse.opponent, club.id);
      assert.notEqual(reverse.venue, match.venue);
      assert.ok(match.rating >= 1 && match.rating <= 5);
    }
  }
});
test("Fixture averages reflect venue selection and empty sets", () => {
  const matches = [
    { rating: 1, venue: "H" },
    { rating: 5, venue: "A" },
    { rating: 3, venue: "H" },
  ];
  assert.equal(fixtureAverage(matches), 3);
  assert.equal(fixtureAverage(matches, "H"), 2);
  assert.equal(fixtureAverage(matches, "A"), 5);
  assert.equal(fixtureAverage([], ""), null);
});
test("Preference form validates email, name, selected options and consent", () => {
  const valid = {
    readerName: "Sam",
    readerEmail: "sam@example.com",
    readerClub: "ARS",
    readerTopic: "Strategy",
    readerFrequency: "Every gameweek",
    readerConsent: true,
  };
  assert.deepEqual(validatePreferences(valid), {});
  for (const email of ["", "sam", "sam@", "sam@example", "s am@example.com"])
    assert.ok(validatePreferences({ ...valid, readerEmail: email }).readerEmail);
  assert.ok(validatePreferences({ ...valid, readerName: "x" }).readerName);
  assert.ok(validatePreferences({ ...valid, readerConsent: false }).readerConsent);
  assert.ok(validatePreferences({ ...valid, readerFrequency: "never" }).readerFrequency);
});
test("All local HTML resource and navigation paths exist", () => {
  for (const file of ["index.html", "planner.html", "fdr.html", "articles.html"]) {
    const html = fs.readFileSync(path.join(__dirname, "../dist", file), "utf8");
    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const target = match[1];
      if (/^(https?:|#)/.test(target)) continue;
      assert.ok(
        fs.existsSync(path.join(__dirname, "../dist", target.split(/[?#]/)[0])),
        `${file}: missing ${target}`,
      );
    }
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
    assert.match(html, /aria-current="page"/);
    assert.match(html, /OpenAI ChatGPT\/Codex/);
  }
});

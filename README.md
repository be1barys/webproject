# Fantasy Football Planner - Final revision

Original authors credited in the supplied project: Yerassyl Almakhan and Ualikhan Beibarys. Confirm the official roster before submission. Development and report drafting assisted by OpenAI ChatGPT/Codex.

## Run

From this folder run `python3 -m http.server 8000 --directory dist`, then open http://localhost:8000. You may also open `dist/index.html` directly, but browser storage across file:// pages varies; use a local server for the defense. No npm install or backend is required. Bootstrap CSS uses the existing online CDN; other scripts and images are bundled.

## New since the uploaded Endterm

- Light/dark toggle on all five pages, with JSON localStorage persistence and before-paint theme selection.
- `saved.html`: cross-page player shortlist, reading list and saved transfer plans, with one-by-one removal and clear-list buttons.
- Shared saved-item counter and calculated shortlist price total.
- Direct article links and incoming-player links from Saved workspace.
- Matching dark form, table, card, dialog and status colors.
- Four theme tests, screenshots, and a PDF report draft with defense explanations.

Retained: the original dashboard, transfer planner, fixture table and articles; stadium background; filtering and sorting; inline form validation; accurate integer-tenths price calculations; plan export; three jQuery effect types (sliding, fading and scroll animation).

## Code guide

- `dist/js/data.js`: illustrative players, clubs, fixtures and articles.
- `dist/js/core.js`: pure calculation/validation functions.
- `dist/js/app.js`: events, rendering, JSON storage helpers, theme button, page controllers.
- `dist/js/theme.js`: reads the stored palette before paint.
- `dist/css/style.css`: custom responsive styling and CSS variables.
- `tests/core.test.cjs`, `tests/theme.test.cjs`: run with `npm test`.
- `report/`: PDF draft and actual browser screenshots.
- `.github/workflows/pages.yml`: deploys dist using GitHub Actions in the original repository.

## Storage

No database server or application cookies. Browser localStorage keys: `fpl:shortlist`, `fpl:bookmarks`, `fpl:plans`, `fpl:preferences`, `fpl:theme`. JSON values are scoped to the browser and origin. Name/email from the preferences form are validated but not stored or sent. Clearing browser data removes saved content. If storage is unavailable the UI reports that changes cannot persist.

## Verified and remaining checks

18 Node tests pass. App and theme JavaScript syntax checks pass. Desktop browser checks confirmed cross-page saved players/plans/articles, price totals, theme persistence, individual removal and clearing players. Screenshots are included. The available desktop viewport was 1363px. Complete every page at 375, 768 and 1280px in both modes, W3C validation, full keyboard navigation and the acceptance checklist before submission. Browser extension errors were observed; a completely clean console has not been certified.

## Submission actions requiring your details

1. Add actual team contributions, Endterm defense remarks and verified source credits to the report.
2. Copy the project into your existing GitHub repository while preserving history. Make your own real commits; none were fabricated here.
3. Deploy using your existing Pages configuration or the included workflow, then add the original repository and live website URLs to the report. No deployment was performed during this revision.
4. Verify the original source/license of the supplied stadium image and add it to report and website credits.
5. Confirm official name spelling. Submit the Final ZIP and completed PDF separately. The included PDF is a draft until these details and checks are complete.

## Credits

- Original concept/pages: Yerassyl Almakhan and Ualikhan Beibarys, as credited in the supplied archive.
- OpenAI ChatGPT/Codex: implementation assistance, custom CSS/SVG artwork, illustrative text, tests and report drafting.
- Bootstrap 5.3.3: base/form styles and grid classes, MIT, https://getbootstrap.com/ .
- jQuery 3.6.1: effects, MIT, https://jquery.com/ ; license bundled in dist/vendor.
- Stadium background: supplied `stadium-bg.jpg`; earlier footer calls it “Twilight Stadium Ball on Emerald Turf” and credits Claude (Anthropic) for the CSS integration. Original image source/license was not provided and must be confirmed by the author.

Football data are illustrative, not a current season or official FPL integration. The transfer model covers one swap, not full squad legality.

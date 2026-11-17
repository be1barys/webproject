# Manual acceptance and screenshot checklist

Status: pending browser verification. Do not mark a check passed until you have performed it.

## All four pages

- [ ] Open at 375px, 768px and 1280px. No page-level horizontal scroll, clipped content or overlaps.
- [ ] Confirm navigation works, active page is highlighted and the mobile Menu opens/closes. Escape closes the mobile menu.
- [ ] Tab through all interactive elements; the focus ring is visible. Activate buttons with Enter/Space.
- [ ] Credits accordion survives ten quick clicks and ends in the expected state. Back to top scrolls and restores focus.
- [ ] Check the browser console for errors. Reload and check that local assets load.
- [ ] Enable reduced motion and repeat help, toast and scroll interactions.

## Dashboard

- [ ] All 20 player cards render. Search “Saka”, then an impossible name; the empty state appears.
- [ ] Filter DEF and sort lowest price, points per £m, name and total points.
- [ ] Shortlist a player, reload and enable the shortlist filter. Remove the player and check counters.
- [ ] Use a player's “Plan a move” link; the incoming player is preselected.

## Transfer planner

- [ ] Empty submit shows field-specific errors, with focus on the first invalid field. Correct fields and see their errors disappear.
- [ ] Load example, save: Saka £10.0m to Son £9.8m with £1.5m bank leaves £1.7m, 0-point cost. Form clears and saved plan appears.
- [ ] One free transfer and two already made: preview total cost 8 points, incremental cost 4. Wildcard/Free Hit makes both zero.
- [ ] Enter £0.0m bank and £5.0m selling price for Son: negative preview, clear inline budget error, no save.
- [ ] Test decimal transfer counts, negative money, an overly short plan name and cross-position selections.
- [ ] Save a plan named `<img src=x onerror=alert(1)>`; text should display literally without executing.
- [ ] Reload saved plans, delete one and export the remainder as readable JSON.
- [ ] In a browser with storage blocked, confirm graceful messaging and session-only behavior.

## Fixture difficulty

- [ ] All 20 clubs have four fixtures, rating labels and an average.
- [ ] Search for Arsenal; test an unmatched name. Reset returns all clubs.
- [ ] Sort easiest/hardest and change Home/Away. Recalculate at least one average by hand.

## Articles and preferences

- [ ] Search/filter each topic. Open and read an article; Escape and the close button dismiss it and return focus.
- [ ] Save an article, reload, and use Saved articles. Unsave it and confirm the empty state if appropriate.
- [ ] Submit an empty preference form and an invalid email; errors appear under the correct fields.
- [ ] Submit all six valid fields. Success appears, form clears, and only club/topic/frequency are in local storage. No email is sent.

## Screenshots to insert into the report

Capture your own browser screenshots after testing:
1. Desktop dashboard with a filtered player list and shortlist counter.
2. Transfer planner showing the £1.7m result and a saved plan.
3. Invalid transfer form with an inline budget error.
4. Fixture table with Home only selected and the recomputed average.
5. Article reader plus saved state; separately, a successful preferences form.
6. All four pages at 375px and a representative 768px view.

Do not use generated mockups as evidence of working software.

## Final additions

- On every page, toggle theme with Enter and Space; navigate and reload; selection persists.
- Test all five pages at 375/768/1280px in both themes, including open dialogs and errors.
- Save players on Dashboard and articles in the article dialog. Saved workspace shows them and the nav count; verify price total.
- Save a valid plan, reload, and find it in Saved workspace. Remove individual items and clear each list; verify empty states and persistence after navigation.
- Follow player and article links from Saved workspace and check the selected player / opened article.
- Empty localStorage, corrupt one JSON key and block storage separately; verify no crash and honest persistence feedback.
- Complete the report's team, feedback, image credit and deployment details.

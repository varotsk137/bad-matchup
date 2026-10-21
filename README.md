# 🏸 Bad Matchup

**Fair, automatic court scheduling for badminton sessions.**
Thai name: *จับคู่ตีแบด* · Live app: **https://varotsk137.github.io/bad-matchup/**

Bad Matchup decides who plays, with whom, on which court, round after round, for casual
groups who would otherwise keep a rotation on paper. It runs entirely in the browser: no
backend, no database, no accounts. All data stays in the device's `localStorage`.

The interface is available in Thai and English.

---

## Highlights

- **Everyone partners everyone.** With 9 players on one court, 20 rounds pair every couple at
  least once, and the app tells you how many rounds that takes before you start.
- **Stamina-aware.** No one plays more rounds in a row than you allow, and when there are too
  few players to rest everyone on time you choose the trade-off.
- **Built for the court, not the desk.** Tick matches off as they finish, add a round at a time,
  and when someone leaves or arrives the app flags it and rebuilds only what is still to come.
- **Fair to part-timers.** Late arrivals and early leavers are judged against the rounds they
  were actually there for, so nobody is rushed on court to "catch up".
- **Shows its work.** A fairness check in Stats compares every number with what was actually
  achievable, and an in-app guide explains how the engine reasons.

## Features

### Players and courts
- Add players one at a time or in bulk, with gender and a five-step level ladder
  (🐣 NB · 🌱 BG · ⭐ N · 🔥 S · 👑 P). New players start at NB.
- Doubles and singles courts. Courts can be switched on and off mid-session.
- Saved **rosters** (for example "Tuesday group") can replace the current list or be merged into it.
- Saved **setups** store every setting plus the courts, so a regular session is one tap away.

### Scheduling
- **Modes:** *Balanced* (the default and the focus of the engine), *Random*, and *Manual*. In
  Manual you tap players into slots and let the app fill in the rest.
- **Round suggestions.** Before a session, the app suggests how many rounds give every pair a
  chance to partner, and how many fit your court booking. Hours booked and minutes per game are
  both adjustable.
- **Stamina** limits consecutive rounds (1–4). When rests cannot all fit, pick one of:
  - *Fill courts:* every court runs every round.
  - *Flexible* (default): full courts while everyone is fresh, then fewer courts or singles as
    people tire. At most one round past the limit.
  - *Rest on time:* no one ever exceeds the limit, and the number of courts varies to fit as
    much play as rests allow.
  - Stamina can also be switched off entirely.
- **No idle courts** (optional, on by default): a court that would sit empty becomes two singles
  courts. Singles are spread evenly and never given to the same person twice in a row.
- **Build three times, keep the fairest** (on by default): each batch is built three times and
  the best result is kept. A time budget keeps very large schedules under about ten seconds.
- **One round at a time.** Adding a single round draws from a plan for the rest of the session,
  so tapping "add round" twenty times is as fair as building twenty rounds at once. The plan is
  rebuilt automatically when anything it depends on changes.

### During the session
- Tick a match done straight from the schedule table, with no score required. Finished rounds
  fade, and the current round is highlighted.
- **Reshuffle** either redoes the rounds still to come (keeping everything already played and
  counting it), with a chosen number of rounds, or starts over.
- When someone leaves or arrives after the schedule was built, a banner names them and offers a
  one-tap rebuild of the remaining rounds.
- Swap any two players, including someone on the bench, by tapping their names.
- Scores are optional. When entered they feed win/loss statistics.
- A **Stamina** view in the schedule table shows each player's streak and rest count.

### Statistics
- Games, wins, win rate, point difference and distinct partners per player.
- Tap a player to see doubles and singles games and how often they partnered and faced each
  other player.
- **How even is it?** grades partner coverage, opponent spread, games, streaks, rests and
  singles against what the schedule could reach, and includes a who-met-whom grid. Part-time
  players are compared with their fair share.

### Sharing
- **Share links** carry the whole schedule inside the URL fragment, in *view only* or
  *copy and edit* mode. No server is involved.
- **Save as image** renders a clean PNG of the plan (rounds, courts, names and who sits out) for
  the group chat. Levels, stamina, scores and ticks stay on the organiser's screen. On phones the
  image can be saved with a long press, downloaded, or sent through the share sheet.

### Everything else
- Thai and English, light and dark themes. The first visit follows the system; afterwards the
  user's choice sticks.
- Five skins — Classic (the default), League, Scoreboard, Editorial and Candy — that change
  colours, fonts, outlines, shadows and corner shapes. Only the look changes; everything works
  the same.
- JSON backup export and import.

---

## Getting started

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:5173. The dev server listens on all interfaces, so phones on the same
network can connect too.

## Tests

```bash
npm test
```

The engine is covered by a Vitest suite with seeded randomness, so every run is repeatable:

| File | What it guards |
| --- | --- |
| `matchmaker.rules.test.js` | Rules every schedule must follow: well-formed rounds, the stamina limit of each rest mode, court use, editing tools, late arrivals, round suggestions |
| `matchmaker.quality.test.js` | Quality levels measured during tuning, e.g. 9 players over 20 rounds must pair every couple |
| `plan.test.js` | The one-round-at-a-time plan survives ticks and scores, and is discarded on real changes |
| `roster.test.js` | Detection of players who left or arrived after the schedule was built |
| `stats.test.js` | Fair-share statistics for part-time players |
| `ops.test.js` | Every named change to the data is pure and does what its screen promises |
| `store.test.js` | The local store notifies, saves once per burst and loads back |
| `storage.test.js` | Old, partial or broken saves and backups load as a complete state |

End-to-end checks drive the real app in Chromium with Playwright: adding a player, building
and ticking a schedule, opening a share link, and remembering language and theme, each across
a reload.

```bash
npx playwright install chromium   # once
npm run e2e
```

GitHub Actions runs both suites on every branch push, and the unit suite again before each
deploy. A failing test blocks the release.

## Deployment

The build is fully static:

```bash
npm run build
```

Output goes to `dist/`. `vite.config.js` sets `base: './'`, so the same build works at a domain
root or under a sub-path such as GitHub Pages.

| Host | Setup |
| --- | --- |
| GitHub Pages | Already configured: pushing to `main` tests, builds and deploys via `.github/workflows/deploy.yml` |
| Vercel | Import the repository and pick the *Vite* preset |
| Netlify | Build command `npm run build`, publish directory `dist` |
| Cloudflare Pages | Build command `npm run build`, output directory `dist` |

No environment variables or rewrite rules are needed; it is a single page without routing.

For a fork on GitHub Pages, set **Settings → Pages → Source** to *GitHub Actions* once.
The workflow's `GITHUB_TOKEN` cannot enable Pages by itself.

### Versions

Releases are tagged (`v1.0.0`, …). `main` is what the live site runs; new work happens on a
version branch (currently `v2.2`) and reaches the site when it is merged into `main`. The running
version is shown at the bottom of the Settings page.

---

## How the matching works

All of the engine lives in `src/lib/matchmaker.js` as pure functions. Every statistic is derived
from the round history, so editing or deleting a round corrects everything downstream.

1. **How many courts to run.** When not everyone can rest on time, the rest mode decides. In
   *Flexible* and *Rest on time* the engine looks three rounds ahead, so a greedy round of full
   courts does not leave the next round short of fresh players.
2. **Who plays.** Each player present is scored on fewer games than their fair share, time spent
   waiting, and their current streak. The fair share is seats ÷ players present, summed over
   the rounds they attended. The engine may bend this queue slightly when doing so creates a new
   pairing, within strict limits: nobody gets more than a game ahead, and the stamina rule holds.
3. **Who partners whom.** Randomised restarts and hill-climbing minimise a cost made of level
   balance, level spread on a court, repeated partners, repeated opponents, gender preferences
   and singles fairness.
4. **The whole-schedule polish.** Once a batch exists, simulated annealing reworks it as one
   piece. It swaps people within rounds and trades seats across rounds without changing anyone's
   game count. A first pass spreads partnerships as evenly as the seats allow. A second pass
   spreads opponents with every other rule locked, moving whole teams so partnerships stay intact.
5. **Fairest of three.** Optionally, steps 1–4 run three times and the fairest result is kept.
   The comparison goes by over-limit seats, then games against fair share, then partner coverage,
   then opponent spread.

The weights behind steps 2 and 3 are adjustable in **Settings**. The in-app guide ("?" next to
the mode buttons) walks through each step with real engine output.

### Measured results (default settings)

| Scenario | Result |
| --- | --- |
| 9 players, 1 court, 20 rounds | Every pair partners at least once; games within one of each other; no rest longer than two rounds |
| 8 players, 1 court, 14 rounds | Every pair partners exactly once |
| 9 players, 1 court, 18 rounds (the suggested length) | Every pair partners |
| 9 players, 2 courts, 20 rounds, *Rest on time* | No one plays more than two rounds in a row; singles spread 4–5 each, never twice running |
| A player arriving at round 11 of 20 | Plays at the same rate as everyone else (the v1 engine rushed them on court for 7 of 10 rounds) |
| 20 rounds added one tap at a time | As fair as building them at once |

---

## Implementation notes

### Share links
The schedule is packed into the URL fragment (`#…`), which browsers never send to a server.
Static hosting therefore works, and player names never reach anyone's logs. IDs are replaced by
indices and the payload is deflated with the built-in `CompressionStream`, so no library is
needed.

| Session | Link length |
| --- | --- |
| 8 players / 2 courts / 10 rounds | ~340 characters |
| 12 players / 3 courts / 15 rounds | ~610 |
| 20 players / 4 courts / 25 rounds | ~1,190 |
| 24 players / 5 courts / 100 rounds | ~4,110 |

*Copy and edit* copies the schedule into the recipient's own storage. It does **not** sync back.
True multi-device sync would need a backend; Supabase Realtime would be the natural fit. A shared
schedule is always kept apart from the recipient's own data until they explicitly take it over.

### Image export
`src/lib/exportImage.js` draws the schedule onto a `<canvas>` with `fillText`, not html2canvas
(about 200 KB) or SVG rasterisation (which drops Thai fonts). The canvas reuses the fonts the
page has already loaded. Output is rendered at 2–3× device pixel ratio, follows the active
theme, sizes columns to the real names and truncates with an ellipsis rather than overflowing.

### Skins and themes
Every skin lives in `src/index.css`, selected by `<html data-skin="…">`; components never name
a skin. Each skin re-points Tailwind's `slate`, `brand` and `accent` scales (so every
`slate-*` class follows it) and its `--radius-*` scale, and sets a handful of semantic tokens —
`edge` for outlines, `track`/`pick` for segmented controls, `chip`, `preset`, `court-1…5`, the
header badge — plus line weight, shadows and the display font, each for light and dark.
`src/lib/skins.js` lists the skins for the settings picker; a skin's display font is fetched
only when it is used. Adding a skin is one CSS block and one list entry.

Classic layers a sage header over an ivory page with cream cards (nothing approaches pure
white); its dark mode uses navy, deep green and a raised green, with green as the primary
colour and orange as the accent.

---

## Project layout

```
src/
  lib/
    matchmaker.js      the engine — selection, pairing, polish, rest modes, suggestions (pure)
    plan.js            the hidden plan behind one-round-at-a-time additions
    roster.js          detects players who left or arrived after scheduling
    exportImage.js     canvas rendering of the schedule image
    share.js           packing schedules into share links
    ops.js             every change the app can make to its data, as named pure functions
    store.js           the local store: holds the state, runs ops, saves to localStorage
    storage.js         localStorage, backup import/export, schema version and migrations
    i18n.js            Thai and English strings
    skins.js           the skins offered in settings
    testkit.js         shared helpers for the test suite
  components/
    PlayTab.jsx        modes, round controls, schedule, reshuffle, roster-change banner
    ScheduleTable.jsx  the schedule grid with match ticks and the stamina view
    MatchCard.jsx      one court: teams and scores
    RoundAdvisor.jsx   round suggestions before a session
    StatsTab.jsx       per-player statistics and detail sheets
    FairnessReport.jsx the "How even is it?" check and who-met-whom grid
    SettingsTab.jsx    weights, stamina and rest modes, courts behaviour, data
    PresetCard.jsx     saved setups
    HelpSheet.jsx      the in-app guide and rest-mode explainer
    HelpInsight.jsx    "Inside balanced mode" walkthrough
    helpData.js        real engine output used by the guide
    ImageSheet.jsx     image preview with save and share
    ShareSheet.jsx     share-link creation
    RosterSheet.jsx    saved rosters
    PlayersTab.jsx, CourtsTab.jsx, PlayerBits.jsx, ui.jsx
  App.jsx              wires the store to the screens, round building, tabs
e2e/                   Playwright end-to-end checks
```

## Data and privacy

Everything is stored under the `localStorage` key `bad-matchup:v1` and never leaves the device.
Rosters, setups and settings live in the same state, so a backup file carries all of them.
To move to another device, use **Settings → Export backup** and import the file there.

> ⚠️ Clearing the browser's site data deletes the schedule. Regular groups should keep a backup.

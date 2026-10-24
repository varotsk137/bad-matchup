# Graph Report - proto-ux-a-c  (2026-10-24)

## Corpus Check
- 78 files · ~70,842 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .example 1, .rules 1)

## Summary
- 553 nodes · 1589 edges · 19 communities (18 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `30838e24`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- matchmaker.js
- App.jsx
- rooms.rules.test.js
- Icon
- exportImage.js
- 🏸 Bad Matchup
- HelpSheet.jsx
- CostSplitSheet.jsx
- package.json
- dependencies
- devDependencies
- CLAUDE.md
- scripts
- vite.config.js
- rooms.rules.test.js
- make-icons.mjs
- ui.jsx
- roomRemote.js
- App.jsx

## God Nodes (most connected - your core abstractions)
1. `cx()` - 72 edges
2. `App()` - 49 edges
3. `Button()` - 33 edges
4. `Sheet()` - 29 edges
5. `PlayTab()` - 28 edges
6. `CostSplitSheet()` - 27 edges
7. `Card()` - 24 edges
8. `PlayersTab()` - 23 edges
9. `react` - 21 edges
10. `SettingsTab()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `Icon()` --calls--> `cx()`  [EXTRACTED]
  src/App.jsx → src/components/ui.jsx
- `PaymentCard()` --indirect_call--> `loadPayment()`  [INFERRED]
  src/components/PaymentCard.jsx → src/lib/payment.js
- `PlayTab()` --indirect_call--> `isAvailable()`  [INFERRED]
  src/components/PlayTab.jsx → src/lib/matchmaker.js
- `newPlayer()` --calls--> `uid()`  [EXTRACTED]
  src/lib/ops.js → src/lib/matchmaker.js
- `App()` --calls--> `CourtsTab()`  [EXTRACTED]
  src/App.jsx → src/components/CourtsTab.jsx

## Import Cycles
- None detected.

## Communities (19 total, 1 thin omitted)

### Community 0 - "matchmaker.js"
Cohesion: 0.08
Nodes (60): vitest, CourtIcon(), CourtsTab(), attempts(), buildOnce(), buildOnceAsync(), compareKeys(), cost() (+52 more)

### Community 1 - "App.jsx"
Cohesion: 0.08
Nodes (29): DEFAULT_LEVEL, DEFAULT_OPTIONS, DEFAULT_WEIGHTS, newPlayer(), ops, player(), sample(), BASE_SKINS (+21 more)

### Community 2 - "rooms.rules.test.js"
Cohesion: 0.19
Nodes (10): players(), PREVIEW_URL, savedState(), seed(), shareHash(), STORAGE_KEY, EIGHT, EIGHT (+2 more)

### Community 3 - "Icon"
Cohesion: 0.20
Nodes (16): Header(), cx(), Icon(), LiveDot(), PATHS, LinkCard(), LiveRoomSheet(), Note() (+8 more)

### Community 4 - "exportImage.js"
Cohesion: 0.12
Nodes (29): analyse(), FairnessReport(), MeetGrid(), ImageSheet(), Chevron(), DEFAULT_COUNTS, isArchived(), MODES (+21 more)

### Community 5 - "🏸 Bad Matchup"
Cohesion: 0.09
Nodes (22): 🏸 Bad Matchup, Data and privacy, Deployment, During the session, Everything else, Features, Getting started, Highlights (+14 more)

### Community 6 - "HelpSheet.jsx"
Cohesion: 0.11
Nodes (31): PAIRINGS, REST, Heatmap(), HelpInsight(), LEVEL, OPTIONS, PairArt(), PolishArt() (+23 more)

### Community 7 - "CostSplitSheet.jsx"
Cohesion: 0.10
Nodes (41): uqr, CostSplitSheet(), MoneyInput(), ROUNDINGS, sessionPlayers(), Working(), QrCode(), loadPaid() (+33 more)

### Community 9 - "package.json"
Cohesion: 0.12
Nodes (15): description, name, private, type, version, firebase-tools, @fontsource/inter, @fontsource/kanit (+7 more)

### Community 10 - "dependencies"
Cohesion: 0.17
Nodes (12): dependencies, firebase, @fontsource/inter, @fontsource/kanit, @fontsource/mali, @fontsource/mitr, @fontsource/noto-sans-thai, @fontsource/noto-serif-thai (+4 more)

### Community 11 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, @firebase/rules-unit-testing, firebase-tools, @playwright/test, tailwindcss, @tailwindcss/vite, vite, vite-plugin-pwa (+2 more)

### Community 13 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, dev:emulator, e2e, emulators, preview, test (+1 more)

### Community 14 - "vite.config.js"
Cohesion: 0.29
Nodes (5): @tailwindcss/vite, vite, vite-plugin-pwa, @vitejs/plugin-react, FONTS

### Community 15 - "rooms.rules.test.js"
Cohesion: 0.27
Nodes (7): @firebase/rules-unit-testing, as(), join(), KEY, room(), seed(), writeResult()

### Community 16 - "make-icons.mjs"
Cohesion: 0.40
Nodes (3): icons, square, svg

### Community 17 - "ui.jsx"
Cohesion: 0.09
Nodes (68): react, MatchCard(), SCORE_BOX, ScoreBox(), Slot(), TEAM_TEXT, PaymentCard(), Avatar() (+60 more)

### Community 38 - "roomRemote.js"
Cohesion: 0.16
Nodes (19): firebase, loadRemote(), app, auth, config, db, unpackRoom(), closeRoom() (+11 more)

### Community 51 - "App.jsx"
Cohesion: 0.06
Nodes (70): App(), Icon(), ICONS, TABS, InstallInvite(), InstallSheet(), INVITE_MS, TopBars() (+62 more)

## Knowledge Gaps
- **7 isolated node(s):** `@fontsource/kanit`, `@fontsource/mali`, `@fontsource/mitr`, `@fontsource/noto-serif-thai`, `@fontsource/taviraj` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 127 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cx()` connect `ui.jsx` to `matchmaker.js`, `Icon`, `exportImage.js`, `HelpSheet.jsx`, `CostSplitSheet.jsx`, `App.jsx`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **What connects `@fontsource/kanit`, `@fontsource/mali`, `@fontsource/mitr` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `matchmaker.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08428446005267778 - nodes in this community are weakly interconnected._
- **Why does `react` connect `ui.jsx` to `Icon`, `exportImage.js`, `HelpSheet.jsx`, `CostSplitSheet.jsx`, `package.json`, `App.jsx`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08194905869324474 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `matchmaker.js` to `App.jsx`, `CostSplitSheet.jsx`, `package.json`, `vite.config.js`, `rooms.rules.test.js`, `ui.jsx`, `App.jsx`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Should `exportImage.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11746031746031746 - nodes in this community are weakly interconnected._
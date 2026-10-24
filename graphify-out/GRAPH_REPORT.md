# Graph Report - proto-ux-a-c  (2026-10-24)

## Corpus Check
- 79 files · ~72,456 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .example 1, .rules 1)

## Summary
- 579 nodes · 1626 edges · 18 communities (17 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1f80dd1f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- matchmaker.js
- App.jsx
- rooms.rules.test.js
- PlayersTab.jsx
- exportImage.js
- 🏸 Bad Matchup
- HelpSheet.jsx
- CostSplitSheet.jsx
- ui.jsx
- package.json
- dependencies
- devDependencies
- CLAUDE.md
- scripts
- vite.config.js
- matchmaker.rules.test.js
- cx
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
- `CourtsTab()` --indirect_call--> `isAvailable()`  [INFERRED]
  src/components/CourtsTab.jsx → src/lib/matchmaker.js
- `PaymentCard()` --indirect_call--> `loadPayment()`  [INFERRED]
  src/components/PaymentCard.jsx → src/lib/payment.js
- `Header()` --calls--> `RoomStatus()`  [EXTRACTED]
  src/App.jsx → src/components/LiveRoomSheet.jsx
- `App()` --calls--> `CourtsTab()`  [EXTRACTED]
  src/App.jsx → src/components/CourtsTab.jsx

## Import Cycles
- None detected.

## Communities (18 total, 1 thin omitted)

### Community 0 - "matchmaker.js"
Cohesion: 0.08
Nodes (60): Chevron(), isArchived(), MODES, PlayTab(), RoundCard(), Stepper(), HOURS, MINUTES (+52 more)

### Community 1 - "App.jsx"
Cohesion: 0.08
Nodes (23): ops, player(), sample(), BASE_SKINS, DEFAULT_SKIN, EXTRA_SKINS, isSkin(), loaded (+15 more)

### Community 2 - "rooms.rules.test.js"
Cohesion: 0.13
Nodes (13): players(), PREVIEW_URL, savedState(), seed(), shareHash(), STORAGE_KEY, EIGHT, EIGHT (+5 more)

### Community 3 - "PlayersTab.jsx"
Cohesion: 0.15
Nodes (35): CourtIcon(), CourtsTab(), cx(), Icon(), LiveDot(), PATHS, LinkCard(), LiveRoomSheet() (+27 more)

### Community 4 - "exportImage.js"
Cohesion: 0.10
Nodes (36): uqr, ImageSheet(), QrCode(), asFile(), canSharePng(), downloadPng(), drawSchedule(), ellipsize() (+28 more)

### Community 5 - "🏸 Bad Matchup"
Cohesion: 0.09
Nodes (22): 🏸 Bad Matchup, Data and privacy, Deployment, During the session, Everything else, Features, Getting started, Highlights (+14 more)

### Community 6 - "HelpSheet.jsx"
Cohesion: 0.11
Nodes (31): PAIRINGS, REST, Heatmap(), HelpInsight(), LEVEL, OPTIONS, PairArt(), PolishArt() (+23 more)

### Community 7 - "CostSplitSheet.jsx"
Cohesion: 0.17
Nodes (26): CostSplitSheet(), MoneyInput(), ROUNDINGS, sessionPlayers(), Working(), loadPaid(), loadPayment(), loadSplitView() (+18 more)

### Community 8 - "ui.jsx"
Cohesion: 0.10
Nodes (41): react, react-dom, PaymentCard(), PresetCard(), InstallRow(), InstallSheet(), INVITE_MS, TopBars() (+33 more)

### Community 9 - "package.json"
Cohesion: 0.09
Nodes (21): description, name, private, type, version, firebase-tools, @fontsource/bai-jamjuree, @fontsource/chakra-petch (+13 more)

### Community 10 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, firebase, @fontsource/bai-jamjuree, @fontsource/chakra-petch, @fontsource/inter, @fontsource/itim, @fontsource/kanit, @fontsource/kodchasan (+11 more)

### Community 11 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, @firebase/rules-unit-testing, firebase-tools, @playwright/test, tailwindcss, @tailwindcss/vite, vite, vite-plugin-pwa (+2 more)

### Community 13 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, dev:emulator, e2e, emulators, preview, test (+1 more)

### Community 14 - "vite.config.js"
Cohesion: 0.29
Nodes (5): @tailwindcss/vite, vite, vite-plugin-pwa, @vitejs/plugin-react, FONTS

### Community 15 - "matchmaker.rules.test.js"
Cohesion: 0.15
Nodes (24): @firebase/rules-unit-testing, vitest, as(), join(), KEY, room(), seed(), writeResult() (+16 more)

### Community 17 - "cx"
Cohesion: 0.14
Nodes (28): analyse(), FairnessReport(), MeetGrid(), MatchCard(), SCORE_BOX, ScoreBox(), Slot(), TEAM_TEXT (+20 more)

### Community 51 - "App.jsx"
Cohesion: 0.06
Nodes (73): firebase, App(), Header(), Icon(), ICONS, loadRemote(), TABS, DEFAULT_COUNTS (+65 more)

## Knowledge Gaps
- **14 isolated node(s):** `@fontsource/bai-jamjuree`, `@fontsource/chakra-petch`, `@fontsource/itim`, `@fontsource/kanit`, `@fontsource/kodchasan` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 146 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cx()` connect `cx` to `matchmaker.js`, `PlayersTab.jsx`, `exportImage.js`, `HelpSheet.jsx`, `CostSplitSheet.jsx`, `ui.jsx`, `App.jsx`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **What connects `@fontsource/bai-jamjuree`, `@fontsource/chakra-petch`, `@fontsource/itim` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `matchmaker.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07645687645687646 - nodes in this community are weakly interconnected._
- **Why does `react` connect `ui.jsx` to `matchmaker.js`, `PlayersTab.jsx`, `exportImage.js`, `HelpSheet.jsx`, `CostSplitSheet.jsx`, `package.json`, `cx`, `App.jsx`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08013937282229965 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `matchmaker.rules.test.js` to `App.jsx`, `PlayersTab.jsx`, `CostSplitSheet.jsx`, `ui.jsx`, `package.json`, `vite.config.js`, `App.jsx`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Should `rooms.rules.test.js` be split into smaller, more focused modules?**
  _Cohesion score 0.13438735177865613 - nodes in this community are weakly interconnected._
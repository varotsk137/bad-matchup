# Graph Report - reload-skills-f78f93  (2026-11-07)

## Corpus Check
- 83 files · ~81,333 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .example 1, .rules 1)

## Summary
- 608 nodes · 1739 edges · 22 communities (20 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7505ff46`
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
- App.jsx
- package.json
- dependencies
- devDependencies
- CLAUDE.md
- scripts
- vite.config.js
- rooms.rules.test.js
- RoundAdvisor.jsx
- cx
- CourtDiorama
- make-icons.mjs
- fonts.js
- App.jsx

## God Nodes (most connected - your core abstractions)
1. `cx()` - 76 edges
2. `App()` - 50 edges
3. `PlayTab()` - 39 edges
4. `Button()` - 35 edges
5. `Sheet()` - 29 edges
6. `Icon()` - 28 edges
7. `CostSplitSheet()` - 27 edges
8. `SettingsTab()` - 26 edges
9. `PlayersTab()` - 24 edges
10. `Card()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `CourtsTab()` --indirect_call--> `isAvailable()`  [INFERRED]
  src/components/CourtsTab.jsx → src/lib/matchmaker.js
- `PlayTab()` --indirect_call--> `isAvailable()`  [INFERRED]
  src/components/PlayTab.jsx → src/lib/matchmaker.js
- `newPlayer()` --calls--> `uid()`  [EXTRACTED]
  src/lib/ops.js → src/lib/matchmaker.js
- `Header()` --calls--> `Solar()`  [EXTRACTED]
  src/App.jsx → src/components/Solar.jsx
- `Header()` --calls--> `cx()`  [EXTRACTED]
  src/App.jsx → src/components/ui.jsx

## Import Cycles
- None detected.

## Communities (22 total, 2 thin omitted)

### Community 0 - "matchmaker.js"
Cohesion: 0.09
Nodes (59): vitest, attempts(), buildOnce(), buildOnceAsync(), compareKeys(), cost(), courtSize(), createEmptyRound() (+51 more)

### Community 1 - "App.jsx"
Cohesion: 0.06
Nodes (37): Chevron(), Field(), Group(), pickTuning(), SettingsTab(), SkinSwatch(), SkinTile(), Slider() (+29 more)

### Community 2 - "rooms.rules.test.js"
Cohesion: 0.19
Nodes (10): players(), PREVIEW_URL, savedState(), seed(), shareHash(), STORAGE_KEY, EIGHT, EIGHT (+2 more)

### Community 3 - "PlayersTab.jsx"
Cohesion: 0.17
Nodes (27): GenderDot(), LEVEL_TONE, LevelBadge(), levelLabel(), levelMeta(), LevelPips(), NameCount(), nextStatus() (+19 more)

### Community 4 - "exportImage.js"
Cohesion: 0.09
Nodes (39): uqr, ImageSheet(), QrCode(), APP_URL, asFile(), canSharePng(), defaultDate(), downloadPng() (+31 more)

### Community 5 - "🏸 Bad Matchup"
Cohesion: 0.09
Nodes (22): 🏸 Bad Matchup, Data and privacy, Deployment, During the session, Everything else, Features, Getting started, Highlights (+14 more)

### Community 6 - "HelpSheet.jsx"
Cohesion: 0.11
Nodes (31): PAIRINGS, REST, Heatmap(), HelpInsight(), LEVEL, OPTIONS, PairArt(), PolishArt() (+23 more)

### Community 7 - "CostSplitSheet.jsx"
Cohesion: 0.16
Nodes (28): CostSplitSheet(), MoneyInput(), ROUNDINGS, sessionPlayers(), Working(), PaymentCard(), loadPaid(), loadPayment() (+20 more)

### Community 8 - "App.jsx"
Cohesion: 0.07
Nodes (52): App(), Header(), loadRemote(), TABS, RoomStatus(), DEFAULT_COUNTS, InstallInvite(), InstallRow() (+44 more)

### Community 9 - "package.json"
Cohesion: 0.10
Nodes (20): description, name, private, type, version, firebase-tools, @fontsource/bai-jamjuree, @fontsource/chakra-petch (+12 more)

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

### Community 15 - "rooms.rules.test.js"
Cohesion: 0.27
Nodes (7): @firebase/rules-unit-testing, as(), join(), KEY, room(), seed(), writeResult()

### Community 16 - "RoundAdvisor.jsx"
Cohesion: 0.43
Nodes (6): HOURS, MINUTES, Pick(), RoundAdvisor(), Row(), roundsForTime()

### Community 17 - "cx"
Cohesion: 0.09
Nodes (71): react, CourtsideTV(), isArchived(), CourtDrawing(), CourtsTab(), reduceMotion(), SIDE, analyse() (+63 more)

### Community 18 - "CourtDiorama"
Cohesion: 0.80
Nodes (4): CourtDiorama(), F(), O(), S()

### Community 19 - "make-icons.mjs"
Cohesion: 0.40
Nodes (3): icons, square, svg

### Community 51 - "App.jsx"
Cohesion: 0.09
Nodes (40): firebase, Chip(), HistoryList(), RoomHistorySheet(), app, auth, config, db (+32 more)

## Knowledge Gaps
- **14 isolated node(s):** `@fontsource/bai-jamjuree`, `@fontsource/chakra-petch`, `@fontsource/itim`, `@fontsource/kanit`, `@fontsource/kodchasan` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 150 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cx()` connect `cx` to `App.jsx`, `PlayersTab.jsx`, `exportImage.js`, `HelpSheet.jsx`, `CostSplitSheet.jsx`, `App.jsx`, `App.jsx`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **What connects `@fontsource/bai-jamjuree`, `@fontsource/chakra-petch`, `@fontsource/itim` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `matchmaker.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08624708624708624 - nodes in this community are weakly interconnected._
- **Why does `react` connect `cx` to `App.jsx`, `PlayersTab.jsx`, `exportImage.js`, `HelpSheet.jsx`, `CostSplitSheet.jsx`, `App.jsx`, `package.json`, `App.jsx`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06428988895382817 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `matchmaker.js` to `App.jsx`, `PlayersTab.jsx`, `exportImage.js`, `CostSplitSheet.jsx`, `App.jsx`, `package.json`, `vite.config.js`, `rooms.rules.test.js`, `App.jsx`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Should `exportImage.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08888888888888889 - nodes in this community are weakly interconnected._
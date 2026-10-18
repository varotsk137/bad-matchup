# Graph Report - bad-matchup  (2026-10-18)

## Corpus Check
- 39 files · ~40,447 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .css 1)

## Summary
- 293 nodes · 859 edges · 10 communities (9 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1a267560`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- matchmaker.js
- App.jsx
- package.json
- ui.jsx
- exportImage.js
- 🏸 Bad Matchup
- HelpSheet.jsx
- matchmaker.rules.test.js
- PlayTab.jsx
- CLAUDE.md

## God Nodes (most connected - your core abstractions)
1. `cx()` - 59 edges
2. `App()` - 29 edges
3. `PlayTab()` - 22 edges
4. `Button()` - 22 edges
5. `Card()` - 20 edges
6. `Sheet()` - 18 edges
7. `PlayersTab()` - 16 edges
8. `react` - 15 edges
9. `SettingsTab()` - 15 edges
10. `StatsTab()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `Icon()` --calls--> `cx()`  [EXTRACTED]
  src/App.jsx → src/components/ui.jsx
- `CourtsTab()` --indirect_call--> `isAvailable()`  [INFERRED]
  src/components/CourtsTab.jsx → src/lib/matchmaker.js
- `App()` --calls--> `CourtsTab()`  [EXTRACTED]
  src/App.jsx → src/components/CourtsTab.jsx
- `App()` --calls--> `PlayersTab()`  [EXTRACTED]
  src/App.jsx → src/components/PlayersTab.jsx
- `App()` --calls--> `PlayTab()`  [EXTRACTED]
  src/App.jsx → src/components/PlayTab.jsx

## Import Cycles
- None detected.

## Communities (10 total, 1 thin omitted)

### Community 0 - "matchmaker.js"
Cohesion: 0.09
Nodes (43): HOURS, MINUTES, Pick(), RoundAdvisor(), Row(), attempts(), buildOnce(), buildOnceAsync() (+35 more)

### Community 1 - "App.jsx"
Cohesion: 0.10
Nodes (36): react-dom, App(), Header(), Icon(), ICONS, TABS, Toast(), dict (+28 more)

### Community 2 - "package.json"
Cohesion: 0.09
Nodes (23): dependencies, react, react-dom, description, devDependencies, tailwindcss, @tailwindcss/vite, vite (+15 more)

### Community 3 - "ui.jsx"
Cohesion: 0.13
Nodes (48): react, CourtIcon(), CourtsTab(), MatchCard(), SCORE_TONE, ScoreBox(), SIDE, Slot() (+40 more)

### Community 4 - "exportImage.js"
Cohesion: 0.20
Nodes (16): ImageSheet(), ScheduleTable(), asFile(), canSharePng(), downloadPng(), drawSchedule(), ellipsize(), F (+8 more)

### Community 5 - "🏸 Bad Matchup"
Cohesion: 0.09
Nodes (21): 🏸 Bad Matchup, Data and privacy, Deployment, During the session, Everything else, Features, Getting started, Highlights (+13 more)

### Community 6 - "HelpSheet.jsx"
Cohesion: 0.11
Nodes (31): PAIRINGS, REST, Heatmap(), HelpInsight(), LEVEL, OPTIONS, PairArt(), PolishArt() (+23 more)

### Community 7 - "matchmaker.rules.test.js"
Cohesion: 0.30
Nodes (15): vitest, generateRounds(), QUICK, situation(), session(), analyse(), build(), courts() (+7 more)

### Community 8 - "PlayTab.jsx"
Cohesion: 0.21
Nodes (19): analyse(), FairnessReport(), MeetGrid(), Chevron(), DEFAULT_COUNTS, isArchived(), MODES, PlayTab() (+11 more)

## Knowledge Gaps
- **1 isolated node(s):** `tailwindcss`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 64 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cx()` connect `ui.jsx` to `matchmaker.js`, `App.jsx`, `exportImage.js`, `HelpSheet.jsx`, `PlayTab.jsx`?**
  _High betweenness centrality (0.153) - this node is a cross-community bridge._
- **What connects `tailwindcss` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `matchmaker.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09292929292929293 - nodes in this community are weakly interconnected._
- **Why does `react` connect `ui.jsx` to `App.jsx`, `package.json`, `exportImage.js`, `HelpSheet.jsx`, `PlayTab.jsx`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09745293466223699 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.08666666666666667 - nodes in this community are weakly interconnected._
- **Should `ui.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12522686025408347 - nodes in this community are weakly interconnected._
# Graph Report - bad-matchup  (2026-10-19)

## Corpus Check
- 40 files · ~42,673 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .css 1)

## Summary
- 301 nodes · 885 edges · 11 communities (10 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `96f9228d`
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
- share.js
- PlayTab.jsx
- CLAUDE.md

## God Nodes (most connected - your core abstractions)
1. `cx()` - 59 edges
2. `App()` - 31 edges
3. `PlayTab()` - 22 edges
4. `Button()` - 22 edges
5. `Card()` - 20 edges
6. `Sheet()` - 18 edges
7. `SettingsTab()` - 17 edges
8. `PlayersTab()` - 16 edges
9. `react` - 15 edges
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

## Communities (11 total, 1 thin omitted)

### Community 0 - "matchmaker.js"
Cohesion: 0.12
Nodes (37): attempts(), buildOnce(), buildOnceAsync(), compareKeys(), cost(), createEmptyRound(), createRefiner(), EFFORT (+29 more)

### Community 1 - "App.jsx"
Cohesion: 0.10
Nodes (35): react-dom, App(), Header(), Icon(), ICONS, TABS, DEFAULT_COUNTS, pickTuning() (+27 more)

### Community 2 - "package.json"
Cohesion: 0.09
Nodes (23): dependencies, react, react-dom, description, devDependencies, tailwindcss, @tailwindcss/vite, vite (+15 more)

### Community 3 - "ui.jsx"
Cohesion: 0.12
Nodes (47): CourtIcon(), CourtsTab(), FairnessReport(), MeetGrid(), MatchCard(), SCORE_TONE, ScoreBox(), SIDE (+39 more)

### Community 4 - "exportImage.js"
Cohesion: 0.19
Nodes (17): react, ImageSheet(), ScheduleTable(), asFile(), canSharePng(), downloadPng(), drawSchedule(), ellipsize() (+9 more)

### Community 5 - "🏸 Bad Matchup"
Cohesion: 0.09
Nodes (21): 🏸 Bad Matchup, Data and privacy, Deployment, During the session, Everything else, Features, Getting started, Highlights (+13 more)

### Community 6 - "HelpSheet.jsx"
Cohesion: 0.11
Nodes (31): PAIRINGS, REST, Heatmap(), HelpInsight(), LEVEL, OPTIONS, PairArt(), PolishArt() (+23 more)

### Community 7 - "matchmaker.rules.test.js"
Cohesion: 0.30
Nodes (15): vitest, generateRounds(), QUICK, situation(), session(), analyse(), build(), courts() (+7 more)

### Community 8 - "share.js"
Cohesion: 0.23
Nodes (13): ShareSheet(), buildShareUrl(), canCompress(), clearShareHash(), decodeShare(), deflate(), encodeShare(), fromB64Url() (+5 more)

### Community 9 - "PlayTab.jsx"
Cohesion: 0.18
Nodes (20): analyse(), Chevron(), isArchived(), MODES, PlayTab(), RoundCard(), Stepper(), HOURS (+12 more)

## Knowledge Gaps
- **1 isolated node(s):** `tailwindcss`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 65 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cx()` connect `ui.jsx` to `App.jsx`, `exportImage.js`, `HelpSheet.jsx`, `share.js`, `PlayTab.jsx`?**
  _High betweenness centrality (0.149) - this node is a cross-community bridge._
- **What connects `tailwindcss` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `matchmaker.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11522048364153627 - nodes in this community are weakly interconnected._
- **Why does `react` connect `exportImage.js` to `App.jsx`, `package.json`, `ui.jsx`, `HelpSheet.jsx`, `share.js`, `PlayTab.jsx`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10409745293466224 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.08666666666666667 - nodes in this community are weakly interconnected._
- **Should `ui.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12272727272727273 - nodes in this community are weakly interconnected._
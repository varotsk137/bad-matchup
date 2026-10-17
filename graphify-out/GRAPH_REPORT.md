# Graph Report - bad-matchup  (2026-10-18)

## Corpus Check
- 26 files · ~23,995 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .css 1)

## Summary
- 206 nodes · 580 edges · 9 communities (8 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `64b90ff5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- matchmaker.js
- App.jsx
- package.json
- PlayersTab.jsx
- exportImage.js
- 🏸 Bad Matchup · จับคู่ตีแบด
- HelpSheet.jsx
- cx
- CLAUDE.md

## God Nodes (most connected - your core abstractions)
1. `cx()` - 45 edges
2. `App()` - 26 edges
3. `Button()` - 20 edges
4. `PlayTab()` - 17 edges
5. `PlayersTab()` - 16 edges
6. `Card()` - 16 edges
7. `CourtsTab()` - 13 edges
8. `SettingsTab()` - 13 edges
9. `Sheet()` - 13 edges
10. `react` - 12 edges

## Surprising Connections (you probably didn't know these)
- `Icon()` --calls--> `cx()`  [EXTRACTED]
  src/App.jsx → src/components/ui.jsx
- `PlayTab()` --indirect_call--> `isAvailable()`  [INFERRED]
  src/components/PlayTab.jsx → src/lib/matchmaker.js
- `App()` --calls--> `CourtsTab()`  [EXTRACTED]
  src/App.jsx → src/components/CourtsTab.jsx
- `App()` --calls--> `PlayersTab()`  [EXTRACTED]
  src/App.jsx → src/components/PlayersTab.jsx
- `App()` --calls--> `PlayTab()`  [EXTRACTED]
  src/App.jsx → src/components/PlayTab.jsx

## Import Cycles
- None detected.

## Communities (9 total, 1 thin omitted)

### Community 0 - "matchmaker.js"
Cohesion: 0.13
Nodes (33): CourtIcon(), CourtsTab(), cost(), courtSize(), createEmptyRound(), createRefiner(), EFFORT, fillRound() (+25 more)

### Community 1 - "App.jsx"
Cohesion: 0.10
Nodes (39): App(), Header(), Icon(), ICONS, TABS, DEFAULT_COUNTS, pickTuning(), SettingsTab() (+31 more)

### Community 2 - "package.json"
Cohesion: 0.08
Nodes (22): dependencies, react, react-dom, description, devDependencies, tailwindcss, @tailwindcss/vite, vite (+14 more)

### Community 3 - "PlayersTab.jsx"
Cohesion: 0.23
Nodes (18): levelLabel(), nextStatus(), PlayerEditor(), PlayersTab(), SORTS, STATUS_STYLE, statusOf(), RosterSheet() (+10 more)

### Community 4 - "exportImage.js"
Cohesion: 0.18
Nodes (17): ImageSheet(), asFile(), canSharePng(), downloadPng(), drawSchedule(), ellipsize(), F, filename() (+9 more)

### Community 5 - "🏸 Bad Matchup · จับคู่ตีแบด"
Cohesion: 0.15
Nodes (12): 🏸 Bad Matchup · จับคู่ตีแบด, Deploy, Export รูป / Image export, GitHub Pages, การจับคู่ทำงานยังไง / How the matching works, ข้อมูล / Data, ธีม / Theme, ผลที่วัดได้ (จำลอง 8 ครั้งต่อสถานการณ์) (+4 more)

### Community 6 - "HelpSheet.jsx"
Cohesion: 0.36
Nodes (12): Arrow(), BalancedArt(), Bench(), Court(), Dot(), HelpSheet(), ManualArt(), RandomArt() (+4 more)

### Community 9 - "cx"
Cohesion: 0.20
Nodes (25): react, MatchCard(), SCORE_TONE, ScoreBox(), SIDE, Slot(), Avatar(), GenderDot() (+17 more)

## Knowledge Gaps
- **1 isolated node(s):** `tailwindcss`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 50 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `cx` to `App.jsx`, `package.json`, `PlayersTab.jsx`, `exportImage.js`?**
  _High betweenness centrality (0.191) - this node is a cross-community bridge._
- **What connects `tailwindcss` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `matchmaker.js` be split into smaller, more focused modules?**
  _Cohesion score 0.13445378151260504 - nodes in this community are weakly interconnected._
- **Why does `cx()` connect `cx` to `matchmaker.js`, `App.jsx`, `PlayersTab.jsx`, `HelpSheet.jsx`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09619450317124736 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.08307692307692308 - nodes in this community are weakly interconnected._
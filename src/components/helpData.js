/**
 * Example data for the help sheets — real output of the engine, generated
 * offline with 9 players called A–I (all one level), so the pictures show what
 * the app actually does rather than an idealised drawing.
 *
 * PAIRINGS: one court, 20 rounds. How many times each pair teamed up
 * (`partners`) and faced each other (`opponents`), -1 on the diagonal, for
 *   original – the first engine: take the top of the queue, then pair them
 *   rounds   – today's round-by-round pick (who plays and pairing together)
 *   polished – the same rounds after the whole-schedule polish
 *
 * REST: two doubles courts, 12 rounds, at most 2 in a row, per rest mode —
 * each round as [court 1, court 2, bench]: a court is "AB-CD" (doubles),
 * "A-B" (singles) or "" (idle); the bench lists who sat out.
 */
export const PAIRINGS = {
  original: {
    partners: [
      [-1, 1, 1, 1, 1, 2, 0, 1, 1],
      [1, -1, 2, 0, 1, 1, 0, 2, 2],
      [1, 2, -1, 2, 0, 1, 1, 2, 0],
      [1, 0, 2, -1, 2, 1, 2, 1, 0],
      [1, 1, 0, 2, -1, 0, 2, 1, 2],
      [2, 1, 1, 1, 0, -1, 1, 1, 2],
      [0, 0, 1, 2, 2, 1, -1, 1, 2],
      [1, 2, 2, 1, 1, 1, 1, -1, 0],
      [1, 2, 0, 0, 2, 2, 2, 0, -1],
    ],
    opponents: [
      [-1, 4, 3, 1, 0, 4, 0, 2, 2],
      [4, -1, 0, 0, 3, 5, 1, 1, 4],
      [3, 0, -1, 4, 1, 4, 3, 3, 0],
      [1, 0, 4, -1, 2, 1, 5, 3, 2],
      [0, 3, 1, 2, -1, 1, 4, 2, 5],
      [4, 5, 4, 1, 1, -1, 0, 2, 1],
      [0, 1, 3, 5, 4, 0, -1, 3, 2],
      [2, 1, 3, 3, 2, 2, 3, -1, 2],
      [2, 4, 0, 2, 5, 1, 2, 2, -1],
    ],
  },
  rounds: {
    partners: [
      [-1, 2, 0, 1, 1, 1, 1, 1, 2],
      [2, -1, 1, 0, 1, 1, 1, 1, 2],
      [0, 1, -1, 1, 2, 1, 1, 1, 1],
      [1, 0, 1, -1, 1, 2, 2, 1, 1],
      [1, 1, 2, 1, -1, 1, 1, 1, 1],
      [1, 1, 1, 2, 1, -1, 1, 1, 1],
      [1, 1, 1, 2, 1, 1, -1, 2, 0],
      [1, 1, 1, 1, 1, 1, 2, -1, 1],
      [2, 2, 1, 1, 1, 1, 0, 1, -1],
    ],
    opponents: [
      [-1, 5, 1, 3, 0, 2, 2, 1, 4],
      [5, -1, 1, 2, 2, 0, 2, 3, 3],
      [1, 1, -1, 2, 3, 3, 1, 2, 3],
      [3, 2, 2, -1, 1, 3, 4, 1, 2],
      [0, 2, 3, 1, -1, 2, 3, 5, 2],
      [2, 0, 3, 3, 2, -1, 3, 2, 3],
      [2, 2, 1, 4, 3, 3, -1, 3, 0],
      [1, 3, 2, 1, 5, 2, 3, -1, 1],
      [4, 3, 3, 2, 2, 3, 0, 1, -1],
    ],
  },
  polished: {
    partners: [
      [-1, 2, 1, 1, 1, 1, 1, 1, 1],
      [2, -1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, -1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, -1, 1, 1, 1, 1, 2],
      [1, 1, 1, 1, -1, 1, 1, 2, 1],
      [1, 1, 1, 1, 1, -1, 2, 1, 1],
      [1, 1, 1, 1, 1, 2, -1, 1, 1],
      [1, 1, 1, 1, 2, 1, 1, -1, 1],
      [1, 1, 1, 2, 1, 1, 1, 1, -1],
    ],
    opponents: [
      [-1, 3, 1, 2, 3, 2, 2, 3, 2],
      [3, -1, 1, 3, 2, 2, 2, 2, 3],
      [1, 1, -1, 2, 2, 2, 4, 3, 1],
      [2, 3, 2, -1, 3, 2, 2, 1, 3],
      [3, 2, 2, 3, -1, 3, 0, 2, 3],
      [2, 2, 2, 2, 3, -1, 3, 2, 2],
      [2, 2, 4, 2, 0, 3, -1, 3, 2],
      [3, 2, 3, 1, 2, 2, 3, -1, 2],
      [2, 3, 1, 3, 3, 2, 2, 2, -1],
    ],
  },
}

export const REST = {
  fill: [
    ['DH-GI', 'BC-FE', 'A'],
    ['DG-CF', 'BE-AH', 'I'],
    ['IF-CH', 'GD-AE', 'B'],
    ['EC-HF', 'IB-GA', 'D'],
    ['AB-FG', 'IH-ED', 'C'],
    ['DI-BF', 'GH-AC', 'E'],
    ['AI-CF', 'ED-GB', 'H'],
    ['AF-EH', 'BD-IC', 'G'],
    ['IH-AB', 'DC-EG', 'F'],
    ['HB-CD', 'IF-EG', 'A'],
    ['EC-DA', 'HF-BG', 'I'],
    ['EI-GC', 'AH-DF', 'B'],
  ],
  flex: [
    ['CE-GA', 'I-B', 'DFH'],
    ['HG-FI', 'AD-BE', 'C'],
    ['DC-FG', 'H-B', 'AEI'],
    ['DF-IA', 'E-C', 'BGH'],
    ['IB-EH', 'A-G', 'CDF'],
    ['AE-FH', 'BD-GC', 'I'],
    ['CI-HB', 'F-D', 'AEG'],
    ['ID-CA', 'E-G', 'BFH'],
    ['FE-GB', 'H-A', 'CDI'],
    ['CB-AF', 'HI-DG', 'E'],
    ['IE-FC', 'D-B', 'AGH'],
    ['GE-HD', 'C-A', 'BFI'],
  ],
  strict: [
    ['BG-EI', 'A-C', 'DFH'],
    ['FG-AH', 'D-B', 'CEI'],
    ['ED-HC', 'F-I', 'ABG'],
    ['BI-GC', 'A-E', 'DFH'],
    ['GD-FA', 'H-B', 'CEI'],
    ['EH-ID', 'C-F', 'ABG'],
    ['GE-BC', 'A-I', 'DFH'],
    ['BA-HF', 'G-D', 'CEI'],
    ['FD-IC', 'H-E', 'ABG'],
    ['EC-AG', 'I-B', 'DFH'],
    ['FB-AD', 'G-H', 'CEI'],
    ['IH-DC', 'E-F', 'ABG'],
  ],
}


type SectorRow = [number, number, number];
type Sector = [SectorRow, SectorRow, SectorRow];
const obstacleSectors: Sector[] = [
    // Empty
    [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
    ],
    // Corner
    [
        [0, 0, 0],
        [0, 0, 0],
        [1, 0, 0]
    ],
    // Outer Corner
    [
        [1, 1, 1],
        [0, 0, 1],
        [0, 0, 1]
    ],
    // Center
    [
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0]
    ],
    // Double
    [
        [1, 0, 1],
        [0, 0, 0],
        [0, 0, 0]
    ],
    // Column
    [
        [0, 1, 0],
        [0, 1, 0],
        [0, 1, 0]
    ],
    // Column with hole
    [
        [0, 1, 0],
        [0, 0, 0],
        [0, 1, 0]
    ],
    // Quad
    [
        [1, 0, 1],
        [0, 0, 0],
        [1, 0, 1]
    ],
    // Diag
    [
        [1, 0, 0],
        [0, 0, 0],
        [0, 0, 1]
    ],
    // Passage
    [
        [1, 0, 1],
        [1, 0, 1],
        [1, 0, 1]
    ],
];
export default obstacleSectors;
// ─────────────────────────────────────────────────────────────────────────────
// simulator.js
// A faithful browser port of the Java backend (Pixel / Shape / Simulator).
// The math is identical to Simulator.java so the live website and the graded
// Java project produce the same numbers. This lets the site run with no server.
//
// Java → JavaScript correspondence:
//   Shape.getValidIndex(r,c)      → isValid(r,c)   (bounds check + valid flag)
//   Pixel.playerSetTemperature    → fixed[r][c]
//   Pixel.temperature             → temp[r][c]
//   Simulator.update()            → update()
//   Simulator.run()               → the while loop below
// ─────────────────────────────────────────────────────────────────────────────

export function runSimulation({ rows, cols, maxIterations, accuracy, shape, fixedTemps }) {
  // Grid state — mirrors the fields stored on each Pixel.
  const temp = Array.from({ length: rows }, () => new Array(cols).fill(0))
  const fixed = Array.from({ length: rows }, () => new Array(cols).fill(false))
  const valid = shape.map(row => row.slice()) // which cells are part of the drawn shape

  // Lock in fixed-temperature points (mirrors Shape.setPlayerPixel).
  for (const f of fixedTemps) {
    if (f.row >= 0 && f.row < rows && f.col >= 0 && f.col < cols) {
      temp[f.row][f.col] = f.temp
      fixed[f.row][f.col] = true
      valid[f.row][f.col] = true
    }
  }

  // Mirrors Shape.getValidIndex: out-of-bounds is never valid.
  const isValid = (r, c) => r >= 0 && r < rows && c >= 0 && c < cols && valid[r][c]

  const frames = []
  const capture = () => temp.map(row => row.slice())

  // Mirrors Simulator.update(): one sweep over the grid.
  function update() {
    const next = temp.map(row => row.slice())
    let biggestChange = 0

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Only update cells that are in the shape AND not fixed by the user.
        if (isValid(r, c) && !fixed[r][c]) {
          let sum = 0
          let n = 0
          const old = temp[r][c]

          // A neighbor only counts if it's a valid part of the shape.
          if (isValid(r - 1, c)) { sum += temp[r - 1][c]; n++ }
          if (isValid(r + 1, c)) { sum += temp[r + 1][c]; n++ }
          if (isValid(r, c - 1)) { sum += temp[r][c - 1]; n++ }
          if (isValid(r, c + 1)) { sum += temp[r][c + 1]; n++ }

          // Never divide by zero — an isolated cell keeps its value.
          if (n > 0) {
            const newTemp = sum / n
            const change = Math.abs(newTemp - old)
            if (change > biggestChange) biggestChange = change
            next[r][c] = newTemp
          }
        }
      }
    }

    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        temp[r][c] = next[r][c]

    return biggestChange
  }

  // Mirrors Simulator.run(): iterate until equilibrium or max iterations.
  let iteration = 0
  let maxChange = Number.MAX_VALUE
  frames.push(capture()) // frame 0 = starting grid
  while (iteration < maxIterations && maxChange > accuracy) {
    maxChange = update()
    iteration++
    frames.push(capture())
  }

  // Keep at most ~200 frames so the animation stays light (same as the server did).
  let chosen = frames
  if (frames.length > 200) {
    chosen = []
    const step = Math.floor(frames.length / 200)
    for (let i = 0; i < frames.length; i += step) chosen.push(frames[i])
    if (chosen[chosen.length - 1] !== frames[frames.length - 1]) {
      chosen.push(frames[frames.length - 1])
    }
  }

  // Round to 2 decimals to match the Java response.
  const rounded = chosen.map(f => f.map(row => row.map(v => Math.round(v * 100) / 100)))

  return {
    iterations: iteration,
    equilibrium: maxChange <= accuracy,
    valid,
    frames: rounded
  }
}

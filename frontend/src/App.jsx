import { useState, useEffect, useRef } from 'react'
import { runSimulation as simulate } from './simulator'

// ─────────────────────────────────────────────────────────────────────────────
// Color utility: maps a 0–1 ratio onto a thermal gradient
// blue (cold) → cyan → green → yellow → red (hot)
// ─────────────────────────────────────────────────────────────────────────────
function tempToColor(ratio) {
  const r = Math.max(0, Math.min(1, ratio))
  let red, green, blue
  if (r < 0.25) {
    const t = r / 0.25
    red = 0; green = Math.round(255 * t); blue = 255
  } else if (r < 0.5) {
    const t = (r - 0.25) / 0.25
    red = 0; green = 255; blue = Math.round(255 * (1 - t))
  } else if (r < 0.75) {
    const t = (r - 0.5) / 0.25
    red = Math.round(255 * t); green = 255; blue = 0
  } else {
    const t = (r - 0.75) / 0.25
    red = 255; green = Math.round(255 * (1 - t)); blue = 0
  }
  return `rgb(${red},${green},${blue})`
}

function makeGrid(rows, cols) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ valid: false, fixed: false, temp: 0 }))
  )
}

export default function App() {
  // Grid configuration
  const [rows, setRows] = useState(12)
  const [cols, setCols] = useState(12)

  // Interaction
  const [mode, setMode] = useState('draw') // 'draw' | 'erase' | 'setTemp'
  const [selectedTemp, setSelectedTemp] = useState(100)
  const [cells, setCells] = useState(() => makeGrid(12, 12))

  // Simulation results
  const [frames, setFrames] = useState([])
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [animSpeed, setAnimSpeed] = useState(60)
  const [animKey, setAnimKey] = useState(0)
  const [equilibrium, setEquilibrium] = useState(false)
  const [totalIterations, setTotalIterations] = useState(0)
  const [minTemp, setMinTemp] = useState(0)
  const [maxTemp, setMaxTemp] = useState(100)

  // UI
  const [status, setStatus] = useState('Draw a shape, place fixed temperatures, then run the simulation.')
  const [loading, setLoading] = useState(false)

  const isMouseDown = useRef(false)

  // ─── Resize grid ───────────────────────────────────────────────────────────
  function applyGridSize() {
    setCells(makeGrid(rows, cols))
    setFrames([])
    setCurrentFrame(0)
    setIsAnimating(false)
    setStatus(`Grid set to ${rows}×${cols}. Draw your shape.`)
  }

  // ─── Cell editing ────────────────────────────────────────────────────────
  function editCell(r, c) {
    setCells(prev => {
      const next = [...prev]
      next[r] = [...prev[r]]
      if (mode === 'draw') {
        next[r][c] = { valid: true, fixed: false, temp: 0 }
      } else if (mode === 'erase') {
        next[r][c] = { valid: false, fixed: false, temp: 0 }
      } else if (mode === 'setTemp' && prev[r][c].valid) {
        next[r][c] = { ...prev[r][c], fixed: true, temp: selectedTemp }
      }
      return next
    })
  }

  function removeFixed(r, c) {
    setCells(prev => {
      const next = [...prev]
      next[r] = [...prev[r]]
      next[r][c] = { ...prev[r][c], fixed: false, temp: 0 }
      return next
    })
  }

  function onCellDown(r, c, e) {
    e.preventDefault()
    isMouseDown.current = true
    editCell(r, c)
  }
  function onCellEnter(r, c) {
    if (isMouseDown.current) editCell(r, c)
  }

  useEffect(() => {
    const up = () => { isMouseDown.current = false }
    window.addEventListener('mouseup', up)
    return () => window.removeEventListener('mouseup', up)
  }, [])

  // ─── Animation loop ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAnimating || frames.length === 0) return
    const id = setInterval(() => {
      setCurrentFrame(prev => {
        if (prev >= frames.length - 1) {
          setIsAnimating(false)
          return prev
        }
        return prev + 1
      })
    }, animSpeed)
    return () => clearInterval(id)
  }, [isAnimating, frames, animSpeed, animKey])

  // ─── Run simulation (calls the Java backend) ───────────────────────────────
  async function runSimulation() {
    const fixedTemps = []
    let validCount = 0
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (cells[r][c].valid) validCount++
        if (cells[r][c].fixed) fixedTemps.push({ row: r, col: c, temp: cells[r][c].temp })
      }
    }
    if (validCount === 0) { setStatus('Draw a shape first (Draw mode).'); return }
    if (fixedTemps.length === 0) { setStatus('Add at least one fixed temperature point (Set Temp mode).'); return }

    setLoading(true)
    setIsAnimating(false)
    setFrames([])
    setCurrentFrame(0)
    setStatus('Running simulation…')

    try {
      // Runs the in-browser port of the Java Simulator (no server needed).
      const data = simulate({
        rows, cols,
        maxIterations: 1000,
        accuracy: 0.0001,
        shape: cells.map(row => row.map(cell => cell.valid)),
        fixedTemps
      })

      const last = data.frames[data.frames.length - 1]
      let mn = Infinity, mx = -Infinity
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          if (cells[r][c].valid) { mn = Math.min(mn, last[r][c]); mx = Math.max(mx, last[r][c]) }

      setMinTemp(mn === Infinity ? 0 : mn)
      setMaxTemp(mx === -Infinity ? 100 : mx)
      setFrames(data.frames)
      setEquilibrium(data.equilibrium)
      setTotalIterations(data.iterations)
      setCurrentFrame(0)
      setIsAnimating(true)
      setAnimKey(k => k + 1)
      setStatus(`Done — ${data.iterations} iterations. ${data.equilibrium ? 'Equilibrium reached.' : 'Stopped at max iterations.'}`)
    } catch (err) {
      console.error(err)
      setStatus('Something went wrong running the simulation.')
    } finally {
      setLoading(false)
    }
  }

  function pauseResume() {
    if (frames.length === 0) return
    if (!isAnimating && currentFrame >= frames.length - 1) {
      setCurrentFrame(0)
    }
    setIsAnimating(a => !a)
    setAnimKey(k => k + 1)
  }
  function replay() {
    setCurrentFrame(0)
    setIsAnimating(true)
    setAnimKey(k => k + 1)
  }
  function clearAll() {
    setIsAnimating(false)
    setCells(makeGrid(rows, cols))
    setFrames([])
    setCurrentFrame(0)
    setStatus('Cleared. Draw a new shape.')
  }

  // ─── Display helpers ───────────────────────────────────────────────────────
  const displayFrame = frames.length > 0 ? frames[currentFrame] : null
  const tempRange = maxTemp - minTemp
  const cellPx = Math.max(18, Math.floor(620 / Math.max(rows, cols)))

  const fixedPoints = []
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (cells[r][c].fixed) fixedPoints.push({ r, c, temp: cells[r][c].temp })

  // approximate fixed-temp range for pre-run coloring
  const fixedVals = fixedPoints.map(p => p.temp)
  const fMin = fixedVals.length ? Math.min(...fixedVals) : 0
  const fMax = fixedVals.length ? Math.max(...fixedVals) : 100

  function cellBackground(r, c) {
    const cell = cells[r][c]
    if (!cell.valid) return 'var(--void)'
    if (displayFrame) {
      const ratio = tempRange > 0 ? (displayFrame[r][c] - minTemp) / tempRange : 0.5
      return tempToColor(ratio)
    }
    if (cell.fixed) {
      const ratio = fMax > fMin ? (cell.temp - fMin) / (fMax - fMin) : 0.5
      return tempToColor(ratio)
    }
    return 'rgba(110,168,255,0.16)'
  }
  function cellBorder(r, c) {
    const cell = cells[r][c]
    if (!cell.valid) return '1px solid rgba(255,255,255,0.03)'
    if (cell.fixed) return '2px solid #fff'
    if (displayFrame) return '1px solid rgba(0,0,0,0.25)'
    return '1px solid rgba(110,168,255,0.4)'
  }
  function cellGlow(r, c) {
    if (!displayFrame || !cells[r][c].valid) return 'none'
    const ratio = tempRange > 0 ? (displayFrame[r][c] - minTemp) / tempRange : 0.5
    if (ratio < 0.55) return 'none'
    const strength = (ratio - 0.55) / 0.45
    return `0 0 ${Math.round(10 * strength)}px ${Math.round(3 * strength)}px ${tempToColor(ratio)}66`
  }

  // hottest / coldest at the displayed frame
  let hottest = null, coldest = null
  if (displayFrame) {
    let hi = -Infinity, lo = Infinity
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (cells[r][c].valid) {
          const t = displayFrame[r][c]
          if (t > hi) { hi = t; hottest = { r, c, t } }
          if (t < lo) { lo = t; coldest = { r, c, t } }
        }
  }

  const modeButtons = [
    { id: 'draw', label: 'Draw shape', hint: 'click + drag to add cells' },
    { id: 'erase', label: 'Erase', hint: 'click + drag to remove cells' },
    { id: 'setTemp', label: 'Set temperature', hint: 'click a cell to fix its temp' }
  ]

  return (
    <div className="page">
      <div className="bg-grid" aria-hidden="true" />

      <header className="masthead">
        <div className="badge">LINEAR ALGEBRA × AP CS A</div>
        <h1>Heat&nbsp;Distribution&nbsp;Simulator</h1>
        <p className="tagline">
          Draw a shape, anchor a few temperatures, and watch heat diffuse to equilibrium —
          one neighbor-average at a time, until nothing moves.
        </p>
      </header>

      <div className="workspace">
        {/* ── CONTROL PANEL ── */}
        <aside className="panel">
          <section className="block">
            <div className="block-title">Grid</div>
            <div className="dims">
              <label>rows
                <input type="number" min={2} max={32} value={rows}
                  onChange={e => setRows(Math.max(2, Math.min(32, +e.target.value || 2)))} />
              </label>
              <span className="times">×</span>
              <label>cols
                <input type="number" min={2} max={32} value={cols}
                  onChange={e => setCols(Math.max(2, Math.min(32, +e.target.value || 2)))} />
              </label>
            </div>
            <button className="btn ghost wide" onClick={applyGridSize}>Apply size</button>
          </section>

          <section className="block">
            <div className="block-title">Tool</div>
            <div className="tools">
              {modeButtons.map(m => (
                <button key={m.id}
                  className={`tool ${mode === m.id ? 'on' : ''}`}
                  onClick={() => setMode(m.id)}>
                  <span className="tool-label">{m.label}</span>
                  <span className="tool-hint">{m.hint}</span>
                </button>
              ))}
            </div>
          </section>

          {mode === 'setTemp' && (
            <section className="block">
              <div className="block-title">Temperature <span className="temp-readout">{selectedTemp}°</span></div>
              <input type="range" min={0} max={200} value={selectedTemp} className="slider"
                onChange={e => setSelectedTemp(+e.target.value)} />
              <div className="presets">
                {[0, 25, 50, 75, 100, 150, 200].map(t => (
                  <button key={t} className={`chip ${selectedTemp === t ? 'on' : ''}`}
                    onClick={() => setSelectedTemp(t)}>{t}°</button>
                ))}
              </div>
              {fixedPoints.length > 0 && (
                <div className="fixed-list">
                  {fixedPoints.map(({ r, c, temp }) => (
                    <div key={`${r}-${c}`} className="fixed-row">
                      <span className="dot" style={{ background: tempToColor(fMax > fMin ? (temp - fMin) / (fMax - fMin) : 0.5) }} />
                      <span className="coord">[{r}, {c}]</span>
                      <span className="val">{temp}°</span>
                      <button className="x" onClick={() => removeFixed(r, c)}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="block">
            <div className="block-title">Run</div>
            <button className="btn solid wide" onClick={runSimulation} disabled={loading}>
              {loading ? 'Running…' : '▶  Run simulation'}
            </button>
            {frames.length > 0 && (
              <div className="run-row">
                <button className="btn ghost" onClick={pauseResume}>{isAnimating ? '⏸ Pause' : '▶ Play'}</button>
                <button className="btn ghost" onClick={replay}>↻ Replay</button>
              </div>
            )}
            <button className="btn danger wide" onClick={clearAll}>Clear grid</button>
          </section>

          {frames.length > 0 && (
            <section className="block">
              <div className="block-title">Playback</div>
              <input type="range" min={0} max={frames.length - 1} value={currentFrame} className="slider"
                onChange={e => { setIsAnimating(false); setCurrentFrame(+e.target.value) }} />
              <div className="speed-line">
                <span>frame {currentFrame + 1}/{frames.length}</span>
                <span>{animSpeed < 40 ? 'fast' : animSpeed < 90 ? 'medium' : 'slow'}</span>
              </div>
              <input type="range" min={15} max={180} value={animSpeed} className="slider thin"
                onChange={e => setAnimSpeed(+e.target.value)} />
            </section>
          )}
        </aside>

        {/* ── GRID + READOUT ── */}
        <main className="stage">
          <div className="grid-shell">
            <div className="grid"
              style={{ gridTemplateColumns: `repeat(${cols}, ${cellPx}px)` }}
              onMouseLeave={() => { isMouseDown.current = false }}>
              {cells.map((row, r) =>
                row.map((cell, c) => (
                  <div key={`${r}-${c}`} className="cell"
                    style={{
                      width: cellPx, height: cellPx,
                      background: cellBackground(r, c),
                      border: cellBorder(r, c),
                      boxShadow: cellGlow(r, c)
                    }}
                    onMouseDown={e => onCellDown(r, c, e)}
                    onMouseEnter={() => onCellEnter(r, c)}>
                    {cell.fixed && !displayFrame && cellPx >= 34 && (
                      <span className="cell-temp">{cell.temp}°</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="legend">
            <span className="legend-end">{frames.length ? `${minTemp.toFixed(1)}°` : 'cold'}</span>
            <div className="legend-bar" />
            <span className="legend-end">{frames.length ? `${maxTemp.toFixed(1)}°` : 'hot'}</span>
          </div>

          <div className="readout">
            <div className="stat">
              <div className="stat-k">Status</div>
              <div className="stat-v small">{status}</div>
            </div>
            {frames.length > 0 && (
              <>
                <div className="stat">
                  <div className="stat-k">Iterations</div>
                  <div className="stat-v">{totalIterations}</div>
                </div>
                <div className="stat">
                  <div className="stat-k">State</div>
                  <div className="stat-v small">{equilibrium ? 'Equilibrium ✓' : 'Max iterations'}</div>
                </div>
                {hottest && (
                  <div className="stat">
                    <div className="stat-k">Hottest</div>
                    <div className="stat-v">{hottest.t.toFixed(1)}° <span className="at">[{hottest.r},{hottest.c}]</span></div>
                  </div>
                )}
                {coldest && (
                  <div className="stat">
                    <div className="stat-k">Coldest</div>
                    <div className="stat-v">{coldest.t.toFixed(1)}° <span className="at">[{coldest.r},{coldest.c}]</span></div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* ── LINEAR ALGEBRA SECTION ── */}
      <section className="math">
        <div className="math-head">
          <div className="badge">THE MATH</div>
          <h2>Why this is linear algebra</h2>
        </div>

        <div className="math-cards">
          <article className="mcard">
            <h3>1 · The averaging rule</h3>
            <p>At equilibrium each non-fixed pixel equals the average of its valid neighbors:</p>
            <div className="eq">T = (T<sub>up</sub> + T<sub>down</sub> + T<sub>left</sub> + T<sub>right</sub>) / 4</div>
            <p>Rearranged, that is a linear equation:</p>
            <div className="eq accent">4T − T<sub>up</sub> − T<sub>down</sub> − T<sub>left</sub> − T<sub>right</sub> = 0</div>
            <p>An edge pixel with only three neighbors just gives a slightly different equation:</p>
            <div className="eq">3T − T<sub>1</sub> − T<sub>2</sub> − T<sub>3</sub> = 0</div>
          </article>

          <article className="mcard">
            <h3>2 · One system: Ax = b</h3>
            <p>Every unknown pixel contributes exactly one equation. With <em>n</em> unknown pixels you get <em>n</em> equations, packed into matrix form:</p>
            <div className="eq accent big">A x = b</div>
            <ul>
              <li><b>A</b> — coefficients from the averaging rule</li>
              <li><b>x</b> — the unknown temperatures</li>
              <li><b>b</b> — constants set by the fixed points</li>
            </ul>
          </article>

          <article className="mcard">
            <h3>3 · A worked example</h3>
            <p>A 4-cell row with the ends fixed at 100° and 0°, two unknowns T₁, T₂ in the middle:</p>
            <div className="eq">2T₁ − T₂ = 100<br />−T₁ + 2T₂ = 0</div>
            <p>As a matrix:</p>
            <div className="eq matrix">
              [ 2&nbsp;&nbsp;−1 ] [ T₁ ] = [ 100 ]<br />
              [ −1&nbsp;&nbsp;2 ] [ T₂ ] = [ &nbsp;&nbsp;0 ]
            </div>
            <p>Solving gives <b>T₁ ≈ 66.7°, T₂ ≈ 33.3°</b> — a straight gradient, exactly what the simulator draws.</p>
          </article>

          <article className="mcard">
            <h3>4 · Why iterate instead of solve</h3>
            <p>A 20×20 region makes <b>A</b> a 400×400 matrix — expensive to invert directly. So the program uses <em>Jacobi iteration</em>: repeatedly replace each unknown with its neighbor-average until nothing moves.</p>
            <div className="eq">repeat until&nbsp; |T<sub>new</sub> − T<sub>old</sub>| &lt; ε&nbsp; (ε = 0.0001)</div>
            <p>Each frame in the animation above is one sweep of that loop converging toward the solution of Ax = b.</p>
          </article>
        </div>
      </section>

      <footer className="foot">
        Heat Distribution Simulator · AP CS A &amp; Linear Algebra final project · simulation logic ported from the Java backend
      </footer>
    </div>
  )
}

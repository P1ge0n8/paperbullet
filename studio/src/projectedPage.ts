type P = readonly [number, number]

// The CSS matrix that maps a w × h box onto a quadrilateral (top-left,
// top-right, bottom-right, bottom-left): Heckbert's square-to-quad mapping.
export function quad(w: number, h: number, [x0, y0]: P, [x1, y1]: P, [x2, y2]: P, [x3, y3]: P) {
  const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2
  const sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3
  const den = dx1 * dy2 - dx2 * dy1
  const g = (sx * dy2 - dx2 * sy) / den
  const k = (dx1 * sy - sx * dy1) / den
  const a = x1 - x0 + g * x1, b = x3 - x0 + k * x3
  const d = y1 - y0 + g * y1, e = y3 - y0 + k * y3
  const m = [a / w, d / w, 0, g / w, b / h, e / h, 0, k / h, 0, 0, 1, 0, x0, y0, 0, 1]
  return `matrix3d(${m.map((n) => +n.toFixed(10)).join(',')})`
}


// ── Squarified treemap layout — PRD B4.1 ──────────────────────────────────────
// No dependencies. items = [{ label, value }], bounds = { x, y, w, h }.
// Returns [{ label, value, x, y, w, h }] covering the full bounds, non-overlapping.

export function squarify(items, bounds) {
  const rects = [];
  if (!items || items.length === 0) return rects;

  const total = items.reduce((s, it) => s + Math.max(0, it.value || 0), 0);
  if (total <= 0) return rects;

  const sorted = items
    .map((it) => ({ ...it, value: Math.max(0, it.value || 0) }))
    .filter((it) => it.value > 0)
    .sort((a, b) => b.value - a.value);

  const area = Math.max(0, bounds.w * bounds.h);
  if (area <= 0) return rects;

  // Start with the full bounds; recursively cut rows.
  const scale = area / total;

  function cutRow(rowItems, rect) {
    const sum = rowItems.reduce((s, it) => s + it.value, 0) * scale;
    if (sum <= 0) return;
    // layout along the longer side
    const horizontal = rect.w >= rect.h;
    const fixed = horizontal ? rect.w : rect.h; // length of the row along the longer side
    const rowH = sum / fixed; // thickness of the row
    let off = 0;
    rowItems.forEach((it) => {
      const cellLen = ((it.value * scale) / sum) * fixed;
      const r = horizontal
        ? { x: rect.x + off, y: rect.y + (rect.h - rowH) / 2, w: cellLen, h: rowH }
        : { x: rect.x + (rect.w - rowH) / 2, y: rect.y + off, w: rowH, h: cellLen };
      rects.push({ ...it, ...r });
      off += cellLen;
    });
    // shrink rect for the next row
    if (horizontal) {
      return { x: rect.x, y: rect.y + rowH, w: rect.w, h: rect.h - rowH };
    }
    return { x: rect.x + rowH, y: rect.y, w: rect.w - rowH, h: rect.h };
  }

  const worst = (rowValues, fixed) => {
    if (rowValues.length === 0) return Infinity;
    const sum = rowValues.reduce((s, v) => s + v, 0);
    const max = Math.max(...rowValues);
    const min = Math.min(...rowValues);
    const s2 = fixed * fixed;
    return Math.max((s2 * max) / (sum * sum), (s2 * min) / (sum * sum));
  };

  let rect = { ...bounds };
  let remaining = [...sorted];
  let row = [];
  let rowWorst = Infinity;

  while (remaining.length > 0) {
    const fixed = Math.min(rect.w, rect.h);
    const next = remaining[0];
    const candidate = row.concat(next).map((it) => it.value * scale);
    const candidateWorst = worst(candidate, fixed);

    if (row.length === 0 || candidateWorst <= rowWorst) {
      row.push(remaining.shift());
      rowWorst = candidateWorst;
    } else {
      // flush the row
      const newRect = cutRow(row, rect);
      if (!newRect || newRect.w <= 0 || newRect.h <= 0) {
        // last row — place what remains and bail
        remaining.forEach((it) => {
          rects.push({ ...it, x: rect.x, y: rect.y, w: 0, h: 0 });
        });
        remaining = [];
        break;
      }
      rect = newRect;
      row = [];
      rowWorst = Infinity;
    }
  }
  if (row.length > 0) {
    cutRow(row, rect);
  }

  return rects;
}

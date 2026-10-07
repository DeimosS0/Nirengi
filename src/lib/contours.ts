// Deterministic topographic contour rings for the "pafta" backdrop.
// Radius is perturbed by a few harmonics, then smoothed with Catmull–Rom.

export function contourPath(cx: number, cy: number, r: number, seed: number, points = 28): string {
  const pts: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const t = (i / points) * Math.PI * 2;
    const k = 1 + 0.09 * Math.sin(3 * t + seed) + 0.05 * Math.sin(5 * t + seed * 1.7) + 0.03 * Math.cos(2 * t - seed);
    pts.push([cx + Math.cos(t) * r * k * 1.18, cy + Math.sin(t) * r * k * 0.82]);
  }
  const p = (i: number) => pts[(i + points) % points];
  let d = `M${p(0)[0].toFixed(1)} ${p(0)[1].toFixed(1)}`;
  for (let i = 0; i < points; i++) {
    const [x0, y0] = p(i - 1);
    const [x1, y1] = p(i);
    const [x2, y2] = p(i + 1);
    const [x3, y3] = p(i + 2);
    const c1 = [x1 + (x2 - x0) / 6, y1 + (y2 - y0) / 6];
    const c2 = [x2 - (x3 - x1) / 6, y2 - (y3 - y1) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }
  return `${d}Z`;
}

export function contourField(cx: number, cy: number, rings: number, step: number, seed: number) {
  return Array.from({ length: rings }, (_, i) => contourPath(cx, cy, step * (i + 1), seed + i * 0.35));
}

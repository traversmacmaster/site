export const CLASSIC_RINGS = [96, 105, 144, 150];
export const CLASSIC_WHEELS = [
  24, 30, 32, 36, 40, 42, 45, 48, 50, 52, 56, 60, 63, 64, 72, 75, 80, 84,
];

export function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}
export function closureTurns(ring, wheel) {
  return wheel / gcd(ring, wheel);
}
export function symmetry(ring, wheel) {
  return ring / gcd(ring, wheel);
}
export function holeCount(wheel) {
  return Math.max(5, Math.min(14, Math.round(wheel / 8) + 3));
}
export function holeOffset(wheel, hole) {
  const count = holeCount(wheel);
  const safe = Math.max(1, Math.min(count, hole));
  return wheel * (0.16 + ((safe - 1) * 0.76) / Math.max(1, count - 1));
}
export function validateCounts(ring, wheel, mode = "inside") {
  if (!Number.isInteger(ring) || !Number.isInteger(wheel))
    return "Tooth counts must be whole numbers.";
  if (ring < 20 || ring > 500 || wheel < 3 || wheel > 250)
    return "Ring must be 20–500 and wheel 3–250.";
  if (mode === "inside" && wheel >= ring)
    return "For inside drawing, the wheel must be smaller than the ring.";
  return "";
}
export function pointAt({ ring, wheel, hole, mode }, theta) {
  const d = holeOffset(wheel, hole);
  if (mode === "outside") {
    const q = (ring + wheel) / wheel;
    return {
      x: (ring + wheel) * Math.cos(theta) - d * Math.cos(q * theta),
      y: (ring + wheel) * Math.sin(theta) - d * Math.sin(q * theta),
    };
  }
  const q = (ring - wheel) / wheel;
  return {
    x: (ring - wheel) * Math.cos(theta) + d * Math.cos(q * theta),
    y: (ring - wheel) * Math.sin(theta) - d * Math.sin(q * theta),
  };
}
export function mechanismAt(spec, theta) {
  const sign = spec.mode === "outside" ? 1 : -1;
  const distance = spec.ring + sign * spec.wheel;
  const rotation =
    spec.mode === "outside"
      ? -((spec.ring + spec.wheel) / spec.wheel) * theta
      : ((spec.ring - spec.wheel) / spec.wheel) * theta;
  return {
    center: { x: distance * Math.cos(theta), y: distance * Math.sin(theta) },
    rotation,
    pen: pointAt(spec, theta),
  };
}
export function samplePath(spec, quality = 1) {
  const turns = closureTurns(spec.ring, spec.wheel);
  const end = Math.PI * 2 * turns;
  const estimated = Math.ceil(
    end * Math.max(spec.ring, spec.wheel) * 0.42 * quality,
  );
  const count = Math.max(720, Math.min(48000, estimated));
  const points = new Array(count + 1);
  for (let i = 0; i <= count; i++) points[i] = pointAt(spec, (end * i) / count);
  return { points, end, count };
}
export function isClosed(points, epsilon = 1e-7) {
  if (!points || points.length < 2) return false;
  const a = points[0],
    b = points[points.length - 1];
  return Math.hypot(a.x - b.x, a.y - b.y) <= epsilon;
}
export function pathBounds(points) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}
export function svgPath(points, transform = (p) => p) {
  return points
    .map((p, i) => {
      const q = transform(p);
      return `${i ? "L" : "M"}${q.x.toFixed(3)} ${q.y.toFixed(3)}`;
    })
    .join(" ");
}

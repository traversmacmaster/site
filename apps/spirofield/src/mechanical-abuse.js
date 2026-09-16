const TAU = Math.PI * 2;
export const defaultMechanicalAbuse = () => ({
  enabled: false, seed: 1847,
  gearSlip: { amount: 0, frequency: 0, recovery: .35 },
  backlash: { amount: 0, response: .35 }, wobble: { amount: 0, rate: 1 },
  penFlex: { flex: 0, damping: .72 }, inkBleed: { bleed: 0, spread: 0 },
  penLift: { probability: 0, duration: .02 }, brokenTooth: { amount: 0, phase: .5 },
});
const fract = x => x - Math.floor(x);
const hash = (n, seed) => fract(Math.sin(n * 127.1 + seed * 311.7) * 43758.5453);
const wrap = x => ((x % 1) + 1) % 1;

/** Stateful mechanical path transducer. Input points are ideal mechanism positions. */
export function abuseMechanicalPath(points, cfg = defaultMechanicalAbuse()) {
  if (!cfg?.enabled) return points;
  let phaseOffset = 0, slip = 0, flex = { x: 0, y: 0 }, prev = points[0], prevV = { x: 0, y: 0 };
  return points.map((ideal, i) => {
    const u = i / Math.max(1, points.length - 1), cycle = Math.floor(u * 64);
    if (cfg.gearSlip.amount && hash(cycle, cfg.seed) < cfg.gearSlip.frequency * .08)
      slip += (hash(cycle + 1, cfg.seed) - .5) * cfg.gearSlip.amount;
    slip *= 1 - Math.min(.98, cfg.gearSlip.recovery * .08);
    phaseOffset += slip / Math.max(1, points.length);
    const toothDistance = Math.abs(wrap(u - cfg.brokenTooth.phase + .5) - .5);
    const clunk = cfg.brokenTooth.amount * Math.exp(-toothDistance * points.length / 3);
    const wobbleA = TAU * u * Math.max(.05, cfg.wobble.rate);
    let x = ideal.x + Math.cos(wobbleA) * cfg.wobble.amount + clunk;
    let y = ideal.y + Math.sin(wobbleA * 1.013) * cfg.wobble.amount - clunk * .35;
    const v = { x: x - prev.x, y: y - prev.y };
    const accel = { x: v.x - prevV.x, y: v.y - prevV.y };
    const response = Math.max(.01, 1 - cfg.penFlex.damping);
    flex.x += (-accel.x * cfg.penFlex.flex - flex.x) * response;
    flex.y += (-accel.y * cfg.penFlex.flex - flex.y) * response;
    const speed = Math.hypot(v.x, v.y);
    const liftCell = Math.floor(u / Math.max(.002, cfg.penLift.duration));
    const contact = hash(liftCell, cfg.seed + 19) >= cfg.penLift.probability;
    prev = { x, y }; prevV = v;
    return { ...ideal, x: x + flex.x, y: y + flex.y, contact,
      deposition: 1 + cfg.inkBleed.bleed / Math.max(.2, speed), spread: cfg.inkBleed.spread,
      mechanicalPhase: u + phaseOffset };
  });
}

import {
  CLASSIC_RINGS,
  CLASSIC_WHEELS,
  gcd,
  symmetry,
  holeCount,
  holeOffset,
  validateCounts,
  samplePath,
  mechanismAt,
  svgPath,
} from "./geometry.js";
import { History, snapshotState } from "./history.js";
import { createRecorder } from "./recorder.js";
import { abuseMechanicalPath, defaultMechanicalAbuse } from "./mechanical-abuse.js";
import {
  autosave,
  readAutosave,
  clearAutosave,
  normalizeProject,
} from "./project.js";

const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)],
  clone = (o) => structuredClone(o);
const state = {
  version: 2,
  canvas: { width: 1600, height: 1200 },
  background: "#f2ead8",
  transparentBackground: false,
  workspace: "classic",
  selection: { ring: 96, wheel: 32, hole: 3, mode: "inside" },
  appearance: { color: "#ff5d47", width: 2, opacity: 1 },
  layers: [],
  selectedLayerId: null,
  showMechanism: true,
  speed: 36,
  progress: 0,
  playing: false,
  projectName: "Untitled",
  mechanicalAbuse: defaultMechanicalAbuse(),
};
const history = new History(60),
  pathCache = new WeakMap();
function sampledCurrent() {
  const path = samplePath(state.selection);
  path.points = abuseMechanicalPath(path.points, state.mechanicalAbuse);
  return path;
}
let current = sampledCurrent(),
  raf = 0,
  lastTime = 0,
  autosaveTimer = 0,
  styleStart = null;
const canvas = $("#canvas"),
  ctx = canvas.getContext("2d");
let dpr = 1;
const liveRecorder = createRecorder((target, w, h) => renderExport(target.canvas, w, h, false, true));
liveRecorder.mount($("#recordingPanel"));
function recordingFrame(now) {
  liveRecorder.frame(state, now);
  requestAnimationFrame(recordingFrame);
}
requestAnimationFrame(recordingFrame);

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
function selectedLayer() {
  return state.layers.find((l) => l.id === state.selectedLayerId) || null;
}
function radialSize(spec) {
  return spec.mode === "outside" ? spec.ring + 2 * spec.wheel : spec.ring;
}
function fitScale(w, h) {
  return (
    (0.43 * Math.min(w, h)) /
    Math.max(
      1,
      radialSize(state.selection),
      ...state.layers.filter((l) => l.visible).map(radialSize),
    )
  );
}
function transform(p, s = fitScale(canvas.width / dpr, canvas.height / dpr)) {
  return {
    x: canvas.width / dpr / 2 + p.x * s,
    y: canvas.height / dpr / 2 + p.y * s,
  };
}
function resize() {
  const r = canvas.getBoundingClientRect();
  dpr = Math.min(devicePixelRatio || 1, 2.5);
  canvas.width = Math.max(1, Math.round(r.width * dpr));
  canvas.height = Math.max(1, Math.round(r.height * dpr));
  render();
}
function pathFor(layer) {
  let p = pathCache.get(layer);
  if (!p && typeof Path2D !== "undefined") {
    p = new Path2D();
    layer.points.forEach((q, i) =>
      i && q.contact !== false ? p.lineTo(q.x, q.y) : p.moveTo(q.x, q.y),
    );
    pathCache.set(layer, p);
  }
  return p;
}
function strokeLayer(
  layer,
  c = ctx,
  w = canvas.width / dpr,
  h = canvas.height / dpr,
  s = fitScale(w, h),
) {
  const p = pathFor(layer);
  c.save();
  c.translate(w / 2, h / 2);
  c.scale(s, s);
  c.strokeStyle = layer.color;
  c.globalAlpha = layer.opacity;
  c.lineWidth = layer.width / s;
  c.lineCap = "round";
  c.lineJoin = "round";
  if (p) c.stroke(p);
  else {
    c.beginPath();
    layer.points.forEach((q, i) =>
      i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y),
    );
    c.stroke();
  }
  c.restore();
}
function strokePartial(points, count, style) {
  if (count < 2) return;
  ctx.beginPath();
  for (let i = 0; i < count; i++) {
    const p = transform(points[i]);
    i && points[i].contact !== false ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
  }
  ctx.strokeStyle = style.color;
  ctx.globalAlpha = style.opacity;
  ctx.lineWidth = style.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.globalAlpha = 1;
}
function toothCircle(c, x, y, r, count, color, width = 1, rotation = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(rotation);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.stroke();
  const step = (Math.PI * 2) / count;
  c.beginPath();
  for (let i = 0; i < count; i++) {
    const a = i * step;
    c.moveTo(Math.cos(a) * (r - 3), Math.sin(a) * (r - 3));
    c.lineTo(Math.cos(a) * (r + 3), Math.sin(a) * (r + 3));
  }
  c.stroke();
  c.restore();
}
function drawMechanism(theta) {
  const s = fitScale(canvas.width / dpr, canvas.height / dpr),
    cx = canvas.width / dpr / 2,
    cy = canvas.height / dpr / 2,
    m = mechanismAt(state.selection, theta),
    mc = transform(m.center, s),
    pen = transform(m.pen, s);
  ctx.save();
  ctx.globalAlpha = 0.68;
  toothCircle(
    ctx,
    cx,
    cy,
    state.selection.ring * s,
    state.selection.ring,
    "#4f5049",
  );
  toothCircle(
    ctx,
    mc.x,
    mc.y,
    state.selection.wheel * s,
    state.selection.wheel,
    "#565750",
    1.2,
    m.rotation,
  );
  ctx.fillStyle = "#42433e";
  ctx.beginPath();
  ctx.arc(mc.x, mc.y, 3, 0, 7);
  ctx.fill();
  for (let h = 1; h <= holeCount(state.selection.wheel); h++) {
    const off = holeOffset(state.selection.wheel, h) * s,
      a = m.rotation,
      px = mc.x + Math.cos(a) * off,
      py = mc.y - Math.sin(a) * off;
    ctx.beginPath();
    ctx.arc(px, py, h === state.selection.hole ? 5 : 2.6, 0, 7);
    ctx.fillStyle =
      h === state.selection.hole ? state.appearance.color : "#77786f";
    ctx.fill();
    if (h === state.selection.hole) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
  ctx.strokeStyle = state.appearance.color;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(mc.x, mc.y);
  ctx.lineTo(pen.x, pen.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = state.appearance.color;
  ctx.beginPath();
  ctx.arc(pen.x, pen.y, 4.5, 0, 7);
  ctx.fill();
  ctx.restore();
}
function render() {
  const w = canvas.width / dpr,
    h = canvas.height / dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  canvas.classList.toggle("transparent-preview", state.transparentBackground);
  if (!state.transparentBackground) {
    ctx.fillStyle = state.background;
    ctx.fillRect(0, 0, w, h);
  }
  for (const l of state.layers) if (l.visible) strokeLayer(l);
  const n = Math.floor(current.points.length * state.progress);
  if (n > 1) strokePartial(current.points, n, state.appearance);
  if (state.showMechanism && !selectedLayer())
    drawMechanism(current.end * state.progress);
  $("#emptyHint").style.display =
    state.layers.length || state.progress ? "none" : "block";
}

function scheduleAutosave() {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(async () => {
    try {
      const text = serialize();
      if (window.spiroDesktop) await window.spiroDesktop.saveRecovery(text);
      else autosave(localStorage, text);
      $("#statusText").textContent = "AUTOSAVED";
    } catch {
      $("#statusText").textContent = "AUTOSAVE FULL";
    }
  }, 500);
}
function capture(label) {
  history.push(snapshotState(state), label);
  updateHistoryButtons();
}
function applySnapshot(s) {
  Object.assign(state, s, { playing: false, progress: 0 });
  state.mechanicalAbuse = { ...defaultMechanicalAbuse(), ...(state.mechanicalAbuse || {}) };
  current = sampledCurrent();
  syncInputs();
  updateUI();
  render();
  scheduleAutosave();
}
function undo() {
  pause(false);
  const e = history.undo(snapshotState(state));
  if (e) applySnapshot(e.snapshot);
}
function redo() {
  pause(false);
  const e = history.redo(snapshotState(state));
  if (e) applySnapshot(e.snapshot);
}
function updateHistoryButtons() {
  $("#undo").disabled = !history.canUndo;
  $("#redo").disabled = !history.canRedo;
}
function mutate(label, fn) {
  capture(label);
  fn();
  updateUI();
  render();
  scheduleAutosave();
}

function rebuild() {
  if (state.workspace === "classic") {
    if (!CLASSIC_RINGS.includes(state.selection.ring))
      state.selection.ring = 96;
    if (!CLASSIC_WHEELS.includes(state.selection.wheel))
      state.selection.wheel = 32;
  }
  const err = validateCounts(
    state.selection.ring,
    state.selection.wheel,
    state.selection.mode,
  );
  $("#validation").textContent = err;
  if (!err) {
    state.selection.hole = Math.min(
      state.selection.hole,
      holeCount(state.selection.wheel),
    );
    current = sampledCurrent();
  }
  updateUI();
  render();
  scheduleAutosave();
}
function makeButtons(el, values, key) {
  el.innerHTML = values
    .map(
      (v) =>
        `<button data-value="${v}" class="${state.selection[key] === v ? "active" : ""}" aria-pressed="${state.selection[key] === v}">${v}</button>`,
    )
    .join("");
  el.onclick = (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    state.selectedLayerId = null;
    state.selection[key] = +b.dataset.value;
    state.progress = 0;
    rebuild();
  };
}
function renderHoles() {
  const n = holeCount(state.selection.wheel);
  $("#holes").innerHTML = Array.from(
    { length: n },
    (_, i) =>
      `<button data-hole="${i + 1}" class="${state.selection.hole === i + 1 ? "active" : ""}" aria-label="Pen hole ${i + 1}" aria-pressed="${state.selection.hole === i + 1}">${i + 1}</button>`,
  ).join("");
  $("#holes").onclick = (e) => {
    const b = e.target.closest("button");
    if (b) {
      state.selectedLayerId = null;
      state.selection.hole = +b.dataset.hole;
      state.progress = 0;
      rebuild();
    }
  };
}
function ratioText(spec = state.selection) {
  const g = gcd(spec.ring, spec.wheel);
  return `${spec.ring / g} : ${spec.wheel / g}`;
}
function syncInputs() {
  const edit = selectedLayer(),
    appearance = edit || state.appearance;
  $("#lineColor").value = appearance.color;
  $("#lineWidth").value = appearance.width;
  $("#opacity").value = appearance.opacity * 100;
  $("#bgColor").value = state.background;
  $("#transparentBackground").checked = state.transparentBackground;
  $("#canvasWidth").value = state.canvas.width;
  $("#canvasHeight").value = state.canvas.height;
  $("#speed").value = state.speed;
  $("#mechanismToggle").checked = state.showMechanism;
}
function updateUI() {
  makeButtons($("#rings"), CLASSIC_RINGS, "ring");
  makeButtons($("#wheels"), CLASSIC_WHEELS, "wheel");
  renderHoles();
  const edit = selectedLayer(),
    info = edit || state.selection,
    appearance = edit || state.appearance;
  $("#ringReadout").textContent = state.selection.ring;
  $("#wheelReadout").textContent = state.selection.wheel;
  $("#holeReadout").textContent = state.selection.hole;
  $("#ringInput").value = state.selection.ring;
  $("#wheelInput").value = state.selection.wheel;
  $("#infoRing").textContent = `${info.ring} teeth`;
  $("#infoWheel").textContent = `${info.wheel} teeth`;
  $("#infoHole").textContent = info.hole;
  $("#infoRatio").textContent = ratioText(info);
  $("#infoSymmetry").textContent = `${symmetry(info.ring, info.wheel)}-fold`;
  $("#lineHex").textContent = appearance.color.toUpperCase();
  $("#widthOut").textContent = (+appearance.width).toFixed(1);
  $("#opacityOut").textContent = `${Math.round(appearance.opacity * 100)}%`;
  $("#progressText").textContent = `${Math.round(state.progress * 100)}%`;
  $("#layerCount").textContent = state.layers.length;
  $("#penLabel").textContent = edit
    ? `PEN · ${edit.name}`
    : "PEN · NEW PATTERN";
  $("#deselectLayer").classList.toggle("hidden", !edit);
  $("#statusText").textContent = state.playing
    ? "DRAWING"
    : state.progress
      ? "PAUSED"
      : "READY";
  $("#statusDot").classList.toggle("drawing", state.playing);
  $("#draw").disabled =
    state.playing ||
    !!validateCounts(
      state.selection.ring,
      state.selection.wheel,
      state.selection.mode,
    ) ||
    !!edit;
  $("#pause").disabled = !state.playing;
  $$("[data-workspace]").forEach((b) =>
    b.classList.toggle("active", b.dataset.workspace === state.workspace),
  );
  $$("[data-mode]").forEach((b) =>
    b.classList.toggle("active", b.dataset.mode === state.selection.mode),
  );
  $("#labRing").classList.toggle("hidden", state.workspace !== "lab");
  $("#labWheel").classList.toggle("hidden", state.workspace !== "lab");
  $("#rings").classList.toggle("hidden", state.workspace === "lab");
  $("#wheels").classList.toggle("hidden", state.workspace === "lab");
  updateHistoryButtons();
  renderLayers();
}
function renderLayers() {
  const el = $("#layers");
  if (!state.layers.length) {
    el.innerHTML = '<p class="no-layers">Completed patterns stay here.</p>';
    return;
  }
  el.innerHTML = state.layers
    .map(
      (l, i) =>
        `<div class="layer ${l.visible ? "" : "hidden-layer"} ${l.id === state.selectedLayerId ? "selected" : ""}" data-select="${i}" tabindex="0" role="button" aria-label="Edit ${l.name}"><button data-vis="${i}" title="Show or hide" aria-label="${l.visible ? "Hide" : "Show"} ${l.name}">${l.visible ? "◉" : "○"}</button><div><span class="swatch" style="display:inline-block;background:${l.color};border-color:${l.color}"></span><b>${l.name}</b><small>${l.ring}/${l.wheel} · H${l.hole} · ${l.mode === "inside" ? "IN" : "OUT"}</small><div class="layer-tools"><button data-up="${i}" title="Move up">↑</button><button data-down="${i}" title="Move down">↓</button><button data-dup="${i}" title="Duplicate">⧉</button></div></div><button data-del="${i}" title="Delete" aria-label="Delete ${l.name}">×</button></div>`,
    )
    .join("");
  el.onclick = (e) => {
    const b = e.target.closest("button"),
      card = e.target.closest(".layer");
    if (b) {
      e.stopPropagation();
      const i = +(
        b.dataset.vis ??
        b.dataset.del ??
        b.dataset.up ??
        b.dataset.down ??
        b.dataset.dup
      );
      if (b.dataset.vis !== undefined)
        mutate(
          "Toggle layer",
          () => (state.layers[i].visible = !state.layers[i].visible),
        );
      else if (b.dataset.del !== undefined)
        mutate("Delete layer", () => {
          if (state.layers[i].id === state.selectedLayerId)
            state.selectedLayerId = null;
          state.layers.splice(i, 1);
        });
      else if (b.dataset.up !== undefined && i < state.layers.length - 1)
        mutate("Move layer up", () =>
          state.layers.splice(i + 1, 0, state.layers.splice(i, 1)[0]),
        );
      else if (b.dataset.down !== undefined && i > 0)
        mutate("Move layer down", () =>
          state.layers.splice(i - 1, 0, state.layers.splice(i, 1)[0]),
        );
      else if (b.dataset.dup !== undefined)
        mutate("Duplicate layer", () => {
          const copy = {
            ...state.layers[i],
            id: uid(),
            name: `${state.layers[i].name} copy`,
            points: state.layers[i].points,
          };
          state.layers.splice(i + 1, 0, copy);
          state.selectedLayerId = copy.id;
          syncInputs();
        });
      return;
    }
    if (card) {
      state.selectedLayerId = state.layers[+card.dataset.select].id;
      syncInputs();
      updateUI();
      render();
    }
  };
  el.onkeydown = (e) => {
    if (
      (e.key === "Enter" || e.key === " ") &&
      e.target.classList.contains("layer")
    ) {
      e.preventDefault();
      e.target.click();
    }
  };
}

function commit() {
  if (
    validateCounts(
      state.selection.ring,
      state.selection.wheel,
      state.selection.mode,
    )
  )
    return;
  capture("Add pattern");
  const l = {
    id: uid(),
    name: `Pattern ${state.layers.length + 1}`,
    ...clone(state.selection),
    ...state.appearance,
    visible: true,
    points: current.points,
  };
  state.layers.push(l);
  state.progress = 0;
  state.playing = false;
  updateUI();
  render();
  scheduleAutosave();
}
function animate(t) {
  if (!state.playing) return;
  if (!lastTime) lastTime = t;
  const dt = Math.min(50, t - lastTime);
  lastTime = t;
  const pointsPerMs = Math.max(0.15, Math.pow(state.speed / 18, 2.35));
  state.progress = Math.min(
    1,
    state.progress + (dt * pointsPerMs) / current.count,
  );
  if (state.progress >= 1) {
    commit();
    return;
  }
  render();
  $("#progressText").textContent = `${Math.round(state.progress * 100)}%`;
  raf = requestAnimationFrame(animate);
}
function start() {
  if (selectedLayer()) return;
  if (state.progress >= 1) state.progress = 0;
  state.playing = true;
  lastTime = 0;
  updateUI();
  raf = requestAnimationFrame(animate);
}
function pause(refresh = true) {
  state.playing = false;
  cancelAnimationFrame(raf);
  if (refresh) {
    updateUI();
    render();
  }
}
function projectObject() {
  return {
    ...state,
    version: 2,
    playing: false,
    progress: 0,
    selectedLayerId: null,
    layers: state.layers.map((l) => ({ ...l })),
  };
}
function serialize() {
  return JSON.stringify(projectObject());
}
function hydrate(data, { recovery = false } = {}) {
  const p = normalizeProject(data);
  Object.assign(state, p, {
    playing: false,
    progress: 0,
    selectedLayerId: null,
  });
  history.clear();
  current = sampledCurrent();
  syncInputs();
  rebuild();
  if (recovery) $("#recoveryBar").classList.remove("hidden");
}
function exportScale(width, height, layers) {
  return (
    (0.45 * Math.min(width, height)) / Math.max(1, ...layers.map(radialSize))
  );
}
function artworkLayers() {
  const layers = state.layers.filter(l => l.visible);
  const count = Math.floor(current.points.length * state.progress);
  if (count > 1) layers.push({ ...state.selection, ...state.appearance, points: current.points.slice(0, count) });
  return layers;
}
function renderExport(c, width, height, transparent = false, recording = false) {
  const ex = c.getContext("2d");
  ex.setTransform(1, 0, 0, 1, 0, 0);
  ex.clearRect(0, 0, width, height);
  if (!transparent) {
    ex.fillStyle = state.background;
    ex.fillRect(0, 0, width, height);
  }
  const visible = artworkLayers(),
    s = recording ? fitScale(width, height) : exportScale(width, height, visible);
  for (const l of visible) strokeLayer(l, ex, width, height, s);
}
function svgMarkup(width, height, transparent) {
  const visible = artworkLayers(),
    s = exportScale(width, height, visible),
    tf = (p) => ({ x: width / 2 + p.x * s, y: height / 2 + p.y * s }),
    bg = transparent
      ? ""
      : `<rect width="100%" height="100%" fill="${state.background}"/>`,
    paths = visible
      .map(
        (l) =>
          `<path d="${svgPath(l.points, tf)}" fill="none" stroke="${l.color}" stroke-width="${l.width}" stroke-opacity="${l.opacity}" stroke-linecap="round" stroke-linejoin="round" data-ring="${l.ring}" data-wheel="${l.wheel}" data-hole="${l.hole}"/>`,
      )
      .join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${bg}${paths}</svg>`;
}
async function saveExport(options) {
  if (window.spiroDesktop) return window.spiroDesktop.saveExport(options);
  const blob = new Blob([
    options.encoding === "utf8"
      ? options.data
      : Uint8Array.from(atob(options.data), (c) => c.charCodeAt(0)),
  ]);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = options.defaultName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function setExportSize(kind, preset) {
  const sizes = {
      canvas: [state.canvas.width, state.canvas.height],
      web: [1920, 1080],
      square: [2048, 2048],
      print: [4800, 3600],
    },
    size = sizes[preset] || sizes.canvas;
  $(`#${kind}Width`).value = size[0];
  $(`#${kind}Height`).value = size[1];
  const custom = preset === "custom";
  $(`#${kind}Width`).disabled = !custom;
  $(`#${kind}Height`).disabled = !custom;
}

$$("[data-workspace]").forEach(
  (b) =>
    (b.onclick = () => {
      state.workspace = b.dataset.workspace;
      state.selectedLayerId = null;
      state.progress = 0;
      rebuild();
    }),
);
$$("[data-mode]").forEach(
  (b) =>
    (b.onclick = () => {
      state.selection.mode = b.dataset.mode;
      state.selectedLayerId = null;
      state.progress = 0;
      rebuild();
    }),
);
$("#prevHole").onclick = () => {
  state.selectedLayerId = null;
  state.selection.hole = Math.max(1, state.selection.hole - 1);
  rebuild();
};
$("#nextHole").onclick = () => {
  state.selectedLayerId = null;
  state.selection.hole = Math.min(
    holeCount(state.selection.wheel),
    state.selection.hole + 1,
  );
  rebuild();
};
for (const [id, key] of [
  ["ringInput", "ring"],
  ["wheelInput", "wheel"],
])
  $("#" + id).oninput = (e) => {
    state.selectedLayerId = null;
    state.selection[key] = +e.target.value;
    state.progress = 0;
    rebuild();
  };
function styleInput(key, value) {
  const l = selectedLayer();
  if (l) l[key] = value;
  else state.appearance[key] = value;
  updateUI();
  render();
}
for (const el of [$("#lineColor"), $("#lineWidth"), $("#opacity")]) {
  el.onpointerdown = () => (styleStart = snapshotState(state));
  el.onfocus = () => {
    if (!styleStart) styleStart = snapshotState(state);
  };
  el.onchange = () => {
    if (styleStart) {
      history.push(styleStart, "Edit appearance");
      styleStart = null;
      updateHistoryButtons();
      scheduleAutosave();
    }
  };
}
$("#lineColor").oninput = (e) => styleInput("color", e.target.value);
$("#lineWidth").oninput = (e) => styleInput("width", +e.target.value);
$("#opacity").oninput = (e) => styleInput("opacity", +e.target.value / 100);
$("#bgColor").onpointerdown = () => (styleStart = snapshotState(state));
$("#transparentBackground").onchange = e => mutate("Change transparency", () => {
  state.transparentBackground = e.target.checked;
});
$("#bgColor").oninput = (e) => {
  state.background = e.target.value;
  render();
};
$("#bgColor").onchange = () => {
  if (styleStart) {
    history.push(styleStart, "Change background");
    styleStart = null;
    updateHistoryButtons();
    scheduleAutosave();
  }
};
$("#speed").oninput = (e) => {
  state.speed = +e.target.value;
  scheduleAutosave();
};
$("#mechanismToggle").onchange = (e) => {
  state.showMechanism = e.target.checked;
  render();
  scheduleAutosave();
};
$("#draw").onclick = start;
$("#pause").onclick = () => pause();
$("#reset").onclick = () => {
  pause();
  state.progress = 0;
  updateUI();
  render();
};
$("#complete").onclick = () => {
  if (selectedLayer()) return;
  pause();
  state.progress = 1;
  render();
  commit();
};
$("#clear").onclick = () => {
  if (state.layers.length)
    mutate("Clear canvas", () => {
      state.layers = [];
      state.selectedLayerId = null;
      state.progress = 0;
    });
};
$("#fitView").onclick = render;
$("#undo").onclick = undo;
$("#redo").onclick = redo;
$("#deselectLayer").onclick = () => {
  state.selectedLayerId = null;
  syncInputs();
  updateUI();
  render();
};
for (const b of $$("[data-canvas]"))
  b.onclick = () => {
    const [w, h] = b.dataset.canvas.split("x").map(Number);
    mutate("Resize canvas", () => {
      state.canvas = { width: w, height: h };
      syncInputs();
    });
  };
for (const [id, key] of [
  ["canvasWidth", "width"],
  ["canvasHeight", "height"],
])
  $("#" + id).onchange = (e) => {
    const v = Math.max(
      256,
      Math.min(12000, Math.round(+e.target.value || state.canvas[key])),
    );
    mutate("Resize canvas", () => {
      state.canvas = { ...state.canvas, [key]: v };
      syncInputs();
    });
  };
$("#saveProject").onclick = async () => {
  if (window.spiroDesktop)
    await window.spiroDesktop.saveProject(
      JSON.stringify(projectObject(), null, 2),
    );
  else {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify(projectObject(), null, 2)], {
        type: "application/json",
      }),
    );
    a.download = "untitled.spirofield";
    a.click();
  }
};
$("#openProject").onclick = async () => {
  try {
    if (!window.spiroDesktop) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".spirofield,.json";
      input.onchange = async () =>
        hydrate(JSON.parse(await input.files[0].text()));
      input.click();
      return;
    }
    const result = await window.spiroDesktop.openProject();
    if (result) hydrate(JSON.parse(result.text));
  } catch (e) {
    alert(e.message);
  }
};
async function clearRecovery() {
  if (window.spiroDesktop) await window.spiroDesktop.clearRecovery();
  else clearAutosave(localStorage);
}
$("#newProject").onclick = () => {
  if (state.layers.length) capture("New project");
  pause();
  state.layers = [];
  state.selectedLayerId = null;
  state.progress = 0;
  state.selection = { ring: 96, wheel: 32, hole: 3, mode: "inside" };
  clearRecovery();
  rebuild();
};
$("#discardRecovery").onclick = () =>
  $("#recoveryBar").classList.add("hidden");
$("#exportPng").onclick = () => {
  $("#pngTransparent").checked = state.transparentBackground;
  setExportSize("png", "canvas");
  $("#pngPreset").value = "canvas";
  $("#pngDialog").showModal();
};
$("#pngPreset").onchange = (e) => setExportSize("png", e.target.value);
$("#confirmPng").onclick = (e) => {
  e.preventDefault();
  const w = +$("#pngWidth").value,
    h = +$("#pngHeight").value;
  if (w < 256 || h < 256 || w > 12000 || h > 12000) return;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  renderExport(c, w, h, $("#pngTransparent").checked);
  saveExport({
    data: c.toDataURL("image/png").split(",")[1],
    defaultName: `spirofield-${w}x${h}.png`,
    filters: [{ name: "PNG", extensions: ["png"] }],
  });
  $("#pngDialog").close();
};
$("#exportSvg").onclick = () => {
  $("#svgTransparent").checked = state.transparentBackground;
  setExportSize("svg", "canvas");
  $("#svgPreset").value = "canvas";
  $("#svgDialog").showModal();
};
$("#svgPreset").onchange = (e) => setExportSize("svg", e.target.value);
$("#confirmSvg").onclick = (e) => {
  e.preventDefault();
  const w = +$("#svgWidth").value,
    h = +$("#svgHeight").value;
  if (w < 256 || h < 256 || w > 12000 || h > 12000) return;
  saveExport({
    data: svgMarkup(w, h, $("#svgTransparent").checked),
    defaultName: `spirofield-${w}x${h}.svg`,
    filters: [{ name: "SVG", extensions: ["svg"] }],
    encoding: "utf8",
  });
  $("#svgDialog").close();
};
window.addEventListener("keydown", (e) => {
  const tag = e.target.tagName;
  if (["INPUT", "SELECT", "TEXTAREA"].includes(tag)) return;
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === "z") {
    e.preventDefault();
    e.shiftKey ? redo() : undo();
  } else if (mod && e.key.toLowerCase() === "y") {
    e.preventDefault();
    redo();
  } else if (mod && e.key.toLowerCase() === "s") {
    e.preventDefault();
    $("#saveProject").click();
  } else if (e.key === " ") {
    e.preventDefault();
    state.playing ? pause() : start();
  } else if (e.key === "Enter") {
    e.preventDefault();
    $("#complete").click();
  } else if (e.key === "Escape" && selectedLayer()) $("#deselectLayer").click();
  else if (e.key === "[") $("#prevHole").click();
  else if (e.key === "]") $("#nextHole").click();
});
window.addEventListener("resize", resize);
function setNested(target, path, value) {
  const parts = path.split("."); let cursor = target;
  for (const key of parts.slice(0, -1)) cursor = cursor[key];
  cursor[parts.at(-1)] = value;
}
function rebuildLabPath() { current = sampledCurrent(); state.progress = 0; render(); scheduleAutosave(); }
$("#labEnabled").onchange = e => { state.mechanicalAbuse.enabled = e.target.checked; rebuildLabPath(); };
for (const input of $$('[data-lab]')) input.oninput = e => { setNested(state.mechanicalAbuse, e.target.dataset.lab, +e.target.value); rebuildLabPath(); };
$("#resetLab").onclick = () => { state.mechanicalAbuse = defaultMechanicalAbuse(); $("#labEnabled").checked = false; for (const input of $$('[data-lab]')) { const parts=input.dataset.lab.split('.'); input.value=state.mechanicalAbuse[parts[0]][parts[1]]; } rebuildLabPath(); };
new ResizeObserver(resize).observe(canvas);
async function boot() {
  let recovery = null;
  try {
    if (window.spiroDesktop) {
      const raw = await window.spiroDesktop.loadRecovery();
      if (raw) recovery = normalizeProject(JSON.parse(raw));
    } else recovery = readAutosave(localStorage);
  } catch {}
  if (recovery && recovery.layers.length) hydrate(recovery, { recovery: true });
  else {
    syncInputs();
    rebuild();
  }
  resize();
}
boot();

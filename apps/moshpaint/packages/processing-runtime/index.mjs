// Portable CPU reference runtime. GPU input is rejected, never read back implicitly.
const fail = message => { throw new Error(message); };
const integer = n => Number.isSafeInteger(n) && n >= 0;
const engineIds = new Set(['temporal-sculptor','frequency-weaver','recursive-feedback','chromatic-physics','motion-ecology']);
const srgbLinear=Float64Array.from({length:256},(_,i)=>{const v=i/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});
const size = value => {
  if (!integer(value.width) || !integer(value.height) || !value.width || !value.height ||
      !Number.isSafeInteger(value.width * value.height * 16)) fail('Invalid dimensions');
  return value.width * value.height;
};
export function validateFrame(frame) {
  const pixels = size(frame);
  validateMetadata(frame);
  if (frame.storage?.kind !== 'cpu') fail('CPU runtime requires explicit GPU-to-CPU conversion');
  const data = frame.storage.data;
  if (!(data instanceof Float32Array) || data.length !== pixels * 4) fail('Invalid frame storage');
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (!Number.isFinite(a) || a < 0 || a > 1) fail('Invalid alpha');
    for (let c = 0; c < 3; c++) if (!Number.isFinite(data[i+c]) || data[i+c] < 0 || data[i+c] > a) fail('Invalid premultiplied color');
  }
  return frame;
}
function validateMetadata(frame) {
  size(frame);
  if (frame.format !== 'linear-srgb-premultiplied-rgba' || frame.origin !== 'top-left' ||
      !integer(frame.epoch) || !integer(frame.sequence) || !Number.isFinite(frame.timestampSeconds) ||
      typeof frame.sourceId !== 'string' || !frame.sourceId) fail('Invalid frame metadata');
}
export function validateMask(mask, frame) {
  if (mask.width !== frame.width || mask.height !== frame.height || mask.origin !== 'top-left' ||
      mask.format !== 'coverage-f32' || typeof mask.id !== 'string' || !mask.id ||
      mask.epoch !== frame.epoch || mask.sequence !== frame.sequence || mask.storage?.kind !== 'cpu' ||
      !(mask.storage.data instanceof Float32Array) || mask.storage.data.length !== size(frame)) fail('Invalid or stale coverage mask');
  for (const v of mask.storage.data) if (!Number.isFinite(v) || v < 0 || v > 1) fail('Invalid mask coverage');
  return mask;
}
export class BudgetAllocator {
  #used = 0; #peak = 0; #leases = new Set(); #disposed = false;
  constructor(byteLimit) {
    if (!integer(byteLimit) || !byteLimit) fail('Invalid byte budget');
    Object.defineProperty(this, 'byteLimit', {value: byteLimit, enumerable: true});
  }
  get bytesUsed() { return this.#used; }
  get peakBytes() { return this.#peak; }
  #allocate(template, channels, ArrayType = Float32Array, ownedData) {
    if (this.#disposed) fail('Allocator disposed');
    const length = size(template) * channels, bytes = length * 4;
    if (bytes > this.byteLimit - this.#used) fail('Processing byte budget exceeded');
    const data = ownedData ?? new ArrayType(length);
    this.#used += bytes;
    this.#peak = Math.max(this.#peak, this.#used);
    const value = Object.freeze({...template, storage: Object.freeze({kind:'cpu', data})});
    let released = false;
    const lease = { get value() { if (released) fail('Lease released'); return value; },
      release: () => { if (!released) { released = true; this.#used -= bytes; this.#leases.delete(lease); } } };
    this.#leases.add(lease);
    return lease;
  }
  frame(template) { validateFrame(template); return this.#allocate(template, 4); }
  emptyFrame(metadata) { validateMetadata(metadata); return this.#allocate(metadata, 4); }
  mask(template) { return this.#allocate(template, 1); }
  // Numerical data is distinct from color/coverage, but shares the same hard budget.
  field(metadata) {
    validateFieldMetadata(metadata);
    return this.#allocate(metadata, 1, metadata.format === 'scalar-u32' ? Uint32Array : Float32Array);
  }
  // Reserve remote/device capacity against this same allocator's aggregate limit.
  reserve(bytes) {
    if(this.#disposed||!integer(bytes)||!bytes||bytes>this.byteLimit-this.#used)fail('Processing reservation budget exceeded');
    this.#used+=bytes;this.#peak=Math.max(this.#peak,this.#used);let released=false;
    const lease={value:Object.freeze({bytes}),release:()=>{if(!released){released=true;this.#used-=bytes;this.#leases.delete(lease);}}};
    this.#leases.add(lease);return lease;
  }
  // Adopt transferred storage; the caller relinquishes ownership without a copy.
  adopt(surface) {
    if(surface.format==='linear-srgb-premultiplied-rgba'){validateFrame(surface);return this.#allocate(surface,4,Float32Array,surface.storage.data);}
    if(surface.format==='coverage-f32'){validateMask(surface,surface);return this.#allocate(surface,1,Float32Array,surface.storage.data);}
    validateField(surface);return this.#allocate(surface,1,surface.storage.data.constructor,surface.storage.data);
  }
  copy(frame) { const lease = this.frame(frame); lease.value.storage.data.set(frame.storage.data); return lease; }
  owns(lease) { return this.#leases.has(lease); }
  dispose() { this.#disposed = true; for (const lease of [...this.#leases]) lease.release(); }
}
function validateFieldMetadata(field) {
  size(field);
  if (!['scalar-f32','scalar-u32'].includes(field.format) || field.origin !== 'top-left' ||
      typeof field.id !== 'string' || !field.id || typeof field.units !== 'string' || !field.units ||
      typeof field.sourceId !== 'string' || !field.sourceId || !integer(field.epoch) ||
      !integer(field.sequence) || !Number.isFinite(field.timestampSeconds)) fail('Invalid numerical field metadata');
}
export function validateField(field) {
  validateFieldMetadata(field);
  const ArrayType = field.format === 'scalar-u32' ? Uint32Array : Float32Array;
  if (field.storage?.kind !== 'cpu' || !(field.storage.data instanceof ArrayType) ||
      field.storage.data.length !== size(field)) fail('Invalid numerical field storage');
  for (const value of field.storage.data) if (!Number.isFinite(value)) fail('Nonfinite numerical field');
  return field;
}
export function frameFromSrgb8(allocator, rgba, metadata) {
  validateMetadata(metadata);
  if (!(rgba instanceof Uint8Array || rgba instanceof Uint8ClampedArray) || rgba.length !== size(metadata)*4) fail('Invalid sRGB pixels');
  const lease=allocator.emptyFrame(metadata),d=lease.value.storage.data;
  for(let i=0;i<rgba.length;i+=4){const a=rgba[i+3]/255;for(let c=0;c<3;c++)d[i+c]=srgbLinear[rgba[i+c]]*a;d[i+3]=a;}
  return lease;
}
export function frameToSrgb8(frame, destination = new Uint8ClampedArray(size(frame)*4)) {
  validateFrame(frame);
  if(!(destination instanceof Uint8ClampedArray)||destination.length!==size(frame)*4)fail('Invalid sRGB destination');
  const d=frame.storage.data,srgb=v=>v<=.0031308?v*12.92:1.055*v**(1/2.4)-.055;
  for(let i=0;i<d.length;i+=4){const a=d[i+3];for(let c=0;c<3;c++)destination[i+c]=Math.round(srgb(a?d[i+c]/a:0)*255);destination[i+3]=Math.round(a*255);}
  return destination;
}
export function composite(allocator, base, processed, {wet = 1, mask, blend = 'normal'} = {}) {
  validateFrame(base); validateFrame(processed);
  if (base.width !== processed.width || base.height !== processed.height || base.epoch !== processed.epoch ||
      base.sequence !== processed.sequence || base.sourceId !== processed.sourceId ||
      base.timestampSeconds !== processed.timestampSeconds) fail('Output frame mismatch');
  if (!Number.isFinite(wet) || wet < 0 || wet > 1) fail('Invalid wet mix');
  if (!['normal', 'multiply', 'screen'].includes(blend)) fail('Unsupported blend mode');
  if (mask) validateMask(mask, base);
  const out = allocator.frame(base);
  const b = base.storage.data, p = processed.storage.data, d = out.value.storage.data;
  for (let i = 0; i < d.length; i += 4) {
    const amount = wet * (mask ? mask.storage.data[i/4] : 1), ab = b[i+3], ap = p[i+3];
    for (let c = 0; c < 4; c++) {
      let target = p[i+c];
      if (blend !== 'normal') {
        if (c === 3) target = ap + ab * (1-ap);
        else {
          const cb = ab ? b[i+c]/ab : 0, cp = ap ? p[i+c]/ap : 0;
          const mixed = blend === 'multiply' ? cb*cp : cb+cp-cb*cp;
          target = (1-ap)*b[i+c] + (1-ab)*p[i+c] + ab*ap*mixed;
        }
      }
      d[i+c] = amount === 0 ? b[i+c] : b[i+c] + amount * (target-b[i+c]);
    }
  }
  return out;
}
export function validateGraph(nodes) {
  if (!Array.isArray(nodes) || !nodes.length || nodes.length > 256) fail('Invalid graph size');
  const map = new Map();
  for (const node of nodes) {
    if (!node || typeof node.id !== 'string' || !node.id || node.id === '$input' || map.has(node.id) ||
        typeof node.input !== 'string' || typeof node.factory !== 'function') fail('Invalid graph node');
    if (node.enabled !== undefined && typeof node.enabled !== 'boolean') fail('Invalid enabled state');
    if (node.wet !== undefined && (!Number.isFinite(node.wet) || node.wet < 0 || node.wet > 1)) fail('Invalid wet mix');
    if (node.blend !== undefined && !['normal','multiply','screen'].includes(node.blend)) fail('Unsupported blend mode');
    if (node.maskId !== undefined && (typeof node.maskId !== 'string' || !node.maskId)) fail('Invalid mask assignment');
    map.set(node.id, node);
  }
  const active = new Set(), done = new Set(), sorted = [];
  const visit = id => {
    if (id === '$input' || done.has(id)) return;
    if (active.has(id)) fail('Same-frame processing cycle');
    const node = map.get(id); if (!node) fail('Missing graph input');
    active.add(id); visit(node.input); active.delete(id); done.add(id); sorted.push(node);
  };
  for (const id of map.keys()) visit(id);
  return sorted;
}
// Bounded history returns borrowed samples. They remain valid until push/reset.
// History uses the same allocator as graph output and simulation allocations.
export class FrameHistory {
  version = 1;
  #frames = []; #key;
  constructor(allocator, {maxFrames, maxBytes}) {
    if (!integer(maxFrames) || !maxFrames || !integer(maxBytes) || !maxBytes) fail('Invalid history limits');
    this.allocator = allocator; this.maxFrames = maxFrames; this.maxBytes = maxBytes;
  }
  push(frame) {
    validateFrame(frame);
    const bytes = frame.storage.data.byteLength;
    if (bytes > this.maxBytes) fail('Frame exceeds history byte limit');
    const key = `${frame.sourceId}/${frame.epoch}/${frame.width}/${frame.height}`;
    const latest = this.#frames.at(-1)?.value;
    if (this.#key !== key) this.reset();
    else if (latest && (frame.sequence <= latest.sequence || frame.timestampSeconds < latest.timestampSeconds)) fail('Nonmonotonic history; reset epoch on seek');
    while (this.#frames.length >= this.maxFrames || (this.#frames.length+1)*bytes > this.maxBytes) this.#frames.shift().release();
    const lease = this.allocator.copy(frame); this.#frames.push(lease); this.#key = key;
  }
  sample(delayFrames = 0) {
    if (!integer(delayFrames)) fail('Invalid history delay');
    return this.#frames.at(-1-delayFrames)?.value ?? null;
  }
  get length() { return this.#frames.length; }
  reset() { for (const frame of this.#frames) frame.release(); this.#frames = []; this.#key = undefined; }
  dispose() { this.reset(); }
}
export class ProcessingGraph {
  #nodes; #instances = new Map(); #ready = false; #busy = false; #disposed = false; #last;
  constructor(nodes, {byteLimit, services = {}}) {
    this.#nodes = validateGraph(nodes).map(n => structuredClone({...n, factory: undefined}));
    const ordered = validateGraph(nodes);
    this.allocator = new BudgetAllocator(byteLimit);
    this.environment = Object.freeze({backend:'cpu', allocator:this.allocator, services:Object.freeze({...services})});
    this.#nodes.forEach((n,i) => n.factory = ordered[i].factory);
  }
  async initialize() {
    if (this.#disposed || this.#ready || this.#busy) fail('Graph cannot initialize');
    this.#busy = true;
    try {
      for (const node of this.#nodes) {
        const engine = node.factory(); this.#instances.set(node.id, engine);
        const descriptor = engine.descriptor;
        if (descriptor?.contractVersion !== 1 || !engineIds.has(descriptor.id) || !descriptor.backends?.includes('cpu')) fail('Engine lacks CPU contract capability');
        for (const [id,version] of Object.entries(descriptor.requiredServices ?? {})) {
          if (this.environment.services[id]?.version !== version) fail(`Missing or incompatible service: ${id}`);
        }
        await engine.initialize(this.environment);
      }
      this.#ready = true;
    } catch (error) { this.#cleanup(); throw error; }
    finally { this.#busy = false; }
  }
  async render(input, {masks = [], timeSeconds = input.timestampSeconds, deltaSeconds = 0,
    discontinuity = 'none', seed = 1, signal = new AbortController().signal, outputId = this.#nodes.at(-1).id} = {}) {
    if (!this.#ready || this.#disposed || this.#busy) fail('Graph unavailable or busy');
    validateFrame(input);
    if (!Number.isFinite(timeSeconds) || !Number.isFinite(deltaSeconds) || deltaSeconds < 0 || !integer(seed) ||
        !['none','seek','loop','source','resize'].includes(discontinuity)) fail('Invalid evaluation clock');
    if (!this.#instances.has(outputId)) fail('Missing graph output');
    const maskMap = new Map();
    for (const mask of masks) { validateMask(mask,input); if (maskMap.has(mask.id)) fail('Duplicate mask ID'); maskMap.set(mask.id,mask); }
    for (const node of this.#nodes) if (node.maskId && !maskMap.has(node.maskId)) fail('Missing assigned mask');
    const previous = this.#last;
    let reason = discontinuity;
    if (previous) {
      if (previous.sourceId !== input.sourceId || previous.epoch !== input.epoch) reason = 'source';
      else if (previous.width !== input.width || previous.height !== input.height) reason = 'resize';
      else if (input.sequence <= previous.sequence || input.timestampSeconds < previous.timestampSeconds) reason = 'seek';
    }
    this.#busy = true;
    const held = [], values = new Map([['$input',input]]);
    try {
      signal.throwIfAborted();
      for (const node of this.#nodes) {
        const engine = this.#instances.get(node.id), base = values.get(node.input);
        if (reason !== 'none') engine.reset(reason);
        if (node.enabled === false) { values.set(node.id,base); continue; }
        const mask = node.maskId ? maskMap.get(node.maskId) : undefined;
        let processed;
        try {
          processed = await engine.process({input:base, masks:mask ? [mask] : [], parameters:node.parameters ?? {},
            timeSeconds, deltaSeconds, seed, discontinuity:reason, signal});
          signal.throwIfAborted();
          if (!this.allocator.owns(processed)) fail('Engine returned an unowned output lease');
          const combined = composite(this.allocator,base,processed.value,{wet:node.wet ?? 1,mask,blend:node.blend ?? 'normal'});
          held.push(combined); values.set(node.id,combined.value);
        } finally { processed?.release(); }
      }
      const result = this.allocator.copy(values.get(outputId));
      this.#last = {sourceId:input.sourceId, epoch:input.epoch, width:input.width, height:input.height,
        sequence:input.sequence,timestampSeconds:input.timestampSeconds};
      return result;
    } catch (error) {
      for (const engine of this.#instances.values()) { try { engine.reset('manual'); } catch {} }
      this.#last = undefined; throw error;
    } finally { for (const lease of held) lease.release(); this.#busy = false; }
  }
  setEnabled(id, enabled) {
    if (!this.#ready || this.#disposed || this.#busy || typeof enabled !== 'boolean') fail('Cannot change enabled state');
    const node = this.#nodes.find(n=>n.id===id); if (!node) fail('Missing graph node');
    if (node.enabled === false && enabled) this.#instances.get(id).reset('reenable');
    node.enabled = enabled;
  }
  #cleanup() {
    for (const engine of this.#instances.values()) { try { engine.dispose(); } catch {} }
    this.#instances.clear(); this.allocator.dispose(); this.#ready = false; this.#disposed = true;
  }
  dispose() { if (this.#busy) fail('Cancel and await active evaluation before disposal'); this.#cleanup(); }
}

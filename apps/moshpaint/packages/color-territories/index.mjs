// Selection/routing service: no effect execution, host state, RGB output or frame loop.
// The injected provider returns decoded legacy crop alpha; it owns temporary resources.
export {createRangeTerritories, territoryPreset, restoreTerritoryPreset} from './live.mjs';
export function createTerritories({allocator, select, maxRegions = 16}) {
  if (!allocator?.mask || typeof select !== 'function' || !Number.isInteger(maxRegions) || maxRegions < 1 || maxRegions > 64) throw Error('Invalid territory dependencies');
  let disposed = false, busy = false;
  return {
    async evaluate(input, selections, signal) {
      if (disposed || busy) throw Error('Territory service unavailable or busy');
      if (!Array.isArray(selections) || selections.length > maxRegions) throw Error('Invalid region count');
      const ids = new Set();
      for (const selection of selections) {
        if (!selection || typeof selection.id !== 'string' || !selection.id || ids.has(selection.id) ||
            !Number.isFinite(selection.x) || selection.x < 0 || selection.x >= input.width ||
            !Number.isFinite(selection.y) || selection.y < 0 || selection.y >= input.height ||
            !Number.isFinite(selection.tolerance) || selection.tolerance < 0 || selection.tolerance > .3 ||
            !['connected','global'].includes(selection.mode) || typeof selection.invert !== 'boolean' ||
            !Number.isFinite(selection.cleanup) || selection.cleanup < 0 || selection.cleanup > 100) throw Error('Invalid region selection');
        ids.add(selection.id);
      }
      busy = true;
      const masks = [];
      try {
        signal.throwIfAborted();
        for (const selection of selections) {
          const crop = await select(input, selection, signal);
          signal.throwIfAborted();
          if (crop) {
            const {rect, alpha} = crop;
            if (!rect || !['x','y','w','h'].every(k=>Number.isSafeInteger(rect[k])) || rect.x < 0 || rect.y < 0 ||
                rect.w < 1 || rect.h < 1 || rect.x+rect.w > input.width || rect.y+rect.h > input.height ||
                !(alpha instanceof Uint8ClampedArray || alpha instanceof Uint8Array) || alpha.length !== rect.w*rect.h) throw Error('Invalid selected crop');
          }
          const lease = allocator.mask({id:selection.id,width:input.width,height:input.height,
            format:'coverage-f32',origin:'top-left',epoch:input.epoch,sequence:input.sequence});
          masks.push(lease);
          if (crop) for (let y=0;y<crop.rect.h;y++) for(let x=0;x<crop.rect.w;x++) {
            lease.value.storage.data[(crop.rect.y+y)*input.width+crop.rect.x+x] = crop.alpha[y*crop.rect.w+x]/255;
          }
        }
        return {masks,regionIds:[...ids]};
      } catch (error) { for(const mask of masks) mask.release(); throw error; }
      finally { busy = false; }
    },
    routes(assignments) {
      if (disposed || !Array.isArray(assignments) || assignments.length > 256 || assignments.some(a=>
        !a || typeof a.regionId !== 'string' || !a.regionId || typeof a.nodeId !== 'string' || !a.nodeId)) throw Error('Invalid territory routes');
      return assignments.map(({regionId,nodeId})=>Object.freeze({regionId,nodeId}));
    },
    reset() { if (busy) throw Error('Cancel and await selection before reset'); },
    dispose() { if (busy) throw Error('Cancel and await selection before disposal'); disposed = true; },
  };
}

export class History {
  constructor(limit = 60) {
    this.limit = limit;
    this.undoStack = [];
    this.redoStack = [];
  }
  push(snapshot, label = "Change") {
    this.undoStack.push({ snapshot, label });
    if (this.undoStack.length > this.limit) this.undoStack.shift();
    this.redoStack = [];
  }
  undo(current) {
    const entry = this.undoStack.pop();
    if (!entry) return null;
    this.redoStack.push({ snapshot: current, label: entry.label });
    return entry;
  }
  redo(current) {
    const entry = this.redoStack.pop();
    if (!entry) return null;
    this.undoStack.push({ snapshot: current, label: entry.label });
    return entry;
  }
  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
  get canUndo() {
    return this.undoStack.length > 0;
  }
  get canRedo() {
    return this.redoStack.length > 0;
  }
}

export function snapshotState(state) {
  return {
    canvas: { ...state.canvas },
    background: state.background,
    transparentBackground: !!state.transparentBackground,
    selection: { ...state.selection },
    appearance: { ...state.appearance },
    layers: state.layers.map((layer) => ({ ...layer, points: layer.points })),
    selectedLayerId: state.selectedLayerId,
  };
}

export const AUTOSAVE_KEY = "spirofield.autosave.v2";

export function normalizeProject(data) {
  if (!data || ![1, 2].includes(data.version) || !Array.isArray(data.layers))
    throw new Error("This is not a valid SPIROFIELD project.");
  const canvas = data.canvas || { width: 1600, height: 1200 };
  if (
    !Number.isInteger(+canvas.width) ||
    !Number.isInteger(+canvas.height) ||
    canvas.width < 256 ||
    canvas.height < 256 ||
    canvas.width > 12000 ||
    canvas.height > 12000
  )
    throw new Error(
      "Canvas dimensions must be whole numbers from 256 to 12000 pixels.",
    );
  return {
    ...data,
    version: 2,
    transparentBackground: data.transparentBackground === true,
    canvas: { width: +canvas.width, height: +canvas.height },
    layers: data.layers.map((layer, i) => ({
      id: layer.id || `imported-${i}-${Date.now()}`,
      name: layer.name || `Pattern ${i + 1}`,
      visible: layer.visible !== false,
      ...layer,
    })),
  };
}

export function autosave(storage, serialized) {
  storage.setItem(AUTOSAVE_KEY, serialized);
}
export function readAutosave(storage) {
  const raw = storage.getItem(AUTOSAVE_KEY);
  if (!raw) return null;
  try {
    return normalizeProject(JSON.parse(raw));
  } catch {
    return null;
  }
}
export function clearAutosave(storage) {
  storage.removeItem(AUTOSAVE_KEY);
}

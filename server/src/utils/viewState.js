function normalizeViewState(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  if (typeof raw !== 'string') return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function parseModelViewState(raw) {
  const candidate = normalizeViewState(raw);
  const cp = candidate?.cameraPosition;
  const ct = candidate?.controlsTarget;
  const fov = candidate?.fov;
  const isNumber = (value) => typeof value === 'number' && Number.isFinite(value);

  if (
    isNumber(cp?.x) && isNumber(cp?.y) && isNumber(cp?.z) &&
    isNumber(ct?.x) && isNumber(ct?.y) && isNumber(ct?.z) &&
    (fov === undefined || isNumber(fov))
  ) {
    return {
      cameraPosition: { x: cp.x, y: cp.y, z: cp.z },
      controlsTarget: { x: ct.x, y: ct.y, z: ct.z },
      ...(fov !== undefined ? { fov } : {}),
    };
  }

  return null;
}

module.exports = {
  normalizeViewState,
  parseModelViewState,
};

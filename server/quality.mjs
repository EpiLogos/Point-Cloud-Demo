/** Quality presets and the deterministic auto-tier resolver. Pure logic; no I/O. */

export const PRESETS = {
  // HD 4000-class iGPUs hold 43-58 fps at 16k particles / 0.75 ratio with no
  // competing load; eco targets well below that so a busy old machine copes.
  eco: { fps: 24, particleLimit: 8000, pixelRatio: .6 },
  gentle: { fps: 20, particleLimit: 50000, pixelRatio: .75 },
  balanced: { fps: 30, particleLimit: 100000, pixelRatio: 1 },
  fluid: { fps: 60, particleLimit: 200000, pixelRatio: 1 },
};

export const TIERS = ['eco', 'gentle', 'balanced', 'fluid'];
const TIER_INDEX = Object.fromEntries(TIERS.map((t, i) => [t, i]));

/** Rough GPU capability class from an UNMASKED_RENDERER_WEBGL-style string. */
export function classifyGpu(rendererString = '') {
  const s = String(rendererString);
  if (/llvmpipe|swiftshader|softpipe|softwarerenderer|basic render/i.test(s)) return { gpuClass: 'software', gpuLabel: s || 'Software renderer' };
  if (/apple/i.test(s)) return { gpuClass: 'apple', gpuLabel: s };
  if (/nvidia|geforce|quadro|radeon|vega|arc/i.test(s)) return { gpuClass: 'discrete', gpuLabel: s };
  if (/intel/i.test(s)) {
    // Pre-Xe Intel graphics (HD 4000 through UHD 6xx) are all modest; Xe and
    // later discrete lines are the first ones worth trusting at higher tiers.
    const modern = /iris xe|(\b|intel\(r\) )arc|uhd graphics 7[0-9]0/i.test(s);
    return modern ? { gpuClass: 'intel-modern', gpuLabel: s } : { gpuClass: 'intel-legacy', gpuLabel: s };
  }
  if (/adreno|mali|videocore/i.test(s)) return { gpuClass: 'mobile', gpuLabel: s };
  return { gpuClass: 'unknown', gpuLabel: s || null };
}

const BASE_TIER = {
  software: 'eco',
  'intel-legacy': 'eco',
  'intel-modern': 'gentle',
  apple: 'fluid',
  discrete: 'fluid',
  mobile: 'gentle',
  unknown: 'balanced',
};

// Signals can only lower the tier, never raise it: capability sets the ceiling,
// machine state (memory, pressure) carves it down.
function cap(tier, floor, reasons, why) {
  if (floor && TIER_INDEX[tier] > TIER_INDEX[floor]) {
    reasons.push(why);
    return floor;
  }
  return tier;
}

/**
 * Resolve the concrete tier for a machine.
 * @param detection browser-collected signals (renderer string, deviceMemory, screen, merged server probe)
 * @param server live server-side probe (cores, memory, PSI); used where detection is missing
 */
export function resolveAuto(detection = {}, server = {}) {
  const { gpuClass, gpuLabel } = classifyGpu(detection.rendererString);
  let tier = BASE_TIER[gpuClass] ?? 'balanced';
  const reasons = [gpuLabel || gpuClass || 'unknown GPU'];
  const mem = detection.memAvailableMiB ?? server.memAvailableMiB;
  const deviceMemory = detection.deviceMemoryGiB ?? null;
  if (mem != null && mem < 600) tier = cap(tier, 'eco', reasons, 'low available memory');
  else if (mem != null && mem < 1200) tier = cap(tier, 'gentle', reasons, 'low available memory');
  else if (deviceMemory != null && deviceMemory < 4) tier = cap(tier, 'gentle', reasons, 'small device memory');
  if ((detection.cores ?? server.cores ?? 4) <= 2) tier = cap(tier, 'gentle', reasons, 'only two cores');
  const psi = detection.psiMemorySomeAvg10 ?? server.psiMemorySomeAvg10;
  if (psi != null && psi >= 50) tier = cap(tier, 'eco', reasons, 'heavy memory pressure');
  else if (psi != null && psi >= 25) tier = cap(tier, 'gentle', reasons, 'memory pressure');
  const preset = PRESETS[tier];
  return { tier, gpuClass, gpuLabel, fps: preset.fps, particleLimit: preset.particleLimit, pixelRatio: preset.pixelRatio, reason: reasons.join(' · ') };
}

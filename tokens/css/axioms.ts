/**
 * @file tokens/css/axioms.js
 * @description Axiom's End CSS custom-property tokens — the runtime
 * channel from the WASM engine to the sheet (HP fraction, mana
 * fraction, corruption, tension). Values are set per-frame on the
 * frame element so the sheet stays static CSS.
 */

/**
 * Frozen Axiom's End CSS custom-property map — the only custom props
 * the experiment writes/reads.
 */
export const AX_CSS_PROPS = Object.freeze({
  /** HP fill width — 0–1 fraction written every HUD tick. */
  AX_HP_FRAC: '--ax-hp-frac',
  /** Mana fill width — 0–1 fraction. */
  AX_MANA_FRAC: '--ax-mana-fr',
  /** Soul-corruption meter width — 0–1 fraction. */
  AX_SOUL_FRAC: '--ax-soul-fr',
  /** Tension-driven vignette intensity — 0–1. */
  AX_TENSION: '--ax-tension',
})

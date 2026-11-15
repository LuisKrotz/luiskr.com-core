/**
 * @file tokens/classes/axioms.js
 * @description Axiom's End experiment class tokens — the view's DOM
 * vocabulary (frame, canvas host, HUD, class picker, gambit dialog,
 * adventure-book overlay, fallback). Sole declaration site (rule 4).
 */

/**
 * Frozen Axiom's End class map — every class the view and its HUD
 * render, imported rather than re-declared.
 */
export const AX_CLASSES = Object.freeze({
  /** Root layout frame — full-viewport flex column. */
  AX_FRAME: 'axioms-frame',
  /** Canvas host — fills the frame, WebGL attaches here. */
  AX_STAGE: 'axioms-stage',
  /** The mounted <canvas> itself. */
  AX_CANVAS: 'axioms-canvas',
  /** Loader veil shown until first rendered frame. */
  AX_LOADER: 'axioms-loader',
  /** Loader dismiss state. */
  AX_LOADER_DONE: 'axioms-loader--done',
  /** HUD root — pointer-events:none overlay band. */
  AX_HUD: 'axioms-hud',
  /** HP bar container + fill. */
  AX_HP: 'axioms-hp',
  AX_HP_FILL: 'axioms-hp-fill',
  /** Mana bar container + fill. */
  AX_MANA: 'axioms-mana',
  AX_MANA_FILL: 'axioms-mana-fill',
  /** Soul-corruption meter + label. */
  AX_SOUL: 'axioms-soul',
  /** Echoes counter. */
  AX_ECHOES: 'axioms-echoes',
  /** Minimap canvas. */
  AX_MAP: 'axioms-map',
  /** Region-entry toast. */
  AX_TOAST: 'axioms-toast',
  AX_TOAST_SHOW: 'axioms-toast--show',
  /** Class-picker dialog (pre-game). */
  AX_PICKER: 'axioms-picker',
  AX_PICKER_CARD: 'axioms-picker-card',
  /** Devil's Gambit choice modal on lethal hit. */
  AX_GAMBIT: 'axioms-gambit',
  /** Adventure-book print overlay. */
  AX_BOOK: 'axioms-book',
  AX_BOOK_OPEN: 'axioms-book--open',
  /** WebGL-unavailable fallback surface. */
  AX_FALLBACK: 'axioms-fallback',
})

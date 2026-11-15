/**
 * @file tokens/axioms/params.js
 * @description Axiom's End numeric/string params — the wasm artifact
 * mount, storage keys, key bindings and frame-contract constants
 * shared between the JS shell and (documented) the Rust crate. Sole
 * declaration site; the module imports these rather than re-declaring
 * the literals (zero-hardcoding rule 5).
 */

/**
 * Frozen Axiom's End parameter map.
 */
export const AX_PARAMS = Object.freeze({
  /** Public URL prefix the wasm-pack artifacts mount under. */
  WASM_BASE: '/experiments/axioms-end/wasm/',
  /** Glue entry — `init()` + `GameEngine` exports. */
  WASM_GLUE: 'luiskr_axioms_end.js',
  /** localStorage save key — holds the base64 PlayerState blob. */
  SAVE_KEY: 'axioms-end-save-v1',
  /** Default world seed when no save exists — the run is deterministic
   *  per seed, so a fixed default replays the same opening world. */
  DEFAULT_SEED: 1729,
  /** Input buffer length — [moveX, moveY, lookX, lookY, buttons]. */
  INPUT_LEN: 5,
  /** Transform stream stride — id, kind, x, y, z, rotY, scale, anim,
   *  hpFrac, aux. */
  TRANSFORM_STRIDE: 10,
  /** Entity kind ids mirrored from the Rust constants. */
  KIND_PLAYER: 0,
  KIND_CHERUB: 1,
  KIND_VIRTUE: 2,
  KIND_DOMINION: 3,
  KIND_SERAPH: 4,
  KIND_DEVIL: 5,
  /** Vegetation instance stride — x, y, z, rotY, scale, r, g, b. */
  INSTANCE_STRIDE: 8,
  /** World-space chunk edge — mirrors CHUNK_SIZE in procgen.rs. */
  CHUNK_SIZE: 64,
  /** Minimap grid dimension — mirrors MINIMAP_DIM in lib.rs. */
  MINIMAP_DIM: 64,
  /** Frame-event packet stride — kind, a, b, c. */
  EVENT_STRIDE: 4,
  /** Camera toggle key — V flips first/third-person. */
  KEY_CAM_TOGGLE: 'KeyV',
  /** Dodge key — Shift taps the i-frame burst (hold = sprint). */
  KEY_DODGE: 'Space',
  /** Attack mouse button index. */
  BTN_ATTACK: 0,
  /** Adventure-book print key. */
  KEY_BOOK: 'KeyP',
  /** Interaction key. */
  KEY_INTERACT: 'KeyE',
})

/**
 * GPU surface palette — material/fill colors for the WebGL scene and
 * the minimap canvas. CSS-var rules don't reach shader materials, so
 * like SF_COLORS these hex/rgba literals live in one frozen map (the
 * zero-hardcoding contract is the single declaration site, not SCSS).
 */
export const AX_COLORS = Object.freeze({
  /** Entity material colors per kind — [color, emissive]. */
  PLAYER_COLOR: 0x3a2b22,
  PLAYER_EMISSIVE: 0x881100,
  CHERUB_COLOR: 0xfff6dd,
  CHERUB_EMISSIVE: 0xaa8830,
  VIRTUE_COLOR: 0xf0ead8,
  VIRTUE_EMISSIVE: 0xcc9900,
  DOMINION_COLOR: 0xe8ddff,
  DOMINION_EMISSIVE: 0x8855ff,
  SERAPH_COLOR: 0xffffff,
  SERAPH_EMISSIVE: 0xffee55,
  DEVIL_COLOR: 0x5a2015,
  DEVIL_EMISSIVE: 0xcc3300,
  /** Atmosphere — fog, background, ground, vegetation. */
  FOG: 0x0a0d08,
  SKY: 0x07090a,
  AMBIENT: 0x2a3038,
  KEY_LIGHT: 0xd8b27a,
  SKY_LIGHT: 0x33404d,
  GROUND_LIGHT: 0x0c1008,
  GROUND: 0x11140d,
  /** Minimap cell fills per grid value. */
  MAP_BLOCKED: 'rgba(70,90,60,0.8)',
  MAP_HOSTILE: 'rgba(255,220,120,0.95)',
  MAP_DEVIL: 'rgba(255,80,40,0.9)',
})

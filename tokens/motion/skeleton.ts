/**
 * @file tokens/motion/skeleton.js
 * @description Skeleton-shimmer configuration tokens — grouped subsets
 * of SKELETON for the CSS-only placeholder system.
 */

/**
 * Frozen skeleton map — sole declaration site for these tokens; consumers read members and
 * never re-declare the strings (zero-hardcoding rules 4–5). Object.freeze makes the token
 * contract immutable at runtime.
 */
export const SKELETON_RESOLVE = Object.freeze({
  /** Resolve-out length once content has arrived (ms) */
  RESOLVE_DURATION: 480,
})

/**
 * Frozen skeleton map — sole declaration site for these tokens; consumers read members and
 * never re-declare the strings (zero-hardcoding rules 4–5). Object.freeze makes the token
 * contract immutable at runtime.
 */
export const SKELETON_MOSAIC = Object.freeze({
  /** Mosaic skeleton tiles rendered before data lands (mirrors portfoliolist size) */
  MOSAIC_TILES: 12,
  /** The curated home list leads with featured (2-column) items */
  MOSAIC_FEATURED: 6,
  /** Mosaic tiles eligible for LCP — loaded eagerly with high fetch priority */
  MOSAIC_LCP_TILES: 2,
})

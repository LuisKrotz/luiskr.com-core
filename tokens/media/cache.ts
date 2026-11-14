/**
 * @file tokens/media/cache.js
 * @description IndexedDB media disk-cache + network cache-mode tokens.
 */

/**
 * IndexedDB media disk-cache + network cache-mode tokens. Sole declaration site — consumers import members
 * from this frozen map rather than re-declaring the literals
 * (zero-hardcoding rule).
 */
export const IDB_CONFIG = Object.freeze({
  MEDIA_DB_NAME: 'luiskr_media_disk_cache_v1',
  MEDIA_KEY_PREFIX: 'luiskr_media_',
  MEDIA_META_PREFIX: 'luiskr_media_meta_',
  MEDIA_DB_VERSION: 1,
  MEDIA_STORE: 'media_blobs',
  READONLY: 'readonly',
  READWRITE: 'readwrite',
})

/**
 * Caches config.
 */
export const CACHE_CONFIG = Object.freeze({
  FORCE_CACHE: 'force-cache',
})

/**
 * Idle-prefetch tuning — background asset warming while the tab is
 * hidden (`document.visibilitychange`). Kept conservative on purpose:
 * the page must stay cheap to keep alive, so warming is throttled to a
 * small concurrent pool of low-priority no-cors GETs and skips
 * metered/slow connections entirely.
 */
export const IDLE_PREFETCH = Object.freeze({
  /** Concurrent warm requests in flight at once. */
  CONCURRENCY: 4,
  /** Settle delay after the tab hides — transient tab switches never start a cycle. */
  ARM_DELAY_MS: 1200,
  /** fetch mode — opaque CDN GETs still land in the HTTP/image cache. */
  MODE_NO_CORS: 'no-cors',
  /** No cookies on the CDN bucket — keeps the warm request credentials-free. */
  CREDENTIALS_OMIT: 'omit',
  /** navigator.connection member names (non-standard but widely shipped). */
  CONNECTION_SAVE_DATA: 'saveData',
  CONNECTION_EFFECTIVE_TYPE: 'effectiveType',
  /** effectiveType values treated as too constrained to warm in the background. */
  SLOW_EFFECTIVE_TYPES: Object.freeze(['slow-2g', '2g']),
})

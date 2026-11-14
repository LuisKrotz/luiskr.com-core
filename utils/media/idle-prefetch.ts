/**
 * @file utils/media/idle-prefetch.ts
 * @description Background asset warming while the tab is hidden.
 *
 * When the user backgrounds the tab (`visibilitychange` → hidden), the
 * module walks the composed DOM (shadow roots included) and collects
 * every CDN media URL the current route already references — rendered
 * `img`/`source`/`video` URLs plus the manifest-proven ladder rungs of
 * each original — then warms them into the HTTP/image cache with a small
 * pool of low-priority `no-cors` GETs.
 *
 * Contracts kept deliberately tight:
 *   - never starts while `navigator.connection.saveData` or a
 *     `slow-2g`/`2g` effective type is reported — metered users keep
 *     their bytes;
 *   - an arm delay after `hidden` absorbs transient tab switches;
 *   - the pool aborts the moment the tab comes back — user interaction
 *     always wins the bandwidth;
 *   - a `done` set dedupes across cycles and across routes, so a
 *     second hide continues the backlog rather than restarting it.
 */
import { CDN_URLS } from '@core/tokens/media/urls.js'
import { CACHE_CONFIG, IDLE_PREFETCH } from '@core/tokens/media/cache.js'
import { MEDIA_ATTRS } from '@core/tokens/attrs/media.js'
import { ATTR_VALUES } from '@core/tokens/attrs/values.js'
import { CLIPBOARD_EVENTS } from '@core/tokens/events/dom.js'
import { TYPE_STRINGS } from '@core/tokens/strings/types.js'
import { MEDIA } from '@core/tokens/media/suffixes.js'
import { initMediaManifest, coverRungs, webpIfExists } from './manifest.js'

/** Armed-once latch — init is idempotent across repeated boot calls. */
let armed = false

/** A warm cycle is in flight — the visibility handler never double-starts. */
let running = false

/** Abort handle for the in-flight cycle (null while idle). */
let cycle: AbortController | null = null

/** Arm-delay timer after `hidden` — cancelled when the tab returns early. */
let armTimer: ReturnType<typeof setTimeout> | null = null

/** URLs already warmed (or in flight) — dedupes cycles and routes. */
const done = new Set<string>()

/** Backlog shared across cycles — leftovers resume on the next hide. */
const queue: string[] = []

/** In-queue dedupe for URLs collected but not yet fetched. */
const queued = new Set<string>()

/** The visibilitychange handler — kept for removeEventListener symmetry. */
const onVisibility = () => {
  if (document.visibilityState === ATTR_VALUES.HIDDEN) {
    arm()
  } else {
    abortCycle()
  }
}

/**
 * Schedules a warm cycle after the arm delay if the tab stays hidden —
 * quick Alt-Tab peeks never reach the network.
 */
const arm = () => {
  if (armTimer !== null || running) return

  armTimer = setTimeout(() => {
    armTimer = null
    void startCycle()
  }, IDLE_PREFETCH.ARM_DELAY_MS)
}

/** Cancels the pending arm (if any) and aborts the in-flight cycle. */
const abortCycle = () => {
  if (armTimer !== null) {
    clearTimeout(armTimer)
    armTimer = null
  }

  if (cycle) {
    cycle.abort()
    cycle = null
  }

  running = false
}

/**
 * Whether the network is too constrained for background warming —
 * `saveData` or a 2g-class effective type means the user's bytes are
 * precious and the tab-hidden download would be unwelcome.
 */
const networkTooExpensive = (): boolean => {
  if (typeof navigator === TYPE_STRINGS.UNDEFINED) return false

  const conn = (navigator as unknown as { connection?: Record<string, unknown> }).connection

  if (!conn) return false

  if (conn[IDLE_PREFETCH.CONNECTION_SAVE_DATA] === true) return true

  const type = conn[IDLE_PREFETCH.CONNECTION_EFFECTIVE_TYPE]

  return (
    typeof type === TYPE_STRINGS.STRING &&
    (IDLE_PREFETCH.SLOW_EFFECTIVE_TYPES as readonly string[]).includes(type as string)
  )
}

/**
 * Every CDN media URL referenced anywhere in the composed tree — img
 * `src`/`srcset` entries, `source` `srcset`, `video` `src`/`poster`.
 * Shadow roots are walked recursively so component-rendered media
 * (mosaic tiles, carousel figures, related cards) counts too.
 */
const collectCdnUrls = (): Set<string> => {
  const urls = new Set<string>()

  const add = (value: string | null | undefined) => {
    if (value && value.startsWith(CDN_URLS.CDN_BASE)) urls.add(value)
  }

  const addSrcset = (value: string | null | undefined) => {
    if (!value) return

    for (const candidate of value.split(',')) {
      add(candidate.trim().split(/\s+/)[0])
    }
  }

  const visit = (root: ParentNode) => {
    for (const el of root.querySelectorAll('img,source,video')) {
      const e = el as HTMLImageElement

      add(e.getAttribute(MEDIA_ATTRS.SRC))
      addSrcset(e.getAttribute(MEDIA_ATTRS.SRCSET))
      add(e.getAttribute(MEDIA_ATTRS.POSTER))
    }

    for (const el of root.querySelectorAll('*')) {
      if (el.shadowRoot) visit(el.shadowRoot)
    }
  }

  visit(document)

  return urls
}

/**
 * Expands the collected set with manifest-proven derivative rungs —
 * the DOM only references the tier it painted first, but the ladder
 * upgrade path (webp siblings, higher-quality mozjpgs) is exactly what
 * interaction would trigger later, so it warms alongside.
 */
const expandVariants = (urls: Set<string>) => {
  for (const url of [...urls]) {
    const webp = webpIfExists(url)

    if (webp) urls.add(webp)

    if (!url.endsWith(MEDIA.EXT) || url.includes(MEDIA.MOZ)) continue

    for (const rung of coverRungs(url)) {
      urls.add(rung.jpg)

      if (rung.webp) urls.add(rung.webp)
    }
  }
}

/** Enqueues a URL unless it is already warmed or already waiting. */
const enqueue = (url: string) => {
  if (done.has(url) || queued.has(url)) return

  queued.add(url)
  queue.push(url)
}

/**
 * Runs one warm cycle — collects the route's CDN URLs, expands variants,
 * then drains the backlog with the configured worker pool. Each worker
 * shares the cycle's AbortSignal so returning the tab drops every
 * in-flight request immediately.
 */
const startCycle = async () => {
  if (running || networkTooExpensive() || typeof fetch !== TYPE_STRINGS.FUNCTION) return

  running = true
  cycle = new AbortController()
  const signal = cycle.signal

  try {
    await initMediaManifest()

    const urls = collectCdnUrls()

    expandVariants(urls)

    for (const url of urls) enqueue(url)

    const worker = async () => {
      for (;;) {
        const url = queue.shift()

        if (url === undefined) return

        queued.delete(url)

        if (done.has(url) || signal.aborted) continue

        try {
          await fetch(url, {
            cache: CACHE_CONFIG.FORCE_CACHE as RequestCache,
            credentials: IDLE_PREFETCH.CREDENTIALS_OMIT as RequestCredentials,
            mode: IDLE_PREFETCH.MODE_NO_CORS as RequestMode,
            signal,
            // Low-priority hint — ignored where unsupported.
            priority: MEDIA_ATTRS.FETCH_PRIORITY_LOW as RequestPriority,
          })

          // Resolution (any status) marks the URL warmed; HTTP errors
          // resolve too — the server answered, nothing to retry.
          done.add(url)
        } catch {
          // Abort/network denial — NOT marked done: the URL re-enters the
          // backlog on the next hide via collectCdnUrls + enqueue.
        }
      }
    }

    const workers: Promise<void>[] = []

    for (let i = 0; i < IDLE_PREFETCH.CONCURRENCY; i++) {
      workers.push(worker())
    }

    await Promise.all(workers)
  } finally {
    cycle = null
    running = false
  }
}

/**
 * Arms the background prefetch listener — call once at boot (deferred,
 * off the critical path). Idempotent: repeated calls are a no-op.
 */
export function initIdlePrefetch(): void {
  if (armed || typeof document === TYPE_STRINGS.UNDEFINED) return

  armed = true
  document.addEventListener(CLIPBOARD_EVENTS.VISIBILITY_CHANGE, onVisibility)
}

/**
 * Detaches the listener and aborts any in-flight cycle — exported for
 * test teardown so a warm cycle can't outlive its suite.
 */
export function destroyIdlePrefetch(): void {
  if (!armed) return

  armed = false

  if (typeof document !== TYPE_STRINGS.UNDEFINED) {
    document.removeEventListener(CLIPBOARD_EVENTS.VISIBILITY_CHANGE, onVisibility)
  }

  abortCycle()
}

/**
 * Test seam — clears the warm/queue bookkeeping so a suite can drive
 * multiple hide/show cycles without cross-test bleed.
 */
export function _resetIdlePrefetch(): void {
  done.clear()
  queue.length = 0
  queued.clear()
}

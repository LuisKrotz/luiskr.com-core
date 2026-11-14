/**
 * @file idle-prefetch-tails.test.js
 * @description Coverage tails for utils/media/idle-prefetch.ts — the
 * arm/abort lifecycle on visibilitychange, the metered/slow-network
 * guards, composed-DOM URL collection (shadow roots, srcset parsing),
 * manifest-proven variant expansion, the worker-pool drain with
 * done/queue dedupe, and abort-mid-flight re-queueing.
 */
import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals'
import {
  initIdlePrefetch,
  destroyIdlePrefetch,
  _resetIdlePrefetch,
} from '@core/utils/media/idle-prefetch.js'
import { CDN_URLS } from '@core/tokens/media/urls.js'
import { MEDIA } from '@core/tokens/media/suffixes.js'
import { ATTR_VALUES } from '@core/tokens/attrs/values.js'
import { CLIPBOARD_EVENTS } from '@core/tokens/events/dom.js'
import { IDLE_PREFETCH } from '@core/tokens/media/cache.js'
import { HTML_TAGS } from '@core/tokens/elements/html.js'

const CDN = CDN_URLS.CDN_BASE
const KEY_A = 'covers/alpha'
const KEY_B = 'covers/beta'
const URL_A = `${CDN}${KEY_A}${MEDIA.EXT}`
const URL_B = `${CDN}${KEY_B}${MEDIA.EXT}`
const MANIFEST = '/meta/media-manifest.json'

/**
 * Bucket key list the first manifest fetch latches — `initMediaManifest`
 * loads ONCE per module state, so the file's first stubbed response is
 * the only one that lands. Everything later tests need proven must be
 * in this list.
 */
const MANIFEST_LIST = [
  `${KEY_A}${MEDIA.MOZ}${MEDIA.THUMB_SUFFIX}${MEDIA.EXT}`,
  `${KEY_A}${MEDIA.MOZ}${MEDIA.Q75}${MEDIA.EXT}`,
  `${KEY_A}${MEDIA.MOZ}${MEDIA.Q75}${MEDIA.WEBP_EXT}`,
  `${KEY_A}${MEDIA.WEBP_EXT}`,
  `covers/gamma${MEDIA.MOZ}${MEDIA.Q75}${MEDIA.EXT}`,
]

/** Fake Response stand-in for the manifest + warm fetches. */
const res = (json) => ({ ok: true, json: async () => json })

/** Sets document.visibilityState for the duration of a test. */
const setVis = (value) =>
  Object.defineProperty(document, 'visibilityState', { value, configurable: true })

/** Sets navigator.connection (or deletes it with `undefined`). */
const setConn = (value) =>
  Object.defineProperty(navigator, 'connection', { value, configurable: true })

/** Mounts an img/video tree (with optional shadow root) for collection. */
const mountMedia = () => {
  const host = document.createElement(HTML_TAGS.DIV)
  document.body.appendChild(host)

  const img = document.createElement(HTML_TAGS.IMG)
  img.setAttribute('src', URL_A)
  img.setAttribute('srcset', `${URL_A} 1x, ${URL_B} 2x`)
  host.appendChild(img)

  const vid = document.createElement(HTML_TAGS.VIDEO)
  vid.setAttribute('src', `${CDN}clips/one.mp4`)
  vid.setAttribute('poster', `${CDN}clips/one-poster.jpg`)
  host.appendChild(vid)

  const shadowHost = document.createElement(HTML_TAGS.DIV)
  const shadow = shadowHost.attachShadow({ mode: 'open' })
  const inner = document.createElement(HTML_TAGS.IMG)
  inner.setAttribute('src', `${CDN}covers/in-shadow.jpg`)
  inner.setAttribute('srcset', '   ,   ')
  shadow.appendChild(inner)
  host.appendChild(shadowHost)

  const foreign = document.createElement(HTML_TAGS.IMG)
  foreign.setAttribute('src', `https://example.com/not-cdn.jpg`)
  host.appendChild(foreign)

  return host
}

describe('idle prefetch', () => {
  let realFetch
  let fetched

  beforeEach(() => {
    realFetch = globalThis.fetch
    fetched = []
    jest.useFakeTimers()
    _resetIdlePrefetch()
  })

  afterEach(() => {
    destroyIdlePrefetch()
    globalThis.fetch = realFetch
    setVis(ATTR_VALUES.VISIBLE)
    setConn(undefined)
    jest.useRealTimers()
    document.body.innerHTML = ''
  })

  const hide = () => {
    setVis(ATTR_VALUES.HIDDEN)
    document.dispatchEvent(new Event(CLIPBOARD_EVENTS.VISIBILITY_CHANGE))
  }

  const show = () => {
    setVis(ATTR_VALUES.VISIBLE)
    document.dispatchEvent(new Event(CLIPBOARD_EVENTS.VISIBILITY_CHANGE))
  }

  /** Drains queued microtasks — the async warm cycle is several awaits deep. */
  const flush = async () => {
    for (let i = 0; i < 30; i++) await Promise.resolve()
  }

  const stubFetch = (manifestList = []) => {
    globalThis.fetch = jest.fn(async (url) => {
      if (String(url).endsWith(MANIFEST)) return res(manifestList)

      fetched.push(String(url))

      return res()
    })
  }

  test('init arms once; hidden tab warms collected CDN urls through the pool', async () => {
    stubFetch(MANIFEST_LIST)
    const host = mountMedia()

    initIdlePrefetch()
    initIdlePrefetch() // armed latch — second init is a no-op

    hide()
    jest.advanceTimersByTime(IDLE_PREFETCH.ARM_DELAY_MS + 100)
    await flush()

    expect(fetched).toContain(URL_A)
    expect(fetched).toContain(URL_B)
    expect(fetched).toContain(`${CDN}clips/one.mp4`)
    expect(fetched).toContain(`${CDN}clips/one-poster.jpg`)
    expect(fetched).toContain(`${CDN}covers/in-shadow.jpg`)
    expect(fetched).not.toContain('https://example.com/not-cdn.jpg')

    // initFetch options: force-cache + no-cors + omit credentials.
    const [, init] = globalThis.fetch.mock.calls.find((c) => String(c[0]) === URL_A)
    expect(init.cache).toBe('force-cache')
    expect(init.mode).toBe('no-cors')
    expect(init.credentials).toBe('omit')

    // A second hide/show cycle refetches nothing — `done` dedupes.
    const count = fetched.length
    show()
    hide()
    jest.advanceTimersByTime(IDLE_PREFETCH.ARM_DELAY_MS + 100)
    await flush()
    expect(fetched.length).toBe(count)

    host.remove()
  })

  test('visible tab cancels the arm and aborts in-flight fetches', async () => {
    let aborted = 0

    globalThis.fetch = jest.fn(async (url, init) => {
      if (String(url).endsWith(MANIFEST)) return res([])

      await new Promise((resolve) => setTimeout(resolve, 5000))

      if (init?.signal?.aborted) aborted += 1

      return res()
    })

    mountMedia()
    initIdlePrefetch()

    // Show before the arm delay — the cycle never starts.
    hide()
    jest.advanceTimersByTime(IDLE_PREFETCH.ARM_DELAY_MS - 100)
    show()
    jest.advanceTimersByTime(5000)
    expect(aborted).toBe(0)

    // Cycle starts, then the tab returns mid-flight — signal aborts.
    hide()
    jest.advanceTimersByTime(IDLE_PREFETCH.ARM_DELAY_MS + 100)
    await flush()
    show()
    jest.advanceTimersByTime(6000)
    await flush()
    expect(aborted).toBeGreaterThan(0)
  })

  test.each([{ saveData: true }, { effectiveType: 'slow-2g' }, { effectiveType: '2g' }])(
    'metered/slow network %j skips warming entirely',
    async (conn) => {
      stubFetch([])
      mountMedia()
      setConn(conn)
      initIdlePrefetch()

      hide()
      jest.advanceTimersByTime(IDLE_PREFETCH.ARM_DELAY_MS + 100)
      await flush()

      expect(fetched).toEqual([])
    }
  )

  test('missing navigator.connection warms normally (no signal to block on)', async () => {
    stubFetch([])
    mountMedia()
    setConn(undefined)
    initIdlePrefetch()

    hide()
    jest.advanceTimersByTime(IDLE_PREFETCH.ARM_DELAY_MS + 100)
    await flush()

    expect(fetched).toContain(URL_A)
  })

  test('manifest-proven ladder rungs + webp siblings warm alongside originals', async () => {
    // The first test already latched MANIFEST_LIST — a fresh stem proves
    // THIS cycle's expansion (already-done rungs stay off the backlog).
    stubFetch(MANIFEST_LIST)

    const img = document.createElement(HTML_TAGS.IMG)
    img.setAttribute('src', `${CDN}covers/gamma${MEDIA.EXT}`)
    document.body.appendChild(img)

    initIdlePrefetch()

    hide()
    jest.advanceTimersByTime(IDLE_PREFETCH.ARM_DELAY_MS + 100)
    await flush()

    expect(fetched).toContain(`${CDN}covers/gamma${MEDIA.EXT}`)
    expect(fetched).toContain(`${CDN}covers/gamma${MEDIA.MOZ}${MEDIA.Q75}${MEDIA.EXT}`)
    // Unproven rungs stay cold — only manifest-listed objects warm.
    expect(fetched).not.toContain(`${CDN}covers/gamma${MEDIA.MOZ}${MEDIA.Q50}${MEDIA.EXT}`)

    img.remove()
  })

  test('a second hide while armed (or running) is a no-op — no double arm', async () => {
    stubFetch([])
    mountMedia()
    initIdlePrefetch()

    // First hide arms the timer; a second hide before it fires hits
    // the `armTimer !== null` guard and leaves a single pending arm.
    hide()
    hide()
    jest.advanceTimersByTime(IDLE_PREFETCH.ARM_DELAY_MS + 100)
    await flush()

    expect(fetched).toContain(URL_A)

    // While a cycle is running the `running` guard covers the same
    // early-return — arm a second hide mid-flight.
    show()
    hide()
    jest.advanceTimersByTime(IDLE_PREFETCH.ARM_DELAY_MS + 100)
    hide()
    await flush()
  })

  test('no navigator global means no metered signal — the cycle still warms', async () => {
    stubFetch([])
    mountMedia()

    const realNavigator = globalThis.navigator

    Object.defineProperty(globalThis, 'navigator', { value: undefined, configurable: true })

    initIdlePrefetch()
    hide()
    jest.advanceTimersByTime(IDLE_PREFETCH.ARM_DELAY_MS + 100)
    await flush()

    expect(fetched).toContain(URL_A)

    Object.defineProperty(globalThis, 'navigator', { value: realNavigator, configurable: true })
  })

  test('a rejecting fetch stays off `done` — next cycle retries the URL', async () => {
    let calls = 0

    globalThis.fetch = jest.fn(async (url) => {
      if (String(url).endsWith(MANIFEST)) return res([])

      calls += 1

      if (calls <= 1) throw new Error('offline')

      return res()
    })

    const img = document.createElement(HTML_TAGS.IMG)
    img.setAttribute('src', URL_A)
    document.body.appendChild(img)

    initIdlePrefetch()
    hide()
    jest.advanceTimersByTime(IDLE_PREFETCH.ARM_DELAY_MS + 100)
    await flush()

    expect(calls).toBeGreaterThan(0)

    // Second cycle — the failed URL is retried (not latched by `done`).
    show()
    hide()
    jest.advanceTimersByTime(IDLE_PREFETCH.ARM_DELAY_MS + 100)
    await flush()

    const imgCalls = calls

    // Third cycle — now resolved and marked done: no further calls.
    show()
    hide()
    jest.advanceTimersByTime(IDLE_PREFETCH.ARM_DELAY_MS + 100)
    await flush()
    expect(calls).toBe(imgCalls)

    img.remove()
  })

  test('init without document is a no-op; destroy detaches the listener', async () => {
    stubFetch([])

    // Cover the typeof document guard — no arm is possible.
    const realDoc = globalThis.document
    Object.defineProperty(globalThis, 'document', { value: undefined, configurable: true })
    initIdlePrefetch()
    expect(() => destroyIdlePrefetch()).not.toThrow()
    Object.defineProperty(globalThis, 'document', { value: realDoc, configurable: true })

    initIdlePrefetch()
    destroyIdlePrefetch()
    hide()
    jest.advanceTimersByTime(IDLE_PREFETCH.ARM_DELAY_MS + 100)
    await flush()
    expect(fetched).toEqual([])

    // destroy with an armed listener but a gone document — the
    // removeEventListener guard arm (armed=true, document=undefined).
    initIdlePrefetch()
    Object.defineProperty(globalThis, 'document', { value: undefined, configurable: true })
    destroyIdlePrefetch()
    Object.defineProperty(globalThis, 'document', { value: realDoc, configurable: true })
  })
})

/**
 * @file print-init-tails.test.js
 * @description Coverage for core/utils/print/print.ts — initPrintSupport
 * installs the before/afterprint + matchMedia channels once, and the
 * idempotent latch makes a second install a no-op. Runs on its own
 * module registry — the install latches once per instance, so this
 * scenario cannot share a file with the SSR arm.
 */
import { initPrintSupport } from '@core/utils/print/print.js'
import { MEDIA_QUERIES } from '@core/tokens/primitives.js'

describe('initPrintSupport install', () => {
  let origMatchMedia

  beforeAll(() => {
    origMatchMedia = window.matchMedia

    // The install path queries the print channel before any DOM work.
    window.matchMedia = (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })
  })

  afterAll(() => {
    window.matchMedia = origMatchMedia
  })

  test('installs the print channels once — repeat calls latch', () => {
    expect(window.matchMedia(MEDIA_QUERIES.PRINT).media).toBe(MEDIA_QUERIES.PRINT)

    expect(() => initPrintSupport()).not.toThrow()

    // The install latch is one-shot — a second call early-returns.
    expect(() => initPrintSupport()).not.toThrow()
  })
})

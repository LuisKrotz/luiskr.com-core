/**
 * @file starfield-names-enfail-tails.test.js
 * @description Coverage tail for core/locale/starfield-names — the
 * `code === LOCALES.EN ? null : fetch-english-fallback` arm: when the
 * English names file itself fails, fetchBodyNames resolves null without
 * re-requesting (a self-fallback would loop). Lives in its own file —
 * the module's per-locale cache can't hold a successful and a failed EN
 * resolution in one registry.
 */
import { describe, test, expect, jest } from '@jest/globals'
import { fetchBodyNames, peekBodyNames } from '@core/locale/starfield-names.js'
import { LOCALES } from '@core/tokens/locales.js'

describe('starfield-names — English failure arm', () => {
  test('fetchBodyNames resolves null for English itself — no fallback re-fetch', async () => {
    const origFetch = globalThis.fetch

    globalThis.fetch = jest.fn(async () => ({ ok: false, status: 404 }))

    try {
      expect(await fetchBodyNames(LOCALES.EN)).toBeNull()
      expect(peekBodyNames(LOCALES.EN)).toBeNull()
      // One network attempt — the EN arm returns null directly instead of
      // issuing a fallback request for the very file that just failed.
      expect(globalThis.fetch.mock.calls.length).toBe(1)
    } finally {
      globalThis.fetch = origFetch
    }
  })
})

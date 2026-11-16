/**
 * @file starfield-names.test.js
 * @description Coverage for core/locale/starfield-names — the shared
 * star-field body-name table (fetch + byId/bySlug build + sync peek)
 * extracted from the experiment's dossier module so the lang dialog can
 * resolve translated deep-link segments. Exercises the legacy-locale
 * alias map, slug collisions/empty slugs in buildNames, the per-locale
 * cache, the English fallback fetch, HTTP/parse failure arms, and the
 * synchronous peek mirror.
 */
import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals'

import { dossierLocale, fetchBodyNames, peekBodyNames } from '@core/locale/starfield-names.js'
import { LOCALES } from '@core/tokens/locales.js'
import { LOG_LEVELS } from '@core/tokens/data/log.js'
import { getDevLog, clearDevLog } from '@core/devlog.js'

/** fetch-Response stub — ok:true with an async json() returning the body. */
const jsonRes = (body) => ({ ok: true, json: async () => body })

/** fetch mock routing URL suffixes to names files; `missing` frags 404. */
const fileFetch = (files, missing = []) =>
  jest.fn(async (url) => {
    const u = String(url)

    for (const frag of missing) {
      if (u.endsWith(frag)) return { ok: false, status: 404 }
    }

    for (const [frag, body] of Object.entries(files)) {
      if (u.endsWith(frag)) return jsonRes(body)
    }

    return { ok: false, status: 404 }
  })

let origFetch

beforeEach(() => {
  origFetch = globalThis.fetch
  clearDevLog()
})

afterEach(() => {
  globalThis.fetch = origFetch
})

describe('starfield-names locale aliases', () => {
  test('dossierLocale maps legacy codes and passes modern ones through', () => {
    expect(dossierLocale(LOCALES.PT)).toBe(LOCALES.BR)
    expect(dossierLocale(LOCALES.HRX)).toBe(LOCALES.HRK)
    expect(dossierLocale(LOCALES.TLI)).toBe(LOCALES.TLN)
    expect(dossierLocale('zz')).toBe('zz')
    expect(dossierLocale(null)).toBe(LOCALES.EN)
    expect(dossierLocale(undefined)).toBe(LOCALES.EN)
  })
})

describe('starfield-names fetch + peek', () => {
  test('fetchBodyNames builds byId/bySlug, skips empty + duplicate slugs, caches per locale', async () => {
    globalThis.fetch = fileFetch({
      'kq/names.json': {
        'body-a': 'Foo Bar',
        'body-b': 'Foo-Bar',
        'body-c': '!!!',
      },
    })

    const names = await fetchBodyNames('kq')

    expect(names.byId.get('body-a')).toBe('Foo Bar')
    // 'Foo Bar' and 'Foo-Bar' slugify identically — the first id keeps
    // the segment, the degenerate duplicate must not clobber it.
    expect(names.bySlug.get('foo-bar')).toBe('body-a')
    // '!!!' slugifies to '' — unslugifiable names never enter bySlug.
    expect(names.bySlug.size).toBe(1)

    // Second call resolves the same cached table — one network fetch.
    expect(await fetchBodyNames('kq')).toBe(names)
    expect(
      globalThis.fetch.mock.calls.filter((c) => String(c[0]).endsWith('kq/names.json')).length
    ).toBe(1)

    // The sync mirror answers for already-fetched locales only.
    expect(peekBodyNames('kq')).toBe(names)
    expect(peekBodyNames('kx-never-fetched')).toBeNull()
  })

  test('fetchBodyNames falls back to the English names file for untranslated locales', async () => {
    globalThis.fetch = fileFetch({ 'en/names.json': { mars: 'Mars' } }, ['kr/names.json'])

    const names = await fetchBodyNames('kr')

    expect(names.byId.get('mars')).toBe('Mars')
    expect(peekBodyNames('kr')).toBe(names)

    const f = globalThis.fetch

    expect(f.mock.calls.some((c) => String(c[0]).endsWith('kr/names.json'))).toBe(true)
    expect(f.mock.calls.some((c) => String(c[0]).endsWith('en/names.json'))).toBe(true)
  })

  test('fetchBodyNames resolves null when the locale and English fallback both fail', async () => {
    globalThis.fetch = fileFetch({}, ['ks/names.json', 'en/names.json'])

    expect(await fetchBodyNames('ks')).toBeNull()
    expect(peekBodyNames('ks')).toBeNull()
    expect(getDevLog().filter((e) => e.level === LOG_LEVELS.WARN).length).toBeGreaterThan(0)
  })

  test('fetchBodyNames logs devError and resolves null when fetch rejects', async () => {
    globalThis.fetch = jest.fn(() => Promise.reject(new Error('network down')))

    expect(await fetchBodyNames('kt')).toBeNull()
    expect(getDevLog().some((e) => e.level === LOG_LEVELS.ERROR)).toBe(true)
  })

  test('fetchBodyNames defaults to the store locale and peekBodyNames mirrors it', async () => {
    globalThis.fetch = fileFetch({ 'en/names.json': { vesta: 'Vesta' } })

    const names = await fetchBodyNames()

    expect(names.byId.get('vesta')).toBe('Vesta')
    expect(peekBodyNames()).toBe(names)
  })
})

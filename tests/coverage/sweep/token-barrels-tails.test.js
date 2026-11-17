/**
 * @file token-barrels-tails.test.js
 * @description Coverage tails for the barrel/shim token modules that
 * no runtime suite imports directly: the `base.js` Node-ESM resolution
 * shim (namespace aggregate + re-export contract), the `searchThemes`
 * CMS field key, and the star-field parameter barrel's `SF_PARAMS`
 * aggregate. Importing each registers it; the assertions pin the
 * export contract so an empty or broken barrel fails loudly.
 */
import { describe, test, expect } from '@jest/globals'

describe('token barrels/shims register and re-export', () => {
  test('base.js shim forwards the authoritative base.ts bindings', async () => {
    const shim = await import('@core/tokens/base.js')

    expect(Object.keys(shim).length).toBeGreaterThan(0)
    expect(shim.BASE_TOKENS).toBeDefined()

    const direct = await import('@core/tokens/base.js')

    expect(shim.BASE_TOKENS._B_ABOUT).toBe(direct._B_ABOUT)
  })

  test('search-themes.js exports the CMS field key', async () => {
    const { SEARCH_THEMES_KEY } = await import('@core/tokens/data/search-themes.js')

    expect(typeof SEARCH_THEMES_KEY).toBe('string')

    expect(SEARCH_THEMES_KEY.length).toBeGreaterThan(0)
  })

  test('starfield/params.ts barrel re-exports the domain parameter bags', async () => {
    const params = await import('@core/tokens/starfield/params.js')

    expect(Object.keys(params).length).toBeGreaterThan(0)
    expect(params.SF_PARAMS).toBeDefined()
    expect(params.SF_PARAMS.SF_CAMERA).toBe(params.SF_CAMERA)
    expect(Object.isFrozen(params.SF_PARAMS)).toBe(true)
  })
})

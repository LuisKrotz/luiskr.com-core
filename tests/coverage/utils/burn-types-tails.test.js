/**
 * @file burn-types-tails.test.js
 * @description Coverage tail for utils/burn/types.ts — the shared
 * BurnSession/BurnClasses contract module plus its two runtime tokens
 * (BURN_PARTICLE kind ids, BURN_DIR direction ids) consumed by the
 * paper-combustion pipeline. Asserts the frozen id maps so a dropped
 * or mutated token fails loudly.
 */
import { describe, test, expect } from '@jest/globals'
import { BURN_DIR, BURN_PARTICLE } from '@core/utils/burn/types.js'

describe('burn/types.ts id tokens', () => {
  test('BURN_PARTICLE pins the ember/fleck kind ids', () => {
    expect(BURN_PARTICLE.EMBER).toBe(0)
    expect(BURN_PARTICLE.FLECK).toBe(1)
    expect(Object.isFrozen(BURN_PARTICLE)).toBe(true)
  })

  test('BURN_DIR pins the forward/rebuild direction ids', () => {
    expect(BURN_DIR.FORWARD).toBe(1)
    expect(BURN_DIR.REBUILD).toBe(-1)
    expect(Object.isFrozen(BURN_DIR)).toBe(true)
  })
})

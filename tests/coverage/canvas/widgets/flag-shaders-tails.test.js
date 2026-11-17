/**
 * @file flag-shaders-tails.test.js
 * @description Coverage tail for the FlagWebGL GLSL sources — importing
 * the module evaluates both shader template literals (the precision
 * preamble + paint-token interpolations resolve at module load).
 */
import { describe, test, expect } from '@jest/globals'
import { FLAG_FS, FLAG_VS } from '@core/utils/canvas/widgets/flag/shaders.js'
import { CANVAS_PAINT_GLSL as PAINT } from '@core/tokens/canvas/paint.js'

describe('flag shader sources', () => {
  test('the vertex stage carries the y-flipped fullscreen quad', () => {
    // Textures upload in image coords — the only a_pos variant that
    // inverts v_uv.y, so the flag reads top-left correctly.
    expect(FLAG_VS).toContain('v_uv.y = 1.0 - v_uv.y')
    expect(FLAG_VS).toContain('gl_Position')
  })

  test('the fragment stage carries warp, split-dissolve and the paint divider', () => {
    // Wind uniforms drive the drape; the split path blends two flags at
    // u_split_x and paints the thin divider from the shared paint token.
    for (const uniform of ['u_time', 'u_hover', 'u_anim_type', 'u_is_split', 'u_split_x']) {
      expect(FLAG_FS).toContain(`uniform float ${uniform}`)
    }

    expect(FLAG_FS).toContain('u_tex1')
    expect(FLAG_FS).toContain('u_tex2')
    expect(FLAG_FS).toContain(PAINT.FLAG_DIVIDER)
    expect(FLAG_FS).toContain('gl_FragColor')
  })
})

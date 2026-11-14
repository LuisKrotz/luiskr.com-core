/**
 * @file gl-lifecycle-tails-shared-renderer-purge-restore.test.js
 * @description Split from gl-lifecycle-tails.test.js — covers the "shared-renderer purge/restore" describe.
 */
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals'
import { FlagWebGL } from '@core/utils/canvas/widgets/flag-webgl.js'
import { createMockGL, createMock2D } from '@tests/fixtures/mock-webgl.js'
import { WEBGL_STRINGS } from '@core/tokens/strings/webgl.js'
import { HTML_TAGS } from '@core/tokens/elements/html.js'
import { STATE_CLASSES } from '@core/tokens/classes/state.js'

import { LOCALES } from '@core/constants.js'

let mockGL
let mock2D
let origGetContext

beforeEach(() => {
  mockGL = createMockGL()
  mock2D = createMock2D()

  const proto = window.HTMLCanvasElement?.prototype || HTMLCanvasElement.prototype

  origGetContext = proto.getContext

  proto.getContext = function patchedGetContext(type) {
    if (String(type) === WEBGL_STRINGS.CONTEXT_2D) return mock2D
    if (/webgl/i.test(String(type))) return mockGL

    return null
  }
})

afterEach(() => {
  const proto = window.HTMLCanvasElement?.prototype || HTMLCanvasElement.prototype

  proto.getContext = origGetContext

  document.body.innerHTML = ''
})

/** Appended canvas — optional class hook the lifecycle maps key on. */
const makeCanvas = (cls = null, parent = document.body) => {
  const canvas = document.createElement(HTML_TAGS.CANVAS)

  if (cls) canvas.className = cls

  parent.appendChild(canvas)

  return canvas
}

// ─── Shared-renderer purge/restore ───────────────────────────────────────────
describe('shared-renderer purge/restore', () => {
  test('FlagWebGL releases the shared renderer offscreen and re-acquires on re-entry', () => {
    const canvas = makeCanvas()
    const flag = new FlagWebGL(canvas, { code: LOCALES.EN, cc: 'us' })

    expect(flag.renderer).toBeTruthy()

    const oldCanvas = flag.renderer.canvas

    flag.restore()
    flag.purge()

    expect(flag.renderer).toBeNull()

    flag.restore()

    expect(flag.renderer).toBeTruthy()
    expect(flag.renderer.canvas).not.toBe(oldCanvas)

    flag.destroy()
  })

  test('FlagWebGL purge tolerates missing animId/renderer; restore falls back when acquire fails', () => {
    const canvas = makeCanvas()
    const flag = new FlagWebGL(canvas, { code: LOCALES.DE, cc: 'de' })

    flag.animId = null
    flag.purge()

    expect(flag.renderer).toBeNull()

    flag.useWebGL = false
    flag.restore()

    expect(flag.renderer).toBeNull()

    flag.destroy()
  })

  test('FlagWebGL restore falls back when the shared renderer cannot re-init', () => {
    const proto = window.HTMLCanvasElement?.prototype || HTMLCanvasElement.prototype
    const canvas = makeCanvas()
    const flag = new FlagWebGL(canvas, { code: LOCALES.FR, cc: 'fr' })

    flag.purge()

    proto.getContext = function patched(type) {
      return String(type) === WEBGL_STRINGS.CONTEXT_2D ? mock2D : null
    }

    flag.restore()

    expect(flag.useWebGL).toBe(false)
    expect(canvas.classList.contains(STATE_CLASSES.IS_FALLBACK)).toBe(true)

    flag.destroy()
  })
})

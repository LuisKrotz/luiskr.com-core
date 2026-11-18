/**
 * @file page-backdrop-loop.ts — static render plumbing for the page
 * backdrop: start (palette sample + size + document marker + one draw),
 * the viewport-resize buffer sync, and the on-demand frame draw. The
 * field never animates — no parallax, no frame loop; a draw runs only
 * when an input actually changed (mount, resize, theme flip, restore).
 */

import { STATE_CLASSES } from '@core/tokens/classes/state.js'
import { QUAD_STRIP } from '@core/tokens/motion/gpu.js'
import { PAGE_BACKDROP } from '@core/tokens/motion/page-backdrop.js'
import type { PageBackdropWebGL } from '../page-backdrop-webgl.js'

/**
 * Begins rendering: samples the palette (an unparseable surface colour
 * falls back to CSS), sizes the buffer, stamps the document marker that
 * pins the CSS glow layers to `none`, and draws the one static dithered
 * frame. High contrast keeps the flat surface: nothing starts while it
 * is on.
 * @param host - the backdrop instance to start
 */
export function start(host: PageBackdropWebGL): void {
  if (host.isActive || !host.useWebGL) return

  const root = document.documentElement

  if (root.classList.contains(STATE_CLASSES.HIGH_CONTRAST)) return

  if (!host._sampleTheme()) {
    host._triggerFallback()

    return
  }

  host.isActive = true

  // Sizes the buffer and — because the instance is already active —
  // draws the first static frame inside the same call.
  host._handleResize()

  // Stamp the marker only after the first frame is queued — the CSS
  // lobes pin to `none` once the opaque canvas is presenting, so the
  // swap never exposes a bare surface for a beat.
  root.classList.add(STATE_CLASSES.HAS_GL_BACKDROP)
}

/**
 * Stops rendering and clears the document marker so the CSS glow layers
 * paint again while the canvas is idle/hidden.
 * @param host - the backdrop instance to stop
 */
export function stop(host: PageBackdropWebGL): void {
  host.isActive = false

  document.documentElement.classList.remove(STATE_CLASSES.HAS_GL_BACKDROP)
}

/**
 * Syncs the backing store with the viewport — then redraws the static
 * frame so the resized buffer never presents a stretched stale pose.
 * The canvas is fixed and fullscreen, so the viewport IS its box — no
 * layout read needed. DPR is capped (the dither only needs device
 * pixels, not supersampling) and each axis is capped so a 4K×2 display
 * never allocates a giant buffer.
 * @param host - the backdrop instance to resize
 */
export function handleResize(host: PageBackdropWebGL): void {
  const dpr = Math.min(window.devicePixelRatio || 1, PAGE_BACKDROP.DPR_MAX)

  host.width = Math.min(Math.round(window.innerWidth * dpr), PAGE_BACKDROP.MAX_DIM)

  host.height = Math.min(Math.round(window.innerHeight * dpr), PAGE_BACKDROP.MAX_DIM)

  host.canvas.width = host.width

  host.canvas.height = host.height

  host._resDirty = true

  if (host.gl) {
    host.gl.viewport(0, 0, host.width, host.height)
  }

  if (host.isActive) host._renderFrame()
}

/**
 * Draws the lobe field once — a static pose: no field clock, no
 * animation. A theme flip resamples the palette before the upload;
 * dirty flags gate the buffer writes so a steady frame is one
 * `drawArrays` and nothing else.
 * @param host - the backdrop instance to draw
 */
export function renderFrame(host: PageBackdropWebGL): void {
  const gl = host.gl

  if (!gl) return

  const isDark = document.documentElement.classList.contains(STATE_CLASSES.DARK_MODE)

  if (isDark !== host._darkAtStart) {
    host._sampleTheme()
  }

  gl.useProgram(host.program)

  if (host._paletteDirty) {
    gl.uniform3fv(host.uCol, host._colors)

    gl.uniform3f(host.uBase, host._base[0], host._base[1], host._base[2])

    gl.uniform1f(host.uGain, host._gain)

    gl.uniform4fv(host.uKey, host._key)

    gl.uniform4fv(host.uShade, host._shade)

    host._paletteDirty = false
  }

  if (host._resDirty) {
    gl.uniform2f(host.uRes, host.width, host.height)

    host._resDirty = false
  }

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, QUAD_STRIP.VERTEX_COUNT)
}

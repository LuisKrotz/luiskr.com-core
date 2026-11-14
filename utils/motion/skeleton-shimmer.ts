/**
 * @file skeleton-shimmer.ts
 * @description Component-level skeleton-shimmer sync — the CSS-only
 * loading placeholder contract after the WebGL glyph layer was
 * removed. The `.skeleton-*` DOM placeholders paint themselves (the
 * `skeleton-shimmer` keyframes live in the adopted sheets); this
 * module only watches renders so the arrival of real content still
 * gets the `skeleton-content-in` fade the resolve-out animation used
 * to provide.
 */

import { SKELETON_CLASSES } from '@core/tokens/classes/skeleton.js'
import { SKELETON_SELECTORS } from '@core/tokens/selectors/skeleton.js'
import { SKELETON_RESOLVE } from '@core/tokens/motion/skeleton.js'
import type { BaseComponent } from '@core/Component.js'

/**
 * Per-component shimmer bookkeeping — whether the last synced render
 * still showed placeholders, and the pending content-in fade timer.
 * A WeakMap keeps the state off the component instance and lets
 * teardown vanish with GC even if destroy is skipped.
 */
interface ShimmerState {
  /** True while the previous render still contained placeholders. */
  had: boolean
  /** Pending content-in cleanup timer id, or null. */
  timer: number | null
}

/** Live shimmer records keyed by component — see ShimmerState. */
const _shimmerState = new WeakMap<BaseComponent, ShimmerState>()

/**
 * Keeps a component's skeleton shimmer in sync with its rendered
 * content — call from connectedCallback after the render lands. While
 * placeholders exist the CSS does all the painting; the first render
 * that no longer contains them gets the `skeleton-content-in` fade
 * (timed removal mirrors the old layer's resolve-out pacing).
 * @param component The host component whose content is being watched.
 */
export const syncSkeletonShimmer = (component: BaseComponent): void => {
  const content = component._contentNode

  if (!content) return

  const rec = _shimmerState.get(component) ?? { had: false, timer: null }
  const has = !!content.querySelector(SKELETON_SELECTORS.SKELETON_ANY)

  if (rec.had && !has) {
    content.classList.add(SKELETON_CLASSES.SKELETON_CONTENT_IN)

    const timer = window.setTimeout(() => {
      content.classList.remove(SKELETON_CLASSES.SKELETON_CONTENT_IN)

      // Supersede guard — a later transition may have armed a newer timer
      // on the same record; only the owning callback clears the slot.
      if (rec.timer === timer) rec.timer = null
    }, SKELETON_RESOLVE.RESOLVE_DURATION)

    rec.timer = timer
  }

  rec.had = has
  _shimmerState.set(component, rec)
}

/**
 * Component-unmount teardown — cancels a pending content-in cleanup
 * and drops the shimmer record. No resolve-out: the host is going
 * away, so a fade would never be seen.
 * @param component The host component being unmounted.
 */
export const destroySkeletonShimmer = (component: BaseComponent): void => {
  const rec = _shimmerState.get(component)

  if (!rec) return

  if (rec.timer !== null) {
    window.clearTimeout(rec.timer)

    component._contentNode?.classList.remove(SKELETON_CLASSES.SKELETON_CONTENT_IN)
  }

  _shimmerState.delete(component)
}

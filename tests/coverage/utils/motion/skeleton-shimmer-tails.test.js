/**
 * @file skeleton-shimmer-tails.test.js
 * @description Covers the "skeleton shimmer tails" describe — the CSS-only
 * skeleton placeholder sync that replaced the WebGL layer: content-in fade
 * arming, timer supersede, and unmount teardown.
 */
import { describe, test, expect } from '@jest/globals'

import { syncSkeletonShimmer, destroySkeletonShimmer } from '@core/utils/motion/skeleton-shimmer.js'
import { SKELETON_CLASSES } from '@core/tokens/classes/skeleton.js'
import { HTML_TAGS } from '@core/tokens/elements/html.js'

/** Generous flush — the content-in timer runs past the 480ms resolve token. */
const flush = (ms = 700) => new Promise((r) => setTimeout(r, ms))

/** Bare component stand-in — sync only ever reads `_contentNode`. */
const makeComponent = (withSkeleton = false) => {
  const content = document.createElement(HTML_TAGS.DIV)

  if (withSkeleton) {
    const placeholder = document.createElement(HTML_TAGS.SPAN)

    placeholder.className = SKELETON_CLASSES.SKELETON_SHIMMER
    content.appendChild(placeholder)
  }

  return { _contentNode: content }
}

describe('skeleton shimmer tails', () => {
  test('sync without a content node returns early', () => {
    const component = { _contentNode: null }

    expect(() => syncSkeletonShimmer(component)).not.toThrow()
    expect(() => destroySkeletonShimmer(component)).not.toThrow()
  })

  test('a first render with placeholders records state without arming content-in', () => {
    const component = makeComponent(true)

    syncSkeletonShimmer(component)

    expect(component._contentNode.classList.contains(SKELETON_CLASSES.SKELETON_CONTENT_IN)).toBe(
      false
    )

    // Placeholders still present → the rec.had && !has arm stays shut.
    syncSkeletonShimmer(component)

    expect(component._contentNode.classList.contains(SKELETON_CLASSES.SKELETON_CONTENT_IN)).toBe(
      false
    )

    destroySkeletonShimmer(component)
  })

  test('a first render without placeholders never arms the fade', async () => {
    const component = makeComponent(false)

    syncSkeletonShimmer(component)
    await flush()

    expect(component._contentNode.classList.contains(SKELETON_CLASSES.SKELETON_CONTENT_IN)).toBe(
      false
    )

    destroySkeletonShimmer(component)
  })

  test('content replacing placeholders arms content-in, then the timer cleans up', async () => {
    const component = makeComponent(true)

    syncSkeletonShimmer(component)

    component._contentNode.replaceChildren()
    syncSkeletonShimmer(component)

    expect(component._contentNode.classList.contains(SKELETON_CLASSES.SKELETON_CONTENT_IN)).toBe(
      true
    )

    await flush()

    expect(component._contentNode.classList.contains(SKELETON_CLASSES.SKELETON_CONTENT_IN)).toBe(
      false
    )

    destroySkeletonShimmer(component)
  })

  test('a second transition supersedes the first pending timer', async () => {
    const component = makeComponent(true)
    const content = component._contentNode

    syncSkeletonShimmer(component)
    content.replaceChildren()
    syncSkeletonShimmer(component)

    const placeholder = document.createElement(HTML_TAGS.SPAN)

    placeholder.className = SKELETON_CLASSES.SKELETON_SHIMMER
    content.appendChild(placeholder)
    syncSkeletonShimmer(component)
    content.replaceChildren()
    syncSkeletonShimmer(component)

    await flush()

    // Both timers fired — the superseded one skipped its bookkeeping, the
    // live one cleared the class exactly once.
    expect(content.classList.contains(SKELETON_CLASSES.SKELETON_CONTENT_IN)).toBe(false)

    destroySkeletonShimmer(component)
  })

  test('destroy on a recorded-but-idle component drops state without touching classes', () => {
    const component = makeComponent(true)

    syncSkeletonShimmer(component)
    destroySkeletonShimmer(component)

    expect(component._contentNode.classList.contains(SKELETON_CLASSES.SKELETON_CONTENT_IN)).toBe(
      false
    )
  })

  test('destroy with a pending timer cancels it and strips the class', async () => {
    const component = makeComponent(true)

    syncSkeletonShimmer(component)
    component._contentNode.replaceChildren()
    syncSkeletonShimmer(component)

    expect(component._contentNode.classList.contains(SKELETON_CLASSES.SKELETON_CONTENT_IN)).toBe(
      true
    )

    destroySkeletonShimmer(component)

    expect(component._contentNode.classList.contains(SKELETON_CLASSES.SKELETON_CONTENT_IN)).toBe(
      false
    )

    await flush()

    expect(component._contentNode.classList.contains(SKELETON_CLASSES.SKELETON_CONTENT_IN)).toBe(
      false
    )
  })

  test('destroy with a pending timer and no content node skips the class strip', () => {
    const component = makeComponent(true)

    syncSkeletonShimmer(component)
    component._contentNode.replaceChildren()
    syncSkeletonShimmer(component)
    component._contentNode = null
    destroySkeletonShimmer(component)

    // Timer was cleared — no late callback touches the detached record.
    expect(component._contentNode).toBeNull()
  })
})

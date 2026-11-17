/**
 * @file tokens/base.js
 * @description Node-ESM resolution shim — `.ts` sources import `../base.js`
 * per the bundler-specifier convention; Node's native type stripping does not
 * remap `.js` specifiers to `.ts` files, so build scripts (.mjs) loading those
 * modules fail. Re-exports the authoritative bindings from `base.ts`.
 */
import * as _base from './base.ts'

export * from './base.ts'

/**
 * Namespace aggregate — every `_B_*`/`_K_*` base fragment in one object,
 * for `.mjs` consumers that prefer a single namespaced binding over
 * enumerating the re-exported members.
 */
export const BASE_TOKENS = _base

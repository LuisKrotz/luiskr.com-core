/**
 * Star-field parameter barrel.
 *
 * Engine parameters — camera rig, fly-to tween
 * timing, approach thresholds that trigger the lazy dossier fetch, and
 * the procedural material palette used for bodies without real imagery
 * (dwarf planets, exoplanets, stars, nebulae, galaxies). Sole declaration
 * site — consumers import members (zero-hardcoding rule). The parameter
 * bags are split across `./params/*.ts` by domain (camera/scale/bodies/
 * spiral/worker/catalog/scene); this module re-exports them all so
 * existing `@core/tokens/starfield/params.js` imports stay stable.
 */

import * as _bodies from './params/bodies.js'
import * as _camera from './params/camera.js'
import * as _catalog from './params/catalog.js'
import * as _post from './params/post.js'
import * as _scale from './params/scale.js'
import * as _scene from './params/scene.js'
import * as _spiral from './params/spiral.js'
import * as _weather from './params/weather.js'
import * as _worker from './params/worker.js'

export { SF_CAMERA, SF_MOTION, SF_APPROACH, SF_ZOOM, SF_KEYS, SF_TIP } from './params/camera.js'
export { SF_SCALE, SF_STRUCTURE } from './params/scale.js'
export {
  SF_BH,
  SF_BELT,
  SF_BELT_ROCK,
  SF_LOD,
  SF_DETAIL,
  SF_SPIKE,
  SF_NEBULA_DEPTH,
  SF_COMET,
} from './params/bodies.js'
export { SF_SPIRAL } from './params/spiral.js'
export { SF_WORKER, SF_STAR_CLOUD } from './params/worker.js'
export { SF_BODY_IDS, SF_COLORS } from './params/catalog.js'
export { SF_FALLBACK, SF_SCENE } from './params/scene.js'
export { SF_POST } from './params/post.js'
export {
  SF_WEATHER,
  SF_SOLAR_WIND,
  SF_AURORA,
  SF_CONSTELLATION,
  SF_METEOR,
  SF_PLUME,
} from './params/weather.js'

/**
 * The complete parameter surface in one frozen flat map — every `SF_*`
 * bag member keyed by name, for consumers (devtools dumps, registries)
 * that iterate the whole parameter set instead of importing members.
 */
export const SF_PARAMS = Object.freeze({
  ..._camera,
  ..._scale,
  ..._bodies,
  ..._spiral,
  ..._worker,
  ..._catalog,
  ..._scene,
  ..._post,
  ..._weather,
})

/**
 * @file locale/starfield-names.ts
 * @description Star-field body-name tables — fetches
 * `experiments/star-field/data/<locale>/names.json` (English fallback)
 * and builds the `byId`/`bySlug` lookup pair the navigator, deep-link
 * resolver and locale-switch URL rebuilder all share. Lives in core so
 * both the experiment view and the lang dialog can resolve translated
 * body segments without a component→experiment import. `_namesResolved`
 * mirrors each landed table so `peekBodyNames` answers synchronously —
 * `localeUrl` is a sync href builder and cannot await the fetch.
 */
import { SF_DATA_BASE, SF_NAMES_FILE } from '@core/tokens/starfield/textures.js'
import { LOCALES } from '@core/tokens/locales.js'
import { slugify } from '@core/utils/string.js'
import store from '@core/store.js'
import { devError, devWarn } from '@core/devlog.js'

/**
 * Locale body-name table — `byId` feeds the navigator rows, hover
 * tooltips and the URL segment; `bySlug` (each name run through the
 * shared `slugify` — NFD-fold, lowercase, `-` runs) resolves translated
 * deep-link segments back to the canonical catalog id.
 */
export interface SFBodyNames {
  /** Canonical body id → localized display name. */
  byId: Map<string, string>
  /** `slugify(localized name)` → canonical body id. */
  bySlug: Map<string, string>
}

/** In-flight + resolved names cache — locale → parsed name table. */
const _namesCache = new Map<string, Promise<SFBodyNames | null>>()

/** Sync mirror of `_namesCache` — populated as each fetch lands so
 *  `peekBodyNames` can answer without awaiting (localeUrl hrefs). */
const _namesResolved = new Map<string, SFBodyNames | null>()

/**
 * Legacy locale aliases — pt/hrx/tli URLs map onto the modern codes
 * whose dossier folders hold the translations.
 * @param locale Active locale code (may be null/undefined).
 * @returns The dossier folder code to fetch.
 */
export function dossierLocale(locale: string | null | undefined): string {
  const alias: Record<string, string> = {
    [LOCALES.PT]: LOCALES.BR,
    [LOCALES.HRX]: LOCALES.HRK,
    [LOCALES.TLI]: LOCALES.TLN,
  }

  return locale ? (alias[locale] ?? locale) : LOCALES.EN
}

/**
 * Builds the names table from a parsed `names.json` payload — forward
 * map verbatim, reverse map keyed by each name's `slugify` output so a
 * localized route segment (`…/via-lactea`) resolves to its catalog id.
 * Slug collisions keep the first id — dossier names are unique within a
 * locale by contract, but a degenerate duplicate must not clobber the
 * catalog body that legitimately owns the segment.
 * @param raw Parsed `{ id: name }` object.
 * @returns The paired lookup maps.
 */
function buildNames(raw: Record<string, string>): SFBodyNames {
  const byId = new Map<string, string>(Object.entries(raw))

  const bySlug = new Map<string, string>()

  for (const [id, name] of byId) {
    const slug = slugify(name)

    if (slug && !bySlug.has(slug)) bySlug.set(slug, id)
  }

  return { byId, bySlug }
}

/**
 * One names-file GET — resolves null on HTTP/parse failure (the UI
 * falls back to catalog names + raw ids) rather than throwing.
 * @param url Names-file URL under `SF_DATA_BASE`.
 * @param code Locale folder for diagnostics.
 * @returns The parsed `{ id: name }` map or null.
 */
function fetchNamesJson(url: string, code: string): Promise<Record<string, string> | null> {
  return Promise.resolve()
    .then(() => fetch(url))
    .then((res) => {
      if (!res.ok) {
        devWarn('[StarField] names fetch failed:', code, res.status)

        return null
      }

      return res.json() as Promise<Record<string, string>>
    })
    .catch((e) => {
      devError('[StarField] names error:', code, e)

      return null
    })
}

/**
 * Fetches the locale's body-name table — `data/<locale>/names.json`,
 * with the canonical English file as fallback. One ~6 KB document per
 * locale, cached per locale code: the navigator renders localized rows
 * and the router reads/writes translated body segments without pulling
 * all 143 dossier files.
 * @param locale Active locale code — defaults to the store's current.
 * @returns The names table, or null when both fetches fail.
 */
export function fetchBodyNames(locale?: string | null): Promise<SFBodyNames | null> {
  const code = dossierLocale(locale ?? store.getters.getLang())

  let pending = _namesCache.get(code)

  if (!pending) {
    pending = fetchNamesJson(`${SF_DATA_BASE}/${code}/${SF_NAMES_FILE}`, code)
      .then(
        (d) =>
          d ??
          (code === LOCALES.EN
            ? null
            : fetchNamesJson(`${SF_DATA_BASE}/${LOCALES.EN}/${SF_NAMES_FILE}`, LOCALES.EN))
      )
      .then((d) => (d ? buildNames(d) : null))
      .then((names) => {
        _namesResolved.set(code, names)

        return names
      })

    _namesCache.set(code, pending)
  }

  return pending
}

/**
 * Synchronous read of an already-landed names table — `localeUrl` is a
 * pure sync builder, so the lang dialog resolves body segments only
 * from tables the star-field view (or a prior switch) already fetched.
 * A miss simply yields null and the caller falls back to the locale-
 * invariant catalog id, which every locale's deep-link resolver accepts.
 * @param locale Locale code — defaults to the store's current.
 * @returns The resolved names table, or null when never fetched/failed.
 */
export function peekBodyNames(locale?: string | null): SFBodyNames | null {
  return _namesResolved.get(dossierLocale(locale ?? store.getters.getLang())) ?? null
}

/**
 * @file tokens/strings/docs.js
 * @description Docs-portal string tokens — English-only UI literals, the
 * content-asset path prefix and the CMS component keys.
 */

import { _B_DOCS } from '../base.js'

/**
 * Frozen docs string map — sole declaration site for these tokens;
 * consumers read members and never re-declare the strings
 * (zero-hardcoding rules 4–5). Object.freeze makes the token contract
 * immutable at runtime.
 */
export const DOCS_STRINGS = Object.freeze({
  /** Page + footer link title — English-only by product spec. */
  TITLE: 'In-depth project docs',
  /** English fallback for the CMS-provided description + toast copy. */
  DESC_FALLBACK: 'Available only in English',
  /** Route-search group header for docs hits — English-only by product
   *  spec: the docs corpus exists only in English, so the label names
   *  that explicitly in every locale (never localized, never CMS-fed). */
  SEARCH_GROUP_LABEL: 'In depth docs (available only in English)',
  COPY_TOAST_FALLBACK:
    "This page doesn't allow copy, please refer to github to download the sourcecode or contact the page admin.",
  /** database.json component node: translations/<locale>/components/<key>. */
  CMS_COMPONENT: `${_B_DOCS}-portal`,
  /** URL prefix under which rendered file payloads are served/emitted. */
  ASSET_BASE: `/${_B_DOCS}-content/`,
  /** JSON suffix appended to every emitted content payload. */
  ASSET_EXT: '.json',
  /** Accessibility labels for the editable breadcrumb + copy feedback. */
  CRUMB_INPUT_LABEL: 'Edit path',
  CRUMB_INPUT_HINT: 'Type a docs path segment and press Enter',
  TREE_LABEL: 'Documentation tree',
  GRID_LABEL: 'Folders and files',
  /** aria-label on the docs content area — the shell already owns the
   *  sole <main> landmark, so the portal's content region is a named
   *  section (region landmark) rather than a second main. */
  MAIN_LABEL: 'Document content',
  NAV_TOGGLE: 'Browse the docs tree',
  VIEWER_BACK: 'Back',
  SOURCE_PROTECTED_LABEL: 'Copy protection active',
  MEDIA_UNAVAILABLE: 'Binary file too large to preview — download it from the GitHub repository.',
  NOT_FOUND_PATH: 'Not found in the documentation tree.',
  /** Keyboard key the print-screen guard reacts to. */
  KEY_PRINT_SCREEN: 'PrintScreen',
  /** Editable-breadcrumb input fallback when the URL path can't resolve. */
  CRUMB_PLACEHOLDER: 'docs/…',
  /** `name` attr for the editable-breadcrumb field (form-field audit). */
  CRUMB_INPUT_NAME: 'docs-path',
  /** Root-bucket folder exempt from index-file auto-open (source tree). */
  SRC_ROOT: 'src',
  /** Index filename that auto-opens when its folder is entered. */
  INDEX_FILE: 'index.html',
  /** Analytics event name for copy-guard attempts. */
  EVENT_COPY_ATTEMPT: 'docs_copy_attempt',
  /** JSON-LD description for the portal root/folder pages. */
  SCHEMA_DESCRIPTION:
    'Source code, documentation and quality reports for luiskr.com — browsable and indexable.',
  /** Boot-loader overlay copy — mirrors the space playground's system
   *  boot sequence with docs-context wording (English-only portal). */
  LOADER_TITLE: 'Docs system boot',
  LOADER_MSG_INIT: 'Opening the documentation archive',
  LOADER_MSG_MANIFEST: 'Indexing modules and reports',
  LOADER_MSG_FILE: 'Loading the document payload',
  LOADER_MSG_READY: 'Portal online',
  /** In-place skeleton label while a mermaid diagram renders. */
  MERMAID_LOADING: 'Rendering diagram…',
  /** sr-only heading + landmark names for the complete document index —
   *  every manifest node rendered as a heading link so AT heading-jump
   *  and crawlers reach all docs without walking the tree. */
  INDEX_TITLE: 'All documents',
  INDEX_LABEL: 'Complete documentation index',
  /** Viewer heading shown when a file is open — labels the content region. */
  VIEWER_HEADING_PREFIX: 'Viewing',
  /** Portal section labels — the flat root buckets re-seat under four
   *  disclosure groups in the treeview and sectioned portal grid. */
  GROUP_DOCS_LABEL: 'Documentation',
  GROUP_ARCH_LABEL: 'Architecture Docs',
  GROUP_SOURCE_LABEL: 'Source Code',
  GROUP_REPORTS_LABEL: 'Reports',
  /** Synthetic path prefix for the section-group rows — ids under it are
   *  view-only (a section has no manifest path), so tree bookkeeping
   *  ('group/docs'…) can never collide with a real docs route. */
  GROUP_PATH_PREFIX: 'group/',
  /** The docs-root child promoted into its own Architecture section. */
  ARCH_DIR: 'architecture',
})

/**
 * Staged boot-loader progress marks — the manifest is inlined at build
 * time so real fetch percentages don't exist; discrete stage numbers
 * keep the bar honest (manifest scanned → file fetched
 * → portal usable).
 */
export const DOCS_LOADER_PCT = Object.freeze({
  MANIFEST: 25,
  FILE: 80,
  READY: 100,
})

/** Unit tokens used by docs layout/backdrop math. */
export const DOCS_UNITS = Object.freeze({
  /** gl-strip thread-field drift — 1/16 real-time so lines barely move */
  GL_STRIP_TIME_SCALE: 0.0625,
  /** deterministic folder-art hash modulus */
  FOLDER_HASH_MOD: 9973,
  /** semantic-index streaming — elements appended per idle slice (~a few
   *  ms each, far under a frame budget), the rIC starvation bound per
   *  slice, and the setTimeout fallback delay where rIC is absent */
  INDEX_CHUNK: 400,
  INDEX_IDLE_TIMEOUT: 250,
  INDEX_FALLBACK_DELAY: 0,
  /** folder paper-stack caps — closed folders peek at most this many
   *  page tops above the tab; open folders fan up to this many colored
   *  sheets, so the pile stops growing before it walls off the glyph */
  TREE_SHEET_CAP_CLOSED: 4,
  TREE_SHEET_CAP_OPEN: 4,
})

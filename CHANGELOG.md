# Changelog

All notable changes to this project are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased] - 2026-11-13

### Added
- Proxy: required `X-DeHype-Key` shared-secret header, compared as SHA-256 digests with `crypto.timingSafeEqual`; 401 on mismatch. The server refuses to start if `SHARED_SECRET` is unset, shorter than 32 characters, or the placeholder.
- Proxy: per-IP rate limiting (`express-rate-limit`), configurable via `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_MS`; `TRUST_PROXY` accepts `true`, `false`, a hop count or an IP/subnet list.
- Proxy: JSON body size limit (`BODY_LIMIT`, default 200kb) with a JSON 413 response; type checks on `content`, `title`, `url` and `type`.
- Proxy: 30 second timeout and one retry on Groq calls.
- Extension: `scripts/config.example.js` template; the gitignored `scripts/config.js` holds the shared secret and `background.js` sends it with analysis requests. A missing or placeholder config shows a red `!` badge and a clear error instead of failing silently.
- README: Known limitations, proxy-first installation steps, project structure including `server/`.

### Changed
- Proxy: CORS restricted to `chrome-extension://` origins (or the exact list in `ALLOWED_ORIGINS`).
- Proxy: clients get fixed error messages (`Upstream rate limited` for 429, `Upstream error` otherwise); `error.message` is only logged server-side. Logs never include request content or model output.
- README, popup hints and manifest description now state that page text, page URL and transcripts are sent to Groq through the proxy, that auto-analyze sends every page visited, and that the proxy does not store them. Removed the claims that data stays local and that the API key never leaves the browser.
- README pipeline description now matches the code: one request and one Groq call per analysis, not six parallel calls.
- `server/.env.example` documents the new variables.

### Fixed
- Model output and error text were inserted into page panels with `innerHTML` unescaped (`page-analyzer.js`, `content.js`). All dynamic values are now HTML-escaped and numeric scores are clamped.
- `scripts/page-analyzer.js` contained a leftover code fragment that was a syntax error, so the page analyzer content script could not load. Removed the fragment.

### Removed
- The "Check Link Credibility" context-menu item and its README entry; it only showed a notification and did no analysis.
- `scripts/DeHype-Unveiling-the-truth-behind-/`, an outdated v1.0 (Gemini-based) copy of the project nested by mistake.

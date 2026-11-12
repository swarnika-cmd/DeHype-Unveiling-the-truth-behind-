# DeHype Pro — AI Content Intelligence Engine 🧠✨

> *unveiling the truth behind the hype*

DeHype Pro is a **Chrome Extension** that uses AI to fight misinformation, clickbait, and emotional manipulation across the entire web. It analyzes any webpage or YouTube video in real-time — delivering factual summaries, credibility scores, sentiment analysis, smart tags, and actionable insights, all powered by **Groq's blazing-fast LLM inference**.

---

## ✨ Key Features

### 🎯 YouTube DeHype
- **Clickbait Detection** — Identifies sensationalist, misleading titles on YouTube
- **AI Title Replacement** — Reads the transcript and replaces hype with a factual one-liner
- **Clickbait Scoring** — Quantified 0-100 clickbait meter with specific tactic identification
- **Bulk Title Scanner** — Scan all visible titles in your YouTube feed at once

### 📊 Universal Page Analysis
- **Works on Any Website** — News articles, blogs, social media, research papers
- **AI Summaries** — Concise, factual 3-4 sentence summaries of any content
- **Smart Tagging** — Auto-generates relevant topic tags for content categorization
- **AI Suggestions** — 3 actionable insights per analysis

### 🛡️ Credibility Scoring
- **Trust Score (0-100)** — AI-powered credibility assessment with animated ring visualization
- **Bias Detection** — Identifies emotional language, unsourced claims, and logical fallacies
- **Source Quality** — Evaluates factual grounding and citation patterns

### 💬 Sentiment & Manipulation Detection
- **Emotional Tone Analysis** — Detects positive, negative, or neutral sentiment
- **Manipulation Alerts** — Flags false urgency, fear-mongering, and emotional exploitation
- **Visual Sentiment Bar** — Color-coded indicator with animated marker

### ⚡ Power Features
- **Context Menu Integration** — Right-click selected text or a page to analyze it
- **Auto-Analyze Mode** — Automatically analyze pages as you browse
- **Analysis History** — Persistent history with timestamps, scores, and domains
- **Usage Statistics** — Track pages analyzed, clickbait caught, and time saved
- **Clipboard Export** — Copy formatted analysis results with one click
- **5 Independent Toggles** — Enable/disable each feature individually
- **Settings & History Stay in the Browser** — Settings, history, stats and an optional Groq key are kept in Chrome Storage. Page text and transcripts you analyze are sent to Groq via the proxy (see Privacy & Data Flow)

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Platform | Chrome Extension (Manifest V3) |
| AI Backend | Groq API — Llama 3.3 70B Versatile |
| Architecture | Service Worker + Content Scripts + Injected Scripts |
| Request model | One proxy request and one Groq call per analysis |
| YouTube Integration | DOM scraping + `ytInitialPlayerResponse` transcript extraction |
| UI Framework | Vanilla JS/CSS — zero dependencies |
| Storage | Chrome Storage API (local) |
| Design | Shader gradient aesthetic with noise textures |

---

## 📁 Project Structure

```
DeHype-Pro/
├── manifest.json                # Manifest V3 configuration
├── popup/
│   ├── popup.html               # Tabbed popup UI (Settings / Analyze / History)
│   ├── popup.css                # Shader gradient design system
│   └── popup.js                 # Analysis engine + rendering
├── scripts/
│   ├── config.example.js        # Template for gitignored config.js (proxy shared secret)
│   ├── background.js            # Service worker — CORS proxy, context menus, auto-analyze
│   ├── content.js               # YouTube-specific analysis & title replacement
│   ├── page-analyzer.js         # Universal page analyzer (runs on all sites)
│   ├── analyzer-panel.css       # Floating panel styles
│   └── injected.js              # YouTube page-world script injection
├── server/
│   ├── index.js                 # Express proxy to Groq (shared secret, rate limit, CORS)
│   ├── package.json
│   └── .env.example             # Proxy configuration template
├── CHANGELOG.md
└── README.md
```

---

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/swarnika-cmd/DeHype-Unveiling-the-truth-behind-.git
   cd DeHype-Unveiling-the-truth-behind-
   ```

2. **Start the proxy first** (Node 18+)
   ```bash
   cd server
   npm ci
   cp .env.example .env
   ```
   Edit `.env`: set `GROQ_API_KEY` (free from [console.groq.com/keys](https://console.groq.com/keys)) and `SHARED_SECRET` (at least 32 characters, not the placeholder; e.g. `openssl rand -hex 32`). The server refuses to start otherwise.
   ```bash
   node index.js
   ```

3. **Configure the extension**
   ```bash
   cd ..
   cp scripts/config.example.js scripts/config.js
   ```
   Set `SHARED_SECRET` in `scripts/config.js` to the same value as the server. `config.js` is gitignored. Until it is set, the toolbar icon shows a red `!` and analysis requests fail with a configuration error.

4. **Load in Chrome**
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode** (top right)
   - Click **"Load unpacked"** → select the project root folder (the one with `manifest.json`)

5. **Optional: custom Groq key**
   - Open the DeHype Pro popup → **Settings** tab → paste a Groq API key → **Save Settings**. It overrides the server's key and is sent to the proxy with each request.
   - If the proxy is not on `http://localhost:3000`, set its URL in the same tab.

---

## 📖 Usage

### YouTube
1. Navigate to any YouTube video
2. The DeHype floating panel appears (bottom right)
3. Click **"🎯 Analyze This Video"** to de-clickbait the title
4. View clickbait score, sentiment, and topic tags in the results panel
5. Click **"📊 Scan All Titles"** to scan your entire feed

### Any Webpage
1. Visit any news article, blog, or webpage
2. Click the floating **DeHype button** (bottom right corner)
3. Click **"🔍 Analyze Page"**
4. Get instant summary, credibility score, sentiment, tags, and insights

### Extension Popup
1. Click the DeHype Pro extension icon
2. **Analyze tab** → "Analyze Current Page" or paste custom text
3. **History tab** → View past analyses with scores
4. **Settings tab** → Configure features and API key

### Right-Click Menu
- Select text → Right-click → **"🔍 DeHype: Analyze Selected Text"**
- Right-click any page → **"📊 DeHype: Analyze This Page"**

---

## ⚙️ Analysis Pipeline

Each analysis is a single request:

```
User clicks "Analyze"
        │
        ▼
Content script / popup  →  one DEHYPE_ANALYZE_REQUEST message
        │
        ▼
Background service worker  →  POST {proxy}/api/analyze  (X-DeHype-Key header)
        │
        ▼
Express proxy  →  one Groq chat completion (JSON object response)
        │
        ▼
Summary, tags, sentiment, credibility / clickbait score rendered from that one response
```

The background service worker makes the request so page content security policies do not block it, and attaches the proxy's shared-secret header. The proxy returns whatever the model produced for the schema of the request type (`video`, `page` or `text`). Model output is HTML-escaped before it is rendered.

---

## 🎨 Design

Built with a **shader gradient aesthetic** inspired by modern generative art:

- Pure black (`#050508`) canvas with organic flowing cyan noise gradients
- Film grain SVG texture overlay for depth
- **Playfair Display** serif for headings — elegant and editorial
- **Inter** sans-serif for body — clean and readable
- Animated score rings, sentiment bars, and pulse indicators
- Frosted glass card effects with `backdrop-filter: blur`
- Micro-animations on every interactive element

---

## 🔒 Privacy & Data Flow

- **Analysis is not on-device.** Page text, selected text, titles and YouTube transcripts are sent to the project's Express proxy (`server/`), which forwards them to Groq (`llama-3.3-70b-versatile`) for analysis. Groq's own data handling applies to what it receives.
- **What is sent.** For page analysis: the page title, the page URL and up to 8,000 characters of page text. For YouTube: the video title and up to 12,000 characters of transcript. For selected text: the selection. When **auto-analyze** is enabled, this is sent for every page you visit, including pages that are logged in or private to you. Leave auto-analyze off if that is not acceptable.
- **Nothing is stored server-side by the proxy.** `server/index.js` has no database and no file writes, and it does not log request bodies (only error status and message). Standard hosting logs (access logs, platform logs) are outside this code and depend on where you deploy.
- **Browser storage** — History, stats and settings are stored in Chrome Storage (local). The optional custom Groq key is stored there too and is sent to the proxy in the `Authorization` header with each request, so it does leave the browser.
- **No analytics** — The extension and proxy contain no telemetry code.
- **Open source** — Full codebase visible and auditable

---

## ⚠️ Known Limitations

- **The shared secret is extractable.** The extension sends `X-DeHype-Key` to the proxy; the value lives in `scripts/config.js` inside the installed extension, so anyone with the package can read it. It deters casual abuse of the server's Groq key. It is not real authentication.
- **Data goes to Groq.** Everything you analyze leaves your machine (browser, proxy, Groq). Do not analyze pages with sensitive content.
- **Rate limiting is per IP.** Default is 60 requests per minute per IP (`RATE_LIMIT_MAX`). IPv6 clients can rotate addresses within their /64 and get fresh buckets. Users behind a shared NAT share a bucket. Behind a reverse proxy, set `TRUST_PROXY` to the number of hops (accepted: integer, `loopback`/IP list, `true`, `false`), otherwise all clients look like one IP; do not set it when exposed directly, since `X-Forwarded-For` would then be spoofable.
- **Request size is capped** at 200kb (`BODY_LIMIT`); longer content is rejected with 413. The page analyzer already truncates page text before sending.
- **CORS only limits browsers.** Non-browser clients ignore it; the shared secret and rate limit are the only guards for them.
- **Custom Groq key goes through the proxy** and still needs the shared secret.
- **Upstream calls** time out after 30 seconds with one retry. Clients get fixed error messages (`Upstream rate limited`, `Upstream error`); details stay in the server log.
- **Model output is not verified.** Credibility, sentiment and clickbait scores are LLM judgements and can be wrong.

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

*Built with ❤️ by [Swarnika](https://github.com/swarnika-cmd)*

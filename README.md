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
- **Context Menu Integration** — Right-click any selected text, page, or link to analyze instantly
- **Auto-Analyze Mode** — Automatically analyze pages as you browse
- **Analysis History** — Persistent history with timestamps, scores, and domains
- **Usage Statistics** — Track pages analyzed, clickbait caught, and time saved
- **Clipboard Export** — Copy formatted analysis results with one click
- **5 Independent Toggles** — Enable/disable each feature individually
- **Privacy First** — All data stored locally, your API key never leaves your browser

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Platform | Chrome Extension (Manifest V3) |
| AI Backend | Groq API — Llama 3.3 70B Versatile |
| Architecture | Service Worker + Content Scripts + Injected Scripts |
| Concurrency | Parallel `Promise.all()` — 6 simultaneous API calls per analysis |
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
│   ├── background.js            # Service worker — CORS proxy, context menus, auto-analyze
│   ├── content.js               # YouTube-specific analysis & title replacement
│   ├── page-analyzer.js         # Universal page analyzer (runs on all sites)
│   ├── analyzer-panel.css       # Floating panel styles
│   └── injected.js              # YouTube page-world script injection
└── README.md
```

---

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/swarnika-cmd/DeHype-Unveiling-the-truth-behind-.git
   ```

2. **Load in Chrome**
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode** (top right)
   - Click **"Load unpacked"** → select the project folder

3. **Configure API Key**
   - Click the DeHype Pro icon in the toolbar
   - Go to **Settings** tab
   - Paste your **Groq API Key** (free from [console.groq.com/keys](https://console.groq.com/keys))
   - Click **Save Key**

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
- Right-click a link → **"🔗 DeHype: Check Link Credibility"**

---

## ⚙️ Analysis Pipeline

Each analysis triggers **6 parallel AI calls** for maximum speed:

```
User clicks "Analyze"
        │
        ▼
   ┌─────────────────────────────────────────┐
   │          Promise.all() — Parallel       │
   ├─────────┬──────────┬──────────┬─────────┤
   │ Summary │   Tags   │ Insights │  Cred.  │
   │         │          │          │  Score  │
   ├─────────┼──────────┼──────────┼─────────┤
   │       Sentiment    │    Clickbait       │
   │       Analysis     │    Detection       │
   └─────────┴──────────┴──────────┴─────────┘
        │
        ▼
   Rendered in UI with animations
```

All requests go through the **background service worker** as a CORS proxy, keeping API keys secure and bypassing content security policies.

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

## 🔒 Privacy & Security

- **No external servers** — All processing via your personal Groq API key
- **Local storage only** — API key, history, and settings stored in Chrome Storage
- **No tracking** — Zero telemetry, analytics, or data collection
- **Open source** — Full codebase visible and auditable

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

*Built with ❤️ by [Swarnika](https://github.com/swarnika-cmd)*

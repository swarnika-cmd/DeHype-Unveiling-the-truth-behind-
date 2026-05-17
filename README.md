# DeHype Pro — AI Content Intelligence Engine 🚫✨🧠

> **Unveil the truth behind the hype. Everywhere.**

DeHype Pro is a **Chrome Extension** that uses AI (Google Gemini) to fight misinformation, clickbait, and manipulation across the entire web. Originally built to de-clickbait YouTube titles, it has evolved into a **full-spectrum AI content intelligence engine** — analyzing any webpage for credibility, sentiment, bias, and more.

---

## 🚀 Features

### 🎯 YouTube DeHype (Core)
- **Clickbait Detection**: Identifies sensationalist titles on YouTube videos
- **AI-Powered Summaries**: Uses Gemini to read transcripts and generate factual 1-sentence summaries
- **Title Replacement**: Swaps hype-filled titles with real, accurate answers
- **Bulk Title Scanner**: Scan all visible YouTube titles in your feed at once

### 📊 Smart Content Analysis (NEW — inspired by [SmartContent](https://github.com/prabhsharan1/smart-content))
- **Universal Page Analysis**: Analyze ANY webpage with a single click
- **AI Summaries**: Get concise, factual summaries of any content
- **Intelligent Tagging**: Auto-generate relevant topic tags
- **Smart Suggestions**: Receive AI-powered insights and recommendations
- **Floating Analysis Panel**: Beautiful slide-out panel on every webpage

### 🛡️ Credibility Scoring (NEW)
- **Trust Score (0-100)**: AI-powered credibility assessment of any article
- **Animated Score Ring**: Visual credibility indicator with gradient animation
- **Bias Detection**: Identifies emotional language, unsourced claims, and manipulation

### 💬 Sentiment Analysis (NEW)
- **Emotional Tone Detection**: Analyze whether content is positive, negative, or neutral
- **Manipulation Alerts**: Detect emotional manipulation tactics, false urgency, and sensationalism
- **Visual Sentiment Bar**: Color-coded sentiment indicator with animated marker

### ⚡ Advanced Features
- **Context Menu Integration**: Right-click any text → "DeHype: Analyze Selected Text"
- **Right-Click Page Analysis**: Analyze any page from the context menu
- **Auto-Analyze Mode**: Automatically analyze pages as you browse
- **Analysis History**: Track all your past analyses with timestamps
- **Usage Statistics**: See total pages analyzed, clickbait caught, and time saved
- **Clipboard Export**: Copy analysis results with one click
- **Privacy Focused**: All processing via your personal API key, stored locally

---

## 🛠️ Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/swarnika-cmd/DeHype-Unveiling-the-truth-behind-.git
   ```

2. **Open Chrome Extensions**:
   - Go to `chrome://extensions/` in your browser
   - Enable **Developer mode** (top right toggle)

3. **Load Unpacked**:
   - Click **"Load unpacked"**
   - Select the project folder

4. **Setup API Key**:
   - Click the DeHype Pro icon in your toolbar
   - Enter your **Gemini API Key** (Get one free from [Google AI Studio](https://aistudio.google.com/))
   - Click **"Save Key"**

---

## 📖 How to Use

### YouTube Mode
1. Go to any YouTube video
2. The floating DeHype panel appears in the bottom right
3. Click **"🎯 Analyze This Video"** to de-clickbait the title
4. Click **"📊 Scan All Titles"** to scan your feed
5. View clickbait score, sentiment analysis, and topic tags

### Universal Analysis Mode
1. Visit any webpage (news, blogs, articles, etc.)
2. Click the **floating DeHype button** (bottom right)
3. Click **"🔍 Analyze Page"** in the panel
4. Get instant AI-powered summary, credibility score, sentiment, tags, and insights

### Quick Analysis (Popup)
1. Click the DeHype Pro extension icon
2. Switch to the **"Analyze"** tab
3. Click **"Analyze Current Page"** or paste custom text
4. View comprehensive results with animated visualizations

### Right-Click Analysis
- Select any text → Right-click → **"🔍 DeHype: Analyze Selected Text"**
- Right-click any page → **"📊 DeHype: Analyze This Page"**
- Right-click any link → **"🔗 DeHype: Check Link Credibility"**

---

## 🔧 Technical Details

| Feature | Technology |
|---------|-----------|
| Extension Standard | Chrome Manifest V3 |
| AI Model | Google Gemini 2.0 Flash via REST API |
| Architecture | Service Worker + Content Scripts |
| Content Analysis | Parallel Promise.all() API calls |
| YouTube Integration | DOM scraping + `ytInitialPlayerResponse` |
| UI Framework | Vanilla JS + CSS with animations |
| Storage | Chrome Storage API (local) |
| Analysis Types | 6 parallel AI queries per analysis |

### Architecture
```
DeHype Pro v2.0
├── manifest.json              # Manifest V3 configuration
├── popup/
│   ├── popup.html             # Premium tabbed popup UI
│   ├── popup.css              # Dark-mode design system
│   └── popup.js               # Popup controller + analysis engine
├── scripts/
│   ├── background.js          # Service worker (CORS proxy, context menus, auto-analyze)
│   ├── content.js             # YouTube-specific analysis (DeHype core)
│   ├── page-analyzer.js       # Universal page analysis (SmartContent integration)
│   ├── analyzer-panel.css     # Floating panel styles
│   └── injected.js            # YouTube page world injection
└── README.md
```

### Analysis Pipeline
Each analysis runs **6 parallel Gemini API calls** for maximum speed:
1. **Summary Generation** — Factual content summary
2. **Tag Extraction** — Auto-generated topic tags
3. **Insight Suggestions** — AI-powered actionable insights
4. **Credibility Scoring** — Trust assessment (0-100)
5. **Sentiment Analysis** — Emotional tone detection
6. **Clickbait Detection** — Manipulation tactic identification

---

## 🎨 Design

- **Dark Mode UI** with glassmorphism effects
- **Gradient accents** (purple → cyan)
- **Animated score rings** and sentiment bars
- **Smooth micro-animations** throughout
- **Premium typography** with Inter font
- **Responsive floating panels** on all pages

---

## 📊 Feature Comparison

| Feature | DeHype v1.0 | DeHype Pro v2.0 |
|---------|-------------|-----------------|
| YouTube clickbait detection | ✅ | ✅ Enhanced |
| Title replacement | ✅ | ✅ Enhanced |
| Works on all websites | ❌ | ✅ |
| Content summarization | ❌ | ✅ |
| Smart tagging | ❌ | ✅ |
| AI suggestions | ❌ | ✅ |
| Credibility scoring | ❌ | ✅ |
| Sentiment analysis | ❌ | ✅ |
| Clickbait meter | ❌ | ✅ |
| Context menu integration | ❌ | ✅ |
| Auto-analyze mode | ❌ | ✅ |
| Analysis history | ❌ | ✅ |
| Usage statistics | ❌ | ✅ |
| Bulk title scanning | ❌ | ✅ |
| Premium dark UI | ❌ | ✅ |
| Feature toggles | ❌ | ✅ |

---

## 🙏 Acknowledgments

- **SmartContent** by [@prabhsharan1](https://github.com/prabhsharan1/smart-content) — Content analysis architecture inspiration
- **Google Gemini API** — AI backbone
- **Chrome Extensions Manifest V3** — Platform

---

## 🔒 Privacy

DeHype Pro processes content through Google's Gemini API using **your personal API key**. No data is stored on external servers. Your API key and analysis history are stored locally in Chrome Storage.

---

*Built with ❤️ by [Swarnika-cmd](https://github.com/swarnika-cmd)*

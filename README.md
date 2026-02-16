# DeHype - Clickbait Remover 🚫✨

**Unveil the truth behind the hype.**

DeHype is a Chrome Extension that uses AI (Google Gemini) to fight clickbait on YouTube. It automatically analyzes video transcripts and replaces sensationalized titles with factual, dry, and accurate summaries.

## 🚀 Features

*   **Clickbait Detection**: Identifies sensationalist titles on YouTube videos.
*   **AI-Powered Summaries**: Uses Gemini 1.5 Flash to read the transcript and generate a 1-sentence factual summary.
*   **Title Replacement**: Swaps the hype-filled title with the real answer.
*   **Privacy Focused**: Runs entirely in your browser. Your API key is stored locally.
*   **Robust Fetching**: Advanced transcript fetching that bypasses CORS restrictions and supports both XML and JSON formats.

## 🛠️ Installation

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/swarnika-cmd/DeHype-Unveiling-the-truth-behind-.git
    ```
2.  **Open Chrome Extensions**:
    *   Go to `chrome://extensions/` in your browser.
    *   Enable **Developer mode** (top right toggle).
3.  **Load Unpacked**:
    *   Click the **"Load unpacked"** button.
    *   Select the `DeHype project` folder (where you cloned this repo).
4.  **Setup API Key**:
    *   Click the DeHype extension icon in your toolbar.
    *   Enter your **Gemini API Key** (Get one from [Google AI Studio](https://aistudio.google.com/)).
    *   Click "Save Key".

## 📖 How to Use

1.  Go to any YouTube video.
2.  The extension will automatically show a "DeHype: Ready" badge in the bottom right.
3.  Click **"Fetch Transcript"** (or wait for auto-run in future versions).
4.  Watch as the clickbait title is replaced by a factual summary!

## 🔧 Technical Details

*   **Manifest V3**: Built on the latest Chrome Extension standards.
*   **Service Worker**: Uses a background service worker to proxy network requests and bypass CORS.
*   **Script Injection**: Injects a secure agent into the YouTube page "Main World" to access internal player API data (`ytInitialPlayerResponse`).
*   **AI Model**: Google Gemini 1.5 Flash via REST API.

---
*Built with ❤️ by [Swarnika-cmd]*

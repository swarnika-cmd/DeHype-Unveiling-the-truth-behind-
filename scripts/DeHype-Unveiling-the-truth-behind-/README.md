# DeHype - Clickbait Remover 🚫✨

**Unveil the truth behind the hype.**

DeHype is a Chrome Extension that uses AI (Google Gemini) to fight clickbait on YouTube. It automatically identifies sensationalized video titles and replaces them with factual, dry, and accurate summaries extracted from the video transcript.

---

## 🚀 Features

*   **Zero Clickbait**: Replaces "You Won't Believe This!" titles with the actual answer (e.g., "The answer is X").
*   **AI-Powered**: Uses **Google Gemini 1.5 Flash** to analyze video transcripts in real-time.
*   **Privacy First**: Your API key is stored locally in your browser.
*   **Smart UI Automation**: Automatically interacts with the YouTube UI to find and read transcripts even when API access is restricted.
*   **CORS Bypass**: Uses a secure background service worker to communicate with the Gemini API, ensuring reliable functionality.

## 🛠️ Installation

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/swarnika-cmd/DeHype-Unveiling-the-truth-behind-.git
    ```
2.  **Open Chrome Extensions**:
    *   Navigate to `chrome://extensions/` in your browser address bar.
    *   Enable **Developer mode** (toggle in the top right corner).
3.  **Load Unpacked**:
    *   Click the **"Load unpacked"** button.
    *   Select the `DeHype project` folder (the directory containing `manifest.json`).
4.  **Configure API Key**:
    *   Click the **DeHype extension icon** in your browser toolbar.
    *   Enter your **Gemini API Key**.
        *   *No key? Get one for free from [Google AI Studio](https://aistudio.google.com/).*
    *   Click **"Save Key"**.

## 📖 How to Use

1.  Navigate to any YouTube video.
2.  Look for the **"DeHype: Ready"** status badge in the bottom right corner of the screen.
3.  Click the **"Fetch Transcript"** button on the badge.
    *   *The extension will automatically open the transcript panel, read the text, and send it to Gemini.*
4.  Watch the magic! ✨
    *   The video title will be replaced with a summary (e.g., *"✨ The secret ingredient is vinegar"*).
    *   The browser tab title is also updated for easier navigation.

## 🔧 Technical Details

*   **Manifest V3**: Compliant with the latest secure extension standards.
*   **Background Proxy**: `background.js` handles all external API calls to `generativelanguage.googleapis.com`, bypassing Content Security Policy (CSP) and CORS restrictions on the YouTube page.
*   **DOM Scraping**: Robustly navigates the YouTube DOM (Shadow DOM aware) to extract transcript data without relying on unstable internal APIs.
*   **Tech Stack**: JavaScript (Vanilla), Chrome Extension API, HTML/CSS.

---
*Built with ❤️ by [Swarnika-cmd]*

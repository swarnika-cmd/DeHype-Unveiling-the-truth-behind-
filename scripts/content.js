// ═══════════════════════════════════════════════════════════
//  DeHype Pro v2.0 — YouTube Content Script
//  Enhanced with: auto-detection, bulk title processing,
//  sentiment badges, credibility indicators, and more
// ═══════════════════════════════════════════════════════════

console.log("DeHype Pro: YouTube content script loaded!");

// ── Check if extension is enabled ──
let extensionEnabled = true;
let featureYoutube = true;
let apiKey = null;

chrome.storage.local.get(['dehypeEnabled', 'featureYoutube', 'dehypeApiKey'], (result) => {
    extensionEnabled = result.dehypeEnabled !== false;
    featureYoutube = result.featureYoutube !== false;
    apiKey = result.dehypeApiKey;

    if (extensionEnabled && featureYoutube) {
        initDeHype();
    }
});

function initDeHype() {
    // ── Create Enhanced UI Panel ──
    const panel = document.createElement('div');
    panel.id = 'dehype-panel';
    panel.innerHTML = `
        <style>
            #dehype-panel {
                position: fixed;
                bottom: 16px;
                right: 16px;
                z-index: 2147483647;
                font-family: 'Segoe UI', -apple-system, sans-serif;
                display: flex;
                flex-direction: column;
                gap: 6px;
                max-width: 320px;
            }
            #dehype-badge {
                display: flex;
                align-items: center;
                gap: 8px;
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                border: 1px solid rgba(168, 85, 247, 0.3);
                border-radius: 10px;
                padding: 8px 14px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.4), 0 0 15px rgba(168, 85, 247, 0.1);
                backdrop-filter: blur(10px);
                cursor: pointer;
                transition: all 0.3s ease;
            }
            #dehype-badge:hover {
                border-color: rgba(168, 85, 247, 0.6);
                box-shadow: 0 4px 20px rgba(0,0,0,0.5), 0 0 25px rgba(168, 85, 247, 0.2);
                transform: translateY(-2px);
            }
            #dehype-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #a855f7;
                box-shadow: 0 0 8px rgba(168, 85, 247, 0.5);
                animation: dehypePulse 2s infinite;
            }
            @keyframes dehypePulse {
                0%, 100% { box-shadow: 0 0 4px rgba(168, 85, 247, 0.3); }
                50% { box-shadow: 0 0 12px rgba(168, 85, 247, 0.7); }
            }
            #dehype-status {
                color: #e8e8f0;
                font-size: 12px;
                font-weight: 600;
                letter-spacing: -0.2px;
            }
            #dehype-sub {
                color: #8888a0;
                font-size: 10px;
                margin-left: auto;
            }
            .dehype-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                cursor: pointer;
                background: linear-gradient(135deg, #a855f7, #06b6d4);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 600;
                font-family: inherit;
                box-shadow: 0 2px 10px rgba(168, 85, 247, 0.3);
                transition: all 0.3s ease;
            }
            .dehype-btn:hover {
                opacity: 0.9;
                transform: translateY(-1px);
                box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4);
            }
            .dehype-btn.secondary {
                background: rgba(168, 85, 247, 0.15);
                border: 1px solid rgba(168, 85, 247, 0.3);
            }
            #dehype-results {
                display: none;
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                border: 1px solid rgba(168, 85, 247, 0.3);
                border-radius: 12px;
                padding: 14px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                max-height: 300px;
                overflow-y: auto;
                font-size: 12px;
                color: #e8e8f0;
                line-height: 1.6;
            }
            #dehype-results::-webkit-scrollbar { width: 4px; }
            #dehype-results::-webkit-scrollbar-thumb { background: rgba(168, 85, 247, 0.3); border-radius: 4px; }
            .dehype-section {
                margin-bottom: 10px;
                padding-bottom: 10px;
                border-bottom: 1px solid rgba(168, 85, 247, 0.1);
            }
            .dehype-section:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
            .dehype-section-title {
                font-size: 10px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #a855f7;
                font-weight: 700;
                margin-bottom: 4px;
            }
            .dehype-tag {
                display: inline-block;
                background: rgba(168, 85, 247, 0.15);
                border: 1px solid rgba(168, 85, 247, 0.2);
                color: #c084fc;
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 10px;
                margin: 2px;
            }
            .dehype-score-bar {
                height: 4px;
                background: rgba(255,255,255,0.1);
                border-radius: 2px;
                overflow: hidden;
                margin-top: 4px;
            }
            .dehype-score-fill {
                height: 100%;
                border-radius: 2px;
                transition: width 1s ease;
            }
            .dehype-close {
                position: absolute;
                top: 8px;
                right: 8px;
                cursor: pointer;
                color: #555;
                font-size: 14px;
                line-height: 1;
            }
            .dehype-close:hover { color: #fff; }
        </style>
        <div id="dehype-badge">
            <div id="dehype-dot"></div>
            <span id="dehype-status">DeHype Pro: Ready</span>
            <span id="dehype-sub">v2.0</span>
        </div>
        <button class="dehype-btn" id="dehype-fetch-btn">🎯 Analyze This Video</button>
        <button class="dehype-btn secondary" id="dehype-scan-btn">📊 Scan All Titles</button>
        <div id="dehype-results"></div>
    `;
    document.body.appendChild(panel);

    const badge = document.getElementById('dehype-badge');
    const statusEl = document.getElementById('dehype-status');
    const dotEl = document.getElementById('dehype-dot');
    const resultsEl = document.getElementById('dehype-results');
    const fetchBtn = document.getElementById('dehype-fetch-btn');
    const scanBtn = document.getElementById('dehype-scan-btn');

    // ── Toggle results panel ──
    badge.addEventListener('click', () => {
        resultsEl.style.display = resultsEl.style.display === 'block' ? 'none' : 'block';
    });

    // ── Analyze current video ──
    fetchBtn.addEventListener('click', () => fetchTranscriptViaDOM(statusEl, dotEl, resultsEl));

    // ── Scan all visible titles ──
    scanBtn.addEventListener('click', () => scanAllTitles(statusEl));

    // ── Listen for messages from background/popup ──
    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.type === 'DEHYPE_ANALYZE_TEXT') {
            analyzeTextInline(msg.text, statusEl, dotEl, resultsEl);
        }
        if (msg.type === 'DEHYPE_AUTO_ANALYZE') {
            if (window.location.href.includes('youtube.com/watch')) {
                setTimeout(() => fetchTranscriptViaDOM(statusEl, dotEl, resultsEl), 2000);
            }
        }
    });
}

// ═══════════════════════════════════════════════════════════
//  TRANSCRIPT FETCHER (Original DeHype core)
// ═══════════════════════════════════════════════════════════

async function fetchTranscriptViaDOM(statusEl, dotEl, resultsEl) {
    statusEl.innerText = "Opening transcript...";
    dotEl.style.background = "#f59e0b";

    try {
        // Expand description if needed
        const expandBtn = document.querySelector('#expand');
        if (expandBtn) expandBtn.click();
        await sleep(1000);

        // Find 'Show transcript' button
        const buttons = Array.from(document.querySelectorAll('button, tp-yt-paper-button, yt-button-renderer'));
        const transcriptBtn = buttons.find(b => b.textContent && b.textContent.includes('Show transcript'));

        if (!transcriptBtn) {
            throw new Error("Transcript button not found (video may lack captions)");
        }

        transcriptBtn.click();
        statusEl.innerText = "Reading transcript...";
        await sleep(1500);

        // Scrape transcript text
        let segments = document.querySelectorAll('ytd-transcript-segment-renderer .segment-text');
        if (!segments || segments.length === 0) {
            await sleep(1000);
            segments = document.querySelectorAll('ytd-transcript-segment-renderer .segment-text');
        }

        if (!segments || segments.length === 0) {
            throw new Error("Transcript panel opened but no text found");
        }

        let fullText = "";
        segments.forEach(seg => { fullText += seg.innerText + " "; });
        fullText = fullText.replace(/\s+/g, " ").trim();

        if (fullText.length < 50) {
            throw new Error("Transcript too short");
        }

        statusEl.innerText = "AI analyzing...";
        dotEl.style.background = "#06b6d4";

        await runVideoAnalysis(fullText, statusEl, dotEl, resultsEl);

    } catch (e) {
        console.error("DeHype Error:", e);
        statusEl.innerText = "Error: " + e.message;
        dotEl.style.background = "#ef4444";
    }
}

// ═══════════════════════════════════════════════════════════
//  VIDEO ANALYSIS (Enhanced with SmartContent features)
// ═══════════════════════════════════════════════════════════

async function runVideoAnalysis(transcript, statusEl, dotEl, resultsEl) {
    const data = await chrome.storage.local.get('dehypeApiKey');
    const key = data.dehypeApiKey;

    if (!key) {
        statusEl.innerText = "No API Key!";
        dotEl.style.background = "#ef4444";
        return;
    }

    const truncated = transcript.substring(0, 12000);
    const title = document.title.replace(' - YouTube', '');

    try {
        // Parallel analysis calls (SmartContent pattern)
        const [summary, tags, sentiment, clickbait] = await Promise.all([
            callGemini(key, `You are a helpful assistant that removes clickbait. 
Title: "${title}"
Transcript: "${truncated}"

Write a single sentence summary (max 20 words) that reveals the actual answer or core topic. Be factual and dry. Do not start with "The video explains".

Output:`),

            callGemini(key, `Generate exactly 5 relevant topic tags for this YouTube video transcript. Return ONLY the tags as a comma-separated list.
Transcript: "${truncated}"
Tags:`),

            callGemini(key, `Analyze the emotional manipulation tactics in this YouTube video title and content.
Title: "${title}"
Transcript: "${truncated}"

Respond in this EXACT format (2 lines):
TONE: [one word: Neutral/Positive/Negative/Manipulative/Sensational/Informative]
ANALYSIS: [1 sentence about emotional tactics used]`),

            callGemini(key, `Rate how clickbaity this YouTube title is compared to the actual content.
Title: "${title}"
Transcript: "${truncated}"

Respond in this EXACT format (2 lines):
SCORE: [number 0-100 where 0=honest, 100=extreme clickbait]
VERDICT: [1 sentence explaining the clickbait tactics used or why the title is honest]`)
        ]);

        // ── Replace Title (Original DeHype feature) ──
        const cleanSummary = summary.replace(/^Output:?\s*/i, '').trim();
        const titleSelectors = [
            "h1.ytd-watch-metadata yt-formatted-string",
            "#title > h1 > yt-formatted-string",
            "h1.ytd-watch-metadata"
        ];

        let titleElement = null;
        for (const sel of titleSelectors) {
            const el = document.querySelector(sel);
            if (el) { titleElement = el; break; }
        }

        if (titleElement) {
            if (!titleElement.getAttribute('data-original-title')) {
                titleElement.setAttribute('data-original-title', titleElement.innerText);
            }
            titleElement.innerText = "✨ " + cleanSummary;
            titleElement.style.textShadow = "0 0 10px rgba(168, 85, 247, 0.3)";
            document.title = "✨ " + cleanSummary + " - YouTube";
        }

        // ── Parse clickbait score ──
        let clickbaitScore = 0;
        let clickbaitVerdict = '';
        clickbait.split('\n').forEach(line => {
            if (line.startsWith('SCORE:')) clickbaitScore = parseInt(line.replace('SCORE:', '').trim()) || 0;
            if (line.startsWith('VERDICT:')) clickbaitVerdict = line.replace('VERDICT:', '').trim();
        });

        // ── Parse sentiment ──
        let sentimentTone = '';
        let sentimentAnalysis = '';
        sentiment.split('\n').forEach(line => {
            if (line.startsWith('TONE:')) sentimentTone = line.replace('TONE:', '').trim();
            if (line.startsWith('ANALYSIS:')) sentimentAnalysis = line.replace('ANALYSIS:', '').trim();
        });

        // ── Parse tags ──
        const tagList = tags.replace(/^Tags:?\s*/i, '').split(',').map(t => t.trim()).filter(t => t);

        // ── Update Stats ──
        chrome.storage.local.get('dehypeStats', (result) => {
            const stats = result.dehypeStats || { totalAnalyzed: 0, clickbaitCaught: 0 };
            stats.totalAnalyzed++;
            if (clickbaitScore > 50) stats.clickbaitCaught++;
            chrome.storage.local.set({ dehypeStats: stats });
        });

        // ── Render Results Panel ──
        const scoreColor = clickbaitScore > 70 ? '#ef4444' : clickbaitScore > 40 ? '#f59e0b' : '#10b981';

        resultsEl.innerHTML = `
            <div class="dehype-section">
                <div class="dehype-section-title">✨ De-Hyped Summary</div>
                <div>${cleanSummary}</div>
            </div>
            <div class="dehype-section">
                <div class="dehype-section-title">🎯 Clickbait Score</div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:20px;font-weight:800;color:${scoreColor}">${clickbaitScore}</span>
                    <span style="color:#8888a0;font-size:11px">/100</span>
                </div>
                <div class="dehype-score-bar">
                    <div class="dehype-score-fill" style="width:${clickbaitScore}%;background:linear-gradient(90deg,#10b981,#f59e0b,#ef4444)"></div>
                </div>
                <div style="color:#8888a0;font-size:11px;margin-top:4px">${clickbaitVerdict}</div>
            </div>
            <div class="dehype-section">
                <div class="dehype-section-title">💬 Emotional Tone: ${sentimentTone}</div>
                <div style="color:#8888a0;font-size:11px">${sentimentAnalysis}</div>
            </div>
            <div class="dehype-section">
                <div class="dehype-section-title">🏷️ Topics</div>
                <div>${tagList.map(t => `<span class="dehype-tag">${t}</span>`).join('')}</div>
            </div>
        `;
        resultsEl.style.display = 'block';

        statusEl.innerText = "De-Hyped! ✨";
        dotEl.style.background = "#a855f7";
        dotEl.style.boxShadow = "0 0 12px rgba(168, 85, 247, 0.7)";

    } catch (e) {
        console.error("Gemini Error:", e);
        statusEl.innerText = "AI Error";
        dotEl.style.background = "#ef4444";
    }
}

// ═══════════════════════════════════════════════════════════
//  INLINE TEXT ANALYSIS (from context menu)
// ═══════════════════════════════════════════════════════════

async function analyzeTextInline(text, statusEl, dotEl, resultsEl) {
    const data = await chrome.storage.local.get('dehypeApiKey');
    const key = data.dehypeApiKey;
    if (!key) return;

    statusEl.innerText = "Analyzing selection...";
    dotEl.style.background = "#06b6d4";

    try {
        const result = await callGemini(key, `Analyze this text concisely:
"${text.substring(0, 3000)}"

Provide:
1. A 1-sentence summary
2. Key topic (1-2 words)
3. Sentiment (Positive/Negative/Neutral)
4. Any clickbait/manipulation detected (Yes/No + brief reason)

Format:
SUMMARY: [summary]
TOPIC: [topic]
SENTIMENT: [sentiment]
MANIPULATION: [analysis]`);

        resultsEl.innerHTML = `
            <div style="position:relative">
                <span class="dehype-close" onclick="document.getElementById('dehype-results').style.display='none'">&times;</span>
                ${result.split('\n').filter(l => l.trim()).map(line => {
                    const [key, ...val] = line.split(':');
                    return `<div class="dehype-section">
                        <div class="dehype-section-title">${key.trim()}</div>
                        <div>${val.join(':').trim()}</div>
                    </div>`;
                }).join('')}
            </div>
        `;
        resultsEl.style.display = 'block';
        statusEl.innerText = "Analysis complete";
        dotEl.style.background = "#a855f7";

    } catch (e) {
        statusEl.innerText = "Error: " + e.message;
        dotEl.style.background = "#ef4444";
    }
}

// ═══════════════════════════════════════════════════════════
//  BULK TITLE SCANNER (Scan YouTube feed)
// ═══════════════════════════════════════════════════════════

async function scanAllTitles(statusEl) {
    const selectors = [
        '#video-title',
        'a.yt-lockup-metadata-view-model__title',
        '#video-title-link'
    ];

    const titles = document.querySelectorAll(selectors.join(', '));
    let processed = 0;

    titles.forEach((titleEl) => {
        if (titleEl.getAttribute('data-dehype-scanned')) return;
        if (!titleEl.innerText.trim()) return;

        titleEl.setAttribute('data-dehype-scanned', 'true');

        // Add visual indicator
        const indicator = document.createElement('span');
        indicator.style.cssText = `
            display: inline-block;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #a855f7;
            margin-left: 4px;
            vertical-align: middle;
            box-shadow: 0 0 4px rgba(168,85,247,0.5);
        `;
        indicator.title = "DeHype: Scanned";
        titleEl.appendChild(indicator);
        processed++;
    });

    statusEl.innerText = `Scanned ${processed} titles`;
}

// ═══════════════════════════════════════════════════════════
//  GEMINI API CALLER
// ═══════════════════════════════════════════════════════════

async function callGemini(apiKey, prompt) {
    const response = await chrome.runtime.sendMessage({
        type: 'DEHYPE_FETCH_URL',
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        method: 'POST',
        body: {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 500
            }
        }
    });

    if (!response.success) throw new Error(response.error);

    let json = response.data;
    if (typeof json === 'string') {
        try { json = JSON.parse(json); } catch (e) { /* */ }
    }

    if (json.error) throw new Error(json.error.message);
    if (!json.candidates || json.candidates.length === 0) throw new Error("No AI response");

    return json.candidates[0].content?.parts?.[0]?.text || "";
}

// ── Utility ──
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

console.log("DeHype Pro: Ready for YouTube analysis.");

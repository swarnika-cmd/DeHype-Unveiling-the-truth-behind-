// ═══════════════════════════════════════════════════════════
//  DeHype Pro v2.0 — Universal Page Analyzer
//  Runs on ALL pages (from SmartContent integration)
//  Provides: floating analysis panel, right-click analysis,
//  auto-analysis, and content intelligence
// ═══════════════════════════════════════════════════════════

// Don't run on YouTube (handled by content.js)
if (window.location.hostname.includes('youtube.com')) {
    // YouTube is handled by the dedicated content.js
} else {
    initPageAnalyzer();
}

function initPageAnalyzer() {
    let isEnabled = true;
    let featureAnalysis = true;

    chrome.storage.local.get(['dehypeEnabled', 'featureAnalysis'], (result) => {
        isEnabled = result.dehypeEnabled !== false;
        featureAnalysis = result.featureAnalysis !== false;

        if (isEnabled && featureAnalysis) {
            createFloatingButton();
        }
    });

    // Listen for messages from background/popup
    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.type === 'DEHYPE_ANALYZE_PAGE') {
            analyzeCurrentPage();
        }
        if (msg.type === 'DEHYPE_ANALYZE_TEXT' && msg.text) {
            analyzeSelectedText(msg.text);
        }
        if (msg.type === 'DEHYPE_ANALYZE_LINK' && msg.url) {
            showNotification(`🔗 Link analysis requested for: ${msg.url}`, 'info');
        }
        if (msg.type === 'DEHYPE_AUTO_ANALYZE') {
            analyzeCurrentPage();
        }
    });
}

// ═══════════════════════════════════════════════════════════
//  FLOATING ANALYSIS BUTTON
// ═══════════════════════════════════════════════════════════

function createFloatingButton() {
    const fab = document.createElement('div');
    fab.id = 'dehype-fab';
    fab.innerHTML = `
        <div id="dehype-fab-btn" title="DeHype Pro — Analyze this page">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="url(#fabGrad1)"/>
                <path d="M2 17l10 5 10-5" stroke="url(#fabGrad2)" stroke-width="2" fill="none"/>
                <path d="M2 12l10 5 10-5" stroke="url(#fabGrad3)" stroke-width="2" fill="none"/>
                <defs>
                    <linearGradient id="fabGrad1" x1="2" y1="2" x2="22" y2="12">
                        <stop offset="0%" stop-color="#a855f7"/>
                        <stop offset="100%" stop-color="#06b6d4"/>
                    </linearGradient>
                    <linearGradient id="fabGrad2" x1="2" y1="17" x2="22" y2="22">
                        <stop offset="0%" stop-color="#a855f7"/>
                        <stop offset="100%" stop-color="#06b6d4"/>
                    </linearGradient>
                    <linearGradient id="fabGrad3" x1="2" y1="12" x2="22" y2="17">
                        <stop offset="0%" stop-color="#a855f7"/>
                        <stop offset="100%" stop-color="#06b6d4"/>
                    </linearGradient>
                </defs>
            </svg>
        </div>
        <div id="dehype-analysis-panel">
            <div class="dehype-ap-header">
                <div class="dehype-ap-title">
                    <span class="dehype-ap-brand">DeHype Pro</span>
                    <span class="dehype-ap-badge">AI</span>
                </div>
                <button id="dehype-ap-close">&times;</button>
            </div>
            <div id="dehype-ap-content">
                <div class="dehype-ap-empty">
                    <p>Click "Analyze" to get AI insights about this page</p>
                </div>
            </div>
            <div class="dehype-ap-actions">
                <button id="dehype-ap-analyze" class="dehype-ap-btn primary">
                    🔍 Analyze Page
                </button>
                <button id="dehype-ap-copy" class="dehype-ap-btn secondary">
                    📋 Copy
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(fab);

    // Toggle panel
    const fabBtn = document.getElementById('dehype-fab-btn');
    const panel = document.getElementById('dehype-analysis-panel');
    const closeBtn = document.getElementById('dehype-ap-close');
    const analyzeBtn = document.getElementById('dehype-ap-analyze');
    const copyBtn = document.getElementById('dehype-ap-copy');

    fabBtn.addEventListener('click', () => {
        panel.classList.toggle('visible');
    });

    closeBtn.addEventListener('click', () => {
        panel.classList.remove('visible');
    });

    analyzeBtn.addEventListener('click', () => {
        analyzeCurrentPage();
    });

    copyBtn.addEventListener('click', () => {
        const content = document.getElementById('dehype-ap-content').innerText;
        navigator.clipboard.writeText(content).then(() => {
            copyBtn.textContent = '✓ Copied!';
            setTimeout(() => { copyBtn.textContent = '📋 Copy'; }, 2000);
        });
    });
}

// ═══════════════════════════════════════════════════════════
//  PAGE ANALYSIS
// ═══════════════════════════════════════════════════════════

async function analyzeCurrentPage() {
    const contentArea = document.getElementById('dehype-ap-content');
    const panel = document.getElementById('dehype-analysis-panel');

    if (panel) panel.classList.add('visible');

    if (contentArea) {
        contentArea.innerHTML = `
            <div class="dehype-ap-loading">
                <div class="dehype-ap-spinner"></div>
                <p>AI is analyzing this page...</p>
            </div>
        `;
    }

    const data = await chrome.storage.local.get(['dehypeApiKey', 'featureCredibility', 'featureSentiment']);
    const apiKey = data.dehypeApiKey;

    if (!apiKey) {
        if (contentArea) {
            contentArea.innerHTML = `<div class="dehype-ap-error">⚠️ No API key. Open DeHype popup → Settings → Save your Groq API Key.</div>`;
        }
        return;
    }

    // Extract page content
    const pageTitle = document.title;
    const pageUrl = window.location.href;
    const pageContent = document.body.innerText.substring(0, 8000);
    const metaDesc = document.querySelector('meta[name="description"]')?.content || '';

    try {
        // Run analyses in parallel
        const analyses = [
            callGroqFromContent(apiKey, buildPageSummaryPrompt(pageContent, pageTitle)),
            callGroqFromContent(apiKey, buildPageTagsPrompt(pageContent)),
            callGroqFromContent(apiKey, buildPageSuggestionsPrompt(pageContent, pageTitle))
        ];

        // Conditionally add credibility & sentiment
        if (data.featureCredibility !== false) {
            analyses.push(callGroqFromContent(apiKey, buildPageCredibilityPrompt(pageContent, pageTitle, pageUrl)));
        }
        if (data.featureSentiment !== false) {
            analyses.push(callGroqFromContent(apiKey, buildPageSentimentPrompt(pageContent, pageTitle)));
        }

        const results = await Promise.all(analyses);

        const [summary, tags, suggestions] = results;
        const credibility = results[3] || null;
        const sentiment = results[4] || null;

        // Parse tags
        const tagList = tags.replace(/^Tags:?\s*/i, '').split(',').map(t => t.trim()).filter(t => t);

        // Parse suggestions
        const suggestionList = suggestions.split('\n')
            .map(s => s.replace(/^[-•*]\s*/, '').trim())
            .filter(s => s.length > 5);

        // Parse credibility
        let credScore = 0, credLabel = '', credExplanation = '';
        if (credibility) {
            credibility.split('\n').forEach(line => {
                if (line.startsWith('SCORE:')) credScore = parseInt(line.replace('SCORE:', '').trim()) || 0;
                if (line.startsWith('LABEL:')) credLabel = line.replace('LABEL:', '').trim();
                if (line.startsWith('EXPLANATION:')) credExplanation = line.replace('EXPLANATION:', '').trim();
            });
        }

        // Parse sentiment
        let sentScore = 50, sentAnalysis = '';
        if (sentiment) {
            sentiment.split('\n').forEach(line => {
                if (line.startsWith('SCORE:')) sentScore = parseInt(line.replace('SCORE:', '').trim()) || 50;
                if (line.startsWith('ANALYSIS:')) sentAnalysis = line.replace('ANALYSIS:', '').trim();
            });
        }

        // Render
        const credScoreColor = credScore >= 70 ? '#10b981' : credScore >= 40 ? '#f59e0b' : '#ef4444';

        if (contentArea) {
            contentArea.innerHTML = `
                <div class="dehype-ap-section">
                    <div class="dehype-ap-section-title">📝 Summary</div>
                    <div class="dehype-ap-text">${summary.replace(/^Summary:?\s*/i, '').trim()}</div>
                </div>
                ${credibility ? `
                <div class="dehype-ap-section">
                    <div class="dehype-ap-section-title">🛡️ Credibility</div>
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                        <span style="font-size:22px;font-weight:800;color:${credScoreColor}">${credScore}</span>
                        <span style="color:#8888a0;font-size:12px">/100 — ${credLabel}</span>
                    </div>
                    <div class="dehype-ap-bar">
                        <div class="dehype-ap-bar-fill" style="width:${credScore}%;background:${credScoreColor}"></div>
                    </div>
                    <div class="dehype-ap-sub">${credExplanation}</div>
                </div>` : ''}
                ${sentiment ? `
                <div class="dehype-ap-section">
                    <div class="dehype-ap-section-title">💬 Sentiment</div>
                    <div class="dehype-ap-sentiment-bar">
                        <div class="dehype-ap-sentiment-track"></div>
                        <div class="dehype-ap-sentiment-dot" style="left:${sentScore}%"></div>
                    </div>
                    <div class="dehype-ap-sub">${sentAnalysis}</div>
                </div>` : ''}
                <div class="dehype-ap-section">
                    <div class="dehype-ap-section-title">🏷️ Topics</div>
                    <div class="dehype-ap-tags">${tagList.map(t => `<span class="dehype-ap-tag">${t}</span>`).join('')}</div>
                </div>
                <div class="dehype-ap-section">
                    <div class="dehype-ap-section-title">💡 Insights</div>
                    <ul class="dehype-ap-suggestions">${suggestionList.map(s => `<li>${s}</li>`).join('')}</ul>
                </div>
            `;
        }

        // Save to history
        chrome.storage.local.get('dehypeHistory', (result) => {
            const history = result.dehypeHistory || [];
            history.unshift({
                title: pageTitle,
                url: pageUrl,
                timestamp: Date.now(),
                credibility: credScore,
                summary: summary.substring(0, 100)
            });
            chrome.storage.local.set({ dehypeHistory: history.slice(0, 50) });
        });

        // Update stats
        chrome.storage.local.get('dehypeStats', (result) => {
            const stats = result.dehypeStats || { totalAnalyzed: 0, clickbaitCaught: 0 };
            stats.totalAnalyzed++;
            chrome.storage.local.set({ dehypeStats: stats });
        });

    } catch (e) {
        if (contentArea) {
            contentArea.innerHTML = `<div class="dehype-ap-error">❌ Analysis failed: ${e.message}</div>`;
        }
    }
}

// ═══════════════════════════════════════════════════════════
//  SELECTED TEXT ANALYSIS
// ═══════════════════════════════════════════════════════════

async function analyzeSelectedText(text) {
    const contentArea = document.getElementById('dehype-ap-content');
    const panel = document.getElementById('dehype-analysis-panel');

    if (panel) panel.classList.add('visible');

    if (contentArea) {
        contentArea.innerHTML = `
            <div class="dehype-ap-loading">
                <div class="dehype-ap-spinner"></div>
                <p>Analyzing selected text...</p>
            </div>
        `;
    }

    const data = await chrome.storage.local.get('dehypeApiKey');
    const apiKey = data.dehypeApiKey;

    if (!apiKey) {
        if (contentArea) {
            contentArea.innerHTML = `<div class="dehype-ap-error">⚠️ No API key configured.</div>`;
        }
        return;
    }

    try {
        const result = await callGroqFromContent(apiKey, `Analyze this text:
"${text.substring(0, 5000)}"

Provide a concise analysis with:
1. One-line summary
2. Key topic
3. Sentiment (Positive/Negative/Neutral)
4. Credibility assessment (if applicable)
5. Any bias or manipulation detected

Format each on its own line with a label.`);

        if (contentArea) {
            contentArea.innerHTML = `
                <div class="dehype-ap-section">
                    <div class="dehype-ap-section-title">📝 Selected Text Analysis</div>
                    <div class="dehype-ap-text" style="white-space:pre-line">${result}</div>
                </div>
            `;
        }
    } catch (e) {
        if (contentArea) {
            contentArea.innerHTML = `<div class="dehype-ap-error">❌ ${e.message}</div>`;
        }
    }
}

// ═══════════════════════════════════════════════════════════
//  PROMPTS
// ═══════════════════════════════════════════════════════════

function buildPageSummaryPrompt(content, title) {
    return `Provide a concise, factual summary (3-4 sentences) of this webpage content. Be objective.
Title: "${title}"
Content: "${content}"
Summary:`;
}

function buildPageTagsPrompt(content) {
    return `Generate exactly 6 relevant topic tags for this content. Return ONLY tags as comma-separated list.
Content: "${content}"
Tags:`;
}

function buildPageSuggestionsPrompt(content, title) {
    return `Based on this content, provide 3 actionable insights or suggestions. Each on a new line starting with a dash (-).
Title: "${title}"
Content: "${content}"
Suggestions:`;
}

function buildPageCredibilityPrompt(content, title, url) {
    return `Analyze this content for credibility.
Title: "${title}"
URL: "${url}"
Content: "${content}"

Respond in EXACT format (3 lines):
SCORE: [0-100]
LABEL: [Very Low|Low|Moderate|High|Very High]
EXPLANATION: [1 sentence]`;
}

function buildPageSentimentPrompt(content, title) {
    return `Analyze emotional tone of this content.
Title: "${title}"
Content: "${content}"

Respond in EXACT format (2 lines):
SCORE: [0-100, 0=negative, 50=neutral, 100=positive]
ANALYSIS: [1 sentence about tone and any manipulation]`;
}

// ═══════════════════════════════════════════════════════════
//  GROQ API
// ═══════════════════════════════════════════════════════════

async function callGroqFromContent(apiKey, prompt) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
            type: 'DEHYPE_FETCH_URL',
            url: 'https://api.groq.com/openai/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: {
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
                max_tokens: 500
            }
        }, (response) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            if (!response || !response.success) {
                reject(new Error(response?.error || 'Unknown error'));
                return;
            }

            let json = response.data;
            if (typeof json === 'string') {
                try { json = JSON.parse(json); } catch (e) { /* */ }
            }

            if (json.error) { reject(new Error(json.error.message || JSON.stringify(json.error))); return; }
            if (!json.choices || json.choices.length === 0) { reject(new Error("No AI response")); return; }

            resolve(json.choices[0].message?.content || "");
        });
    });
}

// ── Notification Helper ──
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top: 16px; right: 16px; z-index: 2147483647;
        padding: 12px 18px; border-radius: 10px;
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border: 1px solid rgba(168, 85, 247, 0.3);
        color: #e8e8f0; font-size: 13px; font-family: 'Segoe UI', sans-serif;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        animation: dehypeSlideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

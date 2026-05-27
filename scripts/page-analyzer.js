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

    const storage = await chrome.storage.local.get(['dehypeApiKey', 'dehypeProxyUrl', 'featureCredibility', 'featureSentiment']);
    const apiKey = storage.dehypeApiKey;
    const proxyUrl = storage.dehypeProxyUrl || 'http://localhost:3000';

    // Extract page content
    const pageTitle = document.title;
    const pageUrl = window.location.href;
    const pageContent = document.body.innerText.substring(0, 8000);

    try {
        const response = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                type: 'DEHYPE_ANALYZE_REQUEST',
                url: `${proxyUrl}/api/analyze`,
                body: {
                    content: pageContent,
                    title: pageTitle,
                    url: pageUrl,
                    type: 'page'
                },
                customKey: apiKey
            }, (res) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(res);
                }
            });
        });

        if (!response || !response.success) {
            throw new Error(response?.error || 'Failed to get analysis from proxy.');
        }

        const result = response.data;

        // Parse tags
        const tagList = Array.isArray(result.tags) ? result.tags : [];

        // Parse suggestions
        const suggestionList = Array.isArray(result.suggestions) ? result.suggestions : [];

        // Parse credibility
        const credScore = result.credibility?.score || 0;
        const credLabel = result.credibility?.label || '';
        const credExplanation = result.credibility?.explanation || '';

        // Parse sentiment
        const sentScore = result.sentiment?.score || 50;
        const sentAnalysis = result.sentiment?.analysis || '';

        // Render
        const credScoreColor = credScore >= 70 ? '#10b981' : credScore >= 40 ? '#f59e0b' : '#ef4444';

        if (contentArea) {
            contentArea.innerHTML = `
                <div class="dehype-ap-section">
                    <div class="dehype-ap-section-title">📝 Summary</div>
                    <div class="dehype-ap-text">${result.summary || ''}</div>
                </div>
                ${storage.featureCredibility !== false ? `
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
                ${storage.featureSentiment !== false ? `
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
        chrome.storage.local.get('dehypeHistory', (historyResult) => {
            const history = historyResult.dehypeHistory || [];
            history.unshift({
                title: pageTitle,
                url: pageUrl,
                timestamp: Date.now(),
                credibility: credScore,
                summary: (result.summary || '').substring(0, 100)
            });
            chrome.storage.local.set({ dehypeHistory: history.slice(0, 50) });
        });

        // Update stats
        chrome.storage.local.get('dehypeStats', (statsResult) => {
            const stats = statsResult.dehypeStats || { totalAnalyzed: 0, clickbaitCaught: 0 };
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

    const storage = await chrome.storage.local.get(['dehypeApiKey', 'dehypeProxyUrl']);
    const apiKey = storage.dehypeApiKey;
    const proxyUrl = storage.dehypeProxyUrl || 'http://localhost:3000';

    try {
        const response = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                type: 'DEHYPE_ANALYZE_REQUEST',
                url: `${proxyUrl}/api/analyze`,
                body: {
                    content: text.substring(0, 5000),
                    type: 'text'
                },
                customKey: apiKey
            }, (res) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(res);
                }
            });
        });

        if (!response || !response.success) {
            throw new Error(response?.error || 'Failed to analyze text.');
        }

        const result = response.data;

        if (contentArea) {
            contentArea.innerHTML = `
                <div class="dehype-ap-section">
                    <div class="dehype-ap-section-title">📝 Selected Text Analysis</div>
                    <div class="dehype-ap-text">
                        <strong>Summary:</strong> ${result.summary || ''}<br><br>
                        <strong>Topic:</strong> ${result.topic || ''}<br><br>
                        <strong>Sentiment:</strong> ${result.sentiment || ''}<br><br>
                        <strong>Manipulation:</strong> ${result.manipulation || ''}
                    </div>
                </div>
            `;
        }
    } catch (e) {
        if (contentArea) {
            contentArea.innerHTML = `<div class="dehype-ap-error">❌ ${e.message}</div>`;
        }
    }
}

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

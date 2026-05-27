// ═══════════════════════════════════════════════════════════
//  DeHype Pro v2.0 — Background Service Worker
//  Handles: CORS proxy, context menus, auto-analysis,
//  page content extraction, and inter-script messaging
// ═══════════════════════════════════════════════════════════

// ── Installation ──
chrome.runtime.onInstalled.addListener(() => {
    console.log("DeHype Pro v2.0 Installed");

    // Create context menu for right-click analysis
    chrome.contextMenus.create({
        id: "dehype-analyze-selection",
        title: "🔍 DeHype: Analyze Selected Text",
        contexts: ["selection"]
    });

    chrome.contextMenus.create({
        id: "dehype-analyze-page",
        title: "📊 DeHype: Analyze This Page",
        contexts: ["page"]
    });

    chrome.contextMenus.create({
        id: "dehype-analyze-link",
        title: "🔗 DeHype: Check Link Credibility",
        contexts: ["link"]
    });

    // Initialize default settings
    chrome.storage.local.get('dehypeEnabled', (result) => {
        if (result.dehypeEnabled === undefined) {
            chrome.storage.local.set({
                dehypeEnabled: true,
                featureYoutube: true,
                featureAnalysis: true,
                featureCredibility: true,
                featureSentiment: true,
                featureAutoAnalyze: false,
                dehypeHistory: [],
                dehypeStats: { totalAnalyzed: 0, clickbaitCaught: 0 }
            });
        }
    });
});

// ── Context Menu Handler ──
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "dehype-analyze-selection" && info.selectionText) {
        // Send selected text to content script for analysis
        try {
            await chrome.tabs.sendMessage(tab.id, {
                type: 'DEHYPE_ANALYZE_TEXT',
                text: info.selectionText,
                source: 'context-menu'
            });
        } catch (e) {
            console.error("DeHype: Failed to send to content script", e);
        }
    }

    if (info.menuItemId === "dehype-analyze-page") {
        try {
            await chrome.tabs.sendMessage(tab.id, {
                type: 'DEHYPE_ANALYZE_PAGE',
                source: 'context-menu'
            });
        } catch (e) {
            console.error("DeHype: Failed to send to content script", e);
        }
    }

    if (info.menuItemId === "dehype-analyze-link" && info.linkUrl) {
        try {
            await chrome.tabs.sendMessage(tab.id, {
                type: 'DEHYPE_ANALYZE_LINK',
                url: info.linkUrl,
                source: 'context-menu'
            });
        } catch (e) {
            console.error("DeHype: Failed to send to content script", e);
        }
    }
});

// ── Universal Message Handler (CORS Proxy + Page Analysis) ──
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Proxy request router for backend DeHype server
    if (request.type === 'DEHYPE_ANALYZE_REQUEST') {
        const url = request.url;
        const method = 'POST';
        const body = request.body ? JSON.stringify(request.body) : null;
        
        console.log(`DeHype BG Proxy: Requesting ${url} (type: ${request.body?.type})`);

        const headers = {
            "Content-Type": "application/json"
        };
        
        if (request.customKey) {
            headers["Authorization"] = `Bearer ${request.customKey}`;
        }

        fetch(url, {
            method: method,
            headers: headers,
            body: body
        })
        .then(async response => {
            const text = await response.text();
            console.log(`DeHype BG Proxy: Response Status ${response.status}`);
            
            let data = text;
            try {
                data = JSON.parse(text);
            } catch (e) {
                // Not JSON
            }
            
            if (response.ok) {
                sendResponse({ success: true, data: data });
            } else {
                const errMsg = (data && data.error) ? data.error : `HTTP ${response.status}: ${text}`;
                sendResponse({ success: false, error: errMsg });
            }
        })
        .catch(error => {
            console.error("DeHype BG Proxy Error:", error);
            sendResponse({ success: false, error: error.toString() });
        });

        return true; // Keep channel open
    }

    // CORS Proxy Fetcher (used by content scripts & popup)
    if (request.type === 'DEHYPE_FETCH_URL') {
        const url = request.url;
        const referer = request.referer;
        const method = request.method || 'GET';
        const body = request.body ? JSON.stringify(request.body) : null;

        console.log(`DeHype BG Fetch: ${url.substring(0, 80)}... (${method})`);

        const headers = {
            "Content-Type": "application/json"
        };
        // Merge any custom headers (e.g. Authorization for Groq API)
        if (request.headers) {
            Object.assign(headers, request.headers);
        }
        if (referer) {
            headers['Referer'] = referer;
        }

        const fetchOptions = {
            method: method,
            headers: headers,
            credentials: 'include'
        };

        if (body && method !== 'GET') {
            fetchOptions.body = body;
        }

        fetch(url, fetchOptions)
            .then(async response => {
                const text = await response.text();
                console.log(`DeHype BG Fetch Status: ${response.status}, Len: ${text.length}`);

                let data = text;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    // Not JSON, return as text
                }

                sendResponse({ success: true, data: data, status: response.status });
            })
            .catch(error => {
                console.error("DeHype BG Fetch Error:", error);
                sendResponse({ success: false, error: error.toString() });
            });

        return true; // Keep channel open for async response
    }

    // Page Content Extraction (from SmartContent pattern)
    if (request.type === 'ANALYZE_PAGE') {
        chrome.scripting.executeScript({
            target: { tabId: sender.tab.id },
            function: () => {
                const content = document.body.innerText;
                return {
                    url: window.location.href,
                    title: document.title,
                    content: content.substring(0, 8000),
                    metaDescription: document.querySelector('meta[name="description"]')?.content || '',
                    headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent).slice(0, 10),
                    links: document.querySelectorAll('a[href]').length,
                    images: document.querySelectorAll('img').length
                };
            }
        }, (results) => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                return;
            }

            const data = results[0].result;
            chrome.runtime.sendMessage({
                type: 'TAB_DATA',
                ...data
            });
        });
    }

    // Forward tab data to requesting scripts
    if (request.type === 'TAB_DATA') {
        // Broadcast to all extension pages
        chrome.runtime.sendMessage(request);
    }
});

// ── Tab Update Listener (Auto-analyze feature) ──
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        const result = await chrome.storage.local.get(['featureAutoAnalyze', 'dehypeEnabled']);

        if (result.dehypeEnabled && result.featureAutoAnalyze) {
            try {
                await chrome.tabs.sendMessage(tabId, {
                    type: 'DEHYPE_AUTO_ANALYZE',
                    url: tab.url,
                    title: tab.title
                });
            } catch (e) {
                // Content script not loaded on this page
            }
        }
    }
});

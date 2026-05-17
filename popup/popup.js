// ═══════════════════════════════════════════════════════════
//  DeHype Pro v2.0 — Popup Controller
// ═══════════════════════════════════════════════════════════

// ── DOM Elements ──
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ── Tab Navigation ──
$$('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    $$('.tab').forEach(t => t.classList.remove('active'));
    $$('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    $(`#tab-${tab.dataset.tab}`).classList.add('active');
  });
});

// ── Toggle Visibility ──
$('#toggleKeyVisibility').addEventListener('click', () => {
  const input = $('#apiKey');
  input.type = input.type === 'password' ? 'text' : 'password';
});

// ── Master Toggle ──
$('#toggle').addEventListener('change', (e) => {
  const enabled = e.target.checked;
  const statusDot = $('#statusDot');
  const statusText = $('#status');

  if (enabled) {
    statusDot.classList.add('active');
    statusText.textContent = "Active — All systems operational";
  } else {
    statusDot.classList.remove('active');
    statusText.textContent = "Disabled — Extension paused";
  }

  chrome.storage.local.set({ dehypeEnabled: enabled });
});

// ── Feature Toggles ──
const featureToggles = ['featureYoutube', 'featureAnalysis', 'featureCredibility', 'featureSentiment', 'featureAutoAnalyze'];
featureToggles.forEach(id => {
  const el = $(`#${id}`);
  if (el) {
    el.addEventListener('change', (e) => {
      chrome.storage.local.set({ [id]: e.target.checked });
    });
  }
});

// ── Load Saved Settings ──
document.addEventListener('DOMContentLoaded', () => {
  const settingsKeys = ['dehypeApiKey', 'dehypeEnabled', ...featureToggles, 'dehypeHistory', 'dehypeStats'];

  chrome.storage.local.get(settingsKeys, (result) => {
    // API Key
    if (result.dehypeApiKey) {
      $('#apiKey').value = result.dehypeApiKey;
    }

    // Master toggle
    if (result.dehypeEnabled !== undefined) {
      $('#toggle').checked = result.dehypeEnabled;
      if (!result.dehypeEnabled) {
        $('#statusDot').classList.remove('active');
        $('#status').textContent = "Disabled — Extension paused";
      }
    }

    // Feature toggles
    featureToggles.forEach(id => {
      const el = $(`#${id}`);
      if (el && result[id] !== undefined) {
        el.checked = result[id];
      }
    });

    // History
    if (result.dehypeHistory) {
      renderHistory(result.dehypeHistory);
    }

    // Stats
    if (result.dehypeStats) {
      renderStats(result.dehypeStats);
    }
  });
});

// ── Save API Key ──
$('#saveBtn').addEventListener('click', () => {
  const key = $('#apiKey').value.trim();
  const msg = $('#msg');

  if (!key) {
    msg.textContent = "Please enter a valid API key";
    msg.style.color = "#ef4444";
    return;
  }

  chrome.storage.local.set({ dehypeApiKey: key }, () => {
    msg.textContent = "✓ API Key saved successfully!";
    msg.style.color = "#10b981";
    setTimeout(() => msg.textContent = "", 3000);
  });
});

// ═══════════════════════════════════════════════════════════
//  ANALYSIS ENGINE (from SmartContent integration)
// ═══════════════════════════════════════════════════════════

// ── Analyze Current Page ──
$('#analyzePageBtn').addEventListener('click', async () => {
  showLoading();

  try {
    // Get current tab content via background script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) throw new Error("No active tab found");

    // Execute script to get page content
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        const title = document.title;
        const url = window.location.href;
        const metaDesc = document.querySelector('meta[name="description"]')?.content || '';
        const content = document.body.innerText.substring(0, 8000);
        return { title, url, content, metaDesc };
      }
    });

    if (!results || !results[0]) throw new Error("Failed to read page content");

    const pageData = results[0].result;
    await runFullAnalysis(pageData.content, pageData.title, pageData.url);

  } catch (err) {
    hideLoading();
    showError("Could not analyze page: " + err.message);
  }
});

// ── Analyze Custom Text ──
$('#analyzeTextBtn').addEventListener('click', async () => {
  const text = $('#customText').value.trim();
  if (!text) {
    alert("Please paste some text to analyze.");
    return;
  }

  showLoading();
  await runFullAnalysis(text, "Custom Text Analysis", "");
});

// ── Full Analysis Pipeline ──
async function runFullAnalysis(content, title, url) {
  const apiKey = await getApiKey();
  if (!apiKey) {
    hideLoading();
    showError("No API key configured. Go to Settings → Save your Gemini API Key.");
    return;
  }

  const truncated = content.substring(0, 10000);

  try {
    // Run all analyses in parallel for speed (inspired by SmartContent's Promise.all pattern)
    const [summaryResult, tagsResult, suggestionsResult, credibilityResult, sentimentResult, clickbaitResult] = await Promise.all([
      callGeminiAPI(apiKey, buildSummaryPrompt(truncated, title)),
      callGeminiAPI(apiKey, buildTagsPrompt(truncated)),
      callGeminiAPI(apiKey, buildSuggestionsPrompt(truncated, title)),
      callGeminiAPI(apiKey, buildCredibilityPrompt(truncated, title, url)),
      callGeminiAPI(apiKey, buildSentimentPrompt(truncated, title)),
      callGeminiAPI(apiKey, buildClickbaitPrompt(title, truncated))
    ]);

    hideLoading();

    // Render each section
    renderSummary(summaryResult);
    renderTags(tagsResult);
    renderSuggestions(suggestionsResult);
    renderCredibility(credibilityResult);
    renderSentiment(sentimentResult);
    renderClickbait(clickbaitResult);

    // Save to history
    saveToHistory({
      title: title,
      url: url,
      timestamp: Date.now(),
      credibility: extractScore(credibilityResult),
      summary: summaryResult.substring(0, 100)
    });

    // Update stats
    updateStats();

  } catch (err) {
    hideLoading();
    showError("Analysis failed: " + err.message);
  }
}

// ═══════════════════════════════════════════════════════════
//  GEMINI API INTEGRATION
// ═══════════════════════════════════════════════════════════

async function callGeminiAPI(apiKey, prompt) {
  const response = await new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
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
    }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });

  if (!response.success) throw new Error(response.error);

  let json = response.data;
  if (typeof json === 'string') {
    try { json = JSON.parse(json); } catch (e) { /* */ }
  }

  if (json.error) throw new Error(json.error.message);
  if (!json.candidates || json.candidates.length === 0) throw new Error("No response from AI");

  return json.candidates[0].content?.parts?.[0]?.text || "";
}

// ═══════════════════════════════════════════════════════════
//  PROMPT ENGINEERING
// ═══════════════════════════════════════════════════════════

function buildSummaryPrompt(content, title) {
  return `You are a content analysis AI. Provide a concise, factual summary (3-4 sentences max) of the following content.
Title: "${title}"
Content: "${content}"

Rules:
- Be objective and factual
- Highlight the main points
- Do NOT start with "This article" or "The content"
- Write in plain English

Summary:`;
}

function buildTagsPrompt(content) {
  return `Analyze this content and generate exactly 6 relevant topic tags. Return ONLY the tags as a comma-separated list, nothing else.

Content: "${content}"

Tags:`;
}

function buildSuggestionsPrompt(content, title) {
  return `Based on this content, provide 3 smart insights or suggestions. Each suggestion should be actionable and insightful.

Title: "${title}"
Content: "${content}"

Return exactly 3 suggestions, each on a new line, starting with a dash (-).

Suggestions:`;
}

function buildCredibilityPrompt(content, title, url) {
  return `You are a media literacy expert. Analyze this content for credibility and trustworthiness.

Title: "${title}"
URL: "${url}"
Content: "${content}"

Respond in this EXACT format (3 lines only):
SCORE: [number from 0-100]
LABEL: [one of: Very Low | Low | Moderate | High | Very High]
EXPLANATION: [1 sentence explaining the score, mentioning specific factors like sources cited, emotional language, factual claims, etc.]`;
}

function buildSentimentPrompt(content, title) {
  return `Analyze the emotional tone and sentiment of this content.

Title: "${title}"
Content: "${content}"

Respond in this EXACT format (2 lines only):
SCORE: [number from 0-100 where 0=very negative, 50=neutral, 100=very positive]
ANALYSIS: [1 sentence describing the emotional tone, any manipulation tactics, bias, or emotional triggers detected]`;
}

function buildClickbaitPrompt(title, content) {
  return `Analyze this title for clickbait characteristics. Compare the title's claims/promises against the actual content.

Title: "${title}"
Content: "${content}"

Respond in this EXACT format (2 lines only):
SCORE: [number from 0-100 where 0=completely factual and 100=extreme clickbait]
ANALYSIS: [1 sentence explaining why. Mention specific clickbait tactics if found: curiosity gaps, exaggeration, false urgency, emotional manipulation, misleading claims]`;
}

// ═══════════════════════════════════════════════════════════
//  RENDERING FUNCTIONS
// ═══════════════════════════════════════════════════════════

function renderSummary(text) {
  const section = $('#summarySection');
  section.classList.remove('hidden');
  $('#summaryText').textContent = text.replace(/^Summary:?\s*/i, '').trim();
}

function renderTags(text) {
  const section = $('#tagsSection');
  section.classList.remove('hidden');
  const container = $('#tagsContainer');
  container.innerHTML = '';

  const tags = text.replace(/^Tags:?\s*/i, '').split(',').map(t => t.trim()).filter(t => t);
  tags.forEach(tag => {
    const el = document.createElement('span');
    el.className = 'tag';
    el.textContent = tag;
    container.appendChild(el);
  });
}

function renderSuggestions(text) {
  const section = $('#suggestionsSection');
  section.classList.remove('hidden');
  const list = $('#suggestionsList');
  list.innerHTML = '';

  const suggestions = text.split('\n')
    .map(s => s.replace(/^[-•*]\s*/, '').trim())
    .filter(s => s.length > 5);

  suggestions.forEach(suggestion => {
    const li = document.createElement('li');
    li.textContent = suggestion;
    list.appendChild(li);
  });
}

function renderCredibility(text) {
  const section = $('#credibilitySection');
  section.classList.remove('hidden');

  const lines = text.split('\n').filter(l => l.trim());
  let score = 50, label = 'Moderate', explanation = '';

  lines.forEach(line => {
    if (line.startsWith('SCORE:')) score = parseInt(line.replace('SCORE:', '').trim()) || 50;
    if (line.startsWith('LABEL:')) label = line.replace('LABEL:', '').trim();
    if (line.startsWith('EXPLANATION:')) explanation = line.replace('EXPLANATION:', '').trim();
  });

  score = Math.max(0, Math.min(100, score));

  // Animate score ring
  const circumference = 2 * Math.PI * 42; // r=42
  const offset = circumference - (score / 100) * circumference;
  const circle = $('#scoreCircle');
  setTimeout(() => {
    circle.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
    circle.style.strokeDashoffset = offset;
  }, 100);

  $('#credibilityValue').textContent = score;
  $('#credibilityLabel').textContent = label;
  $('#credibilityLabel').style.color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  $('#credibilityExplanation').textContent = explanation;
}

function renderSentiment(text) {
  const section = $('#sentimentSection');
  section.classList.remove('hidden');

  const lines = text.split('\n').filter(l => l.trim());
  let score = 50, analysis = '';

  lines.forEach(line => {
    if (line.startsWith('SCORE:')) score = parseInt(line.replace('SCORE:', '').trim()) || 50;
    if (line.startsWith('ANALYSIS:')) analysis = line.replace('ANALYSIS:', '').trim();
  });

  score = Math.max(0, Math.min(100, score));

  setTimeout(() => {
    $('#sentimentMarker').style.left = `${score}%`;
  }, 200);

  $('#sentimentText').textContent = analysis;
}

function renderClickbait(text) {
  const section = $('#clickbaitSection');
  section.classList.remove('hidden');

  const lines = text.split('\n').filter(l => l.trim());
  let score = 0, analysis = '';

  lines.forEach(line => {
    if (line.startsWith('SCORE:')) score = parseInt(line.replace('SCORE:', '').trim()) || 0;
    if (line.startsWith('ANALYSIS:')) analysis = line.replace('ANALYSIS:', '').trim();
  });

  score = Math.max(0, Math.min(100, score));

  setTimeout(() => {
    $('#clickbaitFill').style.width = `${score}%`;
  }, 300);

  $('#clickbaitText').textContent = analysis;
}

// ═══════════════════════════════════════════════════════════
//  HISTORY & STATS
// ═══════════════════════════════════════════════════════════

function saveToHistory(entry) {
  chrome.storage.local.get('dehypeHistory', (result) => {
    const history = result.dehypeHistory || [];
    history.unshift(entry);
    // Keep last 50 entries
    const trimmed = history.slice(0, 50);
    chrome.storage.local.set({ dehypeHistory: trimmed });
    renderHistory(trimmed);
  });
}

function renderHistory(history) {
  const container = $('#historyList');
  if (!history || history.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <p>No analysis history yet</p>
        <small>Analyzed pages will appear here</small>
      </div>`;
    return;
  }

  container.innerHTML = history.slice(0, 20).map(item => {
    const date = new Date(item.timestamp);
    const timeAgo = getTimeAgo(date);
    const scoreColor = item.credibility >= 70 ? '#10b981' : item.credibility >= 40 ? '#f59e0b' : '#ef4444';
    const domain = item.url ? new URL(item.url).hostname : 'text';

    return `
      <div class="history-item" title="${item.summary || ''}">
        <div class="history-info">
          <div class="history-title">${escapeHtml(item.title || 'Untitled')}</div>
          <div class="history-meta">${domain} · ${timeAgo}</div>
        </div>
        <span class="history-score" style="color: ${scoreColor}">${item.credibility || '--'}</span>
      </div>`;
  }).join('');
}

function updateStats() {
  chrome.storage.local.get('dehypeStats', (result) => {
    const stats = result.dehypeStats || { totalAnalyzed: 0, clickbaitCaught: 0 };
    stats.totalAnalyzed++;
    chrome.storage.local.set({ dehypeStats: stats });
    renderStats(stats);
  });
}

function renderStats(stats) {
  if (!stats) return;
  $('#totalAnalyzed').textContent = stats.totalAnalyzed || 0;
  $('#clickbaitCaught').textContent = stats.clickbaitCaught || 0;
  const minutes = (stats.totalAnalyzed || 0) * 2;
  $('#timeSaved').textContent = minutes >= 60 ? `${Math.floor(minutes/60)}h` : `${minutes}m`;
}

// ── Clear History ──
$('#clearHistoryBtn').addEventListener('click', () => {
  if (confirm("Clear all analysis history?")) {
    chrome.storage.local.set({ dehypeHistory: [], dehypeStats: { totalAnalyzed: 0, clickbaitCaught: 0 } });
    renderHistory([]);
    renderStats({ totalAnalyzed: 0, clickbaitCaught: 0 });
  }
});

// ── Copy Results ──
$('#copyResultsBtn').addEventListener('click', () => {
  const summary = $('#summaryText').textContent;
  const tags = Array.from($$('.tag')).map(t => t.textContent).join(', ');
  const cred = $('#credibilityValue').textContent;
  const sentiment = $('#sentimentText').textContent;

  const text = `📊 DeHype Pro Analysis\n\n📝 Summary:\n${summary}\n\n🏷️ Tags: ${tags}\n\n🛡️ Credibility: ${cred}/100\n\n💬 Sentiment: ${sentiment}`;

  navigator.clipboard.writeText(text).then(() => {
    const btn = $('#copyResultsBtn');
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
    setTimeout(() => {
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
    }, 2000);
  });
});

// ═══════════════════════════════════════════════════════════
//  UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════

function getApiKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get('dehypeApiKey', (result) => {
      resolve(result.dehypeApiKey || null);
    });
  });
}

function showLoading() {
  $('#resultsCard').classList.remove('hidden');
  $('#loading').classList.remove('hidden');
  // Hide all result sections
  ['summarySection', 'credibilitySection', 'sentimentSection', 'tagsSection', 'suggestionsSection', 'clickbaitSection'].forEach(id => {
    $(`#${id}`).classList.add('hidden');
  });
}

function hideLoading() {
  $('#loading').classList.add('hidden');
}

function showError(msg) {
  $('#resultsCard').classList.remove('hidden');
  $('#loading').classList.add('hidden');
  const section = $('#summarySection');
  section.classList.remove('hidden');
  $('#summaryText').textContent = "❌ " + msg;
  $('#summaryText').style.color = '#ef4444';
}

function extractScore(text) {
  const match = text.match(/SCORE:\s*(\d+)/);
  return match ? parseInt(match[1]) : null;
}

function getTimeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

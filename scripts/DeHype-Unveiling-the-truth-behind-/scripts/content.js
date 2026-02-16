console.log("DeHype: Content script loaded on YouTube!");

// 1. VISUAL CONFIRMATION (Setup UI first)
const debugBadge = document.createElement('div');
debugBadge.style.position = "fixed";
debugBadge.style.bottom = "10px";
debugBadge.style.right = "10px";
debugBadge.style.zIndex = "2147483647";
debugBadge.style.display = "flex";
debugBadge.style.flexDirection = "column";
debugBadge.style.gap = "5px";

const badgelabel = document.createElement('div');
badgelabel.innerText = "DeHype: Ready";
badgelabel.style.background = "orange";
badgelabel.style.color = "black";
badgelabel.style.padding = "5px 10px";
badgelabel.style.fontWeight = "bold";
badgelabel.style.borderRadius = "5px";
badgelabel.style.boxShadow = "0 0 5px rgba(0,0,0,0.5)";

const fetchBtn = document.createElement('button');
fetchBtn.innerText = "Fetch Transcript";
fetchBtn.style.cursor = "pointer";
fetchBtn.style.background = "#222";
fetchBtn.style.color = "white";
fetchBtn.style.border = "1px solid #555";
fetchBtn.style.padding = "5px";
fetchBtn.style.borderRadius = "5px";
fetchBtn.onclick = () => fetchTranscriptViaDOM();

debugBadge.appendChild(badgelabel);
debugBadge.appendChild(fetchBtn);
document.body.appendChild(debugBadge);


// 3. UI SCRAPER (Robust Fallback)
async function fetchTranscriptViaDOM() {
  badgelabel.innerText = "Opening UI...";

  // 1. Find and Click 'Show transcript'
  try {
    // First, expand description if needed
    const expandBtn = document.querySelector('#expand');
    if (expandBtn) expandBtn.click();

    await new Promise(r => setTimeout(r, 1000)); // Wait for expansion

    // Correct selector for the button in the description
    const buttons = Array.from(document.querySelectorAll('button, tp-yt-paper-button, yt-button-renderer'));
    const transcriptBtn = buttons.find(b => b.textContent && b.textContent.includes('Show transcript'));

    if (!transcriptBtn) {
      throw new Error("Transcript button not found in UI (Video might not have captions)");
    }

    transcriptBtn.click();
    badgelabel.innerText = "Reading...";

    // 2. Wait for panel to load (Dynamic wait)
    await new Promise(r => setTimeout(r, 1500));

    // 3. Scrape text
    const segments = document.querySelectorAll('ytd-transcript-segment-renderer .segment-text');
    if (!segments || segments.length === 0) {
      // Try waiting a bit more
      await new Promise(r => setTimeout(r, 1000));
    }

    const segmentsRetry = document.querySelectorAll('ytd-transcript-segment-renderer .segment-text');

    if (!segmentsRetry || segmentsRetry.length === 0) {
      throw new Error("Transcript panel opened but no text found");
    }

    let fullText = "";
    segmentsRetry.forEach(seg => {
      fullText += seg.innerText + " ";
    });

    fullText = fullText.replace(/\s+/g, " ").trim();
    console.log("DeHype DOM Scrape Length:", fullText.length);

    if (fullText.length < 50) {
      throw new Error("Scraped text too short");
    }

    badgelabel.innerText = "Summarizing...";
    badgelabel.style.background = "cyan";

    // Close panel? Optional. Let's keep it open so user sees we worked.

    await callGemini(fullText);

  } catch (e) {
    console.error("DeHype DOM Error:", e);
    badgelabel.innerText = "UI Fail";
    badgelabel.style.background = "red";
    alert("Could not fetch transcript via UI: " + e.message);
  }
}

async function callGemini(transcript) {
  // Get API Key
  const data = await chrome.storage.local.get('dehypeApiKey');
  const apiKey = data.dehypeApiKey;

  if (!apiKey) {
    badgelabel.innerText = "No API Key!";
    badgelabel.style.background = "red";
    alert("DeHype: Please set your Gemini API Key in the extension popup!");
    return;
  }

  // Limit transcript length
  const truncatedTranscript = transcript.substring(0, 12000);

  const prompt = `You are a helpful assistant that removes clickbait. Setup:
  User is watching a YouTube video. 
  Title: "${document.title.replace(' - YouTube', '')}"
  
  Transcript: 
  "${truncatedTranscript}"
  
  Task: Write a single sentence summary (max 20 words) that reveals the actual answer or core topic, effectively de-clickbaiting the title. Be factual and dry. Do not start with "The video explains".
  
  Output:`;

  try {
    // Offload to Background Script to avoid CORS/CSP issues
    const response = await chrome.runtime.sendMessage({
      type: 'DEHYPE_FETCH_URL',
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      body: {
        contents: [{ parts: [{ text: prompt }] }]
      }
    });

    if (!response.success) {
      throw new Error("Background Fetch Failed: " + response.error);
    }

    let json = response.data;
    console.log("DeHype Gemini Response:", json);

    if (typeof json === 'string') {
      // In case it wasn't parsed as JSON
      try {
        json = JSON.parse(json);
      } catch (e) { /* ignore */ }
    }

    if (json.error) {
      throw new Error("API Error: " + json.error.message);
    }

    if (!json.candidates || json.candidates.length === 0) {
      throw new Error("No candidates returned. Safety filter?");
    }

    const summary = json.candidates[0].content?.parts?.[0]?.text;

    if (summary) {
      console.log("DeHype Summary:", summary);
      badgelabel.innerText = "De-Hyped!";
      badgelabel.style.background = "#FF00FF"; // Magenta for AI Success

      // Replace Title UI
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
        titleElement.innerText = "✨ " + summary;
        titleElement.style.textShadow = "0 0 10px rgba(255, 0, 255, 0.3)";

        // Also update document title
        document.title = "✨ " + summary + " - YouTube";
      } else {
        // Fallback if UI changed
        alert(`DeHype Summary:\n\n${summary}`);
      }
    } else {
      throw new Error("Summary text not found in response.");
    }

  } catch (e) {
    console.error("Gemini Error:", e);
    badgelabel.innerText = "AI Error";
    badgelabel.style.background = "red";

    let msg = e.message;
    if (msg.includes("429")) {
      msg = "Quota Exceeded (429). Please wait a minute or check your API key limits.";
    } else if (msg.includes("400")) {
      msg = "Bad Request (400). Key might be invalid.";
    }

    alert("DeHype Error: " + msg);
  }
}

function processTitles() {
  const selectors = [
    '#video-title',
    'h1.ytd-watch-metadata',
    'a.yt-lockup-metadata-view-model__title',
    '#video-title-link'
  ];

  possibleTitles = document.querySelectorAll(selectors.join(', '));
  possibleTitles.forEach((title) => {
    if (title.getAttribute('data-dehype-processed')) return;
    if (!title.innerText.trim()) return;
    title.setAttribute('data-dehype-processed', 'true');
    title.style.outline = "2px dashed orange";
  });
}

setInterval(() => {
  // Keep processing titles for visual effect, though we only summarize the main one
  // processTitles(); 
}, 2000);

console.log("DeHype: Ready for UI fetch.");

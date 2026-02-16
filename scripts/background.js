chrome.runtime.onInstalled.addListener(() => {
    console.log("DeHype Installed");
});

// Proxy Fetcher to bypass CORS
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'DEHYPE_FETCH_URL') {
        const url = request.url;
        const referer = request.referer;
        const method = request.method || 'GET';
        const body = request.body ? JSON.stringify(request.body) : null;

        console.log(`DeHype Background Fetching: ${url} (Method: ${method})`);

        const headers = {
            "Content-Type": "application/json"
        };
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
                console.log(`DeHype BG Fetch Status: ${response.status}, Length: ${text.length}`);

                // Try to parse JSON if possible, otherwise return text
                let data = text;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    // Not JSON
                }

                sendResponse({ success: true, data: data, status: response.status });
            })
            .catch(error => {
                console.error("DeHype Background Error:", error);
                sendResponse({ success: false, error: error.toString() });
            });

        return true; // Keep channel open for async response
    }
});

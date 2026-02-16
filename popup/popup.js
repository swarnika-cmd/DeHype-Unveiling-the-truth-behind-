document.getElementById('toggle').addEventListener('change', (e) => {
    const statusDiv = document.getElementById('status');
    if (e.target.checked) {
        statusDiv.textContent = "Active";
        statusDiv.style.color = "green";
    } else {
        statusDiv.textContent = "Inactive";
        statusDiv.style.color = "red";
    }

    chrome.storage.local.set({ dehypeEnabled: e.target.checked });
});

// Load saved settings
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['dehypeApiKey', 'dehypeEnabled'], (result) => {
        if (result.dehypeApiKey) {
            document.getElementById('apiKey').value = result.dehypeApiKey;
        }
        if (result.dehypeEnabled !== undefined) {
            document.getElementById('toggle').checked = result.dehypeEnabled;
            updateStatus(result.dehypeEnabled);
        }
    });
});

// Save API Key
document.getElementById('saveBtn').addEventListener('click', () => {
    const key = document.getElementById('apiKey').value.trim();
    if (key) {
        chrome.storage.local.set({ dehypeApiKey: key }, () => {
            const msg = document.getElementById('msg');
            msg.textContent = "Saved!";
            msg.style.color = "green";
            setTimeout(() => msg.textContent = "", 2000);
        });
    }
});

function updateStatus(enabled) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = enabled ? "Active" : "Inactive";
    statusDiv.style.color = enabled ? "green" : "red";
}

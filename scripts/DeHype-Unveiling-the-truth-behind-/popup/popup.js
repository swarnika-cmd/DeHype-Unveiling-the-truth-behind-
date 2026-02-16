document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const elements = {
        toggle: document.getElementById('toggle'),
        statusText: document.getElementById('status'),
        statusCard: document.getElementById('status-card'),
        apiKey: document.getElementById('apiKey'),
        saveBtn: document.getElementById('saveBtn'),
        msg: document.getElementById('msg')
    };

    // Initialize state
    chrome.storage.local.get(['dehypeApiKey', 'dehypeEnabled'], (result) => {
        // Handle API Key
        if (result.dehypeApiKey) {
            elements.apiKey.value = result.dehypeApiKey;
        }

        // Handle Enabled State (Default to true if undefined)
        const isEnabled = result.dehypeEnabled !== undefined ? result.dehypeEnabled : true;
        elements.toggle.checked = isEnabled;
        updateUIState(isEnabled);
    });

    // Toggle Handler
    elements.toggle.addEventListener('change', (e) => {
        const isEnabled = e.target.checked;
        updateUIState(isEnabled);
        chrome.storage.local.set({ dehypeEnabled: isEnabled });
    });

    // Save Button Handler
    elements.saveBtn.addEventListener('click', () => {
        const key = elements.apiKey.value.trim();

        elements.saveBtn.textContent = 'Saving...';

        // Basic validation/simulation
        if (key) {
            chrome.storage.local.set({ dehypeApiKey: key }, () => {
                showFeedback('Configuration saved successfully!', 'success');
                elements.saveBtn.textContent = 'Save Configuration';
            });
        } else {
            showFeedback('Please enter a valid API key', 'error');
            elements.saveBtn.textContent = 'Save Configuration';
        }
    });

    // Helper functions
    function updateUIState(enabled) {
        if (enabled) {
            elements.statusText.textContent = "Active";
            elements.statusCard.classList.add('active');
        } else {
            elements.statusText.textContent = "Inactive";
            elements.statusCard.classList.remove('active');
        }
    }

    function showFeedback(text, type) {
        elements.msg.textContent = text;
        elements.msg.className = `message ${type}`; // Apply type class (success/error)

        // Clear message after 3 seconds
        setTimeout(() => {
            elements.msg.textContent = "";
            elements.msg.className = "message";
        }, 3000);
    }
});

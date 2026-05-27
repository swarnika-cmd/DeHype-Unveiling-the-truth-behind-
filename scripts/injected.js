(function () {
    console.log("DeHype: Injected Script Loaded");

    window.addEventListener('message', (event) => {
        // Only accept messages from ourselves
        if (event.source !== window) return;

        if (event.data && event.data.type === 'DEHYPE_REQ_PLAYER_RESPONSE') {
            try {
                const data = window.ytInitialPlayerResponse ||
                    (window.ytplayer && window.ytplayer.config && window.ytplayer.config.args && JSON.parse(window.ytplayer.config.args.player_response));

                if (!data) {
                    window.postMessage({ type: 'DEHYPE_DATA', error: 'No player response data found.' }, '*');
                    return;
                }

                if (!data.captions) {
                    window.postMessage({ type: 'DEHYPE_DATA', error: 'Captions are disabled or unavailable for this video.' }, '*');
                    return;
                }

                if (data.captions.playerCaptionsTracklistRenderer && data.captions.playerCaptionsTracklistRenderer.captionTracks) {
                    const tracks = data.captions.playerCaptionsTracklistRenderer.captionTracks;
                    window.postMessage({ type: 'DEHYPE_DATA', tracks: tracks }, '*');
                } else {
                    window.postMessage({ type: 'DEHYPE_DATA', error: 'Captions structure mismatch.' }, '*');
                }
            } catch (err) {
                window.postMessage({ type: 'DEHYPE_DATA', error: 'Error reading player data: ' + err.message }, '*');
            }
        }
    });
})();

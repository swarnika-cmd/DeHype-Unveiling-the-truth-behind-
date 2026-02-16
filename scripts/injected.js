(function () {
    console.log("DeHype: Injected Script Started");

    // Try multiple sources
    const data = window.ytInitialPlayerResponse ||
        (window.ytplayer && window.ytplayer.config && window.ytplayer.config.args && JSON.parse(window.ytplayer.config.args.player_response));

    // Helper to send data back
    function send(payload) {
        window.postMessage({ type: 'DEHYPE_DATA', ...payload }, '*');
    }

    if (!data) {
        console.error("DeHype: No player response data found in window.");
        send({ error: 'No global player data found' });
        return;
    }

    if (!data.captions) {
        console.warn("DeHype: Player data found, but no 'captions' field.", data);
        send({ error: 'No captions field in data' });
        return;
    }

    if (data.captions.playerCaptionsTracklistRenderer) {
        const tracks = data.captions.playerCaptionsTracklistRenderer.captionTracks;
        console.log("DeHype: Tracks found:", tracks);
        send({ tracks: tracks });
    } else {
        console.warn("DeHype: Unknown captions structure:", data.captions);
        send({ error: 'Captions structure mismatch' });
    }
})();

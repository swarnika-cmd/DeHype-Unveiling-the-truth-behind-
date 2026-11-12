// Build-time configuration for the DeHype extension.
// Copy this file to scripts/config.js (gitignored) and set SHARED_SECRET.
//
// SHARED_SECRET must equal the SHARED_SECRET set on the proxy server.
// Anything shipped inside an extension package can be read by whoever installs it,
// so this value deters casual abuse of the proxy. It is not real authentication.
// Never commit config.js.
const DEHYPE_CONFIG = {
    SHARED_SECRET: 'replace_with_a_long_random_string'
};

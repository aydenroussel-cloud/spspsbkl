// Stub for Roblox bundleVerifier — suppresses 404 cascade and runtime errors
var Roblox = Roblox || {};
Roblox.BundleDetector = Roblox.BundleDetector || {
    reportBundleError: function() {}
};

// Suppress uncaught errors and unhandled rejections from Roblox CDN scripts
// that try to reach roblox.com APIs (CORS-blocked outside roblox.com).
window.addEventListener('error', function(e) {
    if (!e || !e.error) { e.preventDefault(); return false; }
}, true);
window.addEventListener('unhandledrejection', function(e) {
    if (e) { e.preventDefault(); }
});

// Stub out SignalR / RealTime connection so it doesn't throw on WebSocket failure
var originalWebSocket = window.WebSocket;
window.WebSocket = function(url, protocols) {
    try { return new originalWebSocket(url, protocols); }
    catch(ex) { return { send: function(){}, close: function(){}, addEventListener: function(){} }; }
};

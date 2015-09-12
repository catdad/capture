/* jshint browser: true, devel: true */
/* global chrome */

/**
 * Listens for the app launching then creates the window.
 *
 * @see http://developer.chrome.com/apps/app.runtime.html
 * @see http://developer.chrome.com/apps/app.window.html
 */
//chrome.app.runtime.onLaunched.addListener(function () {
//    chrome.app.window.create(
//        "index.html", {
//            id: "mainWindow",
//            bounds: {
//                width: 700,
//                height: 600
//            }
//        }
//    );
//});


chrome.app.runtime.onLaunched.addListener(function () {
    var width = 264;
    var height = 44;
    
    chrome.app.window.create(
        "controls/controls.html", {
            id: "controls",
            frame: "none",
            innerBounds: {
                width: width,
                height: height,
                minWidth: width,
                minHeight: height,
                maxWidth: width,
                maxHeight: height
            }
        },
        function onCreated(contentWindow) {
            console.log(contentWindow);
        }
    );
});

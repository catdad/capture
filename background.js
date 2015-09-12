/* jshint browser: true, devel: true */
/* global chrome */

var $ = function(selector, root) {
    root = root || window.document;
    return root.querySelector(selector);
};

var refs = {};

// create the controls window when the app launches
chrome.app.runtime.onLaunched.addListener(function () {
    var width = 240;
    var height = 40;
    
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
            },
            resizable: false,
            alwaysOnTop: true,
//            transparentBackground: true
        },
        function onCreated(appWindow) {
            refs.controlsWindow = appWindow;
            appWindow.contentWindow.initControls = initControls;
        }
    );
});

function initControls(win) {
    var root = win.document;
    
    $('#js-desktop', root).onclick = function() {
        initDesktopCapture();
    };

    $('#js-sound', root).onclick = function() {
        console.log('sound');
    };

    $('#js-mirror', root).onclick = function() {
        console.log('mirror');
        if (refs.previewWindow === undefined) {
            createPreviewWindow();
            this.classList.add('on');
        } else {
            refs.previewWindow.contentWindow.close();
            refs.previewWindow = undefined;
            this.classList.remove('on');
        }
    };
}

function initDesktopCapture() {
    refs.videoRequestId = chrome.desktopCapture.chooseDesktopMedia(
        ['screen', 'window'],
        function success(id) {
            getDesktopStream(id);        
        }
    );
}

function getDesktopStream(mediaId) {
    navigator.webkitGetUserMedia({
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: mediaId
            }
        },
        audio: false // TODO is this true?
    }, function sucess(stream) {
        refs.desktopStream = stream;
        initDesktopStream(stream);
    }, function error(err) {
        console.log(err);
    });
}

function initDesktopStream(stream) {
    stream.addEventListener('ended', function() {
        console.log('desktop stream ended');
        refs.desktopStream = undefined;
    });
}

function createPreviewWindow() {
    var width = 400;
    var height = 266;
    
    chrome.app.window.create(
        "preview/preview.html", {
            id: "preview",
            frame: "none",
            innerBounds: {
                width: width,
                height: height,
                minWidth: width,
                minHeight: height,
                maxWidth: width,
                maxHeight: height
            },
            resizable: false
        }, function(appWindow) {
            refs.previewWindow = appWindow;
            appWindow.contentWindow.initPreview = initPreview;
        }
    );
}

function initPreview(win) {
    if (refs.desktopStream === undefined) { return; }
    
    if (refs.desktopStreamUrl) {
        window.URL.revokeObjectURL(refs.desktopStreamUrl);
    }
    
    var root = win.document;
    
    var video = $('#js-video', root);
    var streamUrl = window.URL.createObjectURL(refs.desktopStream);
    
    video.src = streamUrl;
    
    refs.desktopStreamUrl = streamUrl;
    
    refs.desktopStream.addEventListener('ended', function() {
        window.URL.revokeObjectURL(streamUrl);
    });
}

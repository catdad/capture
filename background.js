/* jshint browser: true, devel: true */
/* global chrome */

var $ = function(selector, root) {
    root = root || window.document;
    return root.querySelector(selector);
};

$.once = function once(elem, eventName, func, context) {
    function trigger() {
        elem.removeEventListener(eventName, trigger);
        func.apply(context, arguments);
    }
    
    elem.addEventListener(eventName, func);
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
    
    if (refs.previewWindow && refs.previewWindow.contentWindow) {
        // we have an already open preview window, so initialize the preview
        initPreview(refs.previewWindow.contentWindow);
    }
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
    if (refs.previewWindow === undefined) { return; }
    
    if (refs.desktopStreamUrl) {
        window.URL.revokeObjectURL(refs.desktopStreamUrl);
    }
    
    var root = win.document;
    
    var video = $('#js-video', root);
    var streamUrl = window.URL.createObjectURL(refs.desktopStream);
    
    video.src = streamUrl;
    
    refs.desktopStreamUrl = streamUrl;
    
    refs.desktopStream.addEventListener('ended', function() {
        // revoke the blob url and remove the video source
        window.URL.revokeObjectURL(streamUrl);
        video.src = '';
        
        // TODO should I close the preview window automatically?
    });
    
    refs.previewWindow.onClosed.addListener(function() {
        window.URL.revokeObjectURL(streamUrl);
        video.src = '';
        refs.previewWindow = undefined;
        
        console.log('tore down the preview window');
    });
    
    $.once(video, 'loadeddata', function() {
        // size the window to match the size of the video feed
        var defaultBounds = refs.previewWindow.innerBounds;
        var videoWidth = video.videoWidth;
        var videoHeight = video.videoHeight;
        
        // Chrome demands that these numbers be integers
        var newHeight = (videoHeight * defaultBounds.width / videoWidth) | 0;
        var newWidth = defaultBounds.width | 0;
        
        defaultBounds.setMinimumSize((newWidth / 2) | 0, (newHeight / 2) | 0);
        defaultBounds.setMaximumSize((newWidth * 2) | 0, (newHeight * 2) | 0);
        defaultBounds.setSize(newWidth, newHeight);
    });
}

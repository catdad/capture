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

function noop() {}

var refs = {};

// create the controls window when the app launches
chrome.app.runtime.onLaunched.addListener(function () {
    createControlsWindow(function(appWindow) {
        // register onClose events to clean up
        appWindow.onClosed.addListener(function() {
            var allWindows = chrome.app.window.getAll();
            allWindows.forEach((appWin) => {
                appWin.contentWindow.close();
            });
            
            destroyDesktopStream();
        });
    });
});

function createWindow(url, id, width, height, description, callback) {
    var args = Array.prototype.slice.call(arguments);
    
    var defaultWidth = 240;
    var defaultHeight = 40;
    
    // required params
    url = args.shift();
    id = args.shift();
    callback = args.pop();
    
    description = description || {};
    
    if (args.length) {
        // we can have up to 3 optional parameters
        if (typeof args[0] === 'object') {
            description = Object.assign(args[0], description);
        } else if (typeof args[0] === 'number') {
            width = args[0];
        }
        
        if (typeof args[1] === 'object') {
            description = Object.assign(args[1], description);
        } else if (typeof args[1] === 'number') {
            height = args[1];
        }
        
        if (typeof args[2] === 'object') {
            description = Object.assign(args[2], description);
        }
    }
    
    var defaultDescription = {
        id: id,
        frame: 'none',
        innerBounds: {
            width: width || defaultWidth,
            height: height || defaultHeight
        }
    };
    
    var fullDescription = Object.assign(defaultDescription, description);
    
    chrome.app.window.create(url, fullDescription, function(appWindow) {
        callback(appWindow);
    });
}

function createControlsWindow(done) {
    var width = 240;
    var height = 40;
    done = done || noop;
    
    createWindow('controls/controls.html', 'controls', {
        alwaysOnTop: true,
        resizable: false,
        innerBounds: {
            width: width,
            height: height,
            minWidth: width,
            minHeight: height,
            maxWidth: width,
            maxHeight: height
        }
    }, function(appWindow) {
        refs.controlsWindow = appWindow;
        appWindow.contentWindow.initControls = initControls;
        done(appWindow);
    });
}

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
    
    $('#js-webcam', root).onclick = function() {
        if (refs.webcamWindow === undefined) {
            createWebcamWindow();
            this.classList.add('on');
        } else {
            refs.webcamWindow.contentWindow.close();
            refs.webcamWindow = undefined;
            this.classList.remove('on');
        }
    };
}

function initDesktopCapture() {
    refs.videoRequestId = chrome.desktopCapture.chooseDesktopMedia(
        // only share the whole screen, not individual windows for now
        ['screen'],//, 'window'],
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
        destroyDesktopStream();
    });
    
    if (refs.previewWindow && refs.previewWindow.contentWindow) {
        // we have an already open preview window, so initialize the preview
        initPreview(refs.previewWindow.contentWindow);
    }
}

function destroyDesktopStream() {
    if (refs.desktopStream && refs.desktopStream.active) {
        // tracks have to be stopped one at a time
        // MediaStream.stop is deprecated in M47
        refs.desktopStream.getTracks().forEach((track) => {
            track.stop();
        });
        
        refs.desktopStream = undefined;
    }
    
    if (refs.desktopStreamUrl) {
        window.URL.revokeObjectURL(refs.desktopStreamUrl);
        refs.desktopStreamUrl = undefined;
    }
}

function createPreviewWindow() {
    var width = 400;
    var height = 266;
    
    createWindow('preview/preview.html', 'preview', width, height, {
        resizable: false,
        innerBounds: {
            minWidth: width,
            minHeight: height,
            maxWidth: width,
            maxHeight: height
        }
    }, function(appWindow) {
        refs.previewWindow = appWindow;
        appWindow.contentWindow.initPreview = initPreview;
    });
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

function createWebcamWindow() {
    var width = 400;
    var height = 266;
    
    createWindow('webcam/webcam.html', 'webcam', width, height, {
        alwaysOnTop: true
    }, function(appWindow) {
        refs.webcamWindow = appWindow;
        appWindow.setAlwaysOnTop(true);
    });
}

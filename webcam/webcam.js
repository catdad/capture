/* jshint browser: true, devel: true */
/* global chrome */

onload = function() {
    var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
    getUserMedia = getUserMedia.bind(navigator);
    
    getUserMedia({
        audio: true,
        video: true
    }, function success(stream) {
        initStream(stream);
    }, function error(err) {
        console.log(err);
    });
    
    function initStream(stream) {
        var video = document.querySelector('#js-video');
        var streamUrl = window.URL.createObjectURL(stream);
        video.src = streamUrl;

        stream.addEventListener('ended', function() {
            // revoke the blob url and remove the video source
            window.URL.revokeObjectURL(streamUrl);
            video.src = '';
        });
        
        video.addEventListener('loadeddata', function() {
            correctSize(video);
        });
    }
    
    function correctSize(video) {
        // size the window to match the size of the video feed
        var defaultBounds = chrome.app.window.current().innerBounds;
        var videoWidth = video.videoWidth;
        var videoHeight = video.videoHeight;

        // Chrome demands that these numbers be integers
        var newHeight = (videoHeight * defaultBounds.width / videoWidth) | 0;
        var newWidth = defaultBounds.width | 0;

        defaultBounds.setSize(newWidth, newHeight);
    }
};

/* jshint browser: true, devel: true */

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
    }
};

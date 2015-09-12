/* jshint browser: true, devel: true */
/* global chrome */

var greeting = document.querySelector('#greeting');
greeting.innerText = "Hello, World!";

var globalWriter = null;
var globalEntry = null;

/**
 * @description Chose a file location on the disk
 * @param {Function} callback
 */
function choseFile(callback) {
    var date = new Date();
    var name = ['video_capture', date.getDate(), (date.getMonth() + 1), date.getFullYear(), date.getTime()].join('_') + '.webm'; //'.txt';

    chrome.fileSystem.chooseEntry({
        type: 'saveFile',
        suggestedName: name
    }, function (writableFileEntry) {
        globalEntry = writableFileEntry;

        writableFileEntry.createWriter(function success(writer) {

            console.log('successfully created write file');

            // writer.write(new Blob(['this is a test'], {type: 'text/plain'}));
            globalWriter = writer;
        }, function error(err) {
            console.log('file writer error');

        });
    });
}

/**
 * @description Test writing text to a file.
 */
function write(text) {
    globalWriter.write(new Blob([text], {
        type: 'text/plain'
    }));
}

var chooseFileButton = document.querySelector('#chooseFile');
chooseFileButton.onclick = function () {
    choseFile(function (err, writer) {


    });
};


var globalStream = null;
var globalUrl = null;
var videoRequestId = null;
var video = document.querySelector('video');

var startVideo = document.querySelector('#startVideo');
startVideo.onclick = function () {
    videoRequestId = chrome.desktopCapture.chooseDesktopMedia(
    ['screen', 'window'],
        function success(id) {
            console.log('approved stream', id);

            navigator.webkitGetUserMedia({
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: id
                    }
                },
                audio: false
            }, function success(stream) {
                console.log('success getting video');
                globalStream = stream;

                video.src = globalUrl = window.URL.createObjectURL(stream);

                stream.onended = function () {
                    video.src = null;
                    console.log('video stream ended');
                };
            }, function error(err) {
                console.log('video stream error');
            });
        });
};

var stopVideo = document.querySelector('#stopVideo');
stopVideo.onclick = function () {
    console.log("cancel clicked");

    if (globalStream) {
        globalStream.stop();
    }

    if (videoRequestId) {
        console.log('cancelling stream', videoRequestId);
        chrome.desktopCapture.cancelChooseDesktopMedia(videoRequestId);
    }
};
/* jshint browser: true, devel: true */
/* global chrome */

var appWindow = chrome.app.window.current();

onload = function() {
    var $ = document.querySelector.bind(document);
    
    var origWidth = appWindow.innerBounds.width;
    var origHeight = appWindow.innerBounds.height;
    
    // set up close button
    var close = $('#js-close');
    close.onclick = window.close.bind(window);
    
    if (window.initControls) {
        window.initControls(window);
    }
    
    $('#js-menu').addEventListener('click', menuClick);
            
    function resizeWindow(width, height) {
        // Chrome demands that these numbers be integers
        width = width | 0;
        height = height | 0;
        
        var currentBounds = appWindow.innerBounds;
        
        currentBounds.setMinimumSize(width, height);
        currentBounds.setMaximumSize(width, height);
        currentBounds.setSize(width, height);
    }
    
    function menuClick(ev) {
        if (this.classList.contains('on')) {
            resizeWindow(origWidth, origHeight);
            this.classList.remove('on');
            $('body').classList.remove('extended');
        } else {
            resizeWindow(origWidth, origHeight + 300);
            this.classList.add('on');
            $('body').classList.add('extended');
        }
    }
};

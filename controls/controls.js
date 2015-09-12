/* jshint browser: true, devel: true */

onload = function() {
    var $ = document.querySelector.bind(document);
    
    // set up close button
    var close = $('#js-close');
    close.onclick = window.close.bind(window);
};

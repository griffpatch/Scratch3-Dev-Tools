const s = document.createElement('script');
// TODO: add "script.js" to web_accessible_resources in manifest.json
s.src = chrome.runtime.getURL('inject3.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);

/*
const s2 = document.createElement('script');
// TODO: add "math.js" to web_accessible_resources in manifest.json
s2.src = chrome.runtime.getURL('math.js');
s2.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s2);
*/



//Load project.bundle.js synchronously and insert code to expose the runtime module to the window
xhr = new window.XMLHttpRequest;
xhr.open('GET', 'https://scratch.mit.edu/js/projects.bundle.js?_=0', false);
xhr.send();
var text = xhr.responseText
var insertPos = text.search('this.runtime');
jsCode = text.slice(0,insertPos) + 'window.Runtime=t,' + text.slice(insertPos);
var blob = new Blob([jsCode], {
    type: 'text/javascript'
});

const s1 = document.createElement('script');
var url = (window.URL ? URL : webkitURL).createObjectURL(blob)
s1.setAttribute('src', url);
(document.head || document.documentElement).appendChild(s1);



const s2 = document.createElement('script');
// TODO: add "script.js" to web_accessible_resources in manifest.json
s2.src = chrome.runtime.getURL('inject3.js');
s2.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s2);

/*
const s3 = document.createElement('script');
// TODO: add "math.js" to web_accessible_resources in manifest.json
s3.src = chrome.runtime.getURL('math.js');
s3.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s3);
*/


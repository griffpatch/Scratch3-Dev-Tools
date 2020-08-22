const file_url = 'https://joeclinton1.github.io/Scratch3-Dev-Tools/projects.bundle.js'

chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        if( details.url == "https://scratch.mit.edu/js/projects.bundle.js" )
            return {
                redirectUrl: file_url,
            };
    },      
    {urls: ["*://scratch.mit.edu/*.js"]},
    ["blocking"]
);

chrome.webRequest.onHeadersReceived.addListener(
    function(details) {
        if( details.url == file_url)
            responseHeaders = details.responseHeaders.map(item => {
                if (item.name.toLowerCase() === 'access-control-allow-origin') {
                item.value = '*'
                }
            })
            
            return {
                responseHeaders
            };
    },      
    {urls: ["*://joeclinton1.github.io/*.js"]},
    ['blocking','responseHeaders', 'extraHeaders']
);
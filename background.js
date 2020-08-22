chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        if( details.url == "https://scratch.mit.edu/js/projects.bundle.js" )
            return {redirectUrl: "https://github.com/Joeclinton1/Scratch3-Dev-Tools/blob/master/projects.bundle.js" };
    },
    {urls: ["*://scratch.mit.edu/*.js"]},
    ["blocking"]
);
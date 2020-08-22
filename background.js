chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        if( details.url == "https://scratch.mit.edu/js/projects.bundle.js" )
            return {redirectUrl: "https://raw.githubusercontent.com/Joeclinton1/Scratch3-Dev-Tools/master/projects.bundle.js" };
    },
    {urls: ["*://scratch.mit.edu/*.js"]},
    ["blocking"]
);
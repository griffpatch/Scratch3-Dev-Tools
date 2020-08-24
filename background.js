chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        if( details.url == "https://scratch.mit.edu/js/projects.bundle.js" ){
            return {cancel: true};
        }else{
            return{};
        }
    },      
    {urls: ["*://scratch.mit.edu/*.js"]},
    ["blocking"]
);
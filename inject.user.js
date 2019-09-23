// ==UserScript==
// @name          Scratch 3 Developer Tools
// @namespace     https://github.com/griffpatch/Scratch3-Dev-Tools
// @version       1.0.1
// @description   ...to enhance your Scratch Editing Experience. Injects the code on the source code. Ported, based on the extension. (https://chrome.google.com/webstore/detail/scratch-3-developer-tools/phacniajokfchdcamjhonkbhlcipplno)
// @author        griffpatch, ported by Hans5958
// @match         http*://scratch.mit.edu/projects/editor
// @match         http*://scratch.mit.edu/projects/*
// @match         http*://scratch.mit.edu/projects/*/editor
// @updateURL     https://cdn.jsdelivr.net/gh/griffpatch/Scratch3-Dev-Tools/inject.user.js
// @icon          https://cdn.jsdelivr.net/gh/griffpatch/Scratch3-Dev-Tools/bigIcon.png
// @icon64        https://cdn.jsdelivr.net/gh/griffpatch/Scratch3-Dev-Tools/favicon.png
// @require       https://cdn.jsdelivr.net/gh/griffpatch/Scratch3-Dev-Tools/inject3.js
// @resource	  css https://cdn.jsdelivr.net/gh/griffpatch/Scratch3-Dev-Tools/inject.css
// @grant         GM_addStyle
// @grant         GM_getResourceText
// ==/UserScript==

GM_addStyle(GM_getResourceText("css"));

/*

Q: Where's the script?
A: It's on the @require. It takes the code directly on the repository. This is just an injection script.

*/
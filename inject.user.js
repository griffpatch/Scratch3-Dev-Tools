// ==UserScript==
// @name         Scratch 3 Developer Tools
// @namespace    https://github.com/griffpatch/Scratch3-Dev-Tools
// @version      1.0.0
// @description  ...to enhance your Scratch Editing Experience. Injects the code on the source code. Ported, based on the extension. (https://chrome.google.com/webstore/detail/scratch-3-developer-tools/phacniajokfchdcamjhonkbhlcipplno)
// @author       griffpatch, ported by Hans5958
// @match        http*://scratch.mit.edu/projects/editor
// @match        http*://scratch.mit.edu/projects/*
// @match        http*://scratch.mit.edu/projects/*/editor
// @icon         https://cdn.jsdelivr.net/gh/griffpatch/Scratch3-Dev-Tools/bigIcon.png
// @updateURL    https://cdn.jsdelivr.net/gh/griffpatch/Scratch3-Dev-Tools/inject.user.js
// @grant        none
// ==/UserScript==

var js = document.createElement('script')
js.src = 'https://cdn.jsdelivr.net/gh/griffpatch/Scratch3-Dev-Tools/inject3.js'

var css = document.createElement('link')
css.href = 'https://cdn.jsdelivr.net/gh/griffpatch/Scratch3-Dev-Tools/inject.css'
css.rel = 'stylesheet'

var head = document.getElementsByTagName('head')[0]
head.appendChild(js)
head.appendChild(css)
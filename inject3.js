console.log('Griffpatch Scratch Developer Tools Extension Handler');

function initGUI() {

    let find, findInp, ddOut, dd, wksp;

    function getWorkspace() {
        let wksp2 = Blockly.getMainWorkspace();
        if (wksp2.getToolbox()) {
            // Sadly get get workspace does not always return the 'real' workspace... Not sure how to get that at the moment,
            //  but we can work out whether it's the right one by whether it hsa a toolbox.
            wksp = wksp2;
        }
        return wksp;
    }

    /**
     * Fetch the scratch 3 block list
     * @returns jsonFetch object
     */
    function getScratchBlocks() {

        // Access Blockly!

        let myBlocks = [];

        // todo - get blockyly from an svg???
        
        let wksp = getWorkspace();
        let topBlocks = wksp.getTopBlocks();
        // console.log(topBlocks);

        function addBlock(cls, txt, root) {
            myBlocks.push({cls: cls, procCode: txt, labelID: root.id, y:root.getRelativeToSurfaceXY().y});
        }

        function getDescFromField(root) {
            let fields = root.inputList[0];
            let desc;
            for (const fieldRow of fields.fieldRow) {
                desc = (desc ? desc + ' ' : '') + fieldRow.getText();
            }
            return desc;
        }

        for(let i = 0; i < topBlocks.length; i++){
            let root = topBlocks[i];
            if (root.type === "procedures_definition") {
                let fields = root.inputList[0];
                let typeDesc = fields.fieldRow[0].getText();
                let label = root.getChildren()[0];
                let procCode = label.getProcCode();
                if (!procCode) {
                    continue;
                }
                addBlock('define', typeDesc + ' ' + procCode, root);
                continue;
            }

            if (root.type === "event_whenflagclicked") {
                addBlock('flag', getDescFromField(root), root);   // "When Flag Clicked"
                continue;
            }

            if (root.type === "event_whenbroadcastreceived") {
                //debugger;
                try {   // let wksp2 = Blockly.getMainWorkspace().getTopBlocks()[2].inputList[0].fieldRow[1];
                    let fields = root.inputList[0];
                    let typeDesc = fields.fieldRow[0].getText();
                    let eventName = fields.fieldRow[1].getText();
                    addBlock('receive', typeDesc + ' ' + eventName, root);
                } catch (e) {
                    // eat
                }
                continue;
            }

            if (root.type.substr(0, 6) === 'event_') {
                addBlock('event', getDescFromField(root), root);   // "When Flag Clicked"
                continue;
            }

            if (root.type === 'control_start_as_clone') {
                addBlock('event', getDescFromField(root), root);   // "when I start as a clone"
                continue;
            }

            // debugger;
        }

        const clsOrder = {flag:0, receive:1, event:2, define:3};
        
        myBlocks.sort(function (a, b) {
            let t = clsOrder[a.cls] - clsOrder[b.cls];
            if (t !== 0) {
                return t;
            }
            if (a.procCode < b.procCode) {
                return -1;
            }
            if (a.procCode > b.procCode) {
                return 1;
            }
            return a.y - b.y;
        });
        
        return {procs:myBlocks};
    }

    let rhdd = 0;

    function showDropDown() {
        clearTimeout(rhdd);
        rhdd = 0;

        if (ddOut.classList.contains('vis')) {
            return;
        }
        
        ddOut.classList.add('vis');
        let scratchBlocks = getScratchBlocks();
        dom_removeChildren(dd);
        
        let procs = scratchBlocks.procs;
        for (const proc of procs) {
            let li = document.createElement("li");
            li.innerText = proc.procCode;
            li.data = proc;
            li.className = proc.cls;
            dd.appendChild(li);
        }
    }
    
    function hideDropDown() {
        clearTimeout(rhdd);
        rhdd = setTimeout(reallyHideDropDown, 250);
    }
    
    function reallyHideDropDown() {
        
        // Check focus of find box
        if (findInp === document.activeElement) {
            hideDropDown();
            return;
        }
        
        ddOut.classList.remove('vis');
        rhdd = 0;
    }

    function dom_removeChildren(myNode) {
        while (myNode.firstChild) {
            myNode.removeChild(myNode.firstChild);
        }
    }

    function dropDownClick(e) {
        // console.log(e);

        let li = e.target;
        for (;;) {
            if (!li || li === dd) {
                return;
            }
            if (li.data) {
                break;
            }
            li = li.parentNode;
        }

        centerTop(li.data.labelID);
    }

    /**
     * Based on wksp.centerOnBlock(li.data.labelID);
     * @param e
     */
    function centerTop(e) {
        let wksp = getWorkspace();
        if (e = wksp.getBlockById(e)) {
            
            let ePos = e.getRelativeToSurfaceXY(),
                eSiz = e.getHeightWidth(),
                scale = wksp.scale,

                x = (ePos.x + (wksp.RTL ? -1 : 1) * eSiz.width / 2) * scale,
                y = ePos.y * scale,
                yh = eSiz.height * scale,

                s = wksp.getMetrics(),

                sx = s.contentLeft + s.viewWidth / 2 - x,
                // sy = s.contentTop - y + Math.max(Math.min(32, 32 * scale), (s.viewHeight - yh) / 2);
                sy = s.contentTop - y + Math.min(32, 32 * scale);

            // wksp.hideChaff(),
            wksp.scrollbar.set(-sx, -sy);
        }        
    }

    function enc(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    
    function inputChange(e) {

        if (!ddOut.classList.contains('vis')) {
            showDropDown();
            hideDropDown();
        }

        // Filter the list...
        let val = (findInp.value || '').toLowerCase();

        let listLI = dd.getElementsByTagName('li');
        for (const li of listLI) {
            let procCode = li.data.procCode;
            let i = procCode.toLowerCase().indexOf(val);
            if (i >= 0) {
                li.style.display = 'block';
                li.innerHTML = enc(procCode.substring(0, i)) + '<b>' + enc(procCode.substr(i, val.length)) + "</b>" + enc(procCode.substr(i + val.length));
            } else {
                li.style.display = 'none';
            }
        }
    }

    function navigateFilter(dir) {
        let sel = dd.getElementsByClassName('sel');
        let nxt = null;
        if (sel.length > 0 && sel[0].style.display === 'block') {
            nxt = dir === -1 ? sel[0].previousSibling : sel[sel.length - 1].nextSibling;
        } else {
            nxt = dd.children[0];
            dir = 1;
        }
        while (nxt && nxt.style.display !== 'block') {
            nxt = dir === -1 ? nxt.previousSibling : nxt.nextSibling;
        }
        if (nxt) {
            for (const i of sel) {
                i.classList.remove("sel");
            }
            nxt.classList.add('sel');
            centerTop(nxt.data.labelID);
        }
    }

    function inputKeyDown(e) {
        if (e.keyCode === 38) {
            navigateFilter(-1);
        }
        if (e.keyCode === 40) {
            navigateFilter(1);
        }
        if (e.keyCode === 13) { // Enter
            // Any selected on enter? if not select now
            let sel = dd.getElementsByClassName('sel');
            if (sel.length === 0) {
                navigateFilter(1);
            }
            document.activeElement.blur();
        }
        if (e.keyCode === 27) { // Escape
            if (findInp.value.length > 0) {
                findInp.value = ''; // Clear search first, then close on second press
                inputChange(e);
            } else {
                document.activeElement.blur();
            }
        }
    }
    
    // Loop until the DOM is ready for us...
    
    function initInner() {
        let tab = document.getElementById('react-tabs-0');
        if (!tab) {
            setTimeout(initInner, 1000);
            return;
        }
    
        let root = tab.parentNode;
        root.insertAdjacentHTML('beforeend', "<label class='title' id=s3devFindLabel><span>Find </span><span id=s3devFind><div id='s3devDDOut'><input id='s3devInp' type='search' placeholder='Find (Ctrl+F)' autocomplete='off'><ul id='s3devDD'></ul></div></span></label>");

        find = document.getElementById('s3devFind');
        findInp = document.getElementById('s3devInp');
        ddOut = document.getElementById('s3devDDOut');
        ddOut.addEventListener('click', dropDownClick);
        dd = document.getElementById('s3devDD');
        
        find.addEventListener('mouseenter', showDropDown);
        find.addEventListener('mouseleave', hideDropDown);
        findInp.addEventListener('keyup', inputChange);
        findInp.addEventListener('keydown', inputKeyDown);
        findInp.addEventListener('focus', inputChange);
        
        document.addEventListener('keydown', function (e) {
            // Override default Ctrl+F find
            if (document.URL.indexOf('editor') > 0 && e.key === 'f' && e.ctrlKey) {
                findInp.focus();
                findInp.select();
                e.cancelBubble = true;
                e.preventDefault();
                return true;
            }
        })
    }
    setTimeout(initInner, 1000);
}

initGUI();
//getScratchBlocks();

// Later, you can stop observing
// observer.disconnect();
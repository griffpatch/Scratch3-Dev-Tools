console.log('Griffpatch Scratch Developer Tools Extension Handler');

function initGUI() {

    let find, findInp, ddOut, dd, wksp, offsetX, offsetY;

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
        let myBlocksByProcCode = {};

        // todo - get blockyly from an svg???

        let wksp = getWorkspace();
        let topBlocks = wksp.getTopBlocks();
        // console.log(topBlocks);

        /**
         * @param cls
         * @param txt
         * @param root
         * @returns {{clones: null, procCode: *, labelID: *, lower: *, y: number, cls: *}|*}
         */
        function addBlock(cls, txt, root) {
            let id = root.id ? root.id : root.getId ? root.getId() : null;
            let clone = myBlocksByProcCode[txt];
            if (clone) {
                if (!clone.clones) {
                    clone.clones = [];
                }
                clone.clones.push(id);
                return clone;
            }
            let items = {cls: cls, procCode: txt, labelID: id, y: 0, lower: txt.toLowerCase(), clones:null};
            items.y = root.getRelativeToSurfaceXY ? root.getRelativeToSurfaceXY().y : null;
            myBlocks.push(items);
            myBlocksByProcCode[txt] = items;
            return items;
        }

        function getDescFromField(root) {
            let fields = root.inputList[0];
            let desc;
            for (const fieldRow of fields.fieldRow) {
                desc = (desc ? desc + ' ' : '') + fieldRow.getText();
            }
            return desc;
        }

        for (const root of topBlocks) {
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
                    addBlock('receive', typeDesc + ' ' + eventName, root).eventName = eventName;
                } catch (e) {
                    // eat
                }
                continue;
            }

            if (root.type.substr(0, 10) === 'event_when') {
                addBlock('event', getDescFromField(root), root);   // "When Flag Clicked"
                continue;
            }

            if (root.type === 'control_start_as_clone') {
                addBlock('event', getDescFromField(root), root);   // "when I start as a clone"
                continue;
            }

            // debugger;
        }

        let map = wksp.getVariableMap();

        let vars = map.getVariablesOfType('');
        for (const row of vars) {
            addBlock((row.isLocal ? "var" : "VAR"), (row.isLocal ? "var " : "VAR ") + row.name, row);
        }

        let lists = map.getVariablesOfType('list');
        for (const row of lists) {
            addBlock((row.isLocal ? "list" : "LIST"), (row.isLocal ? "list " : "LIST ") + row.name, row);
        }

        const clsOrder = {flag:0, receive:1, event:2, define:3, var:4, VAR:5, list:6, LIST:7};

        myBlocks.sort(function (a, b) {
            let t = clsOrder[a.cls] - clsOrder[b.cls];
            if (t !== 0) {
                return t;
            }
            if (a.lower < b.lower) {
                return -1;
            }
            if (a.lower > b.lower) {
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

        prevVal = null;   // Clear the previous value of the input search

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

        let label = document.getElementById('s3devFindLabel');
        offsetX = ddOut.getBoundingClientRect().right - label.getBoundingClientRect().left + 26;
        offsetY = 32;
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

    /**
     * A nicely ordered version of the top blocks
     * @returns {[]}
     */
    function getTopBlocks() {
        let columns = getOrderedTopBlockColumns();
        let topBlocks = [];
        for (const col of columns) {
            topBlocks = topBlocks.concat(col.blocks);
        }
        return topBlocks;
    }

    /**
     * A much nicer way of laying out the blocks into columns
     */
    function doCleanUp() {
        let columns = getOrderedTopBlockColumns(true);
        let cursorX = 48;

        for (const column of columns) {
            let cursorY = 64;
            let maxWidth = 0;

            for (const block of column.blocks) {
                let xy = block.getRelativeToSurfaceXY();
                block.moveBy(cursorX - xy.x, cursorY - xy.y);
                let heightWidth = block.getHeightWidth();
                cursorY += heightWidth.height + 72;
                maxWidth = Math.max(maxWidth, heightWidth.width);
            }

            cursorX += maxWidth + 96;
        }
    }

    /**
     * Badly Ophaned - might want to delete these!
     * @param topBlock
     * @returns {boolean}
     */
    function isBlockAnOrphan(topBlock) {
        if (topBlock.getOutputShape() && !topBlock.getSurroundParent()) {
            return true;
        }
        return false;
    }

    /**
     * Split the top blocks into ordered columns
     * @param separateOrphans true to keep all orphans separate
     * @returns {[]}
     */
    function getOrderedTopBlockColumns(separateOrphans) {
        let w = getWorkspace();
        let topBlocks = w.getTopBlocks();
        // Default scratch ordering is horrid... Lets try something more clever.

        let cols = [];
        const TOLERANCE = 256;
        let orphans = {x:-999999, count:0, blocks:[]};

        for (const topBlock of topBlocks) {
            // let r = b.getBoundingRectangle();
            let position = topBlock.getRelativeToSurfaceXY();
            let bestCol = null;
            let bestError = TOLERANCE;

            if (separateOrphans && isBlockAnOrphan(topBlock)) {
                orphans.blocks.push(topBlock);
                continue;
            }

            // Find best columns
            for (const col of cols) {
                let err = Math.abs(position.x - col.x);
                if (err < bestError) {
                    bestError = err;
                    bestCol = col;
                }
            }

            if (bestCol) {
                // We found a column that we fitted into
                bestCol.x = (bestCol.x * bestCol.count + position.x) / ++bestCol.count;    // re-average the columns as more items get added...
                bestCol.blocks.push(topBlock);
            } else {
                // Create a new column
                cols.push({x:position.x,count:1,blocks:[topBlock]});
            }
        }

        if (orphans.blocks.length > 0) {
            cols.push(orphans);
        }

        // Sort columns, then blocks inside the columns
        cols.sort(function (a, b) {return a.x - b.x;});
        for (const col of cols) {
            col.blocks.sort(function (a, b) {return a.getRelativeToSurfaceXY().y - b.getRelativeToSurfaceXY().y;});
        }

        return cols;
    }

    /**
     * Find all the uses of a named variable.
     * @param {string} id ID of the variable to find.
     * @return {!Array.<!Blockly.Block>} Array of block usages.
     */
    function getVariableUsesById(id) {
        let uses = [];

        let topBlocks = getTopBlocks(true);
        for (const topBlock of topBlocks) {
            let kids = topBlock.getDescendants();
            for (const block of kids) {
                let blockVariables = block.getVarModels();
                if (blockVariables) {
                    for (const blockVar of blockVariables) {
                        if (blockVar.getId() === id) {
                            uses.push(block);
                        }
                    }
                }
            }
        }

        return uses;
    }

    /**
     * Find all the uses of a named procedure.
     * @param {string} id ID of the variable to find.
     * @return {!Array.<!Blockly.Block>} Array of block usages.
     */
    function getCallsToProcedureById(id) {
        let w = getWorkspace();
        let procBlock = w.getBlockById(id);
        let label = procBlock.getChildren()[0];
        let procCode = label.getProcCode();

        let uses = [procBlock]; // Definition First, then calls to it
        let topBlocks = getTopBlocks(true);
        for (const topBlock of topBlocks) {
            let kids = topBlock.getDescendants();
            for (const block of kids) {
                if (block.type === "procedures_call") {
                    if (block.getProcCode() === procCode) {
                        uses.push(block);
                    }
                }
            }
        }

        return uses;
    }

    /**
     * Find all the uses of a named procedure.
     * @param {string} id ID of the variable to find.
     * @return {!Array.<!Blockly.Block>} Array of block usages.
     */
    function getCallsToEventsByName(name) {
        let uses = []; // Definition First, then calls to it
        let topBlocks = getTopBlocks(true);
        for (const topBlock of topBlocks) {
            let kids = topBlock.getDescendants();
            for (const block of kids) {
                if (block.type === "event_broadcast" || block.type === "event_broadcastandwait") {
                    if (name === block.getChildren()[0].inputList[0].fieldRow[0].getText()) {
                        uses.push(block);
                    }
                }
            }
        }

        return uses;
    }

    function buildNavigationCarosel(nav, li, blocks) {
        if (nav && nav.parentNode === li) {
            // Same control... click again to go to next
            multi.navRight();
        } else {
            if (nav) {
                nav.remove();
            }
            li.insertAdjacentHTML('beforeend', `
                    <span id="s3devMulti" class="s3devMulti">
                        <span id="s3devMultiLeft" class="s3devNav">◀</span><span id="s3devMultiCount"></span><span id="s3devMultiRight" class="s3devNav">▶</span>
                    </span>
                `);
            document.getElementById('s3devMultiLeft').addEventListener("click", multi.navLeft);
            document.getElementById('s3devMultiRight').addEventListener("click", multi.navRight);

            multi.idx = 0;
            multi.blocks = blocks;
            multi.update();

            if ((blocks.length > 0)) {
                centerTop(blocks[0]);
            }
        }
    }

    function dropDownClick(e) {
        // console.log(e);
        let workspace = getWorkspace();

        if (prevVal === null) {
            prevVal = findInp.value;   // Hack to stop filter change if not entered data into edt box, but clicked on row
        }

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

        // If this was a mouse click, unselect the keyboard selection
        // e.navKey is set when this is called from the keyboard handler...
        if (!e.navKey) {
            let sel = dd.getElementsByClassName('sel');
            sel = sel.length > 0 ? sel[0] : null;
            if (sel && sel !== li) {
                try {
                    sel.classList.remove('sel');
                } catch (e) {
                    console.log(sel);
                    console.error(e);
                }
            }
            if (li !== sel) {
                li.classList.add('sel');
            }
        }

        let nav = document.getElementById('s3devMulti');

        let cls = li.data.cls;
        if (cls === 'var' || cls === 'VAR' || cls === 'list' || cls === 'LIST') {

            // Search now for all instances
            // let wksp = getWorkspace();
            // let blocks = wksp.getVariableUsesById(li.data.labelID);
            let blocks = getVariableUsesById(li.data.labelID);
            buildNavigationCarosel(nav, li, blocks);

        } else if (cls === 'define') {
            let blocks = getCallsToProcedureById(li.data.labelID);
            buildNavigationCarosel(nav, li, blocks);

        } else if (cls === 'receive') {
            let blocks = [workspace.getBlockById(li.data.labelID)];
            if (li.data.clones) {
                for (const cloneID of li.data.clones) {
                    blocks.push(workspace.getBlockById(cloneID))
                }
            }
            blocks = blocks.concat(getCallsToEventsByName(li.data.eventName));
            buildNavigationCarosel(nav, li, blocks);

        } else if (li.data.clones) {
            let blocks = [workspace.getBlockById(li.data.labelID)];
            for (const cloneID of li.data.clones) {
                blocks.push(workspace.getBlockById(cloneID))
            }
            buildNavigationCarosel(nav, li, blocks);

        } else {

            multi.blocks = null;
            centerTop(li.data.labelID);
            if (nav) {
                nav.remove();
            }
        }
    }

    let multi = {
        idx: 0,
        blocks: null,
        update: function () {
            let count = document.getElementById('s3devMultiCount');
            count.innerText = multi.blocks && multi.blocks.length > 0 ? enc((multi.idx + 1) + " / " + multi.blocks.length) : "0"
        },
        navLeft: function(e) { return multi.navSideways(e, -1); },
        navRight: function(e) { return multi.navSideways(e, 1); },
        navSideways: function(e, dir) {
            if (multi.blocks && multi.blocks.length > 0) {
                multi.idx = (multi.idx + dir + multi.blocks.length) % multi.blocks.length; // + length to fix negative modulo js issue.
                multi.update();
                centerTop(multi.blocks[multi.idx]);
            }
            if (e) {
                e.cancelBubble = true;
                e.preventDefault();
            }
            return true;
        }
    };

    let myFlash = {block:null, timerID:null, colour:null};
    let myFlashTimer;

    /**
     * Based on wksp.centerOnBlock(li.data.labelID);
     * @param e
     * @param force if true, the view always moves, otherwise only move if the selected element is not entirely visible
     */
    function centerTop(e, force) {
        let wksp = getWorkspace();
        if (e = (e && e.id ? e : wksp.getBlockById(e))) {

            let root = e.getRootBlock();
            let base = e;
            while (base.getOutputShape() && base.getSurroundParent()) {
                base = base.getSurroundParent();
            }

            let ePos = base.getRelativeToSurfaceXY(),   // Align with the top of the block
                rPos = root.getRelativeToSurfaceXY(),   // Align with the left of the block 'stack'
                eSiz = e.getHeightWidth(),
                scale = wksp.scale,

                // x = (ePos.x + (wksp.RTL ? -1 : 1) * eSiz.width / 2) * scale,
                x = rPos.x * scale,
                y = ePos.y * scale,

                xx = e.width + x,   // Turns out they have their x & y stored locally, and they are the actual size rather than scaled or including children...
                yy = e.height + y,
                // xx = eSiz.width * scale + x,
                // yy = eSiz.height * scale + y,

                s = wksp.getMetrics();

            // On screen?

                // ratio = wksp.scrollbar.hScroll.ratio_;
            // w.scrollbar.hScroll.scrollViewSize_

            if (x < s.viewLeft + offsetX - 4 || xx > s.viewLeft + s.viewWidth || y < s.viewTop + offsetY - 4 || yy > s.viewTop + s.viewHeight) {

                // sx = s.contentLeft + s.viewWidth / 2 - x,
                let sx = x - s.contentLeft - offsetX,
                    // sy = s.contentTop - y + Math.max(Math.min(32, 32 * scale), (s.viewHeight - yh) / 2);
                    sy = y - s.contentTop - offsetY;

                // wksp.hideChaff(),
                wksp.scrollbar.set(sx, sy);
            }

            if (myFlash.timerID > 0) {
                clearTimeout(myFlash.timerID);
                myFlash.block.setColour(myFlash.colour);
            }

            let count = 4;
            let flashOn = true;
            myFlash.colour = e.getColour();
            myFlash.block = e;

            function flash() {
                // wksp.glowBlock(e.id, flashOn);
                myFlash.block.setColour(flashOn ? "#ffff80" : myFlash.colour);
                flashOn = !flashOn;
                count--;
                if (count > 0) {
                    myFlash.timerID = setTimeout(flash, 200);
                } else {
                    myFlash.timerID = 0;
                }
            }

            flash();
        }
    }

    function enc(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    let prevVal = '';

    function inputChange(e) {

        if (!ddOut.classList.contains('vis')) {
            showDropDown();
            hideDropDown(); // Start timer to hide if not got focus
        }

        // Filter the list...
        let val = (findInp.value || '').toLowerCase();
        if (val === prevVal) {
            return;
        }

        prevVal = val;
        multi.blocks = null;

        let listLI = dd.getElementsByTagName('li');
        for (const li of listLI) {
            let procCode = li.data.procCode;
            let i = li.data.lower.indexOf(val);
            if (i >= 0) {
                li.style.display = 'block';
                dom_removeChildren(li);
                if (i > 0) {
                    li.appendChild(document.createTextNode(procCode.substring(0, i)));
                }
                let bText = document.createElement('b');
                bText.appendChild(document.createTextNode(procCode.substr(i, val.length)));
                li.appendChild(bText);
                if (i + val.length < procCode.length) {
                    li.appendChild(document.createTextNode(procCode.substr(i + val.length)));
                }
                // li.innerHTML = enc(procCode.substring(0, i)) + '<b>' + enc(procCode.substr(i, val.length)) + "</b>" + enc(procCode.substr(i + val.length));
            } else {
                li.style.display = 'none';
            }
        }
    }

    function navigateFilter(dir) {
        let sel = dd.getElementsByClassName('sel');
        let nxt = null;
        if (sel.length > 0 && sel[0].style.display !== 'none') {
            nxt = dir === -1 ? sel[0].previousSibling : sel[sel.length - 1].nextSibling;
        } else {
            nxt = dd.children[0];
            dir = 1;
        }
        while (nxt && nxt.style.display === 'none') {
            nxt = dir === -1 ? nxt.previousSibling : nxt.nextSibling;
        }
        if (nxt) {
            for (const i of sel) {
                i.classList.remove("sel");
            }
            nxt.classList.add('sel');
            dropDownClick({target:nxt, navKey:true});
            // centerTop(nxt.data.labelID);
        }
    }

    function inputKeyDown(e) {
        if (e.keyCode === 38) {
            navigateFilter(-1);
            e.preventDefault();
            return;
        }
        if (e.keyCode === 40) {
            navigateFilter(1);
            e.preventDefault();
            return;
        }
        if (e.keyCode === 37) {
            let sel = dd.getElementsByClassName('sel');
            if (sel && multi.blocks) {
                multi.navLeft(e);
            }
        }
        if (e.keyCode === 39) {
            let sel = dd.getElementsByClassName('sel');
            if (sel && multi.blocks) {
                multi.navRight(e);
            }
        }
        if (e.keyCode === 13) { // Enter
            // Any selected on enter? if not select now
            let sel = dd.getElementsByClassName('sel');
            if (sel.length === 0) {
                navigateFilter(1);
            }
            document.activeElement.blur();
            e.preventDefault();
            return;
        }
        if (e.keyCode === 27) { // Escape
            if (findInp.value.length > 0) {
                findInp.value = ''; // Clear search first, then close on second press
                inputChange(e);
            } else {
                document.activeElement.blur();
            }
            e.preventDefault();
            return;
        }
    }

    function deepSearch(e) {

        let selected = document.querySelector('[class*=sprite-selector-item_is-selected_]');
        let wksp = getWorkspace();
        let myTopBlocks = wksp.getTopBlocks();

        let dict = {};

        wksp.setVisible(false);

        document.body.insertAdjacentHTML('beforeend', `
            <div id="s3devOverlay">
            </div>
        `);

        let overlay = document.getElementById("s3devOverlay");
        let sprites = document.querySelectorAll('[class*=sprite-selector_sprite_]');
        let sprite = null, name = null;
        let i = -1;

        function nextSprite() {
            if (sprite !== null) {
                let topBlocks;
                if (sprite === selected) {
                    topBlocks = myTopBlocks;
                } else {
                    sprite.click();
                    topBlocks = wksp.getTopBlocks();
                }

                dict[name] = topBlocks;
            }

            if (++i >= sprites.length) {
                selected.click();   // Back to first -- todo: watch out for background selection
                wksp.setVisible(true);
                return overlay.remove();
            }

            sprite = sprites[i];
            name = sprite.querySelector('[class*=sprite-selector-item_sprite-name]').textContent;

            console.log('Loading ' + name);
            let divElement = document.createElement("div");
            divElement.appendChild(document.createTextNode("Searching in " + name));
            overlay.appendChild(divElement);

            setTimeout(nextSprite, 50);
        }

        nextSprite();

        // for (const sprite of sprites) {
        // }

        e.preventDefault();
        return true;
    }

    function setHex() {
        let input = document.getElementById("s3devColorPickerHexinput").value;
        console.log(input)
        if (input.length != 7 || input.charAt(0) != '#') {
            document.getElementById("s3DevHexColorOutput").innerHTML = "Incorrect"
            document.getElementById("s3DevHSLColorOutput").style.display = "none";
            return
        } else {
            try {
                let hex = hexToHSV(input);
                document.getElementById("s3DevHSLColorOutputC").innerHTML = "Color: " + hex[0]
                document.getElementById("s3DevHSLColorOutputS").innerHTML = "Saturation: " + hex[1]
                document.getElementById("s3DevHSLColorOutputB").innerHTML = "Brightness: " + hex[2]
                document.getElementById("s3DevHexColorOutput").innerHTML = ""
                document.getElementById("s3DevHSLColorOutput").style.display = "block";
            } catch (error) {
                document.getElementById("s3DevHSLColorOutput").style.display = "none";
                document.getElementById("s3DevHexColorOutput").innerHTML = "Incorrect"
            }
        }

    }

    function rgb2hsv(r, g, b) {
        var computedH = 0;
        var computedS = 0;
        var computedV = 0;

        //remove spaces from input RGB values, convert to int
        var r = parseInt(('' + r).replace(/\s/g, ''), 10);
        var g = parseInt(('' + g).replace(/\s/g, ''), 10);
        var b = parseInt(('' + b).replace(/\s/g, ''), 10);

        if (r == null || g == null || b == null ||
            isNaN(r) || isNaN(g) || isNaN(b)) {
            alert('Please enter numeric RGB values!');
            return;
        }
        if (r < 0 || g < 0 || b < 0 || r > 255 || g > 255 || b > 255) {
            alert('RGB values must be in the range 0 to 255.');
            return;
        }
        r = r / 255; g = g / 255; b = b / 255;
        var minRGB = Math.min(r, Math.min(g, b));
        var maxRGB = Math.max(r, Math.max(g, b));

        // Black-gray-white
        if (minRGB == maxRGB) {
            computedV = minRGB;
            return [0, 0, computedV];
        }

        // Colors other than black-gray-white:
        var d = (r == minRGB) ? g - b : ((b == minRGB) ? r - g : b - r);
        var h = (r == minRGB) ? 3 : ((b == minRGB) ? 1 : 5);
        computedH = 60 * (h - d / (maxRGB - minRGB));
        computedS = (maxRGB - minRGB) / maxRGB;
        computedV = maxRGB;
        return [computedH, Math.round(computedS * 100), Math.round(computedV * 100)];
    }
    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    function hexToHSV(hex) {
        var rgb = hexToRgb(hex);
        var hsv = rgb2hsv(rgb['r'], rgb['g'], rgb['b'])
        console.log(hsv);
        return [Math.round((hsv[0]/360)*100), hsv[1], hsv[2]];
    }

    function initColorBar() {
        let colorBar = document.getElementsByClassName('Popover-body')[0];
        console.log("colorBar" + colorBar)
        if (!colorBar) {
            setTimeout(initColorBar, 1000);
            return;
        } else {
            let hexInput = document.getElementById("s3devColorPickerHexinput");
            console.log("hexInput" + hexInput)
            if (!hexInput) {
                let s3devColorPickerHexinput = document.createElement("input");
                s3devColorPickerHexinput.id = "s3devColorPickerHexinput";
                s3devColorPickerHexinput.addEventListener("change", function() {setHex()});
                s3devColorPickerHexinput.placeholder = "Hex Color Code";
                let s3DevHexColorOutput = document.createElement("span");
                s3DevHexColorOutput.id = "s3DevHexColorOutput";
                let s3DevHSLColorOutput = document.createElement("div");
                s3DevHSLColorOutput.id = "s3DevHSLColorOutput";
                let s3DevHSLColorOutputC = document.createElement("span");
                s3DevHSLColorOutputC.id = "s3DevHSLColorOutputC";
                let s3DevHSLColorOutputS = document.createElement("span");
                s3DevHSLColorOutputS.id = "s3DevHSLColorOutputS";
                let s3DevHSLColorOutputB = document.createElement("span");
                s3DevHSLColorOutputB.id = "s3DevHSLColorOutputB";
                s3DevHSLColorOutput.appendChild(s3DevHSLColorOutputC);
                s3DevHSLColorOutput.appendChild(document.createElement("br"));
                s3DevHSLColorOutput.appendChild(s3DevHSLColorOutputS);
                s3DevHSLColorOutput.appendChild(document.createElement("br"));
                s3DevHSLColorOutput.appendChild(s3DevHSLColorOutputB);
                colorBar.appendChild(s3devColorPickerHexinput);
                colorBar.appendChild(document.createElement("br"));
                colorBar.appendChild(s3DevHSLColorOutput);
                colorBar.appendChild(document.createElement("br"));
                colorBar.appendChild(s3DevHexColorOutput);
            }
        }
        document.getElementById("s3DevHSLColorOutput").style.display = "none";
        document.querySelector('[class*=color-button_color-button_]').addEventListener("click", function () { initColorBar(); });
        document.getElementById("react-tabs-2").addEventListener("click", function () { initColorBar(); });
    }

    //
    //
    //
    // Loop until the DOM is ready for us...

    function initInner() {
        let tab = document.getElementById('react-tabs-0');
        if (!tab) {
            setTimeout(initInner, 1000);
            return;
        }

        let root = tab.parentNode;
        root.insertAdjacentHTML('beforeend', `
            <div id="s3devToolBar">
                <label class='title' id=s3devFindLabel>
                    <span>Find </span>
                    <span id=s3devFind>
                        <div id='s3devDDOut'>
                            <input id='s3devInp' type='search' placeholder='Find (Ctrl+F)' autocomplete='off'>
                            <ul id='s3devDD'></ul>
                        </div>
                    </span>
                    <a id="s3devDeep" href="#">Deep</a>
                    <a id="s3devCleanUp" href="#">Clean Up</a>
                </label>
            </div>
        `);

        //                 <span id="s3devMulti">
        //                     <span id="s3devMultiLeft" class="s3devNav">◀</span>
        //                     <span id="s3devMultiCount"></span>
        //                     <span id="s3devMultiRight" class="s3devNav">▶</span>
        //                 </span>

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
        });

        document.getElementById('s3devDeep').addEventListener('click', deepSearch);
        document.getElementById('s3devCleanUp').addEventListener('click', function (e) {
            if (window.confirm('Griffpatch: Tidy up your scripts?')) {
                doCleanUp();
            }
            e.preventDefault();
            return false;
        });
    }

    setTimeout(initInner, 1000);
    setTimeout(initColorBar, 1000);
}

initGUI();
//getScratchBlocks();

// Later, you can stop observing
// observer.disconnect();

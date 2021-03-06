/*
 * TOCit! Bookmarklet
 *
 * Displays table of contents (TOC) of the page it runs on as a dropdown list.
 * Intended for use in Firefox.
 *
 * Home: <http://www.runeskaug.com/greasemonkey/autotoc.user.js>
 *          Creative Commons Attribution License
 *          http://creativecommons.org/licenses/by/2.5/
 * 
 * Modified by Eugene Arshinov to track page scrolling and accordingly update
 * the item selected in the TOC.
 */

var fullTOCText = "-- Table of Contents --";
var hideBtnText = "\u00a0X\u00a0";
var RXmatch = /^h[1-4]$/i;
var XPmatch = "//h1|//h2|//h3|//h4|//h5|//h6";
var resetSelect = true;
var showHide = true;
var useCookie = true;
var trackScrolling = true;

function f() {
    if (document.getElementsByTagName("html").length && (
            document.getElementsByTagName('h1').length ||
            document.getElementsByTagName('h2').length ||
            document.getElementsByTagName('h3').length ||
            document.getElementsByTagName('h4').length ||
            document.getElementsByTagName('h5').length ||
            document.getElementsByTagName('h6').length) && (
            !useCookie || (useCookie && getCookie('autotoc_hide') != 'true'))) {

        var aHs = getHTMLHeadings();
        if (aHs.length == 0)
            return;

        var tocSelect = document.getElementById('js-toc');
        if (tocSelect)
            tocSelect.style.removeProperty('display');
        else {

            var body = document.getElementsByTagName('body')[0];
            body.style.marginBottom = "24px !important";
            addCSS('@media print { #js-toc {display: none;visibility: hidden;}}\n' + '@media screen { #js-toc {position: fixed;left: 0;right: 0;top: auto;bottom: 0;width: 100%;display: block;border-top: 1px solid #777;background: #ddd;margin: 0;padding: 3px;z-index: 9999;}\n' + '#js-toc select { font: 8pt verdana, sans-serif;margin: 0;margin-left:5px;background: #fff;color: #000;float: left;padding: 0;vertical-align: bottom;}\n' + '#js-toc option { font: 8pt verdana, sans-serif;color: #000;}\n' + '#js-toc .hideBtn { font: bold 8pt verdana, sans-serif !important;float: left;margin-left: 2px;margin-right: 2px;padding: 1px;border: 1px solid #999;background: #e7e7e7;}\n' + '#js-toc .hideBtn a { color: #333;text-decoration: none;background: transparent;} #js-toc .hideBtn a:hover { color: #333;text-decoration: none;background: transparent;}}');

            var toc = document.createElement(window.opera || showHide ? 'tocdiv' : 'div');
            toc.id = 'js-toc';
            document.body.appendChild(toc);

            if (showHide) {
                var hideDiv = document.createElement('div');
                hideDiv.setAttribute('class', 'hideBtn');
                var hideLink = document.createElement('a');
                hideLink.setAttribute("href", "#");
                hideLink.setAttribute("onclick", "document.getElementById('js-toc').style.display = 'none'; return false;");
                hideLink.appendChild(document.createTextNode(hideBtnText));
                hideDiv.appendChild(hideLink);
                toc.appendChild(hideDiv);
            }

            tocSelect = document.createElement('select');
            tocSelect.setAttribute("onchange", "if(this.value){function flash(rep,delay) { for (var i=rep;i>0;i--) {window.setTimeout('el.style.background=\"#ff7\";',delay*i*2);window.setTimeout('el.style.background=elbg',delay*((i*2)+1));};};elid=this.value;el=document.getElementById(elid);elbg=el.style.background;location.href='#'+elid;flash(5,100);" + (resetSelect ? "this.selectedIndex=0;}" : "}"));
            tocSelect.id = 'toc-select';
            toc.appendChild(tocSelect);

            var tocEmptyOption = document.createElement('option');
            tocEmptyOption.setAttribute('value', '');
            tocEmptyOption.appendChild(document.createTextNode(fullTOCText));
            tocSelect.appendChild(tocEmptyOption);

            for (var i = 0, aH; aH = aHs[i]; i++) {
                if (aH.offsetWidth) {
                    var refID = aH.id ? aH.id : aH.tagName + '-' + (i * 1 + 1);
                    aH.id = refID;

                    var op = document.createElement("option");
                    op.appendChild(document.createTextNode(gs(aH.tagName) + getInnerText(aH).substring(0, 100)));
                    op.setAttribute("value", refID);
                    tocSelect.appendChild(op);
                }
            }

            if (trackScrolling)
                document.onscroll = function() {
                    updateActiveHeading(tocSelect, aHs);
                };
        }

        if (trackScrolling)
                updateActiveHeading(tocSelect, aHs);
    }
}

function updateActiveHeading(tocSelect, aHs) {
    function callback(aH) { return aH.offsetTop <= window.scrollY; }
    /* Will work for most pages where vertical scrollbar is
     * attached to the whole window (not to a particular block
     * with, for example, fixed height and overflow: auto) */
    var i = upperBound(aHs, 0, aHs.length - 1, callback);
    tocSelect.value = callback(aHs[i]) ? aHs[i].id : "";
}

function upperBound(a, begin, end, callback) {
    if (begin === end)
        return begin;
    var i = begin + Math.ceil((end - begin) / 2);
    callback(a[i]) ? begin = i : end = i - 1;
    return upperBound(a, begin, end, callback);
}

function autoTOC_toggleDisplay() {
    if (document.getElementById('js-toc')) {
        if (document.getElementById('js-toc').style.display == 'none') {
            document.getElementById('js-toc').style.display = 'block';
            if (useCookie) {
                document.cookie = 'autotoc_hide=;path=/';
            }
        } else {
            document.getElementById('js-toc').style.display = 'none';
            if (useCookie) {
                document.cookie = 'autotoc_hide=true;path=/';
            }
        }
    } else {
        if (useCookie) {
            document.cookie = 'autotoc_hide=;path=/';
        }
        f();
    }
}

function getHTMLHeadings() {
    function acceptNode(node) {
        if (node.tagName.match(RXmatch)) {
            if (node.value + '' != '') {
                return NodeFilter.FILTER_ACCEPT;
            }
        }
        return NodeFilter.FILTER_SKIP;
    }
    var outArray = [];
    if (document.evaluate) {
        var nodes = document.evaluate(XPmatch, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        var thisHeading = nodes.iterateNext();
        var j = 0;
        while (thisHeading) {
            if (thisHeading.textContent + '' != '') {
                outArray[j++] = thisHeading;
            }
            thisHeading = nodes.iterateNext();
        }
    } else {
        var els = document.getElementsByTagName("*");
        var j = 0;
        for (var i = 0, el; el = els[i]; i++) {
            if (el.tagName.match(RXmatch))
                outArray[j++] = el;
        }
    }
    return outArray;
}

function addCSS(css) {
    var head, styleLink;
    head = document.getElementsByTagName('head')[0];
    if (!head) {
        return;
    }
    styleLink = document.createElement('link');
    styleLink.setAttribute('rel', 'stylesheet');
    styleLink.setAttribute('type', 'text/css');
    styleLink.setAttribute('href', 'data:text/css,' + escape(css));
    head.appendChild(styleLink);
}

function gs(s) {
    s = s.toLowerCase();
    var ret = "";
    for (var i = 1; i < (s.substring(1) * 1); i++) {
        ret = ret + "\u00a0 \u00a0 ";
    }
    return ret;
}

function getInnerText(el) {
    var s = '';
    for (var i = 0, node; node = el.childNodes[i]; i++) {
        if (node.nodeType == 1)
            s += getInnerText(node);
        else if (node.nodeType == 3)
            s += node.nodeValue;
    }
    return s;
}

function getCookie(cname) {
    var namesep = cname + "=";
    var ca = document.cookie.split(';');
    for (var i = 0, c; c = ca[i]; i++) {
        c = c.replace(/^\s*|\s*$/g, "");
        if (c.indexOf(namesep) == 0) {
            return c.substring(namesep.length, c.length);
        }
    }
    return null;
}

f();

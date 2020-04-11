// ==UserScript==
// @name		Booru Augmentation Project
// @description	Enhance your basic booru experience
// @version		1.1.2
// @author		Seedmanc
// @include		https://*.booru.org/*index.php?page=post*
// @include		https://*.booru.org/*index.php?page=alias*
// @include		https://*.booru.org/*index.php?page=comment*
// @include		https://*.booru.org/*index.php?page=history*
// @include		https://*.booru.org/*index.php?page=forum&s=view*
// @include		https://*.booru.org/*index.php?page=account-options*
// @include		https://*.booru.org/*index.php?page=account&s=profile&uname=*
// @grant		none
// @run-at		document-body
// @require     https://ajax.googleapis.com/ajax/libs/prototype/1.7.3.0/prototype.js
// @noframes
// ==/UserScript==

var pages = {
    'account-options':          optionsPage,
    'account':                  {
        'profile': profilePage
    },
    'alias':                    aliasPage,
    'comment':                  commentPage,
    'forum':                    {
        'view': linkify
    },
    'history&type=tag_history': historyPage,
    'post':                     {
        'list': listPage,
        'view': postPage
    }
};
var hosting = 'https://seedmanc.github.io/Booru-Augmentation-Project/';

window.BAPtags = {};
window.BAPopts = JSON.parse(localStorage.getItem('BAPopts') || '{"ansiOnly":true, "solo":true, "tagme":true}');
window.currentBooru = document.location.host.split('.')[0];
window.taglist = {};
window.linklist = [];
window.thumblist = [];
window.postlist = {};

if (~document.location.href.indexOf('s=search_image')) {
    var frame = document.createElement('iframe');

    document.title = 'BAP - Search by image';

    frame.src = hosting + 'image_search/index.html?booru=' + window.currentBooru;
    frame.width = "100%";
    frame.height = "96%";
    document.body.appendChild(frame);

} else if (!~document.location.href.indexOf('s=mass_upload')) {
    if (document.readyState == 'loading') {
        document.addEventListener('DOMContentLoaded', main, false);
    } else {
        main();
    }
}

function loadAndExecute(url, callback){
    var scriptNode = document.createElement ("script");
    scriptNode.addEventListener("load", callback);
    scriptNode.onerror=function(){
        throw new Error("Can't load "+url);
    };
    scriptNode.src = url;
    document.head.appendChild(scriptNode);
};

function optionsPage() {
    loadAndExecute(hosting + '/js/optionsPage.js');
}

function listPage() {
    loadAndExecute(hosting + '/js/listPage.js');
}

function postPage() {
    loadAndExecute(hosting + '/js/postPage.js');
}

function parseUrl(prefix, handlers) {

    for (var key in handlers) {
        if (~document.location.href.indexOf(prefix + key)) {
            if (typeof handlers[key] == 'function') {
                handlers[key]();

                break;
            } else {
                parseUrl('s=', handlers[key]); // yay recursion

                break;
            }
        }
    }
}

function main() {

    parseUrl('page=', pages);

    var ad;
    try {
        ad = document.querySelectorAll('center div[id*="adbox"]')[0];
        if (ad) {
            ad.parentNode.parentNode.removeChild(ad.parentNode);
        }
        ad = document.querySelectorAll('#right-col div[id*="adbox"]')[0];
        if (ad) {
            ad.parentNode.parentNode.removeChild(ad.parentNode);
        }
        ad = $$('center a[href*="patreon"]')[0];
        if (ad) {
            ad.parentNode.parentNode.removeChild(ad.parentNode);
        }
        new Insertion.Bottom($$('head')[0],
            '<style>' +
            'input[type=text]:focus {' +
            'background: #FFC;' +
            '}' +
            '</style>'
        );
    } catch (any) {
    }
}

function profilePage() {
    document.location.href = document.location.href.replace('account&s=profile', 'account_profile');
}

window.loadOptions = function(that) {
    searchField();
    that.onfocus = '';
}

window.storeTags = function () {
    var tags = $$('#tag_list ul li span');
    var newtags;

    window.BAPtags = Object.keys(window.BAPtags).length && window.BAPtags || JSON.parse(localStorage.getItem('BAPtags') || '{}');

    tags.each(function (span) {
        var tag = span.down('a').href;

        tag = tag && tag.split('tags=')[1];
        if (tag) {
            tag = decodeURIComponent(tag).replace(/\"|\'/g, '');
            window.BAPtags[tag] = Number(span.textContent.split(/\s+/).last());
        }
    });

    newtags = JSON.stringify(window.BAPtags);
    if (Object.keys(newtags).length) {
        localStorage.setItem('BAPtags', newtags);
    }

    $$('input[name^="tag"]')[0].onfocus = function () {
        loadOptions(this);
    };
}

function searchField() {
    var datalist = $('datags');
    var goFullRetard = ~navigator.userAgent.toLowerCase().indexOf('firefox');

    if (!datalist) {
        new Insertion.Top(document.body, '<datalist id="datags"></datalist>');
    }
    datalist = $('datags');

    Object.keys(window.BAPtags).each(function (tag) {
        if (!datalist.down('option[value="' + tag + '"]')) {
            var content = goFullRetard ? tag + ' (' + window.BAPtags[tag] + ')' : window.BAPtags[tag];

            new Insertion.Bottom(datalist, '<option value="' + tag + '">' + content + '</option>');
        }
    });

    $$('input#tags, input#stags, input[name="tag"]')[0].oninput = function () {
        enableDatalist(this);
    };
}

window.enableDatalist = function(that) {
    if (that.value.length >= 1) {
        that.setAttribute('list', 'datags');
    } else {
        that.removeAttribute('list');
    }
}

window.markTags = function (li) {
    var q = li.textContent.trim().split(/\s+/);
    var q1 = q[q.length - 1];;

    if (~q.indexOf('tagme') && window.BAPopts.tagme) {
        li.style.backgroundColor = 'rgba(255,0,0,0.25)';
    }
    if (isNaN(q1) || q1 >= 5) {
        li.down('span').style.color = "#A0A0A0";

        return;
    }
    if (q1 <= 1) {
        li.style.backgroundColor = "rgba(255,225,0,0.66)";
    } else {
        li.style.backgroundColor = "rgba(255,255,0,0.33)";
    }

    li.down('span').style.color = "#000";
}

function aliasPage() { // idea by Usernam, how it's actually done by Seedmanc
    var example = $$('body > div:nth-child(4)');

    if (example.length && ~example[0].textContent.indexOf('example')) {
        example[0].style.color = "black";
        example[0].innerHTML = example[0].innerHTML.replace(/(An example)(.+)(Evangelion)(.+)(Neon_Genesis_Evangelion)(.+)\)/gi, "<b>$1</b>: <code style='color:#A0A'>$3</code>$4<code style='color:#A0A'>$5</code>$6");
    }

    storeTags();

    $$("th")[2].hide();

    $$('.highlightable td').each(function (td, index) {
        var tag = td.textContent;

        if ((index + 1) % 3 == 0) {
            td.hide();
        } else {
            td.innerHTML = "<a href='index.php?page=post&s=list&tags=" + tag + "'>" + tag + "</a>" +
                (tag && window.BAPtags[tag.toLowerCase()] ? ' (' + window.BAPtags[tag.toLowerCase()] + ')' : "");
        }
    });
}

function commentPage() {

    var commentsData = $$('ul.post-info');

    $A(commentsData).forEach(function (el) {
        var user = el.childNodes[2].textContent.split(':')[1].trim();

        var userlink = user == 'Anonymous' ?
            '<a href="index.php?page=post&s=list&tags=user%3AAnonymous">Anonymous</a>' :
            '<a href="index.php?page=account_profile&uname=' + user + '">' + user + '</a>';
        el.removeChild(el.childNodes[2]);
        new Insertion.Before(el.childNodes[2], '<li>user:'+userlink+'</li>');

    });

    linkifyContainer('div.body,div[id^="cbody"] > p');
}

function linkify() {
    linkifyContainer('div.body,div[id^="cbody"] > p');
}

window.linkifyContainer = function(selector) {
    var containers = $$(selector);

    if (!containers || !containers.length) {
        return;
    }

    containers.forEach(function (container) {
        $A(container.childNodes).each(function (node) {
            if (node.nodeType != 3) {
                return true;
            }
            linkifyTextNode(node);
        });
    });
}

// from https://arantius.com/misc/greasemonkey/linkify-plus.user.js
function linkifyTextNode(node) {
    var urlRE = new RegExp(
        '('
        // leading scheme:// or "www."
        + '\\b([a-z][-a-z0-9+.]+://|www\\.)'
        // everything until non-URL character
        + '[^\\s\'"<>()]+'
        + ')', 'gi');

    var l, m;
    var txt = node.textContent;
    var span = null;
    var p = 0;
    while (m = urlRE.exec(txt)) {
        if (null == span) {
            // Create a span to hold the new text with links in it.
            span = document.createElement('span');
        }

        //get the link without trailing dots
        l = m[0].replace(/\.*$/, '');
        var lLen = l.length;
        //put in text up to the link
        span.appendChild(document.createTextNode(txt.substring(p, m.index)));
        //create a link and put it in the span
        a = document.createElement('a');
        a.appendChild(document.createTextNode(l));
        if (!~l.indexOf(":/")) {
            l = "https://" + l;
        }
        a.setAttribute('href', l);
        if (!~l.indexOf(document.location.host)) {
            a.setAttribute('target', '_blank');
        }
        span.appendChild(a);
        //track insertion point
        p = m.index + lLen;
    }
    if (span) {
        //take the text after the last link
        span.appendChild(document.createTextNode(txt.substring(p, txt.length)));
        //replace the original text with the new span
        try {
            node.parentNode.replaceChild(span, node);
        } catch (e) {
            console.error(e);
            console.log(node);
        }
    }
}

// idea by Usernam, madness removal by Seedmanc
function historyPage() {
    var regexp = /([\S]+)/g;

    var table = $('history');
    table.style = "width: 100%; table-layout: auto;";

    $$('#history th').each(function (th) {
        th.removeAttribute("width");
    });

// Delta
    table.down('th:nth-of-type(1)').textContent = '∆';

// Tags
    table.down('th:nth-of-type(5)').style.width = "100%";

// Options
    table.down('th:nth-of-type(6)').textContent = 'Undo';

    var rows = $$('#history tr:not(:first-of-type)');

    rows.each(function (tr, i) {
        var tdTags = tr.down('td:nth-of-type(5)');

        tr.down('td:nth-of-type(3)').style = "white-space: nowrap;";

        var tags1 = tdTags.textContent.trim().split(' ');
        var tags2 = rows[i + 1] ? rows[i + 1].down('td:nth-of-type(5)').textContent.trim().split(' ') : tags1;

        var addTags = tags1.filter(function (el) {
            return !~tags2.indexOf(el);
        });
        var delTags = tags2.filter(function (el) {
            return !~tags1.indexOf(el);
        });
        var sameTags = tags1.filter(function(n) {
            return tags2.indexOf(n) != -1;
        });


        var usernam = tr.down('td:nth-of-type(4)');
        if (usernam.textContent == "Anonymous") {
            usernam.innerHTML = '<a href="index.php?page=post&s=list&tags=user%3AAnonymous">Anonymous</a>';
        } else {
            usernam.innerHTML = usernam.innerHTML.replace(regexp, '<a href="index.php?page=account_profile&uname=$1">$1</a>');
        }

        if (tags2.length > tags1.length) {
            tr.down('td:nth-of-type(1)').style.backgroundColor = 'red';
        } else if (tags2.length < tags1.length) {
            tr.down('td:nth-of-type(1)').style.backgroundColor = 'green';
        }

        // this needs testing for tags with weird characters inside, although you shouldn't be having those anyway
        var html = addTags.join(' ').replace(regexp, '<b style="color:green;">+<a href="index.php?page=post&s=list&tags=$1">$1</a></b> ') +
            delTags.join(' ').replace(regexp, '<i style="color:red;"><b>&ndash;</b><a href="index.php?page=post&s=list&tags=$1">$1</a></i>  ') +
            sameTags.join(' ').replace(regexp, '<a href="index.php?page=post&s=list&tags=$1">$1</a>');

        tdTags.innerHTML = html;
    });
}

// todo: tag categories?
// todo: crop and autocontrast by tags
// todo: store post data internally and reuse it in image search

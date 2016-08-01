// ==UserScript==
// @name		Booru Augmentation Project
// @description	Enhance your basic booru experience
// @version		1.0.9
// @author		Seedmanc
// @include		http://*.booru.org/*index.php?page=post*
// @include		http://*.booru.org/*index.php?page=alias*
// @include		http://*.booru.org/*index.php?page=comment*
// @include		http://*.booru.org/*index.php?page=history*
// @include		http://*.booru.org/*index.php?page=forum&s=view*
// @include		http://*.booru.org/*index.php?page=account-options*
// @include		http://*.booru.org/*index.php?page=account&s=profile&uname=*
// @grant		none
// @run-at		document-body
// @require     https://ajax.googleapis.com/ajax/libs/prototype/1.7.3.0/prototype.js
// @noframes
// ==/UserScript==

var BAPtags = {};
var BAPopts = JSON.parse(localStorage.getItem('BAPopts') || '{"ansiOnly":true, "solo":true, "tagme":true}');
var pages = {
	'account-options':          optionsPage,
	'account':                  {
		'profile': function () {
			document.location.href = document.location.href.replace('account&s=profile', 'account_profile');
		}
	},
	'alias':                    aliasPage,
	'comment':                  commentPage,
	'forum':                    {
		'view': linkify
	},
	'history&type=tag_history': historyPage,
	'post':                     {
		'view': postPage,
		'list': listPage
	}
};
var currentBooru = document.location.host.split('.')[0];

window.taglist = {};
window.linklist = [];
window.thumblist = [];
window.postlist = {};

if (~document.location.href.indexOf('s=search_image')) {
	var frame = document.createElement('iframe');

	document.title = 'BAP - Search by image';

	frame.src = 'http://rawgit.com/Seedmanc/Booru-Augmentation-Project/master/image_search/index.html?booru=' + currentBooru;
	frame.width = "100%";
	frame.height = "95%";
	document.body.appendChild(frame);

} else if (!~document.location.href.indexOf('s=mass_upload')) {
	if (document.readyState == 'loading') {
		document.addEventListener('DOMContentLoaded', main, false);
	} else {
		main();
	}
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

function optionsPage() {
	delete Array.prototype.toJSON;
	var table = $$('div.option table tbody')[0];
	var submit = $$('div.option input[type="submit"]')[0];
	BAPtags = Object.keys(BAPtags).length && BAPtags || JSON.parse(localStorage.getItem('BAPtags') || '{}');

	new Insertion.Bottom(table, '<tr style="text-align:center;"><td colspan=2><br><b>Booru Augmentation Project</b></td></tr>');
	new Insertion.Bottom(table, '<tr><td><div style="float:left; text-align:justify;"><label class="block" for="ansiOnly">Disallow Unicode tags</label><p>Do not accept non-ANSI tags when editing tags in-place</p></div><div style="float:right"><br><input class="BAPoption" id="ansiOnly" type="checkbox"/></td></tr>');
	new Insertion.Bottom(table, '<tr><td><div style="float:left; text-align:justify;"><label class="block" for="solo">Suggest <b>+solo</b></label><p>Mark green/add a solo tag if there are less than 2 existing tags</p></div><div style="float:right"><br><input class="BAPoption" id="solo" type="checkbox"/></td>\
		<td><div style="float:left; text-align:justify; padding-left:100px"><label class="block" for="tagme">Suggest <b>-tagme</b></label><p>Mark red an existing tagme tag for easier removal</p></div><div><br><input class="BAPoption" id="tagme" type="checkbox"/></div></td></tr>');

	new Insertion.Bottom(table, '<tr><td><div style="float:left; text-align:justify;"><label class="block" for="showTags">Show complete tag list</label><p>Display here a list of all tags sorted by their amount of posts</p></div><div style="float:right"><br><input id="showTags" type="radio" name="tools"/></div></td>\
		<td><div style="float:left; text-align:justify; padding-left:100px"><label class="block" for="showScanner">Show Booru Scanner</label><p>Allows to fetch complete post and tag data from the booru, as well as a list of image links.</p></div><div><br><input id="showScanner" type="radio" name="tools" checked/></div></td></tr>');


	Object.keys(BAPopts).each(function (opt) {
		if ($$('input.BAPoption#' + opt)[0]) {
			$$('input.BAPoption#' + opt)[0].checked = BAPopts[opt];
		}
	});

	$('showTags').onchange = function () {
		showTags();
	};

	$('showScanner').onchange = function () {
		showScanner();
	};

	submit.onclick = function () {
		$$('input.BAPoption').each(function (el) {
			BAPopts[el.id] = el.checked;
		});
		localStorage.BAPopts = JSON.stringify(BAPopts);
	};
	showScanner();
}

function removeTagme(offset) {
	getPage('http://' + currentBooru + '.booru.org/index.php?page=post&s=list&tags=tagme&pid=' + offset, function (html) {
		var failure = false;
		var total = html.querySelector('a[alt="last page"]'), completed = 0;
		var next = html.querySelector('a[alt="next"]');
		var ilinks = html.querySelectorAll('.content .thumb > a');
		var rttProgress = $('rttProgress');

		rttProgress.value = offset || 1;

		next = (next && next.getAttribute('href').split("pid=").last()) || 0;
		total = (total && total.getAttribute('href').split("pid=").last()) || 0;

		if (offset === 0) {
			$('rttProgress').max = total || 20;
		}

		$A(ilinks).forEach(function (v, i) {
			if (failure) return false;

			setTimeout(function(){

				getPage('http://' + currentBooru + '.booru.org/index.php?page=post&s=view&id=' + v.id.replace('p',''), function (html2) {
					if (failure) return false;
					var form = html2.querySelector('#edit_form');

					form.tags.value = form.tags.value.replace(/^tagme | tagme$| tagme /i,' ');
					form.pconf.value = 1;

					setTimeout(function(){
						if (failure) return false;
						form.request({
							onComplete: function () {
								if (failure) return false;
								completed++;
								rttProgress.value++;

								if (completed >= ilinks.length && next) {
									setTimeout(function(){removeTagme(next);}, 2000);
								} else if (!next) {
									rttProgress.max = rttProgress.value;
								}
							},
							onFailure:  function () {
								console.log('error removing tagme at post ' + v.href);
								rttProgress.style.color = 'red';
								failure = true;
								rttProgress.enable();
							}
						});
					}, 1333);
				});
			}, 3000+3000*i);
		});
	});
}
//TODO sequential execution in case of booru limitations

function getPage(url, callback) {
	if (!url) {
		return;
	}

	new Ajax.Request(url, {
		method:    'get',
		onSuccess: function (xhr) {
			var tmplt = document.createElement('template');
			tmplt.innerHTML = xhr.responseText;
			var html = (tmplt.content || tmplt);

			if (typeof callback == 'function') {
				callback(html);
			}
		}
	});
}

function showScanner() {

	if ($('allTags')) {
		$('allTags').up('.option').hide();
	}

	if ($('scanner')) {
		$('scanner').up('.option').show();

		return;
	}

	new Insertion.After($$('form > p')[0],
		'<div class="option" style="float:right; height:0; left:740px; position:absolute;"><table id="scanner" class="" style="width:680px; margin-bottom:0;"><thead><tr><th colspan=2><center>Booru scanner</center></th></tr></thead><tbody></tbody></table></div>');
	var table = $$('#scanner tbody')[0], Current = 0, start = 0;

	new Insertion.Bottom(table,
		'<tr><td><label class="block">Limit scope to query:</label><br>&nbsp;</td><td style="width:100%; "><input style="width:99%;padding:0;" type="text" name="tag" id="scanTags" placeholder="tag list or a # of pages to scan"/></td></tr>');
	new Insertion.Bottom(table,
		'<tr><td><label class="block">Initiate scanning</label><br>&nbsp;</td><td style="text-align:center; width:100%; "><input type="button" style="width:100%;" id="start" value="Start"/></td></tr>');
	new Insertion.Bottom(table,
		'<tr><td><label class="block">Scan progress</label><p style="margin:0"><span id="current">' + Current + ' posts remaining </span><span id="time" style="display:none;">, &nbsp;time left: <span id="timeValue"/></span></p></td>\
		<td style="vertical-align:middle; width:100%;"><progress id="scanProgress" style="width:100%;" value="' + Current + '" max="' + start + '"></progress></td></tr>');
	new Insertion.Bottom(table,
		'<tr><td><label class="block"><br>Download results in .json</label><p>Incomplete until scanning finishes</p></td><td style="width:100%; "><table id="dllinks" class="highlightable" style="font-weight:bold;width:100%; text-align:center;">\
			<tr><td><a href="#" id="taglist" class="dllink">post amounts by tag</a></td></tr>\
			<tr><td><a href="#" id="postlist" class="dllink">complete post data by hash</a></td></tr>\
			<tr><td><a href="#" id="linklist" class="dllink">link list to full images</a></td></tr>\
			<tr><td><a href="#" id="thumblist" class="dllink">link list to thumbnails</a></td></tr>\
		</table>\
		</td></tr>');

	new Insertion.After($('scanner'),
		'<table id="sbi" style="width:680px; "><thead><tr><th><center>Search by image (hash)</center></th></tr></thead><tbody><tr><td><p style="width:100%; text-align:justify;">Having the complete post DB allows you to do the advanced post searching.</p>\
			<p style="width:100%; text-align:justify;">For example, here is how you can search for duplicating images at your booru:</p><ol><li>Get the complete post DB by hash and the list of links to thumbnails.</li>\
				<li>DL all thumbs by feeding the list to some mass downloader</li>\
				<li>Run a duplicate finder software on the thumbs, moving all dupes to a folder</li>\
				<li>Open the hash db and the found images in the <a target="_blank" href="http://'+currentBooru+'.booru.org/index.php?page=post&s=search_image"><b>Image Search</b></a> to get links to posts on booru that have duplicating images</li></ol><br>\
			Note: in Chrome the amount of pictures opened simulaneously might be quite limited by their collective filename length. You can open a folder of images instead.\
		</tbody></table></div>');

	new Insertion.After($('sbi'),
		'<table id="rtt" style="width:680px; "><thead><tr><th colspan="2"><center>Remove <i>tagme</i></center></th></tr></thead><tbody><tr><td colspan="2"><p style="width:100%; text-align:justify;">Booru automatically adds the "tagme" tag if your uploads have less than 5 tags. You can\'t turn that off, however, you can batch-delete that tag from the posts that have it.</p></tbody></table></div>');
	new Insertion.Bottom($('rtt'),
		'<tr><td><label class="block"><input type="button" style="width:100%;" id="removeTagme" value="Remove tagme"/></label></td><td style="text-align:center; width:100%; vertical-align:middle;"><progress id="rttProgress" style="width:100%;" value="0" max="'+ (BAPtags.tagme || 0) +'"></progress></td></tr>');

	$('removeTagme').onclick = function () {
		$('removeTagme').disable();
		removeTagme(0);
	};

	$('scanTags').onfocus = function () {
		loadOptions(this);
	};

	$('dllinks').onclick = function (evt) {
		if (evt.target.className == "dllink") {
			var b = new Blob([JSON.stringify(window[evt.target.id], null, '\t')], {type: typeof URL != 'undefined' ? 'text/plain' : 'application/octet-stream'});
			var a = document.createElement('a');
			var scanQuery = $('scanTags').value.trim();
			var isNum = scanQuery && /^\d+$/.test(scanQuery);

			a.download = evt.target.id.replace('list', ' list for ' + (scanQuery ? (isNum ? (scanQuery + ' posts @ ') : ('\'' + scanQuery + '\' @ ')) : '') + currentBooru + 'booru' + isNum ? '' : (', ' + (start - Current) + ' of ' + start + ' posts scanned')) + '.json';
			document.body.appendChild(a);

			if (typeof URL != 'undefined') {
				var fileURL = URL.createObjectURL(b);
				a.href = fileURL;
				a.click();
				a.parentNode.removeChild(a);
			} else {
				var reader = new window.FileReader();
				reader.readAsDataURL(b);
				reader.onloadend = function () {
					a.href = reader.result;
					a.click();
					a.parentNode.removeChild(a);
				};
			}
		}
	};

	$('start').onclick = function () {
		$('start').disable();
		$('scanTags').disable();
		$('time').show();

		window.linklist = [];
		window.thumblist = [];

		scanPage(start);
	};

	function scanPage(offset) {
		var query = $('scanTags').value;
		var isNum = query && /^\d+$/.test(query);
		var limit;

		if (isNum) {
			limit = parseInt(query, 10);
			query = 'all';
		}

		getPage('http://' + currentBooru + '.booru.org/index.php?page=post&s=list&tags=' + query + '&pid=' + offset, function (html) {
			Current = offset;
			$('current').update(Current + ' posts remaining ');
			$('scanProgress').value = start - Current;

			var tags = $A(html.querySelectorAll('#tag_list ul li span')), tag, temp = {};

			tags.forEach(function (span) {
				tag = span.querySelector('a').href;
				tag = tag && tag.split('tags=')[1];
				if (tag) {
					tag = decodeURIComponent(tag).replace(/\"|\'/g, '');
					window.taglist[tag] = Number(span.textContent.split(/\s+/).last());
					BAPtags[tag] = window.taglist[tag];
				}
			});

			if (Object.keys(BAPtags).length) {
				localStorage.setItem('BAPtags', JSON.stringify(BAPtags));
			}

			var ilinks = html.querySelectorAll('.content .thumb > a');

			$A(ilinks).forEach(function (v) {
				var id = v.id.replace('p', '');
				var data = v.querySelector('img').title.trim();
				var itags = data.split('score')[0].trim().split(/\s+/).sort();
				var score = data.split('score:')[1].split('rating')[0].trim();
				var rating = data.split('rating:')[1].split('')[0].toLowerCase();
				var src = v.querySelector('img').src;
				var ext = src.split('.').last();
				window.thumblist.push(src);
				window.linklist.push(src.replace('thumbs', 'img').replace('thumbnails', 'images').replace('thumbnail_', ''));

				var hash = src.split('thumbnail_')[1].split('.')[0];
				var cluster = src.split('thumbnail')[1].replace(/\/+|s/g, '');
				window.postlist[hash] = {
					c: Number(cluster),
					e: ext,
					i: Number(id),
					r: rating,
					s: Number(score),
					t: itags
				};
			});

			var next = html.querySelector('a[alt="back"]');
			next = (next && next.getAttribute('href').split("pid=").last()) || '';

			if (next && start) {
				window.setTimeout(function () {
					scanPage(next);
				}, 500);
				var mins = Math.floor(0.6 * offset / 20 / 60);
				var secs = Math.floor((0.6 * offset / 20) % 60);

				$('timeValue').update(("0" + mins).slice(-2) + ':' + ("0" + secs).slice(-2));
			} else {
				Object.keys(window.taglist).sort().forEach(function (key) {
					temp[key] = window.taglist[key];
				});

				window.taglist = temp;

				if ((Object.keys(window.taglist).length) && (query == 'all') && !isNum) {
					localStorage.setItem('BAPtags', JSON.stringify(window.taglist));
				}

				$('start').enable();
				$('scanTags').enable();
				$('time').hide();
			}
		});

	}

	$('scanTags').onchange = function (evt) {
		var query = (evt && evt.target.value.trim()), lastpic;
		var isNum = query && /^\d+$/.test(query);
		var limit;

		if (isNum) {
			limit = parseInt(query, 10);
			query = 'all';
			start = (limit-1)*20;
			$('scanProgress').max = start;
			$('current').update(start+20 + ' posts remaining ');
			$('current').up('p').style.color = "";
			$('start').enable();

			if (limit === 0) {
				$('start').disable();
			}
		} else {
			query = query || 'all';
			getPage('http://' + currentBooru + '.booru.org/index.php?page=post&s=list&tags=' + query, function (html) {
				start = html.querySelector('a[alt="last page"]');

				if (html.querySelectorAll('span.thumb').length) {
					$('current').up('p').style.color = "";
					$('start').enable();

					start = parseInt((start && start.getAttribute('href').split("pid=").last()) || '1', 10);
					$('scanProgress').max = start;
					$('current').update(start + ' posts remaining ');
				} else {
					$('current').update('Nothing found');
					$('current').up('p').style.color = "#FF0000";
					$('start').disable();
				}
			});

		}
	};

	$('scanTags').onchange();

}

function showTags() {
	var allTags = $('allTags');

	if (!allTags) {
		new Insertion.After($$('form > p')[0],
			'<div class="option" style="float:right; height:0; left:740px; position:absolute;">\
				<table id="allTags" class="highlightable" style="width:680px;">\
					<caption>Tag list by post amount</caption>\
					<thead>\
						<tr>\
							<th>tag</th><th>posts</th>\
						</tr>\
					</thead>\
					<tbody></tbody>\
				</table>\
			</div>');
		allTags = $('allTags');
	} else {
		allTags.up('.option').show();
	}
	$('scanner').up('.option').hide();

	if (allTags.down('a')) {
		return;
	}

	Object.keys(BAPtags).sort(function (a, b) {
		a = BAPtags[a];
		b = BAPtags[b];
		return a == b ? 0 : ((b - a) / Math.abs(b - a));
	}).each(function (tag) {
		if (BAPtags.hasOwnProperty(tag)) {
			if (BAPtags[tag] < 1) {
				delete BAPtags[tag];
			} else {
				new Insertion.Bottom(allTags, '<tr><td' + (BAPtags[tag] < 5 ? ' style="background-color:rgba(255,255,0,0.33);"' : '') + '><a href="index.php?page=post&s=list&tags=' + tag + '">' + tag + '</a></td><td>' + BAPtags[tag] + '</td></tr>');
			}
		}
	});
	if (Object.keys(BAPtags).length) {
		localStorage.setItem('BAPtags', JSON.stringify(BAPtags));
	}
}

function loadOptions(that) {
	searchField();
	that.onfocus = '';
}

function storeTags() {
	var tags = $$('#tag_list ul li span');
	var newtags;

	BAPtags = Object.keys(BAPtags).length && BAPtags || JSON.parse(localStorage.getItem('BAPtags') || '{}');

	tags.each(function (span) {

		var tag = span.down('a').href;
		
		tag = tag && tag.split('tags=')[1];
		if (tag) {
			tag = decodeURIComponent(tag).replace(/\"|\'/g, '');
			BAPtags[tag] = Number(span.textContent.split(/\s+/).last());
		}
	});

	newtags = JSON.stringify(BAPtags);
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

	Object.keys(BAPtags).each(function (tag) {
		if (!datalist.down('option[value="' + tag + '"]')) {
			var content = goFullRetard ? tag + ' (' + BAPtags[tag] + ')' : BAPtags[tag];

			new Insertion.Bottom(datalist, '<option value="' + tag + '">' + content + '</option>');
		}
	});

	$$('input#tags, input#stags, input[name="tag"]')[0].oninput = function () {
		enableDatalist(this);
	};
}

function enableDatalist(that) {
	if (that.value.length >= 1) {
		that.setAttribute('list', 'datags');
	} else {
		that.removeAttribute('list');
	}
}

function markTags(li) {
	var q = li.textContent.trim().split(/\s+/);

	if (~q.indexOf('tagme') && BAPopts.tagme) {
		li.style.backgroundColor = 'rgba(255,0,0,0.25)';
	}
	var q1 = q[q.length - 1];
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

function listPage() {
	var tags = $$('#tag_list ul li');
	var posts = $$('span.thumb');

	storeTags();

	if (!posts.length && ~document.location.href.indexOf('tags=')) {
		var t = (document.location.href.split('tags=')[1] || '').split('+');

		if (t.length == 1 && t[0]) {
			delete BAPtags[t[0]];
			if (Object.keys(BAPtags).length) {
				localStorage.setItem('BAPtags', JSON.stringify(BAPtags));
			}
		}
	}

	if (tags && tags.length) {
		tags.each(function (li) {
			if (!li.textContent.trim()) {
				return;
			}
			var s = li.down('span');
			var a = li.down('a');
			var query = s.down('a').href.split('&tags=')[1];

			if (query) {
				s.down('a').update(decodeURIComponent(query));
			}

			if (a && a.textContent == '+') {
				new Insertion.After(a, '&nbsp;');
				a = a.next('a');
				if (a && a.textContent == '-') {
					a.textContent = a.textContent.replace('-', '–');
				}
			}

			if (s.childNodes[0].textContent == '? ') {
				s.childNodes[0].textContent = ' ';
				new Insertion.Before(s.childNodes[0], '<a style="color:#58c;" href="https://www.google.com/search?q=' + query + '" target="_blank">?</a>');
			}
			markTags(li);
		});
	} else {
		return;
	}

	var paginator = $('paginator');

	if (!paginator.down('a[alt="first page"]') || !paginator.down('a[alt="next"]')) {
		return;
	}

	var current = paginator.down('b');
	var contents = paginator.immediateDescendants().without(paginator.down('script'));

	if (contents.length < 15) {
		return;
	}

	var pos = contents.indexOf(current);

	if (pos >= 7) {
		return;
	}

	if ((contents.last().href == contents.last().previous('a:not([alt])').href) && (contents.first().href == contents.first().next('a:not([alt])').href)) {
		return;
	}

	var pid;

	pid = ~document.location.search.indexOf('pid=') ? document.location.search.split('&').findAll(function (el) {
		return ~el.indexOf('pid');
	})[0].replace('pid=', '') : 0;

	var shift = Math.min(current.textContent - 2, 4);
	var newPos = paginator.down('a:not([alt])', shift);
	var next = current.next();

	if (next == newPos) {
		next = current;
	} else {
		paginator.insertBefore(current, newPos);
	}
	paginator.insertBefore(newPos, next);

	var pageLinks = document.querySelectorAll('div#paginator > a:not([alt]), div#paginator > b');

	for (var i = 0; i < pageLinks.length; i++) {
		pageLinks[i].textContent = pid / 20 - shift + i;
		if (!pageLinks[i].href) {
			continue;
		}
		pageLinks[i].href = pageLinks[i].href.replace(/&pid=\d+/gi, '&pid=' + ((pageLinks[i].textContent - 1) * 20));
	}
}

function postPage() {
	var image = $('image');

	storeTags();

	if (image.getWidth() > 1480) {
		$('note-container').setAttribute('style', 'cursor:pointer');
	}

	new Insertion.Bottom($$('head')[0],
		'<style>' +
		'.aEdit{font-size:smaller; background-color:rgba(255, 255, 0, 0.33);}' +
		'.aDelete{font-size:smaller; background-color:rgba(255,0, 0, 0.2);}' +
		'.aAdd {font-size:smaller; background-color:rgba(0, 255, 0, 0.25);}' +
		'#image{max-width:1480px; margin-right:0 !important;}' +
		'.fitIn{max-width:auto !important;}' +
		'</style>'
	);

	image.setAttribute('style', '');
	image.onclick = function () {
		toggleFitIn(this);
	};

	var taglist = $$('div#tag_list li a');

	taglist.each(function (tagli) {
		var taghref = tagli.href.split('&tags=')[1];

		if (tagli.textContent.trim() || (taghref && ~taghref.indexOf('_'))) {

			inserTag({
				text: decodeURIComponent(taghref),
				num:  tagli.up('span').textContent.split(' ').last()
			}, tagli.up('li'));
		}
	});

	var br1 = $$('div#tag_list br')[0];
	var customTags = (readCookie("tags") || '').toLowerCase().split(/[, ]|%20+|\+/g).sort().reverse();
	var currentTags = $('tags').value.split(/\s+/);

	currentTags.each(function (tag) {
		customTags = customTags.without(tag);
	});
	if ((customTags.length) && (readCookie('tags'))) {
		customTags.each(function (tag) {
			if (tag) {
				inserTag({
					text: tag
				}, br1);
			}
		});
		if (BAPopts.solo) {
			var taglistString = taglist.join(' ');
			if ((taglist.length == 1 && taglist[0].textContent.trim() != 'solo') ||
				(taglist.length == 2 && !~taglistString.indexOf('solo') && ~taglistString.indexOf('tagme'))) {
				if (!$$('.customTag').some(function (ct) {
						var ctli = ct.up('li');
						if (~ctli.textContent.split(/\s+/).indexOf('solo')) {
							ctli.style.backgroundColor = 'rgba(0,255,0,0.25)';
							return true;
						}
					})) {
					inserTag({text: 'solo'}, br1);
				}
			}
		}
		new Insertion.After($$('a.aAdd').last().up('li'), '<br>');
	}

	var strong = $$('#tag_list ul strong')[0];

	inserTag({}, strong.previous());
	new Insertion.Before(strong, '<br>');
	statisticsArea(strong);

	linkifyContainer('#note-container > div[id^="c"][style],#tag_list > ul');
}

function statisticsArea(strong) {
	strong.innerHTML = '<u>' + strong.innerHTML + '</u>';
	var pointer = strong.nextSibling;

	while (pointer && pointer.tagName != 'li') {
		if (pointer.nodeType === 3) {
			var split = pointer.data.split(':');
			if (split.length > 1) {
				if (~split[0].indexOf('Score') || (~split[0].indexOf('Source') && !$('source').value)) {
					pointer.parentNode.removeChild(pointer.previousSibling);
					pointer.data = '';
				} else {
					if (~split[0].indexOf('By')) {
						var userlink = split[1].trim() == 'Anonymous' ?
							'<a href="index.php?page=post&s=list&tags=user%3AAnonymous">Anonymous</a>' :
						'<a href="index.php?page=account_profile&uname=' + split[1].trim() + '">' + split[1].trim() + '</a>';
						new Insertion.Before(pointer.nextSibling, userlink);
						pointer.data = split[0] + ': ';
						split[1] = ' ';
					}
					new Insertion.After(pointer.previousSibling, '<b>' + split[0] + '</b>');
					split[0] = '';
					pointer.data = split.join(':');
				}
			}
		}
		if ((!pointer.nextSibling || pointer.nextSibling.tagName == 'li') && $('title').value) {
			new Insertion.Before(pointer, '<b>Title:</b> ' + $('title').value);
			break;
		}
		pointer = pointer.nextSibling;
	}
}

function inserTag(tag, where) {
	var aAdd = '<a href="#' + tag.text + '" class="aAdd" style="display:none;">[+]</a> ';
	var aEdit = '<a href="#' + tag.text + '" class="aEdit" style="display:none;">[/]</a> ';
	var aDelete = ' <a href="#' + tag.text + '" class="aDelete" style="display:none;">[-]</a>';
	var editField = '<input placeholder="add tag" class="editField" type="text" value="' + (tag.text || '') + '" style="display:none;">';
	var tagLink = ' <a href="index.php?page=post&s=list&tags=" style=""></a> ';

	if (tag.text && !tag.num) { //custom tag
		aAdd = aAdd.replace('style="display:none;"', 'style=""');
		tagLink = '<span class="customTag">' + tag.text + '</span>';
	} else if (!tag.text) { //new tag input
		tagLink = tagLink.replace('style=""', 'style="display:none;"');
		editField = editField.replace('style="display:none;"', 'style=""');
	} else { //existing tag
		tagLink = tagLink.replace('&tags=', '&tags=' + encodeURIComponent(tag.text)).replace('></', '>' + tag.text + '</');
		aEdit = aEdit.replace('style="display:none;"', 'style=""');
		aDelete = aDelete.replace('style="display:none;"', 'style=""');
	}

	var span = '<span style="color: #a0a0a0;">' + aAdd + aEdit + tagLink + editField + aDelete + ' ' + (tag.num || '') + '</span>';

	new Insertion.After(where, '<li>' + span + '</li>');
	markTags(where.next('li'));

	where.next().down('.aAdd').onclick = function () {
		addTag(this);
	};
	where.next().down('.aEdit').onclick = function () {
		togglEdit(this);
	};
	where.next().down('.aDelete').onclick = function () {
		exclude(this);
	};
	if (tag.text) {
		where.next().down('.editField').onblur = function () {
			applyEdit(this);
		};
		where.next().down('.editField').onkeydown = function (event) {
			if (event.keyCode == 13) {
				this.blur();
			}
		};
	} else {
		where.next().down('.editField').onchange = function (event) {
			applyEdit(this);
		};
		where.next().down('.editField').id = 'newTag';
		where.next().down('.editField').onfocus = function () {
			loadOptions(this);
		};
		where.next().down('.editField').oninput = function () {
			enableDatalist(this);
		};
	}
	if (tag.text && ~where.textContent.indexOf(tag.text.replace(/_/g, ' '))) {
		where.parentNode.removeChild(where);
	}
}

function showButton() {
	if ($('btnSubmit')) {
		return;
	}

	new Insertion.Before($$('div#tag_list ul strong')[0], '<input style="width:64%; height:1.5rem;" id="btnSubmit" type="submit" value="submit"><br><br>');
	$('btnSubmit').onclick = function () {
		mySubmit();
	};
}

function mySubmit() {
	var btnSubmit = $('btnSubmit');
	var spinner;

	new Insertion.Before(btnSubmit, '<img id="spinner" src="https://dl.dropboxusercontent.com/u/74005421/js%20requisites/16px_on_transparent.gif">');
	spinner = $('spinner');
	btnSubmit.hide();
	$('edit_form').request({
		onComplete: function (response) {
			if (~response.responseText.indexOf('ou are not logged in')) {
				$('spinner').hide();
				new Insertion.Before($$('div#tag_list ul strong')[0], '<p class="aDelete">You are not logged in</p>');
				return;
			}
			var br = $$('#tag_list ul strong')[0].previous('br');

			br.parentNode.removeChild(br);
			spinner.parentNode.removeChild(spinner);
			btnSubmit.parentNode.removeChild(btnSubmit);

			var taglist;

			taglist = $$('div#tag_list li a.aDelete').findAll(function (el) {
				return el.visible();
			});
			var lis = {};

			taglist.each(function (taglink) {
				lis[taglink.previous('a').textContent.trim()] = true;
			});
			taglist.each(function (taglink) {
				taglink.up('li').parentNode.removeChild(taglink.up('li'));
			});
			var sorted = Object.keys(lis).sort().reverse();

			new Insertion.Top($$('#tag_list ul')[0], '<br>');
			sorted.each(function (tag) {
				inserTag({
					text: tag,
					num:  BAPtags[tag.replace(/\s+/g, '_').replace(/\'/g, '')]
				}, $$('#tag_list ul br')[0]);
			});
			br = $$('#tag_list ul br')[0];
			br.parentNode.removeChild(br);

			if (Object.keys(BAPtags).length) {
				localStorage.setItem('BAPtags', JSON.stringify(BAPtags));
			}

			searchField();
		},
		onFailure:  function () {
			spinner.parentNode.removeChild(spinner);
			btnSubmit.show().disable().value = "error";
		}
	});
}

function toggleFitIn(that) {
	//TODO this really needs improvement, CSS
	if (that.getAttribute('style')) {
		that.setAttribute('style', '');
	} else {
		that.setAttribute('style', 'max-width:90000px !important;');
	}
}

function addTag(that) {
	var tag = that.next('span.customTag').textContent.trim().replace(/\s+/g, '_');
	var currentNum = that.up('span').lastChild;

	currentNum.data = ' ' + String(BAPtags[tag] || '');
	that.hide();
	that.next('.aEdit').show();
	that.next('.aDelete').show();
	that.next('span.customTag').replace('<a href="index.php?page=post&s=list&tags=' + encodeURIComponent(tag) + '">' + tag + '</a>');
	$('tags').value += ' ' + tag;
	BAPtags[tag] = Number(BAPtags[tag] || 0) + 1;

	showButton();
}

function isANSI(s) {
	var is = true;

	s = s.split('');
	s.each(function (v) {
		is = is && (/[\u0000-\u00ff]/.test(v));
	});

	return is;
}

function applyEdit(that) {
	var value = that.value.trim().replace(/\s/g, '_').toLowerCase();
	if (!value) {
		if (that.id != 'newTag') {
			exclude(that);
		}
		return;
	}

	var existing = $$('#tag_list ul > li > span > a:not([class])');
	var element;
	var exists = existing.some(function (tag) {
		if (tag.textContent.trim().replace(/\s/g, '_') == value) {
			element = tag;

			return true;
		}
	});
	var oldTag = that.previous('a').textContent.trim().replace(/\s/g, '_') || '';

	if (exists && (value != oldTag)) {
		element.up('li').style.backgroundColor = 'rgba(255,255,0,0.5)';
		setTimeout(function () {
			element.up('li').style.backgroundColor = '';
		}, 1000);
		that.focus();

		return;
	}

	if (!isANSI(value) && BAPopts.ansiOnly) {
		that.style['backgroundColor'] = '#fc0';
		that.value = oldTag;
		that.focus();
		return;
	} else {
		that.style['backgroundColor'] = '';
	}
	var link = that.previous('span > a');
	link.textContent = value;

	link.href = 'index.php?page=post&s=list&tags=' + encodeURIComponent(value);

	link.show();
	that.hide();

	that.onkeydown = function (event) {
		if (event.keyCode == 13) {
			this.blur();
		}
	};
	link.previous('.aEdit').show();
	link.next('.aDelete').show();

	$('tags').value = ($('tags').value.replace(oldTag, '') + ' ' + value.replace(/\s/g, '_')).replace(/\s+/g, ' ');

	if (oldTag != value) {
		var currentNum = that.up('span').lastChild;

		currentNum.data = ' ' + String(BAPtags[value] || '0');
		markTags(that.up('li'));

		BAPtags[value] = Number(BAPtags[value] || 0) + 1;
		if (oldTag) {
			BAPtags[oldTag] = Math.max(Number(BAPtags[oldTag] || 0) - 1, 0);
			if (BAPtags[oldTag] === 0) {
				delete BAPtags[oldTag];
			}
		}
		showButton();
	}
	if (that.id == 'newTag') {
		that.id = '';
		that.removeAttribute('oninput');
		inserTag({}, $('btnSubmit').previous('li'));
		$('newTag').focus();
	}
	that.placeholder = 'edit tag';
	that.onblur = function () {
		applyEdit(this);
	};
}

function exclude(that) {
	var li = that.up('li');
	var tag = li.down('.aEdit').next('a').textContent.trim().replace(/\s+/g, '_');

	li.parentNode.removeChild(li);
	$('tags').value = $('tags').value.split(/\s+/).without(tag).join(' ');
	BAPtags[tag] = Math.min(Number(BAPtags[tag] || 0) - 1, 0);
	if (BAPtags[tag] === 0) {
		delete BAPtags[tag];
	}
	showButton();
}

function togglEdit(that) {
	var span = that.parentNode;

	span.down('input').show().focus();
	span.down('a.aEdit').next('a').hide();
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
				(tag && BAPtags[tag.toLowerCase()] ? ' (' + BAPtags[tag.toLowerCase()] + ')' : "");
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

function linkifyContainer(selector) {
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
			l = "http://" + l;
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

	var table = $$('.highlightable')[0];
	table.style = "width: 100%; table-layout: auto;";

	table.select('th').each(function (th) {
		th.removeAttribute("width");
	});

// Delta
	table.select('th')[0].textContent = '∆';

// Tags
	table.select('th')[4].style.width = "100%";

// Options
	table.select('th')[5].textContent = 'Undo';

	var rows = table.select('tr:not(:first-of-type)');

	rows.each(function (tr, i) { // it's that simple
		var tdTags = tr.select('td')[4];

		tr.select('td')[2].style = "white-space: nowrap;";

		var tags1 = tdTags.textContent.trim().split(' ');
		var tags2 = rows[i + 1] ? rows[i + 1].select('td')[4].textContent.trim().split(' ') : tags1;

		var addTags = tags1.filter(function (el) {
			return !~tags2.indexOf(el);
		});
		var delTags = tags2.filter(function (el) {
			return !~tags1.indexOf(el);
		});
		var sameTags = tags1.intersect(tags2);

		var usernam = tr.select("td")[3];
		if (usernam.textContent == "Anonymous") {
			usernam.innerHTML = '<a href="index.php?page=post&s=list&tags=user%3AAnonymous">Anonymous</a>';
		} else {
			usernam.innerHTML = usernam.innerHTML.replace(regexp, '<a href="index.php?page=account_profile&uname=$1">$1</a>');
		}

		if (tags2.length > tags1.length) {
			tr.select('td')[0].style.backgroundColor = 'red';
		} else if (tags2.length < tags1.length) {
			tr.select('td')[0].style.backgroundColor = 'green';
		}

		// this needs testing for tags with weird characters inside, although you shouldn't be having those anyway
		var html = addTags.join(' ').replace(regexp, '<b style="color:green;">+<a href="index.php?page=post&s=list&tags=$1">$1</a></b> ') +
			delTags.join(' ').replace(regexp, '<i style="color:red;"><b>&ndash;</b><a href="index.php?page=post&s=list&tags=$1">$1</a></i>  ') +
			sameTags.join(' ').replace(regexp, '<a href="index.php?page=post&s=list&tags=$1">$1</a>');

		tdTags.innerHTML = html;
	});
}

// todo: fix increasing whitespace above image stats after submitting tags 
// todo: tag categories?
// todo: crop and autocontrast by tags
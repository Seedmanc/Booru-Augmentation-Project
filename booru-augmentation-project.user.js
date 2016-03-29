// ==UserScript==
// @name		Booru Augmentation Project
// @description	Enhance your basic booru experience
// @version		1.0
// @author		Seedmanc
// @include		http://*.booru.org/*index.php?page=post*
// @include		http://*.booru.org/index.php?page=account-options
// @include		http://*.booru.org/index.php?page=account&s=profile&uname=*
// @grant		none
// @run-at		document-body
// @require     https://ajax.googleapis.com/ajax/libs/prototype/1.7.3.0/prototype.js
// @noframes
// ==/UserScript==

var BAPtags = '';

if (~document.location.href.indexOf('page=post')) {
	BAPtags = JSON.parse(localStorage.getItem('BAPtags') || '{}');
}
var BAPopts = JSON.parse(localStorage.getItem('BAPopts') || '{"ansiOnly":true, "solo":true, "tagme":true, "showTags":false}');

if (!~document.location.href.indexOf('s=mass_upload')) {
	if (document.readyState == 'loading') {
		document.addEventListener('DOMContentLoaded', main, false)
	} else {
		main();
	}
}

function main() {

	if (~document.location.href.indexOf('page=post')) {
		storeTags();
		if ($$('input#tags, input#stags').length) {
			$$('input#tags, input#stags')[0].onfocus = function () {
				loadOptions(this);
			};
		}
	}

	if (~document.location.href.indexOf('&s=view') && (readCookie('user_id') && readCookie('pass_hash'))) {
		postPage();
	} else if (~document.location.href.indexOf('&s=list') && ~document.location.href.indexOf('page=post')) {
		listPage();
	} else if (~document.location.href.indexOf('page=account-options')) {
		optionsPage();
	} else if (~document.location.href.indexOf('page=account&s=profile&uname=')) {
		document.location.href = document.location.href.replace('account&s=profile', 'account_profile');
	}

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
	} catch (any) {}
}

function optionsPage() {
	var table = $$('div.option table')[0];
	var submit = $$('div.option input[type="submit"]')[0];

	new Insertion.Bottom(table, '<tr style="text-align:center;"><td colspan=2><br><b>Booru Augmentation Project</b></td></tr>');
	new Insertion.Bottom(table, '<tr><td><label class="block">Disallow Unicode tags</label><p>Do not accept non-ANSI tags when editing tags in-place</p></td><td><br><input class="BAPoption" id="ansiOnly" type="checkbox"/></td></tr>');
	new Insertion.Bottom(table, '<tr><td><label class="block">Suggest <b>+solo</b></label><p>Mark green/add a solo tag if there are less than 2 existing tags</p></td><td><br><input class="BAPoption" id="solo" type="checkbox"/></td></tr>');
	new Insertion.Bottom(table, '<tr><td><label class="block">Suggest <b>-tagme</b></label><p>Mark red an existing tagme tag for easier removal</p></td><td><br><input class="BAPoption" id="tagme" type="checkbox"/></td></tr>');
	new Insertion.Bottom(table, '<tr><td><label class="block">Show complete tag list</label><p>Display here a list of all tags sorted by their amount of posts</p></td><td><br><input class="BAPoption" id="showTags" type="checkbox"/></td></tr>');

	new Insertion.After($$('form > p')[0], '<div style="float:right; height:0; left:720px; position:absolute;"><table id="allTags" class="highlightable" style="width:680px;"><caption>Tag list by post amount</caption><thead><tr><th>tag</th><th>posts</th></tr></thead><tbody></tbody></table></div>');

	Object.keys(BAPopts).each(function (opt) {
		$$('input.BAPoption#' + opt)[0].checked = BAPopts[opt];
	});

	$('showTags').onchange = function (that) {
		showTags(that.target.checked);
	};

	showTags(BAPopts.showTags);

	submit.onclick = function () {
		$$('input.BAPoption').each(function (el) {
			BAPopts[el.id] = el.checked;
		});
		localStorage.BAPopts = JSON.stringify(BAPopts);
	};
}

function showTags(show) {
	var allTags = $('allTags');

	if (!show) {
		allTags.hide();
		return;
	}
	allTags.show();
	if (allTags.down('a')) {
		return;
	}
	BAPtags = JSON.parse(localStorage.getItem('BAPtags') || '{}');
	Object.keys(BAPtags).sort(function (a, b) {
		a = BAPtags[a];
		b = BAPtags[b];
		return a == b ? 0 : ((b - a) / Math.abs(b - a));
	}).each(function (tag) {
		if (BAPtags.hasOwnProperty(tag)) {
			if (BAPtags[tag] < 1) {
				delete BAPtags[tag]
			} else {
				new Insertion.Bottom(allTags, '<tr><td' + (BAPtags[tag] < 5 ? ' style="background-color:rgba(255,255,0,0.25);"' : '') + '><a href="index.php?page=post&s=list&tags=' + tag + '">' + tag + '</a></td><td>' + BAPtags[tag] + '</td></tr>');
			}
		}
	});
	localStorage.setItem('BAPtags', JSON.stringify(BAPtags));
}

function loadOptions(that) {
	searchField();
	that.onfocus = '';
}

function storeTags() {
	var tags = $$('#tag_list ul li span');
	var newTags, oldTags;

	if (!tags || !tags.length) {
		return;
	}
	oldTags = JSON.stringify(BAPtags);

	tags.each(function (span) {
		var tag = span.down('a').textContent.trim().replace(/\s+/g, '_').replace(/\"|\'/g, '');
		var num = Number(span.textContent.split(/\s+/).last());
		BAPtags[tag] = num;
	});

	newTags = JSON.stringify(BAPtags);

	localStorage.setItem('BAPtags', newTags);
}

function searchField() {
	var datalist = $('datags');

	if (!datalist) {
		new Insertion.Top(document.body, '<datalist id="datags"></datalist');
	}
	datalist = $('datags');

	Object.keys(BAPtags).each(function (tag) {
		if (!datalist.down('option[value="' + tag + '"]')) {
			new Insertion.Bottom(datalist, '<option value="' + tag + '">' + BAPtags[tag] + '</option>');
		}
	});

	$$('input#tags, input#stags')[0].oninput = function () {
		enableDatalist(this);
	};
}

function enableDatalist(that) {
	if (that.value.length >= 1) {
		that.setAttribute('list', 'datags')
	} else {
		that.removeAttribute('list');
	}
}

function markTags(li) {
	var q = li.textContent.trim().split(/\s+/);

	if (~q.indexOf('tagme') && BAPopts.tagme) {
		li.style.backgroundColor = 'rgba(255,0,0,0.25)';
	}
	q1 = q[q.length - 1];
	if (isNaN(q1) || q1 >= 5) {
		//	delete li.style;
		li.down('span').style.color = "#A0A0A0";
		return;
	}
	if (q1 <= 1) {
		li.style.backgroundColor = "rgba(255,255,0,0.66)";
	} else {
		li.style.backgroundColor = "rgba(255,255,0,0.33)";
	}
	li.down('span').style.color = "#000";
}

function listPage() {
	var tags = $$('#tag_list ul li');
	var posts = $$('span.thumb');

	if (!posts.length && ~document.location.href.indexOf('tags=')) {
		var t = document.location.href.split('tags=')[1].split('+');

		if (t.length == 1) {
			delete BAPtags[t[0]];
			localStorage.setItem('BAPtags', JSON.stringify(BAPtags));
		}
	}

	if (tags && tags.length) {
		tags.each(function (li) {
			if (!li.textContent.trim()) {
				return;
			}
			var q = li.down('span');

			var a = li.down('a');

			if (a && a.textContent == '+') {
				new Insertion.After(a, '&nbsp;');
				a = a.next('a');
				if (a && a.textContent == '-') {
					a.innerHTML = a.innerHTML.replace('-', '&ndash;');
				}
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
		next = current
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
		if (!tagli.textContent.trim()) {
			return false;
		}
		inserTag({
			text: tagli.textContent.trim().replace(/\s+/g, '_'),
			num:  tagli.up('span').textContent.split(' ').last()
		}, tagli.up('li'));
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
		if (BAPopts.solo && taglist.length == 1 && taglist[0].textContent.trim() != 'solo') {
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
		new Insertion.After($$('a.aAdd').last().up('li'), '<br>');
	}

	var strong = $$('#tag_list ul strong')[0];

	inserTag({}, strong.previous());
	new Insertion.Before(strong, '<br>');
	statisticsArea(strong);
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
						new Insertion.Before(pointer.nextSibling, '<a href="index.php?page=account_profile&uname=' + split[1].trim() + '">' + split[1].trim() + '</a>');
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
	} else if (!tag.text) { //new tag
		tagLink = tagLink.replace('style=""', 'style="display:none;"');
		editField = editField.replace('style="display:none;"', 'style=""');
	} else { //existing tag
		tagLink = tagLink.replace('&tags=', '&tags=' + tag.text.replace(/\s+/g, '_')).replace('></', '>' + tag.text.replace(/_/g, ' ') + '</');
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
		}
	} else {
		where.next().down('.editField').onkeydown = function (event) {
			if (event.keyCode == 13) {
				applyEdit(this);
			}
		};
		where.next().down('.editField').id = 'newTag';
		where.next().down('.editField').onfocus = function () {
			loadOptions(this);
		};
		where.next().down('.editField').oninput = function () {
			enableDatalist(this);
		}
	}
	if (tag.text && ~where.textContent.indexOf(tag.text.replace(/_/g, ' '))) {
		where.parentNode.removeChild(where);
	}
}

function showButton() {
	if ($('btnSubmit')) {
		return;
	}

	new Insertion.Before($$('div#tag_list ul strong')[0], '<input id="btnSubmit" type="submit" value="submit"><br><br>');
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
			localStorage.setItem('BAPtags', JSON.stringify(BAPtags));
			searchField();
		},
		onFailure:  function () {
			spinner.parentNode.removeChild(spinner);
			btnSubmit.show().disable().value = "error";
		}
	});
}

function toggleFitIn(that) {
	if (that.getAttribute('style')) {
		that.setAttribute('style', '')
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
	that.next('span.customTag').replace('<a href="index.php?page=post&s=list&tags=' + tag + '">' + tag.replace(/_/g, ' ') + '</a>');
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
	var value = that.value.trim().replace(/\s+/g, '_').toLowerCase();
	if (!value) {
		if (that.id != 'newTag') {
			exclude(that);
		}
		return;
	}

	var existing = $$('#tag_list ul > li > span > a:not([class])');
	var element;
	var exists = existing.some(function (tag) {
		if (tag.textContent.trim().replace(/\s+/g, '_') == value) {
			element = tag;
			return true;
		}
	});
	var oldTag = that.previous('a').textContent.trim().replace(/\s+/g, '_') || '';

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

	value = encodeURIComponent(value);

	var link = that.previous('span > a');

	link.href = 'index.php?page=post&s=list&tags=' + value;
	link.textContent = value.replace(/_/g, ' ');
	link.show();
	that.hide();

	that.onkeydown = function (event) {
		if (event.keyCode == 13) {
			this.blur();
		}
	};
	link.previous('.aEdit').show();
	link.next('.aDelete').show();

	$('tags').value = ($('tags').value.replace(oldTag, '') + ' ' + value.replace(/\s+/g, '_')).replace(/\s+/g, ' ');

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
// todo: fix rare bug when a tag is considered as custom because it shows on an image that's the only one with that tag on the booru
// todo: tag categories?
// todo: fix increasing whitespace above image stats after submitting tags
// todo: add new tag either by onblur or with a mouse button
// todo: larger buttons/fields

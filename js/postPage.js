postPageMain();

function postPageMain() {
	var image = $('image');
	var taglist = $$('div#tag_list li a');

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
		if (window.BAPopts.solo) {
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
			btnSubmit.parentNode.removeChild(btnSubmit.previous('br'));
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
					num:  window.BAPtags[tag.replace(/\s+/g, '_').replace(/\'/g, '')]
				}, $$('#tag_list ul br')[0]);
			});
			br = $$('#tag_list ul br')[0];
			br.parentNode.removeChild(br);

			if (Object.keys(window.BAPtags).length) {
				localStorage.setItem('BAPtags', JSON.stringify(window.BAPtags));
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

	currentNum.data = ' ' + String(window.BAPtags[tag] || '');
	that.hide();
	that.next('.aEdit').show();
	that.next('.aDelete').show();
	that.next('span.customTag').replace('<a href="index.php?page=post&s=list&tags=' + encodeURIComponent(tag) + '">' + tag + '</a>');
	$('tags').value += ' ' + tag;
	window.BAPtags[tag] = Number(window.BAPtags[tag] || 0) + 1;

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

	if (!isANSI(value) && window.BAPopts.ansiOnly) {
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

		currentNum.data = ' ' + String(window.BAPtags[value] || '0');
		markTags(that.up('li'));

		window.BAPtags[value] = Number(window.BAPtags[value] || 0) + 1;
		if (oldTag) {
			window.BAPtags[oldTag] = Math.max(Number(window.BAPtags[oldTag] || 0) - 1, 0);
			if (window.BAPtags[oldTag] === 0) {
				delete window.BAPtags[oldTag];
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
	window.BAPtags[tag] = Math.min(Number(window.BAPtags[tag] || 0) - 1, 0);
	if (window.BAPtags[tag] === 0) {
		delete window.BAPtags[tag];
	}
	showButton();
}

function togglEdit(that) {
	var span = that.parentNode;

	span.down('input').show().focus();
	span.down('a.aEdit').next('a').hide();
}

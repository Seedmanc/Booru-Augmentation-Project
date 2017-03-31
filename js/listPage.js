listPageMain()

function listPageMain() {
	var tags = $$('#tag_list ul li');
	var posts = $$('span.thumb');

	storeTags();

	if (!posts.length && ~document.location.href.indexOf('tags=')) {
		var t = (document.location.href.split('tags=')[1] || '').split('+');

		if (t.length == 1 && t[0]) {
			delete window.BAPtags[t[0]];
			
			if (Object.keys(window.BAPtags).length) {
				localStorage.setItem('BAPtags', JSON.stringify(window.BAPtags));
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
				new Insertion.Before(s.childNodes[0], '<a style="color:#a0a0a0; text-decoration: underline;" href="https://www.google.com/search?q=' + query + '" target="_blank">?</a>');
			}
			markTags(li);
		});
		pagination();
	} else {
		return;
	}
}

function pagination () {
	var paginator = $('paginator');
	var current = paginator && paginator.down('b');
	var contents = paginator && paginator.immediateDescendants().without(paginator.down('script'));
	var pos = contents && contents.indexOf(current);
	var shift = Math.min(current.textContent - 2, 4);
	var newPos = paginator.down('a:not([alt])', shift);
	var next = current.next();
	var pageLinks;
	var pid;
	
	if (!paginator.down('a[alt="first page"]')|| 
		!paginator.down('a[alt="next"]')  || 
		contents.length < 15 ||
		pos >= 7 ||
		(contents.last().href == contents.last().previous('a:not([alt])').href) && (contents.first().href == contents.first().next('a:not([alt])').href)
	) {
		return;
	}

	pid = ~document.location.search.indexOf('pid=') ? 
		document.location.search.split('&').findAll(function (el) {
			return ~el.indexOf('pid');
		})[0].replace('pid=', '') : 
		0;


	if (next == newPos) {
		next = current;
	} else {
		paginator.insertBefore(current, newPos);
	}
	paginator.insertBefore(newPos, next);

	pageLinks = document.querySelectorAll('div#paginator > a:not([alt]), div#paginator > b');

	for (var i = 0; i < pageLinks.length; i++) {
		pageLinks[i].textContent = pid / 20 - shift + i;
		if (!pageLinks[i].href) {
			continue;
		}
		pageLinks[i].href = pageLinks[i].href.replace(/&pid=\d+/gi, '&pid=' + ((pageLinks[i].textContent - 1) * 20));
	}
}
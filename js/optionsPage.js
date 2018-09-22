optionsPageMain();

var Current = 0, start = 0, timeouts=[], failure = false;

function optionsPageMain() {
	delete Array.prototype.toJSON;
	var table = $$('div.option table tbody')[0];
	var submit = $$('div.option input[type="submit"]')[0];
	BAPtags = BAPtags && Object.keys(BAPtags).length || JSON.parse(localStorage.getItem('BAPtags') || '{}');

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

	$('showTags').onchange = showTags
	$('showScanner').onchange = showScanner;

	submit.onclick = function () {
		$$('input.BAPoption').each(function (el) {
			BAPopts[el.id] = el.checked;
		});
		localStorage.BAPopts = JSON.stringify(BAPopts);
	};
	showScanner();
}

function removeTagme(offset) {
	var rttProgress = $('rttProgress');
	
	$('rttError').textContent = '';
		
	getPage('https://' + currentBooru + '.booru.org/index.php?page=post&s=list&tags=tagme&pid=' + offset, function (html) {
		var total = html.querySelector('a[alt="last page"]'), completed = 0;
		var next = html.querySelector('a[alt="next"]');
		var ilinks = html.querySelectorAll('.content .thumb > a');
		var delay = 3000;

		rttProgress.value = offset || 1;

		next = (next && next.getAttribute('href').split("pid=").last()) || 0;
		total = (total && total.getAttribute('href').split("pid=").last()) || 20;

		if (offset === 0) {
			$('rttProgress').max = total;
		}

		$A(ilinks).forEach(function (v, i) {
			if (failure) {
				processError(v);
				return false;
			}

			var t = setTimeout(function(){

				getPage('https://' + currentBooru + '.booru.org/index.php?page=post&s=view&id=' + v.id.replace('p',''), function (html2) {
					if (failure) {
						processError(v);
						return false;
					}
					var form = html2.querySelector('#edit_form');

					form.tags.value = form.tags.value.replace(/^tagme | tagme$| tagme /i, ' ');
					form.pconf.value = 1;

					timeouts.push(setTimeout(function(){
						if (failure) {
							processError(v);
							return false;
						}
						form.request({
							onComplete: function (xhr) {
								if (xhr.responseText && ~xhr.responseText.indexOf('ou are not logged in')) {
									failure = true;
									processError('you are not logged in');
								}
								if (failure) return false;
								
								completed++;
								rttProgress.value++;

								if (completed >= ilinks.length && next) {
									timeouts.push(setTimeout(function(){removeTagme(next);}, delay/2));
								} else if (completed >= ilinks.length) {
									rttProgress.max = rttProgress.value;
								}
							},
							onFailure:  function () {
								failure = true;
								processError(v);								
							}
						});
					}, delay/3));
				});
			}, delay*(i+1));
			timeouts.push(t);
		});
	});
	
	function processError(err) {
		$('removeTagme').removeAttribute('disabled'); 
		$('rttError').innerHTML = typeof err == 'object' ? 'error removing tagme at post ' + err.outerHTML : err;
		timeouts.forEach(function(to) {
			window.clearTimeout(to);
		});
	}
}
//TODO sequential execution in case of booru limitations

function getPage(url, callback) {
	if (!url) {
		return;
	}

	new Ajax.Request(url, {
		method:    'get',
		onSuccess: function (xhr) {
			var tmplt = document.createElement('template'), html;
			
			tmplt.innerHTML = xhr.responseText;
			html = (tmplt.content || tmplt);

			if (typeof callback == 'function') {
				callback(html);
			}
		}
	});
}

function showScanner() {
	var table;
	
	Current = 0;
	start = start || 0;	

	if ($('allTags')) {
		$('allTags').up('.option').hide();
	}

	if ($('scanner')) {
		$('scanner').up('.option').show();

		return;
	}

	new Insertion.After($$('form > p')[0],
		'<div class="option" style="float:right; height:0; left:740px; position:absolute;"><table id="scanner" class="" style="width:680px; margin-bottom:0;"><thead><tr><th colspan=2><center>Booru scanner</center></th></tr></thead><tbody></tbody></table></div>');
	table = $$('#scanner tbody')[0];

	new Insertion.Bottom(table,
		'<tr><td><label class="block">Limit scope to query:</label><br>&nbsp;</td><td style="width:100%; "><input style="width:99%;padding:0;" type="text" name="tag" id="scanTags" placeholder="tag list or a # of pages to scan"/></td></tr>');
	new Insertion.Bottom(table,
		'<tr><td><label class="block">Initiate scanning</label><br>&nbsp;</td><td style="text-align:center; width:100%; "><input type="button" style="width:100%;" id="start" value="Start"/></td></tr>');
	new Insertion.Bottom(table,
		'<tr><td><label class="block">Scan progress</label><p style="margin:0"><span id="current">' + Current + ' posts remaining</span><span id="time" style="display:none;">, &nbsp;time left: <span id="timeValue"/></span></p></td>\
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
				<li>Open the hash db and the found images in the <a target="_blank" href="https://'+currentBooru+'.booru.org/index.php?page=post&s=search_image"><b>Image Search</b></a> to get links to posts on booru that have duplicating images</li></ol><br>\
			Note: in Chrome the amount of pictures opened simulaneously might be quite limited by their collective filename length. You can open a folder of images instead.\
		</tbody></table></div>');

	new Insertion.After($('sbi'),
		'<table id="rtt" style="width:680px; "><thead><tr><th colspan="2"><center>Remove <i>tagme</i></center></th></tr></thead><tbody><tr><td colspan="2"><p style="width:100%; text-align:justify;">Booru automatically adds the "tagme" tag if your uploads have less than 5 tags. You can\'t turn that off, however, you can batch-delete that tag from the posts that have it.</p></tbody></table></div>');
	new Insertion.Bottom($('rtt'),
		'<tr><td><label class="block"><input type="button" style="width:100%;" id="removeTagme" value="Remove tagme"/></label></td><td style="text-align:center; width:100%; vertical-align:middle;"><progress id="rttProgress" style="width:100%;" value="0" max="'+ (BAPtags.tagme || 0) +'"></progress></td></tr><tr><td></td><td><div id="rttError" style="color:red; text-align:center;"></div></td></tr>');

	$('removeTagme').onclick = function () {
		$('removeTagme').disable();
		failure = false;
		removeTagme(0);
	};

	$('scanTags').onfocus = function () {
		loadOptions(this);
	};

	$('dllinks').onclick = function (evt) {
		if (evt.target.className == "dllink") {
			var tl = evt.target.id == 'taglist' ? 
				Object.keys(window.taglist).length == 0 ? 
					BAPtags : 
					false :
				false;
			var b = new Blob([JSON.stringify(tl || window[evt.target.id], null, '\t')], {type: typeof URL != 'undefined' ? 'text/plain' : 'application/octet-stream'});
			var a = document.createElement('a');
			var scanQuery = $('scanTags').value.trim();
			var isNum = scanQuery && /^\d+$/.test(scanQuery);

			a.download = evt.target.id.replace('list', ' list for ' + (scanQuery ? 
					(isNum ? 
						(scanQuery + ' posts @ ') : 
						('\'' + scanQuery + '\' @ ')
					) : 
					'')
				+ currentBooru + 'booru' + isNum ? 
					'' : 
					(', ' + (start - Current) + ' of ' + start + ' posts scanned')
				) + '.json';
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


	$('scanTags').onchange = function (evt) {
		var query = (evt && evt.target.value.trim()), lastpic;
		var isNum = query && /^\d+$/.test(query);
		var limit;

		if (isNum) {
			limit = parseInt(query, 10);
			query = 'all';
			start = (limit-1)*20;
			$('scanProgress').max = start;
			$('current').update(start+20 + ' posts remaining');
			$('current').up('p').style.color = "";
			$('start').enable();

			if (limit === 0) {
				$('start').disable();
			}
		} else {
			query = query || 'all';
			getPage('https://' + currentBooru + '.booru.org/index.php?page=post&s=list' + (query ? '&tags=' + query : ''), function (html) {
				start = html.querySelector('a[alt="last page"]');

				if (html.querySelectorAll('span.thumb').length) {
					$('current').up('p').style.color = "";
					$('start').enable();

					start = parseInt((start && start.getAttribute('href').split("pid=").last()) || '1', 10);
					$('scanProgress').max = start;
					$('current').update(start + ' posts remaining');
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

function scanPage(offset) {
	var query = $('scanTags').value;
	var isNum = query && /^\d+$/.test(query);
	var limit;

	if (isNum) {
		limit = parseInt(query, 10);
		query = 'all';
	}

	getPage('https://' + currentBooru + '.booru.org/index.php?page=post&s=list' + (query ? '&tags=' + query : '') + '&pid=' + offset, function (html) {
		var tags, ilinks, next, tag, temp = {};
		
		Current = offset;
		$('current').update(Current + ' posts remaining');
		$('scanProgress').value = start - Current;

		tags = $A(html.querySelectorAll('#tag_list ul li span'));
		tags.forEach(function (span) {
			tag = span.querySelector('a').getAttribute('href');
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

		ilinks = html.querySelectorAll('.content .thumb > a');
		$A(ilinks).forEach(function (v) {
			var id = v.id.replace('p', '');
			var data = v.querySelector('img').title.trim();
			var itags = data.split('score')[0].trim().split(/\s+/).sort();
			var score = data.split('score:')[1].split('rating')[0].trim();
			var rating = data.split('rating:')[1].split('')[0].toLowerCase();
			var src = v.querySelector('img').src;
			var ext = src.split('.').last();
			var hash = src.split('thumbnail_')[1].split('.')[0];
			var cluster = src.split('thumbnail')[1].replace(/\/+|s/g, '');
			
			window.thumblist.push(src);
			window.linklist.push(src.replace('thumbs', 'img').replace('thumbnails', 'images').replace('thumbnail_', ''));
			window.postlist[hash] = {
				c: Number(cluster),
				e: ext,
				i: Number(id),
				r: rating,
				s: Number(score),
				t: itags
			};
		});

		next = html.querySelector('a[alt="back"]');
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
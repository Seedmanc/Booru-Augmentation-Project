// ==UserScript==
// @name		Booru Augmentation Project
// @description	Enhance your basic booru experience
// @version	1.0
// @author		Seedmanc
// @include	http://*.booru.org/*index.php?page=post*
// @grant 		none 
// @run-at		document-body
// @noframes
// ==/UserScript==

document.addEventListener('DOMContentLoaded', main, false);

function main(){
  try {
	var ad = document.querySelectorAll('center div[id*="adbox"]')[0];
	if (ad)
		ad.parentNode.parentNode.removeChild(ad.parentNode);
	var ad = document.querySelectorAll('#right-col div[id*="adbox"]')[0];
	if (ad)
		ad.parentNode.parentNode.removeChild(ad.parentNode);
	var ad = $$('center a[href*="patreon"]')[0];
	if (ad)
		ad.parentNode.parentNode.removeChild(ad.parentNode);	
  }catch(any){};

	if (!~document.location.href.indexOf('&s=view') || !(readCookie('user_id') && readCookie('pass_hash')))
		return;
 	
	if ($('image').getWidth() > 1480)
		$('note-container').setAttribute('style','cursor:pointer');
		
	new Insertion.Bottom($$('head')[0],'<style>\
		.aEdit{font-size:smaller; background-color:rgba(255, 255, 0, 0.33);}\
		.aDelete{font-size:smaller; background-color:rgba(255,0, 0, 0.2);}\
		.aAdd {font-size:smaller; background-color:rgba(0, 255, 0, 0.25);}\
		#image{max-width:1480px; margin-right:0 !important;}\
		.fitIn{max-width:auto !important;}\
	</style>');

	$('image').setAttribute('style','');
	$('image').onclick = function(){toggleFitIn(this);};

	var taglist = $$('div#tag_list li a');
	taglist.each( function(tagli){
		inserTag({text:tagli.textContent.trim().replace(/\s+/g,'_'), num:tagli.up('span').textContent.split(' ').last()}, tagli.up('li'))
	});
	
	var br1 = $$('div#tag_list br')[0];
	
	var customTags = (readCookie("tags")||'').split(/[, ]|%20+/g).sort().reverse();
	var currentTags = $('tags').value.split(/\s+/);
	currentTags.each(function(tag){
		customTags = customTags.without(tag);
	})
	if ((customTags.length) && (readCookie('tags'))){		
		customTags.each(function(tag){
			inserTag({text:tag}, br1);
		});
		new Insertion.After($$('a.aAdd').last().up('li'),'<br>');
	}
	
	var strong = $$('#tag_list ul strong')[0]	
	
	inserTag({}, strong.previous()); 
	new Insertion.Before(strong,'<br>');  
	strong.innerHTML = '<u>'+strong.innerHTML+'</u>';	
	var pointer = strong.nextSibling;

	while (pointer && pointer.tagName != 'li') {
		if (pointer.nodeType === 3) {
			var split = pointer.data.split(':');
			if (split.length > 1) {
				if (~split[0].indexOf('Score') || (~split[0].indexOf('Source') && !$('source').value)){
					pointer.parentNode.removeChild(pointer.previousSibling);
					pointer.data = '';
				} else {
					if (~split[0].indexOf('By')) {
						new Insertion.Before(pointer.nextSibling,'<a href="index.php?page=account_profile&uname='+split[1].trim()+'">'+split[1].trim()+'</a>');
						pointer.data = split[0]+': ';
						split[1] = ' ';
					}
					new Insertion.After(pointer.previousSibling,'<b>'+split[0]+'</b>');
					split[0] = '';
					pointer.data = split.join(':');
				}
			}
		}  
		if ((!pointer.nextSibling || pointer.nextSibling.tagName == 'li')&& $('title').value) {
			new Insertion.Before(pointer, '<b>Title:</b> '+$('title').value);
			break;
		}
		pointer = pointer.nextSibling;
	}
}

function inserTag(tag, where){
	var aAdd = '<a href="#'+tag.text+'" class="aAdd" style="display:none;">[+]</a> ';;
	var aEdit = '<a href="#'+tag.text+'" class="aEdit" style="display:none;">[/]</a> ';
	var aDelete = ' <a href="#'+tag.text+'" class="aDelete" style="display:none;">[-]</a>';
	var editField = '<input placeholder="add tag" class="editField" type="text" value="'+(tag.text||'')+'" style="display:none;">';
	
	var tagLink = ' <a href="index.php?page=post&s=list&tags=" style=""></a> ';
	if (tag.text && !tag.num) {		//custom tag
		aAdd = aAdd.replace('style="display:none;"', 'style=""');
		tagLink = '<span class="customTag">'+tag.text+'</span>';
	} else if (!tag.text) {			//new tag
		tagLink   = tagLink.replace('style=""','style="display:none;"'); 
		editField = editField.replace('style="display:none;"','style=""');
	} else {						//existing tag
		tagLink = tagLink.replace('&tags=', '&tags='+tag.text.replace(/\s+/g,'_')).replace('></', '>'+tag.text.replace(/_/g,' ')+'</');	
		aEdit   = aEdit.replace('style="display:none;"', 'style=""');
		aDelete = aDelete.replace('style="display:none;"', 'style=""');
	}
		
	var span = '<span style="color: #a0a0a0;">'+aAdd+aEdit+tagLink+editField+aDelete+' '+(tag.num||'')+'</span>';
	new Insertion.After(where, '<li>'+span+'</li>');
	
	where.next().down('.aAdd').onclick = function(){addTag(this);}		
	where.next().down('.aEdit').onclick = function(){togglEdit(this);}
	where.next().down('.aDelete').onclick = function(){exclude(this);}	
	if (tag.text) {
		where.next().down('.editField').onblur = function(){applyEdit(this);}
		where.next().down('.editField').onkeydown = function(){if (event.keyCode == 13) this.blur();}
	} else {
		where.next().down('.editField').onkeydown = function(){if (event.keyCode == 13) applyEdit(this);}
		where.next().down('.editField').id = 'newTag';
	}
	
	if (tag.text && ~where.textContent.indexOf(tag.text.replace(/_/g,' ')))
		where.parentNode.removeChild(where);
}

function showButton(){
	if ($('btnSubmit'))
		return;
	new Insertion.Before($$('div#tag_list ul strong')[0], '<input id="btnSubmit" type="submit" value="submit"><br><br>');
	$('btnSubmit').onclick = function(){mySubmit();};
}

function mySubmit(){
	new Insertion.Before($('btnSubmit'), '<img id="spinner" 	src="https://dl.dropboxusercontent.com/u/74005421/js%20requisites/16px_on_transparent.gif">');
	
	$('btnSubmit').hide();
	$('edit_form').request({
		onComplete: function(response){ 
			if (~response.responseText.indexOf('ou are not logged in')) {
				$('spinner').hide();
				new Insertion.Before($$('div#tag_list ul strong')[0], '<p class="aDelete">You are not logged in</p>');
				return;			
			}		
			var br = $$('#tag_list ul strong')[0].previous('br');
			br.parentNode.removeChild(br);
			$('spinner').parentNode.removeChild($('spinner')); $('btnSubmit').parentNode.removeChild($('btnSubmit'));
			
			var taglist = $$('div#tag_list li a.aDelete').findAll(function(el) { return el.visible(); });
			var lis = {};
			taglist.each(function(taglink){ 
				lis[taglink.previous('a').textContent.trim()] = taglink.up('span').textContent.split(/\s+/).last()||' ';
			});
			taglist.each(function(taglink){ 
				taglink.up('li').parentNode.removeChild(taglink.up('li'));
			});
			var sorted = Object.keys(lis).sort().reverse();
			new Insertion.Top($$('#tag_list ul')[0],'<br>');	
			sorted.each(function(tag){
				inserTag({text:tag,num:lis[tag]},$$('#tag_list ul br')[0]);
			});
			br = $$('#tag_list ul br')[0];
			br.parentNode.removeChild(br);
		},
		onFailure:	function(){ $('spinner').parentNode.removeChild($('spinner')); $('btnSubmit').show().disable().value="error";}
	});
}

function toggleFitIn(that){
	if (that.getAttribute('style')) 
		that.setAttribute('style','') 
	else 
		that.setAttribute('style','max-width:20000px !important;');
}

function addTag(that){
	var tag = that.next('span.customTag').textContent.trim();
	that.hide();
	that.next('.aEdit').show();
	that.next('.aDelete').show();
	
	that.next('span.customTag').replace('<a href="index.php?page=post&s=list&tags='+tag.replace(/\s+/g,'_')+'">'+tag+'</a>');
	
	$('tags').value+= ' '+tag.replace(/\s+/g,'_');
	showButton();
}

function applyEdit(that){ 

	var value = that.value.trim().replace(/\s+/g, '_');	
	if (!value) {
		if (that.id != 'newTag')
			exclude(that);
		return;
	}
	var oldTag = that.previous('a').textContent.trim().replace(/\s+/g,'_')||'';
	var link = that.previous('span > a');
	link.href = 'index.php?page=post&s=list&tags='+value;
	link.textContent = value.replace(/_/g, ' ');
	link.show();
	that.hide();
	that.onblur  = function(){applyEdit(this);};
	that.onkeydown=function(){if (event.keyCode == 13) this.blur();} 
	link.previous('.aEdit').show();
	link.next('.aDelete').show();
	
	$('tags').value = ($('tags').value.replace(oldTag,'')+' '+value.replace(/\s+/g,'_')).replace(/\s+/g, ' ');
	if (oldTag != value)
		showButton();		
	if (that.id == 'newTag'){
		that.id = '';
		inserTag({}, $('btnSubmit').previous('li'));	
		$('newTag').focus();
	}
	that.placeholder = 'edit tag';
}

function exclude(that){
	var li = that.up('li');
	var tag = li.down('.aEdit').next('a').textContent.trim().replace(/\s+/g,'_');
	li.parentNode.removeChild(li);
	$('tags').value = $('tags').value.split(/\s+/).without(tag).join(' ');
	showButton();
}

function togglEdit(that){
	var span = that.parentNode;
	span.down('input').show().focus();
	span.down('a.aEdit').next('a').hide();
}

//todo fix cookies + => %2520 
//todo fix userlist
//todo add recent tags
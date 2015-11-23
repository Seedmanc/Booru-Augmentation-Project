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

	if (!~document.location.href.indexOf('&s=view'))
		return;
  
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
		var aEdit = '<a href="#" class="aEdit" onclick="togglEdit(this)">[/]</a> ';
		var aDelete = ' <a href="#" class="aDelete" onclick="exclude(this)">[-]</a>';
		var editField = '<input class="editField" type="text" value="'+tagli.textContent.replace(/\s+/g,'_')+'" style="display:none" onblur="applyEdit(this)" onkeydown="if (event.keyCode == 13) this.blur();">';
		var span = tagli.parentNode;
		var newSpan = span.innerHTML.split(/\s+/);
		newSpan[0] = aEdit+editField; newSpan.splice(newSpan.length-1, 0, aDelete);
		span.innerHTML = newSpan.join(' '); 
	});
	
	$$('.aEdit').each(function(el){
		el.onclick = function(){togglEdit(this);}
	});
	$$('.aDelete').each(function(el){
		el.onclick = function(){exclude(this);}
	});
	$$('input.editField').each(function(el){
		el.onblur = function(){applyEdit(this);}
		el.onkeydown = function(){if (event.keyCode == 13) this.blur();}
	});
	
	
	var br1 = $$('div#tag_list br')[0];
	
	var customTags = (readCookie("tags")||'').split(/[, ]|%20+/g).sort().reverse();
	var currentTags = $('tags').value.split(/\s+/);
	currentTags.each(function(tag){
		customTags = customTags.without(tag);
	})
	if ((customTags.length) && (readCookie('tags'))){
		
		customTags.each(function(tag){
			var aAdd = '';    
			new Insertion.After(br1, '<li>\
				<span style="color: #a0a0a0;">\
					<a href="#" class="aAdd" onclick="addTag(this)">[+]</a> '+
					tag+
				'</span>\
			</li>');
		});
		new Insertion.After($$('a.aAdd').last().up('li'),'<br>');
	}
	
	$$('.aAdd').each(function(el){
		el.onclick = function(){addTag(this);}
	});
	
	addEdit($$('div#tag_list strong')[0].previous());
	new Insertion.Before($$('#tag_list ul strong')[0],'<br>');
  
}

function showButton(){
	if ($('mySubmit'))
		return;
	new Insertion.Before($$('div#tag_list ul strong')[0], '<input id="mySubmit" type="submit" value="submit" onclick="submit()"><br><br>');
	$('mySubmit').onclick = function(){submit();};
}

function submit(){

	new Insertion.Before($('mySubmit'), '<img id="spinner" 	src="https://dl.dropboxusercontent.com/u/74005421/js%20requisites/16px_on_transparent.gif">');
	$('mySubmit').hide();
	$('edit_form').request({
		onComplete: function(){ 
			var br = $$('#tag_list ul strong')[0].previous('br');
			br.parentNode.removeChild(br);
			$('spinner').parentNode.removeChild($('spinner')); $('mySubmit').parentNode.removeChild($('mySubmit'));
			var taglist = $$('div#tag_list li a.aDelete');
			var lis = {};
			taglist.each(function(taglink){ 
				lis[taglink.previous('a').textContent] = taglink.up('li').innerHTML.replace(/<br\/?>/gim,'');
			});
			taglist.each(function(taglink){ 
				taglink.up('li').parentNode.removeChild(taglink.up('li'));
			});
			var sorted = Object.keys(lis).sort().reverse();
			sorted.each(function(tag){
				new Insertion.Top($$('#tag_list ul')[0],'<li>'+lis[tag]+'</li>');
			});
			$$('.aEdit').each(function(el){
				el.onclick = function(){togglEdit(this);}
			});
			$$('.aDelete').each(function(el){
				el.onclick = function(){exclude(this);}
			});
			$$('input.editField').each(function(el){
				el.onblur = function(){applyEdit(this);}
				el.onkeydown = function(){if (event.keyCode == 13) this.blur();}
			});			
		},
		onFailure:	function(){ $('spinner').parentNode.removeChild($('spinner')); $('mySubmit').show();}
	});
}

function toggleFitIn(that){
	if (that.getAttribute('style')) 
		that.setAttribute('style','') 
	else 
		that.setAttribute('style','max-width:20000px !important;');
}

function addTag(that){
	var li = that.up('li');
	var tag = li.textContent.replace('[+]','').trim();
	that.update('[/]');
	that.setAttribute('onclick','togglEdit(this)');
	that.setAttribute('class','aEdit');
	var span = li.down('span');
	var contents = span.innerHTML.trim().split('</a>');
	contents[0]+= '</a>';
	contents[1] = '<a href="index.php?page=post&s=list&tags='+tag+'">'+tag.replace(/_/g,' ')+'</a>';	contents.push('<input class="editField"  type="text" value="'+tag+'" style="display:none" onblur="applyEdit(this)" onkeydown="if (event.keyCode == 13) this.blur();">');
	contents.push(' <a href="#" class="aDelete" onclick="exclude(this)">[-]</a>');
	span.innerHTML = contents.join(' ');
	$('tags').value+=' '+tag;
	showButton();
	$$('input.editField').each(function(el){
		el.onblur = function(){applyEdit(this);}
		el.onkeydown = function(){if (event.keyCode == 13) this.blur();}
	});	
	$$('.aDelete').each(function(el){
		el.onclick = function(){exclude(this);}
	});	
	$$('.aEdit').each(function(el){
		el.onclick = function(){togglEdit(this);}
	});
}

function addEdit(that){ 
	
	var input = that.down('input');
	if (input) {
		var value = input.value.trim();
		if (!value)
			return;
		var a = that.down('a', 1);
		a.href= a.href.replace('[replace]', value.replace(/\s+/g, '_'));
		a.update(value.replace(/_/g,' '));
		input.hide();
		a.show();
		that.down('a').show()
		that.down('a', 2).show().setAttribute('class','aDelete');
		$$('.aDelete').each(function(el){
			el.onclick = function(){exclude(this);}
		});	
		input.setAttribute('onblur', "applyEdit(this)");
		input.setAttribute('onkeydown', "if (event.keyCode == 13) this.blur();");		
		input.className += ' editField';
		$$('input.editField').each(function(el){
			el.onblur = function(){applyEdit(this);}
			el.onkeydown = function(){if (event.keyCode == 13) this.blur();}
		});			
		$('tags').value += ' '+value.replace(/\s+/g,'_');
	} 
	new Insertion.After(that, '<li>\
		<span style="color: #a0a0a0;">\
			<a href="#" class="aEdit" onclick="togglEdit(this)" style="display:none" >[/]</a>\
			<a href="index.php?page=post&s=list&tags=[replace]" style="display:none" >[replace]</a>\
			<input class="newTag" placeholder="add tag" type="text" value="" onkeydown="if (event.keyCode == 13) addEdit(this.up(\'li\'));">\
			<a href="#" onclick="exclude(this)" style="display:none" >[-]</a>\
		</span>\
		<br>\
	</li>'
	);	
	$$('.aEdit').each(function(el){
		el.onclick = function(){togglEdit(this);}
	});
	$$('.newTag')[0].onkeydown = function(){if (event.keyCode == 13) addEdit(this.up('li'));};
	if (input) {
		showButton();
		$$('.newTag').last().focus();
	}
}

function exclude(that){
	var li = that.up('li');
	var tag = li.down('a',1).textContent.replace(/\s+/g,'_');
	li.parentNode.removeChild(li);
	$('tags').value = $('tags').value.split(/\s+/).without(tag).join(' ');
	showButton();
}

function applyEdit(that){
	var span = that.parentNode;
	var tag = that.value.trim();
	var oldTag = that.up('li').down('a',1).textContent.replace(/\s+/g,'_');
	if (!tag) {
		exclude(that);
		return;
	};
	span.down('a',1).textContent = tag.replace(/_/g,' ');
	span.down('a',1).href = span.down('a',1).href.replace(/&tags=.+/,'&tags='+tag.replace(/\s+/g,'_'));
	span.down('input').hide();
	span.down('a',1).show();	
	$('tags').value = $('tags').value.split(/\s+/).without(oldTag).join(' ')+' '+tag;
	if (oldTag != tag)
		showButton();
}

function togglEdit(that){
	var span = that.parentNode;
	span.down('input').show().focus();
	span.down('a',1).hide();
}

//todo fix cookies + => %2520
// ==UserScript==
// @name		Booru Augmentation Project
// @description	Enhance your basic booru experience
// @version	1.0
// @author		Seedmanc
// @include	http://*.booru.org/index.php?page=post*
// @grant 		none 
// @run-at		document-body
// @noframes
// ==/UserScript==

document.addEventListener('DOMContentLoaded', main, false);

var changed = false;

function main(){
  try {
	var ad = document.querySelectorAll('center div[id*="adbox"]')[0].parentNode;
	ad.parentNode.removeChild(ad);
	var ad = document.querySelectorAll('#right-col div[id*="adbox"]')[0].parentNode;
	ad.parentNode.removeChild(ad);
  } catch(any){};

	var taglist = $$('div#tag_list li a');
	taglist.each( function(tagli){
		var aEdit = '<a href="#" class="aEdit" onclick="togglEdit(this)">[/]</a> ';
		var aDelete = ' <a href="#" class="aDelete" onclick="exclude(this)">[-]</a>';
		var editField = '<input type="text" value="'+tagli.textContent.replace(/\s+/,'_')+'" style="display:none" onblur="applyEdit(this)" onkeydown="if (event.keyCode == 13) this.blur();">';
		var span = tagli.parentNode;
		var newSpan = span.innerHTML.split(/\s+/);
		newSpan[0] = aEdit+editField; newSpan.splice(newSpan.length-1, 0, aDelete);
		span.innerHTML = newSpan.join(' ');
 
	});
	
	var br1 = $$('div#tag_list br')[0];
	
	var customTags = (readCookie("tags")||'').split(/[, ]|%20+/g).sort();
	var currentTags = $('tags').value.split(/\s+/);
	currentTags.each(function(tag){
		customTags = customTags.without(tag);
	})
	if (customTags.length){
		
		customTags.each(function(tag){
			var aAdd = '';    
			new Insertion.After(br1, '<li>\
				<span style="color: #a0a0a0;">\
					<a href="#" class="aAdd" onclick="addTag(this)">[+]</a> '+
					tag+
				'</span>\
			</li>');
		});
	}
	new Insertion.After($$('a.aAdd').last().up('li'),'<br>');
	addEdit($$('div#tag_list strong')[0].previous());
	
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
	contents[1] = '<a href="index.php?page=post&s=list&tags='+tag+'">'+tag.replace(/_/,' ')+'</a>';	contents.push('<input type="text" value="'+tag+'" style="display:none" onblur="applyEdit(this)" onkeydown="if (event.keyCode == 13) this.blur();">');
	contents.push(' <a href="#" class="aDelete" onclick="exclude(this)">[-]</a>');
	span.innerHTML = contents.join(' ');
	$('tags').value+=' '+tag;
}

function addEdit(that){ 
	
	var input = that.down('input');
	if (input) {
		var value = input.value.trim();
		if (!value)
			return;
		var a = that.down('a', 1);
		a.href= a.href.replace('[replace]', value.replace(/\s+/, '_'));
		a.update(value.replace(/_/,' '));
		input.hide();
		a.show();
		that.down('a').show()
		that.down('a', 2).show();
		input.setAttribute('onblur', "applyEdit(this)");
		input.setAttribute('onkeydown', "if (event.keyCode == 13) this.blur();");
		$('tags').value += ' '+value.replace(/\s+/,'_');
	} 
	new Insertion.After(that, '<li>\
		<span style="color: #a0a0a0;">\
			<a href="#" class="aEdit" onclick="togglEdit(this)" style="display:none" >[/]</a>\
			<a href="index.php?page=post&s=list&tags=[replace]" style="display:none" >[replace]</a>\
			<input placeholder="add tag" type="text" value="" onkeydown="if (event.keyCode == 13) addEdit(this.up(\'li\'));">\
			<a href="#" class="aDelete" onclick="exclude(this)" style="display:none" >[-]</a>\
		</span>\
		<br><br>\
	</li>'
	);	
}

function exclude(that){
	var li = that.up('li');
	var tag = li.down('a',1).textContent.replace(/\s+/,'_');
	li.parentNode.removeChild(li);
	$('tags').value = $('tags').value.split(/\s+/).without(tag).join(' ');
}

function applyEdit(that){
	var span = that.parentNode;
	var tag = that.value.trim();
	var oldTag = that.up('li').down('a',1).textContent.replace(/\s+/,'_');
	if (!tag) {
		exclude(that);
		return;
	};
	span.down('a',1).textContent = tag.replace(/_/,' ');
	span.down('a',1).href = span.down('a',1).href.replace(/&tags=.+/,'&tags='+tag.replace(/\s+/,'_'));
	span.down('input').hide();
	span.down('a',1).show();	
	$('tags').value = $('tags').value.split(/\s+/).without(oldTag).join(' ')+' '+tag;
}

function togglEdit(that){
	var span = that.parentNode;
	span.down('input').show().focus();
	span.down('a',1).hide();
}
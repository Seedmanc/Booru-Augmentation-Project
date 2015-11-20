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

function main(){

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
	
	var br = $$('div#tag_list br')[0];
		
	addEdit(br);
	
}

function addEdit(that){
	var input = that.down('input');
	if (input) {
		if (!input.value)
			return;
		var a = that.down('a', 1);
		a.href= a.href.replace('[replace]', input.value.replace(/\s+/, '_'));
		a.update(input.value.replace(/_/,' '));
		input.hide();
		a.show();
		that.down('a').show()
		that.down('a', 2).show();
		input.setAttribute('onblur', "applyEdit(this)");
		input.setAttribute('onkeydown', "if (event.keyCode == 13) this.blur();");
	} 
	new Insertion.After(that, '<li>\
		<span style="color: #a0a0a0;">\
			<a href="#" class="aEdit" onclick="togglEdit(this)" style="display:none" >[/]</a>\
			<input type="text" value="" onkeydown="if (event.keyCode == 13) addEdit(this.up(\'li\'));">\
			<a href="index.php?page=post&s=list&tags=[replace]" style="display:none" >[replace]</a>\
			<a href="#" class="aDelete" onclick="exclude(this)" style="display:none" >[-]</a>\
		</span>\
	</li>');
	
}

function exclude(that){
	var li = that.up('li');
	li.parentNode.removeChild(li);
}

function applyEdit(that){
	var span = that.parentNode;
	var tag = that.value.trim();
	if (!tag) {
		exclude(that);
		return;
	};
	span.down('a',1).textContent = tag.replace(/_/,' ');
	span.down('a',1).href = span.down('a',1).href.replace(/&tags=.+/,'&tags='+tag.replace(/\s+/,'_'));
	span.down('input').hide();
	span.down('a',1).show();
}

function togglEdit(that){
	var span = that.parentNode;
	span.down('input').show().focus();
	span.down('a',1).hide();
}
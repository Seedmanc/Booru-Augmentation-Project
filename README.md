# Booru Augmentation Project
A userscript that improves usability of basic *.booru.org hosted sites.

It's no secret that free accounts on booru.org offer very little convenience compared to well-developed sites like Danbooru.  
  My goal is to do what is possible on client-side to compensate for the lack of functionality of the server side.
  
## List of features:

* Drop-down select tag list for the search field

![screen](http://puu.sh/lD5FK/c90fd506d8.png)

Like on Danbooru, but so far only works for the first tag entered. The data for autocompletion is being collected as you navigate the booru, so its accuracy depends on your booru usage.

* AJAX tag editor
 
 ![pic](http://puu.sh/lwWff/d89ecf28d3.png)

Allows you to quickly add, edit and remove tags with just a few clicks and without page reloading. No more scrolling to the bottom of the page to open the edit form, do everything directly in the tag list to the left.  
  
* Revamp Statistics area below the tag list 

![screen](http://puu.sh/lyCVk/363400f0e5.png)

Improve readability, add user links and image title, remove unnecessary info.

* Shift page number links, so that links to both 5 previous and 5 next pages are available 
  
![screen](http://puu.sh/lC2cz/0a406af9a0.png)

By default booru only shows 10 next links, which makes jumping several pages back impossible.

* The scripts adds its settings section to your account options.

![screen](http://puu.sh/qAgtv/15a2dac554.png)

From here you can see the full list of tags the script collected so far, paired with their amount of posts (this data is used for search autocompletion). Another option is to enable the advanced booru tools:

* Booru scanner

![screen](http://puu.sh/qAgNc/3b2b832a0a.png)

This utility allows you to scan the entire booru or just the posts with selected tags. Scanning builds up the tag database for autocompletion and also allows you to download it in JSON format, as well as data for every post (id, rating, score, tags and image cluster) and a list of links to both image thumbnails and full-sizes. The latter can be fed to any mass-downloader to obtain a booru dump. Having both a collection of image thumbnails and a post database allows you to

* Search posts by images

![screen](http://puu.sh/qAiKm/b5d6d120fb.jpg)

You can find what post a saved thumbnail corresponds to by using this tool. It's useful when you're running duplicate checks on your booru and end up with a list of image doubles to delete.

* Remove tagme tags

![screen](http://puu.sh/qAiR9/811148b73e.png)

Made to overcome the needless "minimum of 5 tags" requirement that spams your uploads with the tagme tag, making it impossible to find posts that actually need to be tagged. Do note that this tool is only useful for admins, because it will attempt to edit any post it encounters and if you don't have right for it it'll fail and stop the progress. It is also advised to avoid editing other tags manually until the process finishes since booru limits the amount of consecutive edit queries and they're all used up by the script.

Aside from these, I added some minor tweaks such as fitting the post image into screen width, fixing links to user accounts, linkifying users and links in comments as well as tags in the alias list, highlighting potential mistakes in tags input, fixing incorrect handling of _ in tags and some other.

You feedback is required, please go to the [Issues](https://github.com/Seedmanc/Booru-Augmentation-Project/issues) section and make suggestions which features I should add, and what would you like to see.

Be sure to check out my other Booru-related userscript project - the [Mass Uploader](https://github.com/Seedmanc/Booru-mass-uploader)

angular.module('myApp', [])
	.controller('myCtrl', function ($scope) {
		$scope.booruName = document.location.href.split('?booru=')[1];
		$scope.orderByField = 'size';
		$scope.reverseSort = false;
		$scope.imagesEven = [];
		$scope.imagesOdd = [];
		$scope.fail = [];
		$scope.db = {};
		var images = [];
		var filenames = {};

		$('#db')   .on('change',   loadb).val('');
		$('#files').on('change',   loadFiles).val('').attr('disabled', '');
		$('table') .on('mouseover',highlighth);
		$('#mode') .on('change',   function () {
			if (this.value == 'folder') {
				$('#files').attr({'directory': true, 'mozdirectory': true, 'webkitdirectory': true});
			} else {
				$('#files').removeAttr('directory mozdirectory webkitdirectory');
			}
		});

		function loadb(evt) {
			var file = evt.target.files[0];
			var reader = new FileReader();

			if (file.name.split('.').reverse()[0] != 'json') {
				alert('Wrong filetype: must be json');

				return false;
			}

			reader.onloadend = function (e) {

				try {
					o = JSON.parse(e.target.result);
				} catch (err) {
					alert('Error loading DB: ' + err.message);

					return false;
				}

				for (var attrname in o) {
					$scope.db[attrname] = o[attrname];
				}

				if (Object.keys(o).length) {
					$('#files').removeAttr('disabled');
				} else {
					alert('Database is empty');
				}

			};
			reader.readAsText(file);
		}

		function highlighth(evt) {
			var i, col, th, secondTable;

			if ($(evt.target).is('td')) {
				i   = $(evt.target).index();
				col = $(evt.target);
				th  = col.closest('table').find('th');
				secondTable = $('#images-even,#images-odd').not(col.closest('table'));

				$('th').removeClass('hover');
				th.eq(i).addClass('hover');
				secondTable.find('th').eq(7 - i).addClass('hover');
			}
		}

		function loadFiles(evt) {
			var files = evt.target.files;
			var image = {}, missing = $('#missing').prop('checked'), hash, reader, failed;

			$.each(files, function (idx, file) {
				file.name = file.name.toLowerCase();
				if (filenames[file.name]) {
					return true;
				}
				filenames[file.name] = true;
				image = {};
				hash = /([a-z]|\d){40}/.exec(file.name);

				if (hash && hash[0] && $scope.db[hash[0]]) {
					if (!missing) {
						hash = hash[0];
						image.hash = [hash.slice(0, 20), hash.slice(20, 40)];
						image.tags = $scope.db[hash].t;
						image.tagnum = $scope.db[hash].t.length;
						image.score = $scope.db[hash].s;
						image.ext = $scope.db[hash].e;
						image.cluster = $scope.db[hash].c;
						image.post = $scope.db[hash].i;
						image.size = file.size / (image.ext == 'png' ? 3 : 1);
						image.pic = "http://thumbs.booru.org/" + $scope.booruName + "/thumbnails/" + image.cluster + "/thumbnail_" + image.hash.join('') + "." + image.ext;

						images.push(image);
					}
				} else {
					(function (file) {
						if (!~file.type.indexOf('image/')) {
							return;
						}
						reader = new FileReader();
						reader.onloadend = function (e) {
							failed = {};

							failed.src = e.target.result;
							failed.name = file.name.length > 7 ? [file.name.slice(0, file.name.length >> 1), file.name.slice(file.name.length >> 1, file.name.length)] : file.name;
							$scope.fail.push(failed);
							$scope.$apply();
						};
						reader.readAsDataURL(file);
					})(file);
				}
			});
			$('#files')[0].value = null;

			if (missing)
				return;

			$scope.imagesOdd = [];
			$scope.imagesEven = [];
			$scope.fail.sort(function (a, b) {
				return String.prototype.localeCompare(a.name, b.name);
			});

			images.sort(function (a, b) {
				return Math.abs(a.size - b.size) / (a.size - b.size) || 0;
			});

			images.forEach(function (image, i) {
				if (i % 2)
					$scope.imagesOdd.push(image)
				else
					$scope.imagesEven.push(image);
			});

			$scope.$apply();
		}

		$scope.sm = function () {
			var a, blob, bat = [], folder = '!missing', reader;

			bat.push('md "' + folder + '"');
			$scope.fail.forEach(function (image) {
				bat.push('move "' + image.name.join('') + '" "' + folder + '\\' + image.name.join('') + '"');
			});
			bat.push('pause');

			blob = new Blob([bat.join('\r\n')], {type: 'application/octet-stream'});
			a = window.document.createElement('a');
			a.download = 'move missing images to \'' + folder + '\' directory.bat';
			document.body.appendChild(a);

			if (window.URL && window.URL.createObjectURL) {
				a.href = window.URL.createObjectURL(blob);

				a.click();
				document.body.removeChild(a);
			} else {
				reader = new window.FileReader();

				reader.readAsDataURL(blob);
				reader.onloadend = function () {
					a.href = reader.result;
					a.click();
					document.body.removeChild(a);
				};
			}

		};
	});
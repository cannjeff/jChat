

$(function() {

	console.log('setting up for filedrop');

	 jQuery.event.props.push("dataTransfer");
	var xhr = new XMLHttpRequest();
	if(xhr.upload) {
		$('html').on('drop', fileSelectHandler);
	} else {
		console.log('nope, xhr no good you fool');
	}

	function fileSelectHandler(e) {
		e.stopPropagation();
		e.preventDefault();
		console.log('file selected!!!');
		var files = e.target.files || e.dataTransfer.files;
		for(var i=0, f; f = files[i]; i++) {
			uploadFile(f);
		}
	}

	function uploadFile(file) {
		console.log('uploading...');
		var xhr = new XMLHttpRequest();
		var formData = new FormData();
		formData.append('files', file);
		xhr.open('POST', '/upload', true)
		xhr.send(formData);

		$('#msg').
			val('I just uploaded a file. <a href="/uploads/' + file.name + '" target="_blank"  >' + file.name + '</a>');
		var e = jQuery.Event("keypress");
		e.keyCode = $.ui.keyCode.ENTER;
		$("input").trigger(e);
	}

});

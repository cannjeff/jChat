$(function() {
		var socket = io.connect();

		socket.on('message', function (data) {
			console.log(data);
			var ms = JSON.parse(data);
			$('<div />', {
				
			});
			$('#chatLog').append('<div>' + ms.username + ': ' + ms.message + '</div>');
			
			// Snap to bottom
			$('#chatLog').animate({scrollTop: $('#chatLog')[0].scrollHeight }, 1 ); 
		});
		
		var userName = "User";
		function sendMsg() {
			var values = {};
			values['cmd'] = 'chat';
			values['username'] = userName;
			values['message'] = $('#msg').val();
			$('#msg').val("");
			socket.send(JSON.stringify(values));
		}
		
		keyPress = function(e) {
			if (e && e.keyCode == 13) {
				if ($('#userNameField').val().length > 0) {
					userName = $('#userNameField').val();
					var msg = {};
					msg['cmd'] = 'login';
					msg['username'] = userName;
					socket.send(JSON.stringify(msg));
					$('#userNameField').val("");
					$('.overlayDiv').hide();
					$('#msg').focus();
					return;
				} else {
					sendMsg();
				}
			}
		}
		
		createUser = function() {
			var overlay = $('<div />', {
				'class': 'overlayDiv'
			}).appendTo('body');
			
			var firstChild = $('<div />', {
				'class': 'overlayFirstChild'
			}).appendTo(overlay);
			
			$('<div />', {
				text: 'Welcome, enter a username and enjoy!',
				css: { fontSize: '20px' } 
			}).appendTo(firstChild);
			
			$('<input />', {
				id: 'userNameField',
				'class': 'pickUserName'
			}).appendTo(firstChild).focus();
		}
		
		$('.button').click(function() { 
			sendMsg();
		});
		
		$(createUser);
		$('body').keypress(keyPress);
	});

function log(msg) {
	console.log(msg);
}
function dropUserBySocket(s) {
	for (var d=0; d<userList.length; d++) {
		if (userList[d].port == s.handshake.address.port) {
			var discUser = userList[d].username;
			userList.splice(d, 1);
			return discUser;
		}
	}
}

var formidable = require('formidable');
var url = require("url");
var util = require('util');

var http = require('http');
var socket_io = require('socket.io');
var fs = require('fs');
function handler (req, res) {

	var pathname = url.parse(req.url).pathname;

	console.log('Request for ' + pathname);

	if(pathname == '/upload') {
		var form = new formidable.IncomingForm();

		form.on('error', function(error) {
				console.log(error);
			}).on('file', function(field, file) {
                fs.rename(file.path,  "./uploads/" + file.name);
        	});

		form.parse(req, function(err, fields, files) {
	      	console.log('file uploaded just now.');
	       	res.writeHead(200, {'content-type': 'text/plain'});
			res.write('received upload:\n\n');
			res.end(util.inspect({fields: fields, files: files}));
	    });
	}  else {
		fs.readFile(__dirname + '/index.html', function (err, data) {
			if (err) {
				res.writeHead(500);
				return res.end('Error loading index.html');
			}
			res.writeHead(200);
			res.end(data);
		});
	}
}

var app = http.createServer(handler);
app.listen(1338);
console.log('Get after it');
var io = socket_io.listen(app, {log: false});
var userList = new Array();
io.sockets.on('connection', function (socket) {
	var address = socket.handshake.address;
	
	var retMsg = new Object();
	retMsg.username = 'Server';
	retMsg.message = 'Welcome to jChat, where JS injection is not only allowed, but encouraged!';
	sendMsg(retMsg, false);
	var ms;
	
	socket.on('message', function (data) {
		ms = JSON.parse(data);
		switch (ms.cmd) {
			case 'login':
				var user = ms.username;
				log(user + '(' + address.port + ') logged in');
				// Notify room
				retMsg.username = 'Server';
				retMsg.message = user + ' has joined';
				sendMsg(retMsg, true);
				// Add to user list
				var cred = new Array();
				cred.port = address.port;
				cred.username = user;
				userList.push(cred);
				break;
			case 'chat':
				if (ms.message.charAt(0)=='/') {
					var str = ms.message.substr(1);
					switch (str) {
						case 'users':
							var j;
							log('UserList:');
							for (j=0; j<userList.length; j++) {
								log(userList[j].port + ' ' + userList[j].username);
							}
							log('');
							break;
						default:
							break;
					}
				} else {
					ms.ip = address.address;
					ms.port = address.port;
					sendMsg(ms, true);
				}
			default:
				break;
		}
	});
	
	socket.on('disconnect', function() {
		log(dropUserBySocket(socket) + ' disconnected');
	});
	
	function sendMsg(msgObj, b) {
		msgObj.timestamp = (new Date()).getTime();
		data = JSON.stringify(msgObj);
		log(data);
		b==true?socket.broadcast.emit('message', data):null;
		socket.emit('message', data);
	}
});

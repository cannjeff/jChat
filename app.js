
/**
 * Module dependencies.
 */
var express = require('express');
var routes = require('./routes');
var socket_io = require('socket.io');
var formidable = require('formidable');
var fs = require('fs');
var url = require('url');
var util = require('util');

function log(msg) {
  console.log((new Date()) + ': ' + msg);
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

var app = module.exports = express.createServer();

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  //app.use(express.bodyParser()); //screws up file upload
  app.use(express.methodOverride());
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', function(req, res) {
  res.render('index', {
    locals: {
      title: "jChat - Where JS injection is encouraged"
    }
  });
});

app.get('/uploads/*', function(req, res) {
    var pathname = url.parse(req.url).pathname;
    log('Trying to GET file ' + pathname);
    res.attachment('.' + pathname);
    res.sendfile('.' + pathname);
});

app.post('/upload', function(req, res) {

  log('uploading a file...');

  var form = new formidable.IncomingForm();

  form.on('error', function(error) {
    log(error);
  }).on('file', function(field, file) {
    log('uploading to ' + file.path + ' and renaming to ' + './uploads/' + file.name);
    var is = fs.createReadStream(file.path);
    var os = fs.createWriteStream('./uploads/' + file.name);

    util.pump(is, os, function() {
        fs.unlinkSync(file.path);
    });
  });

  form.parse(req, function(err, fields, files) {
    log(err);
    log(fields);
    log(files);
    log('file uploaded just now.');
    res.writeHead(200, {'content-type': 'text/plain'});
    res.write('received upload:\n\n');
    res.end(util.inspect({fields: fields, files: files}));
  });

});

app.listen(3000, function(){
  log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

//sockets ish
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
        //log(user + '(' + address.port + ') logged in');
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

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('port', process.env.PORT || 3000);


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;

var server = http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
}); 

var io = require('socket.io').listen(server);

var numUsers = 0;

io.sockets.on('connection', function(socket){
	var addedUser = false;

	var userid = socket.id;
	
	//Mostra para o usuário que ele entrou
	socket.emit('welcome',{userid: userid});
	//Mostra para os outros usuários que um novo usuário acabou de entrar
	socket.broadcast.emit('user in', {userid: userid});
	
	socket.on('change name', function(data){
		var nome = data.nome;
		socket.username = nome;
		
		socket.emit('name changed', {nome: nome});
		socket.broadcast.emit('user changed name', {userid: userid, nome: nome});
	});	
	
	socket.on('add user', function(username){
		if (addedUser) return;
		
		socket.username = username;
		++numUsers;
		addedUser = true;
		
		socket.emit('login',{
			numUsers: numUsers
		});
		socket.broadcast.emit('user joined',{
			username: socket.username, numUsers: numUsers
		});		
	});
	
	socket.on('typing', function(){
		socket.broadcast.emit('typing',{
			username: socket.username
		});
	});
	
	socket.on('disconnect', function(){
		if(addedUser){
			--numUsers;
			
			socket.broadcast.emit('user left',{
				username: socket.username,
				numUsers: numUsers
			});
		}
	});
	
	
	socket.on('send message', function(data){
				
		socket.emit('message sent', {message: data.message});
		socket.broadcast.emit('message sent by user', {message: data.message, nome: socket.username});
	});
});



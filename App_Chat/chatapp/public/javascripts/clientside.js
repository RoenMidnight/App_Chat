$(function(){
	var FADE_TIME = 150;
	var TYPING_TIMER_LENGHT = 400;
	var COLORS = [
		'#e21400', '#e91580f', '#f8a700', '#f78b00',
		'#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
		'#3b88eb', '#3824aa', '#a700ff', '#d300e7'
	];
	
	// Inicializando Variavieis
	var $window = $(window);
	var $usernameInput = $('#usernameInput');
	var $messages = $('.messages');
	var $inputMessage = $('#inputMessage');

	var $loginPage = $('.login.page');
	var $chatPage = $('.chat.page');

	var username;
	var connected = false;
	var typing = false;
	var lastTypingTime;
	var $currentInput = $usernameInput.focus();

	var socket = io.connect();

	/*$('.form-alterar-nome').submit(function(){
		var nome = $('#nome').val();
		socket.emit('change name',{nome: nome});
		var nome = $('#nome').val("");
		return false;
	});
	
	$('.form-enviar-mensagem').submit(function(){
		var mensagem = $('#mensagem').val();
		socket.emit('send message', {message: mensagem});
		$('#mensagem').val("");
		return false;
	});
}); */

	function addParticipantsMessage(data){
		var message = '';
		if (data.numUsers === 1){
			message += "Esta logando apenas 1 pessoa"
		} else {
			message += "Estão logadas "+ data.numUsers + " pessoas ";
		}
		log(message);	
	}

	function setUsername(){
		username = cleanInput($usernameInput.val().trim());
		
		if (username){
			$loginPage.fadeOut();
			$chatPage.show();
			$loginPage.off('click');
			$currentInput = $inputMessage.focus();

			socket.emit('add user');				
		}
	}

	function sendMessage() {
		var message = $inputMessage.val();
		
		message = cleanInput(message);

		if(message && connected){
			$inputMessage.val("");
			addChatMessage({
				username: username,
				message: message
			});
			
			socket.emit('new message', message);
		}
	}

	function log(message, options){
		var $el = $('<li>').addClass('log').text(message);
		addMessageElement($el, options);
	}

	function addChatMessage(data, options){
		var $typingMessages = getTypingMessages(data);
		options = options || {};
		if ($typingMessages.length !== 0){
			options.fade = false;
			$typingMessages.remove();
		}


	var $usernameDiv = $('<span class="username"/>')
		.text(date.username)
		.css('color', getUsernameColor(data.username));
	var $messagebodyDiv = $('<span class="messageBody">')
		.text(data.message);

	var typingClass = data.typing ? 'typing' : '';
	var $messageDiv = $('<li class="message"/>')
		.data('username', data.username)
		.addClass(typingClass)
		.append($usernameDiv, $messageBodyDiv);
		
		addMessageElement($messageDiv, options);
	}

	function addChatTyping(data){
		data.typing = true;
		data.message = 'esta digitando. . .';
		addChatMessage(data);
	}

	function removeChatTyping(data){
		getTypingMessages(date).fadeOut(function(){
			$(this).remove();
		});
	}

	function addMessageElement(el, options){
		var $el = $(el);
		
		if (!options){
			options = {};
		}
		if(typeof options.fade === 'undefined'){
			options.fade=true;
		}
		if(typeof options.prepend === 'undefined'){
			options.prepend = false;
		}
		if(options.fade){
			$el.hide().fadeIn(FADE_TIME);
		}
		if(options.prepend){
			$messages.prepend($el);
		} else {
			$messages.append($el);
		}
		$messages[0].scrollTop = $messages[0].scrollHeight;
	}

	function cleanInput(input){
		return $('<div/>').text(input).text();
	}

	function updateTyping () {
		if(connected){
			if(!typing){
				typing = true;
				socket.emit('typing');
			}
			lastTypingTime = (new Date()).getTime();
			
			setTimeout(function (){
				var typingTimer = (new Date()).getTime();
				var timeDiff = typingTimer - lastTypingtime;
				if (timeDiff >= TYPING_TIMER_LENGHT && typing){
					socket.emit('stop typing');
					typing = false;
				}
			}, TYPING_TIMER_LENGHT);
		}
	}

	function getUsernameColor (username){
		var hash = 7;
		for(var i = 0; i < username.length; i++){
			hash = username.charCodeAt(i) + (hash << 5) - hash;
		}
		var index = Math.abs(hash % COLORS.length);
		return COLORS[index];
	}

	//Eventos do Teclado

	$window.keydown(function (event){
		if (!(event.ctrlKey || event.metaKey || event.altKey)){
			$currentInput.focus();
		}
		
		if(event.which === 13){
			if(username){
				sendMessage();
				socket.emit('stop typing');
				typing = false;
			} else {
				setUsername();
			}
		}	
	});

	$inputMessage.on('input', function(){
		updateTyping();
	});

	//Eventos de Click

	$loginPage.click( function(){
		updateTyping();
	});


	$inputMessage.click(function(){
		$inputMessage.focus();
	});

	//Eventos de Socket

	socket.on('login', function(data){
		connected = true;
		var message = "Bem vindo ao Chat da ousadia - ";
		log(message,{
			prepend:true
		});
		addParticipantsMessage(data);
	});

	socket.on('send message', function(data){
		addChatMessage(data);
	});

	socket.on('user joined', function(data){
		log(data.username + ' logou');
		addParticipantsMessage(data);
	});

	socket.on('user left', function(data){
		log(data.username + ' left');
		addParticipantsMessage(data);
		removeChatTyping(data);
	});

	socket.on('typing', function(data){
		addChatTyping(data);
	});

	socket.on('stop typing', function(data){
		removeChatTyping(data);
	});

	/*
	socket.on('welcome', function (){
			$('.updates').append('<li> Welcome abiguinho, você entrou no chat maroto</li>');	
	});

	socket.on('user in', function(data){
		$('.updates').append('<li>O usuário <strong>' + data.userid + '</strong> entrou</li>');
	});

	socket.on('name changed', function(data){
		$('.updates').append('<li>Seu nome foi alterado para: <strong>'+data.nome+'</strong></li>');
	});

	socket.on('user changed name', function(data){
		$('.updates').append('<li>O usuário <strong>'+data.userid+' </strong> alterou seu nome para: <strong> '+data.nome+'</strong></li>');
	});

	socket.on('message sent', function(data){
		$('#chat ul').append('<li><strong>Me:</strong> '+data.message+'</li>');
	});

	socket.on('message sent by user', function(data){
		$('#chat ul').append('<li><strong>'+data.nome+':</strong> '+data.message+'</li>');
	});*/

});

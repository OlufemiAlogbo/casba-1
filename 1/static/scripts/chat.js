$(document).ready(function(){

  var conversation = document.querySelector('#conversations');
  var inputChat = document.querySelector('#inputChat');
  var url = $(location).attr('href');

  var arr = url.split('=');

  //Initialise websocket

  var socket = io.connect('http://' + document.domain + ':' + location.port);

  socket.on('connect', function() {
		console.log('User has connected!');
	});

  //Initialise with engagment input

  if (arr.length > 1) {
    var text =  arr[1].split('+').join(' ');
    var message = buildMessageSend(text);
    conversation.appendChild(message);

    socket.emit('my event', {data: text});

  }

  // ChatBot response message
  socket.on('my response', function(msg) {
    var text = msg.data;

    if (msg) {
      var message = buildMessageRecieve(text);
      conversation.appendChild(message);
    }

    conversation.scrollTop = conversation.scrollHeight;

		console.log('Received message');
	});

  //User click to send input

  $("#send").on("click", function(e){
    var text = inputChat.value;
    if (inputChat.value) {
      var message = buildMessageSend(text);
      conversation.appendChild(message);
    }

    //socket.send(text);
    socket.emit('my event', {data: text});

    inputChat.value = '';
    conversation.scrollTop = conversation.scrollHeight;

    e.preventDefault();
  });

  //User press enter to send input

  $('#inputChat').keypress(function (e) {
    var key = e.which;
    var text = inputChat.value;

    if(key == 13)  // the enter key code
    {
      if (inputChat.value) {
        var message = buildMessageSend(text);
        conversation.appendChild(message);
      }

      //socket.send(text);
      socket.emit('my event', {data: text});

      inputChat.value = '';
      conversation.scrollTop = conversation.scrollHeight;

      e.preventDefault();
    }
  });

  // Build send message with HTML

  function buildMessageSend(text) {
    var element = document.createElement('div');

    element.classList.add('message', 'sent');

    element.innerHTML = text +
    '<span class="metadata">' +
    '<span class="time">' + moment().format('h:mm A') + '</span>'
    '</span>';

    return element;
  }

  // Build receive message with HTML

  function buildMessageRecieve(text) {
    var element = document.createElement('div');

    element.classList.add('message', 'received');

    element.innerHTML = text +
    '<span class="metadata">' +
    '<span class="time">' + moment().format('h:mm A') + '</span>'
    '</span>';

    return element;
  }

});

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

    socket.emit('my event', {data: text, context: " "});

  }

  // ChatBot response message
  socket.on('my response', function(msg) {
    var text = msg.data;

    if (msg.data) {
      var message = buildMessageRecieve(text);
      conversation.appendChild(message);
    }

    conversation.scrollTop = conversation.scrollHeight;

		console.log('Received message');
	});

  // ChatBot response form
  socket.on('my response', function(msg) {
    var user = msg.user;

    if (msg.form == "signup") {
      var signup = buildSignupForm(user);
      conversation.appendChild(signup);
    }

    conversation.scrollTop = conversation.scrollHeight;

		console.log('Received message');
	});

  // Fade out form on confirm

  $('.conversations').on('click', '#signup', function() {
    var text = "confirmed"

    $(this).closest('.signup').fadeOut();

    //socket.send(text);
    socket.emit('my event', {data: text});

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

  // Build form

  function buildSignupForm(user) {
    var element = document.createElement('div');

    element.classList.add('col-md-6', 'col-md-offset-3', 'signup');

    element.innerHTML = '<div class="account-wall">' +
      '<h1 class="text-center login-title">Personal Info</h1>' +
      '<img class="profile-img" src="https://lh5.googleusercontent.com/-b0-k99FZlyE/AAAAAAAAAAI/AAAAAAAAAAA/eu7opA4byxI/photo.jpg?sz=120" alt="">' +
      '<div class="form-signin">' +
        '<input type="text" class="form-control" value= ' + user.lastName + ' autofocus disabled>' +
        '<input type="text" class="form-control" value= ' + user.firstName + ' autofocus disabled>' +
        '<input type="text" class="form-control" value= ' + user.phoneNumber + ' autofocus disabled>' +
        '<input type="text" class="form-control" value= ' + user.dateOfBirth + ' autofocus disabled>' +
        '<input type="text" class="form-control" value= ' + user.bvn + ' autofocus disabled>' +
        '<button class="btn btn-lg btn-primary btn-block" id="signup" type="submit"> Confirm </button>' +
      '</div>' +
    '</div>';

    return element;
  }

});

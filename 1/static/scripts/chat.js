$(document).ready(function(){

  var conversation = document.querySelector('#conversations');
  var inputChat = document.querySelector('#inputChat');
  var url = $(location).attr('href');

  var arr = url.split('=');

  //Initialise with engagment input

  if (arr.length > 1) {
    var message = buildMessage(arr[1]);
    conversation.appendChild(message);
  }

  //User click to send input

  $("#send").on("click", function(e){
    var text = inputChat.value;
    if (inputChat.value) {
      var message = buildMessage(text);
      conversation.appendChild(message);
    }
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
        var message = buildMessage(text);
        conversation.appendChild(message);
      }
      inputChat.value = '';
      conversation.scrollTop = conversation.scrollHeight;

      e.preventDefault();
    }
  });

  // Build message with HTML

  function buildMessage(text) {
    var element = document.createElement('div');

    element.classList.add('message', 'sent');

    element.innerHTML = text +
    '<span class="metadata">' +
    '<span class="time">' + moment().format('h:mm A') + '</span>'
    '</span>';

    return element;
  }

});

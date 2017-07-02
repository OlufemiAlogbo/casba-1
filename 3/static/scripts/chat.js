var gMapsLoaded = false;

window.gMapsCallback = function(){
    gMapsLoaded = true;
    $(window).trigger('gMapsLoaded');
}

window.loadGoogleMaps = function(){
    if(gMapsLoaded) return window.gMapsCallback();
    var script_tag = document.createElement('script');
    script_tag.setAttribute("type","text/javascript");
    script_tag.setAttribute("src","https://maps.googleapis.com/maps/api/js?key=AIzaSyAvjp8wJ_o916n0FHW8QHXXjZV2YDdTG48&libraries=places&callback=gMapsCallback");
    (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(script_tag);
}

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

  // ChatBot message response

  socket.on('my response', function(msg) {
    var text = msg.data;

    if (msg.data) {
      var message = buildMessageRecieve(text);
      conversation.appendChild(message);
    }

    conversation.scrollTop = conversation.scrollHeight;

		console.log('Received message');
	});

  // ChatBot form response

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

  $('.conversations').on('click', '#confirm', function() {

    var text = "confirmed"

    $(this).closest('.chatForm').fadeOut();

    //socket.send(text);
    socket.emit('my event', {data: text});

  });

  // ChatBot map response

  socket.on('my response', function(msg) {

    if (msg.locate == "1" || msg.locate == "2" || msg.locate == "3" || msg.locate == "4" || msg.locate == "5") {
      var touchpoint = buildLocationMap();
      conversation.appendChild(touchpoint);

      var map, start, end;

      function initialize() {
        var markerArray = [];
        var infoArray = [];

        geocoder = new google.maps.Geocoder();

        // Instantiate a directions service.
        var directionsService = new google.maps.DirectionsService;

        // Create a map and center it on lagos.
        var map = new google.maps.Map(document.getElementById('mapCanvas'), {
          zoom: 13,
          center: {lat: 6.465422, lng: 3.406448}
        });

        // Create a renderer for directions and bind it to the map.
        var directionsDisplay = new google.maps.DirectionsRenderer({map: map});

        // Instantiate an info window to hold step text.
        var stepDisplay = new google.maps.InfoWindow;

        // Get start and end locations
        var myLocation = [];
        var myDestination = [];

        if ("geolocation" in navigator){ //check geolocation available
          //try to get user current location using getCurrentPosition() method
          navigator.geolocation.getCurrentPosition(function(position){
            var lat = position.coords.latitude;
            var lon = position.coords.longitude;
            myLocation.push(lat, lon);
            locationCode()
          });
        }else{
          console.log("Browser doesn't support geolocation!");
        }

        // Get user location array

        function locationCode() {
          start = {lat: parseFloat(myLocation[0]), lng: parseFloat(myLocation[1])};
          var latlng = new google.maps.LatLng(myLocation[0], myLocation[1]);
          geocoder.geocode({
            'latLng': latlng
          }, function(results, status) {
            document.getElementById("myLocation").innerHTML = '' + (results[4].formatted_address); + ''
          });

          // find custom places function
          // prepare variables (filter)
          var type = "atm";
          var radius = "5000";

          // send request
          service = new google.maps.places.PlacesService(map);
          service.nearbySearch({
            location: start,
            radius: radius,
            types: [type]
          }, function(results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
              console.log(results[2].place_id)
              var latitude = results[2].geometry.location.lat();
              var longitude = results[2].geometry.location.lng();
              myDestination.push(results[2].place_id);
              locationCode2()
            } else if (status == google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              alert('Sorry, nothing is found');
            }
          });

          function locationCode2() {
            end = {placeId: myDestination.toString()};

            // Display the route between the initial start and end selections.
            calculateAndDisplayRoute(directionsDisplay, directionsService, start, end, markerArray, stepDisplay, map);

            // Change mode of travel
            document.getElementById('mode').addEventListener('change', function() {
              calculateAndDisplayRoute(directionsDisplay, directionsService, start, end, markerArray, stepDisplay, map);
            });
          }

        }

      }

      function calculateAndDisplayRoute(directionsDisplay, directionsService, start, end, markerArray, stepDisplay, map) {
        // First, remove any existing markers from the map.
        for (var i = 0; i < markerArray.length; i++) {
          markerArray[i].setMap(null);
        }

        var selectedMode = document.getElementById('mode').value;

        // Retrieve the start and end locations and create a DirectionsRequest using
        // WALKING directions.
        directionsService.route({
          origin: start,
          destination: end,
          travelMode: google.maps.TravelMode[selectedMode]
        }, function(response, status) {
          // Route the directions and pass the response to a function to create
          // markers for each step.
          if (status === 'OK') {
            document.getElementById('directionsPanel').innerHTML = '<b>' + response.routes[0].warnings + '</b>';
            directionsDisplay.setDirections(response);
            showSteps(response, markerArray, stepDisplay, map);
          } else {
            window.alert('Directions request failed due to ' + status);
          }
        });
      }

      function showSteps(directionResult, markerArray, stepDisplay, map) {
        // For each step, place a marker, and add the text to the marker's infowindow.
        // Also attach the marker to an array so we can keep track of it and remove it
        // when calculating new routes.
        var myRoute = directionResult.routes[0].legs[0];
        for (var i = 0; i < myRoute.steps.length; i++) {
          var marker = markerArray[i] = markerArray[i] || new google.maps.Marker;
          marker.setMap(map);
          marker.setPosition(myRoute.steps[i].start_location);
          attachInstructionText(stepDisplay, marker, myRoute.steps[i].instructions, map);
        }
      }

      function attachInstructionText(stepDisplay, marker, text, map) {
        google.maps.event.addListener(marker, 'click', function() {
          // Open an info window when the marker is clicked on, containing the text
          // of the step.
          stepDisplay.setContent(text);
          stepDisplay.open(map, marker);
        });
      }

      $(window).bind('gMapsLoaded', initialize);
      window.loadGoogleMaps();
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

  // Build form

  function buildSignupForm(user) {
    var element = document.createElement('div');

    element.classList.add('col-md-6', 'col-md-offset-3', 'chatForm');

    element.innerHTML = '<div class="account-wall">' +
      '<h1 class="text-center login-title">Personal Info</h1>' +
      '<img class="profile-img" src="https://lh5.googleusercontent.com/-b0-k99FZlyE/AAAAAAAAAAI/AAAAAAAAAAA/eu7opA4byxI/photo.jpg?sz=120" alt="">' +
      '<div class="form-signin">' +
        '<input type="text" class="form-control" value= ' + user.lastName + ' autofocus disabled>' +
        '<input type="text" class="form-control" value= ' + user.firstName + ' autofocus disabled>' +
        '<input type="text" class="form-control" value= ' + user.phoneNumber + ' autofocus disabled>' +
        '<input type="text" class="form-control" value= ' + user.dateOfBirth + ' autofocus disabled>' +
        '<input type="text" class="form-control" value= ' + user.bvn + ' autofocus disabled>' +
        '<button class="btn btn-lg btn-primary btn-block btn-engage" id="confirm" type="submit"> Confirm </button>' +
      '</div>' +
    '</div>';

    return element;
  }

  // Build form

  function buildLocationMap() {
    var element = document.createElement('div');

    element.classList.add('col-md-10', 'col-md-offset-1', 'chatMap');

    element.innerHTML = '<div class="panel panel-default">' +
      '<div class="panel-heading">' +
        '<div class="row">' +
          '<div class="col-md-4">Heading</div>' +
          '<div class="col-md-4" id="myLocation"></div>' +
          '<div class="col-md-4">' +
            '<b>Mode of Travel: </b>' +
            '<select id="mode">' +
              '<option value="WALKING">Walking</option>' +
              '<option value="DRIVING">Driving</option>' +
              '<option value="BICYCLING">Bicycling</option>' +
              '<option value="TRANSIT">Transit</option>' +
            '</select>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="panel-body">' +
        '<div id="mapCanvas" class="mapCanvas"></div> ' +
      '</div>' +
      '<div class="panel-footer">' +
        '<div id="directionsPanel"></div> ' +
      '</div>' +
    '</div>';

    return element;
  }

});

// Load the TCP Library
net = require('net');

// Keep track of the chat clients
var clients = [];

var beats_per_loop = 0;
var current_beat = 1;
var num_robots = 0;

var prompt = require('prompt');

var schema = {
    properties: {
      beats: {
        pattern: /^[0-9]+$/,
        message: 'Number of beats must be a number',
        required: true
      }
    }
  };

prompt.start();

prompt.get(schema, function (err,result) {
  beats_per_loop = result.beats;
});

// Start a TCP Server
net.createServer(function (socket) {

  // Identify this client
  socket.name = socket.remoteAddress + ":" + socket.remotePort;
  socket.note = '\x44';
  socket.init = 0;
  clients.push(socket);

  // Send a nice welcome message and announce
  console.log("Received connection from: " + socket.remoteAddress);

  //Byte 0: 1 => Loop, 2 => Beat, 0 => Neither??
  //Byte 1: # of Beats in the loop. Always include
  //Byte 2: # of Robots playing
  //Byte 3 - # of Robots + 3: Sequence of bytes representing what each robot is playing
  var temp = '\x02\x04\x01\x44\x53\x66\x44\r\n';
  console.log(temp.length);

}).listen(4454, '127.0.0.1');


setInterval(function(){
  var string_parse = ''

  //Beat or Loop
  if (current_beat == beats_per_loop) {
    console.log('Loop');
    current_beat = 0;

    //Check for new clients!
    clients.forEach(function(client) {
      //If the new connection hasn't seen a Loop yet...
      if (client.init == 0) {
        client.init = 1;
      }
      //If the new connection now has listened to a complete loop....
      //Increment number of robots..
      //Set iRobot to fully initialized...
      else if (client.init == 1) {
        client.init = 2;
        num_robots++;
      }
    });

    string_parse = '\x01'

  }
  else {
    console.log('Tick');
    string_parse = '\x02'
  }

  //Now add # of Beats & # of Playing Robots
  string_parse += String.fromCharCode(beats_per_loop) + String.fromCharCode(num_robots);
  clients.forEach(function (client) {

    //If init == 2, then client is fully initialized and playing
    if (client.init == 2) {
      string_parse += client.note;
    }

  });

  string_parse += '\r\n';

  clients.forEach(function (client) {
    client.write(string_parse);
  });

  current_beat++;
  console.log(clients.length + " Clients Connected & " + num_robots + " Robot's Playing");

}, 500);

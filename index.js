// Load the TCP Library
net = require('net');

//Brian's to do:
//   1. Fix error handling

// Keep track of the chat clients
var clients = [];
var init_notes = [];

var beats_per_loop = 0;
var current_beat = 1;
var num_robots = 0;
var milli_time = 500;

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



var client_server = net.createServer(function (socket) {

  // Identify this client
  socket.name = socket.remoteAddress + ":" + socket.remotePort;
  socket.init = 0;
  socket.notes = []
  clients.push(socket);

  // Send a nice welcome message and announce
  console.log("Received connection from: " + socket.remoteAddress);

  socket.on('data', function(data) {
    console.log("Recieved Something: " + data);

    if (data.readUInt8(0) == 1) {
      console.log("iRobot coming online...");
      for (var i = 1; i <= beats_per_loop; i++) {
        socket.notes.push(data.readUInt8(i));
      }
      console.log(socket.notes)
      socket.init = 2;
      num_robots++;
    }
    else if (data.readUInt8(0) == 0) {
      console.log("Client Stopped Playing: .... Good Day Robot!");

      socket.init = 0;
      num_robots--;
    }

  });

  socket.on('end', function() {
    console.log("Client closed connection: .... Good Day Robot!");

    loc = clients.indexOf(socket);
    clients.splice(loc,1);
    num_robots--;
  });

  //Currenty, any error on client side will remove the client from our array list
  socket.on('error', function(err){
      // Handle the connection error.
      console.log("Hit an error: " + err + ".... Current Protocol is to remove iRobot. Good Day Robot!");

      loc = clients.indexOf(socket);
      clients.splice(loc,1);
      num_robots--;
  });


});


///BEGINNING OF PROGRAM



prompt.start();

prompt.get(schema, function (err,result) {
  beats_per_loop = result.beats;

  var beat_schema = {
    properties: {
      notes: {
        pattern: /^[0-9]+$/,
        message: 'Enter beats: ',
        required: true,
        type: 'array',
        maxItems: beats_per_loop,
        minItems: beats_per_loop
      }
    }
  };

  prompt.get(beat_schema, function (err,result) {
    init_notes = result.notes;
    console.log(init_notes);

    client_server.listen(4454, '192.168.1.2');

    setInterval(function(){
      var string_parse = ''

      //Beat or Loop
      if (current_beat == beats_per_loop) {
        //console.log('Loop');
        current_beat = 0;

        //Check for new clients!
        clients.forEach(function(client) {
          //If the new connection hasn't seen a Loop yet...
          if (client.init == 0) {
            client.init = 1;
          }

        });

        string_parse = '\x01'

      }
      else {
        //console.log('Tick');
        string_parse = '\x02'
      }

      //Now add # of Beats & # of Playing Robots
      string_parse += String.fromCharCode(beats_per_loop) + String.fromCharCode(num_robots)+String.fromCharCode(milli_time/1000*64);
      if (num_robots == 0) {
        string_parse += String.fromCharCode(init_notes[current_beat]);
      }
      else {
        clients.forEach(function (client) {
          //If init == 2, then client is fully initialized and playing
          if (client.init == 2) {
            string_parse += String.fromCharCode(client.notes[current_beat]);
          }
        });
      }

      string_parse += '\r\n';

      var temp = []
      for (var i = 0; i < string_parse.length; i++) {
        temp.push(string_parse.charCodeAt(i));
      }
      console.log(temp);
      clients.forEach(function (client) {
        client.write(string_parse);
      });

      current_beat++;
      //console.log(clients.length + " Clients Connected & " + num_robots + " Robot's Playing");

    }, milli_time);
  });

});

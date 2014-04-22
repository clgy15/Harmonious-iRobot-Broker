// Load the TCP Library
var net = require('net');
var httpServer = require('./http_server');

httpServer.run(3000);

//Brian's to do:
//   1. Each Robot now has a note length
//   ex. 49 - length 2 49 - length 2 0 - length 1 51 - length 1

// Keep track of the chat clients
var clients = [];
var init_notes = [];
var init_lengths = [];

var notes_per_loop = 0;
var beats_per_loop = 0;
var current_beat = 1;
var num_robots = 0;
var milli_time = 500;

var prompt = require('prompt');

var schema = {
  properties: {
    beats: {
      pattern: /^[0-9]+$/,
      message: 'Number of notes must be a number',
      required: true
    }
  }
};



var client_server = net.createServer(function (socket) {

  // Identify this client
  socket.name = socket.remoteAddress + ":" + socket.remotePort;
  socket.init = 0;
  socket.notes = []
  socket.lengths = []
  clients.push(socket);

  // Send a nice welcome message and announce
  console.log("Received connection from: " + socket.remoteAddress);

  socket.on('data', function(data) {
    console.log("Recieved Something: " + data);

    if (data.readUInt8(0) == 1) {
      console.log("iRobot coming online...");
      for (var i = 1; i <= beats_per_loop; i+=2) {
        socket.notes.push(data.readUInt8(i));
        socket.lengths.push(data.readUInt8(++i));
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
  notes_per_loop = result.beats;

  var beat_schema = {
    properties: {
      notes: {
        pattern: /^[0-9]+$/,
        message: 'Enter beats & length (Note, Length)): ',
        required: true,
        type: 'array',
        maxItems: notes_per_loop,
        minItems: notes_per_loop
      },
    }
  };

  prompt.get(beat_schema, function (err,result) {
    result.notes.forEach(function(note) {
      temp_arr = note.split(',');
      for (var i = 0; i < +temp_arr[1]; i++) {
        init_notes.push(temp_arr[0].trim());
        init_lengths.push(temp_arr[1].trim());
        beats_per_loop++;
      }
    });
    //init_notes = result.notes.split();
    console.log(init_notes);
    console.log(init_lengths);
    console.log(beats_per_loop);

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
        string_parse += String.fromCharCode(init_lengths[current_beat]);
      }
      else {
        clients.forEach(function (client) {
          //If init == 2, then client is fully initialized and playing
          if (client.init == 2) {
            string_parse += String.fromCharCode(client.notes[current_beat]);
            string_parse += String.fromCharCode(client.lengths[current_beat]);
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

// Load the TCP Library
var net = require('net');
var httpServer = require('./http_server');

//Brian's to do:
//   1. Each Robot now has a note length
//   ex. 49 - length 2 49 - length 2 0 - length 1 51 - length 1

// Keep track of the chat clients
var clients = [];
var init_notes = [];
var init_lengths = [];

var beats_per_loop = 0;
var current_beat = 1;
var num_robots = 0;
var milli_time = 0;
var max_loops = 4;
var duration = 0;


var client_server = net.createServer(function (socket) {

  // Identify this client
  socket.name = socket.remoteAddress + ":" + socket.remotePort;
  socket.init = 0;
  socket.notes = []
  socket.lengths = []
  clients.push(socket);

  // Send a nice welcome message and announce
  console.log("Received connection from: " + socket.remoteAddress);
  httpServer.addRobot(socket.remoteAddress);

  socket.on('data', function(data) {
    console.log("Recieved Something: " + data);

    if (data.readUInt8(0) == 1) {
      console.log("iRobot coming online...");
      console.log(data);
      for (var i = 1; i <= beats_per_loop;) {
        var note = data.readUInt8(i);
        i++;
        var length = data.readUInt8(i)/(milli_time/1000*64 >> 0);
        socket.notes.push(note);
        socket.lengths.push(length);
        for (var j = 1; j < length; j++) {
          socket.notes.push('1');
          socket.lengths.push(length);
        }
        i++;

      }
      console.log(socket.notes)
      socket.init = 2;
      num_robots++;

      httpServer.setRobotPattern(socket.remoteAddress, socket.notes, socket.lengths);
    }
    else if (data.readUInt8(0) == 0) {
      console.log("Client Stopped Playing: .... Good Day Robot!");

      socket.init = 0;
      num_robots--;

      httpServer.clearRobotPattern(socket.remoteAddress);
    }

  });

  socket.on('end', function() {
    console.log("Client closed connection: .... Good Day Robot!");
    loc = clients.indexOf(socket);
    clients.splice(loc,1);
    httpServer.removeRobot(socket.remoteAddress);
    if (num_robots > 0) {
      num_robots--;
    }
  });

  //Currenty, any error on client side will remove the client from our array list
  socket.on('error', function(err){
      // Handle the connection error.
      console.log("Hit an error: " + err + ".... Current Protocol is to remove iRobot. Good Day Robot!");
      loc = clients.indexOf(socket);
      clients.splice(loc,1);
      if (num_robots > 0) {
        num_robots--;
      }

      httpServer.removeRobot(socket.remoteAddress);

  });


});



var startTCP = function(data) {
  milli_time = data.duration/64*1000;
  max_loops = data.maxLoops;
  duration = data.duration;

  data.notes.forEach(function(note) {
    for (var i = 0; i < note.duration; i++) {
      if (i == 0) {
        init_notes.push(note.pitch);
      } else {
        init_notes.push('1');
      }
      init_lengths.push(note.duration*duration);
      beats_per_loop++;
    }
  });
  //init_notes = result.notes.split();
  console.log(init_notes);
  console.log(init_lengths);
  console.log(beats_per_loop);
  console.log(duration);
  console.log(milli_time);
  console.log(max_loops);

  client_server.listen(4454, '192.168.1.15');

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

      httpServer.loop();

    }
    else {
      //console.log('Tick');
      string_parse = '\x02'

      httpServer.beat();
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

    // var temp = []
    // for (var i = 0; i < string_parse.length; i++) {
    //   temp.push(string_parse.charCodeAt(i));
    // }
    // console.log(temp);
    clients.forEach(function (client) {
      client.write(string_parse);
    });

    current_beat++;
    //console.log(clients.length + " Clients Connected & " + num_robots + " Robot's Playing");

  }, milli_time);
};

httpServer.startFunction(startTCP);

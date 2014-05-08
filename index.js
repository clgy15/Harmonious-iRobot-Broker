// Load the TCP Library
var net = require('net');
var httpServer = require('./http_server');

//Brian's to do:
//   1. Each Robot now has a note length
//   ex. 49 - length 2 49 - length 2 0 - length 1 51 - length 1

// Robot Init States:
// O: Connection
// 1: Waiting
// 2: Listening
// 3: Playing

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

var octave_freq = 50;
var third_freq = 50;
var fifth_freq = 50;
var seventh_freq = 50;
var syncopation = false;


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

    if (data.readUInt8(0) == 1) {  // Play Song
      try {
        console.log("iRobot coming online...");
        console.log(data);
        var dataStr = data.toString();
        console.log(data.toString().length);
        for (var i = 1; i < dataStr.length - 1; i += 2) {
          var note = data.readUInt8(i);
          var length = data.readUInt8(i + 1)/(milli_time/1000*64 >> 0);
          socket.notes.push(note);
          socket.lengths.push(length);
          for (var j = 1; j < length; j++) {
            socket.notes.push('1');
            socket.lengths.push(length);
          }
        }
        console.log(socket.notes)
        socket.init = 3;
        num_robots++;

        httpServer.setRobotPattern(socket.remoteAddress, socket.notes, socket.lengths);
      } catch (e) {
        console.log(e);
        console.log("Bad robot!", socket.remoteAddress);
        httpServer.removeRobot(socket.remoteAddress);
        loc = clients.indexOf(socket);
        clients.splice(loc,1);
      }
    }
    else if (data.readUInt8(0) == 0) {
      console.log("Client Stopped Playing: .... Good Day Robot!");

      socket.init = 0;
      num_robots--;

      socket.notes = [];
      socket.lengths = [];

      console.log("socket", socket);
      httpServer.clearRobotPattern(socket.remoteAddress);
    }
    else if (data.readUInt8(0) == 2) { //WAITING
      socket.init = 1;
      httpServer.robotWaiting(socket.remoteAddress);
    }
    else if (data.readUInt8(0) == 3) { //WAITING
      socket.init = 2;
      httpServer.robotListening(socket.remoteAddress);
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

      httpServer.removeRobot(socket.name.split(":")[0]);
      console.log("socket", socket);
  });


});

var updateSettings = function(data) {
  octave_freq = data.octave_freq;
  third_freq = data.third_freq;
  fifth_freq = data.fifth_freq;
  seventh_freq = data.seventh_freq;
  syncopation = data.syncopation;
}


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
  httpServer.setBeatLength(beats_per_loop);
  //init_notes = result.notes.split();
  console.log(init_notes);
  console.log(init_lengths);
  console.log(beats_per_loop);
  console.log(duration);
  console.log(milli_time);
  console.log(max_loops);

  if (data.system_initialized == false) {
    client_server.listen(4454, '192.168.1.2');

    setInterval(function(){
      var string_parse = ''

      //Beat or Loop
      if (current_beat == beats_per_loop) {
        //console.log('Loop');
        current_beat = 0;

        string_parse = '\x01'
        httpServer.loop(milli_time);
      }
      else {
        //console.log('Tick');
        string_parse = '\x02'
      }

      //Now add # of Beats & # of Playing Robots
      string_parse += String.fromCharCode(beats_per_loop) + String.fromCharCode(num_robots)+String.fromCharCode(milli_time/1000*64);
      string_parse += String.fromCharCode(octave_freq) + String.fromCharCode(third_freq) + String.fromCharCode(fifth_freq) + String.fromCharCode(seventh_freq);
      if (syncopation == true) {
        string_parse += String.fromCharCode('1');
      } else {
        string_parse += String.fromCharCode('0');
      }

      if (num_robots == 0) {
        string_parse += String.fromCharCode(init_notes[current_beat]);
        string_parse += String.fromCharCode(init_lengths[current_beat]);
      }
      else {
        clients.forEach(function (client) {
          //If init == 2, then client is fully initialized and playing
          if (client.init == 3) {
            string_parse += String.fromCharCode(client.notes[current_beat]);
            string_parse += String.fromCharCode(client.lengths[current_beat]*(milli_time/1000*64 >> 0));
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

    }, milli_time);
  }


};

httpServer.startFunction(startTCP);
httpServer.settingsFunction(updateSettings);

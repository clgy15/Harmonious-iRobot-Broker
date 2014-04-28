var express = require('express');

var port = 3000;
var app = express();

app.use(express.static(__dirname + '/app'));

var io = require('socket.io').listen(app.listen(port));

var start_function;
var start_function_called = false;

var state = {};

io.sockets.on('connection', function(socket) {
  socket.emit('connect', state);
  socket.on('setup', function(data) {
    console.log(data);
    if (!start_function_called) {
      start_function(data);
      start_function_called = true;
    }
  });
});

exports.startFunction = function(fnc) {
  start_function = fnc;
}

/*
 * Adds a new robot to the UI
 * Call when a new robot connection is created
 */
exports.addRobot = function(ip) {
  io.sockets.emit('newRobot', {
    ip: ip
  });
};

/*
 * Sets the musical pattern for a robot
 * Call when a robot sends its pattern to the broker
 */
exports.setRobotPattern = function(ip, notes, durations) {
  var combinedNotes = [];
  notes.forEach(function(note, index) {
    combinedNotes.push({
      pitch: note,
      duration: durations[index]
    });
  });

  io.sockets.emit('setRobotPattern', {
    ip: ip,
    notes: combinedNotes
  });
};

/*
 * Clears the musical pattern for a robot
 * Call when a robot sends a stop playing signal to the broker
 */
exports.clearRobotPattern = function(ip) {
  io.sockets.emit('clearRobotPattern', {
    ip: ip
  });
};

/*
 * Removes a robot completely from the UI.
 * Call when a connection to a robot is lost.
 */
exports.removeRobot = function(ip) {
  io.sockets.emit('removeRobot', {
    ip: ip
  });
};

// Call when a loop is sent to the robots
exports.loop = function(beat_ms_time) {
  console.log("loop to http server");
  io.sockets.emit('loop', {
    beatTime: beat_ms_time
  });
};

exports.setState = function(state) {
  state = state;
};

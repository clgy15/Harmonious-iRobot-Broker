var express = require('express');

var app = express();
var io = require('socket.io').listen(app);

app.use(express.static(__dirname + '/app'));

io.sockets.on('connection', function(socket) {
  // Blah
});

// Init HTTP server
exports.run = function(port) {
  app.listen(port, function() {
    console.log('HTTP Server listening on port ' + port);
  });
};

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
  io.sockets.emit('setRobotPattern', {
    ip: ip,
    notes: notes,
    durations: durations
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

// Call when a beat is sent to the robots
exports.beat = function() {
  io.sockets.emit('beat', {});
};

// Call when a loop is sent to the robots
exports.loop = function() {
  io.sockets.emit('loop', {});
};

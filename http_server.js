var express = require('express');

var port = 3000;
var app = express();

app.use(express.static(__dirname + '/app'));

var io = require('socket.io').listen(app.listen(port));

var start_function;
var start_function_called = false;

var update_settings_function;

// Setting Function:
//   {
//      octave_freq: 50,
//      third_freq: 50,
//      fifth_freq: 50,
//      seventh_freq: 50
//   }
//
//

// $scope.robots.push({
//   ip: info.ip,
//   notes: [],
//   active: false
// });

var state = {beatCount: 0,
            tempo: 0,
            maxLoops: 0,
            patternNotes: [],
            started: false,
            robots: []};

io.sockets.on('connection', function(socket) {
  socket.emit('connect', state);
  socket.on('setup', function(data) {
    console.log(data);
    if (!start_function_called) {
      state.tempo = data.tempo;
      state.maxLoops = data.maxLoops;
      state.started = true;
      state.patternNotes = data.notes;

      start_function(data);
      start_function_called = true;
    }
  });

  socket.on('settings', function(data) {
    console.log(data);
    update_settings_function(data);
  });
});

exports.startFunction = function(fnc) {
  start_function = fnc;
}

exports.settingsFunction = function(fnc) {
  update_settings_function = fnc;
}

exports.setBeatLength = function(length) {
  state.beatCount = length;
}

/*
 * Adds a new robot to the UI
 * Call when a new robot connection is created
 */
exports.addRobot = function(ip) {
  io.sockets.emit('newRobot', {
    ip: ip
  });

  state.robots.push({
    ip: ip,
    notes: [],
    active: false
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

  for (var i = 0; i < state.robots.length; i++) {
    if (state.robots[i].ip == ip) {
      state.robots[i].notes = combinedNotes;
      state.robots[i].active = true;
      break;
    }
  }
  //state.robots[state.robots.indexOf(ip)]
};

/*
 * Clears the musical pattern for a robot
 * Call when a robot sends a stop playing signal to the broker
 */
exports.clearRobotPattern = function(ip) {
  io.sockets.emit('clearRobotPattern', {
    ip: ip
  });

  for (var i = 0; i < state.robots.length; i++) {
    if (state.robots[i].ip == ip) {
      state.robots[i].notes = [];
      state.robots[i].active = false;
      break;
    }
  }
};

/*
 * Removes a robot completely from the UI.
 * Call when a connection to a robot is lost.
 */
exports.removeRobot = function(ip) {
  io.sockets.emit('removeRobot', {
    ip: ip
  });
  for (var i = 0; i < state.robots.length; i++) {
    if (state.robots[i].ip == ip) {
      state.robots.splice(i,1);
      break;
    }
  }
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
